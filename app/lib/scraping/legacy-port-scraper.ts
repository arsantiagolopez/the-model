import { addDays } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "~/lib/db";
import { matches, players, tournaments, playerStats } from "~/lib/db/schema";
import type { NewMatch, NewPlayer, NewTournament, NewPlayerStats } from "~/lib/db/schema";
import { ScrapingClient } from "./scraping-client";
import { PlayerScraper } from "./scrapers/player-scraper";
import { MatchDetailScraper } from "./scrapers/match-detail-scraper";
import { PlayerProfileScraper } from "./scrapers/player-profile-scraper";

interface Logger {
  addLog(message: string): void;
}

type ScrapeResult = {
  success: boolean;
  count: number;
  error?: string;
};

// Port of original working types
interface LegacyTournamentEntity {
  tournamentId: string;
  name: string;
  type: string;
  countryCode: string;
  sex: string;
}

interface LegacyPlayerEntity {
  playerId: string;
  profile: {
    name: string;
    sex: string;
  };
}

interface LegacyMatchEntity {
  matchId: string;
  date?: Date;
  home: string;
  homeLink: string;
  homeH2h: number;
  homeOdds: number;
  away: string;
  awayLink: string;
  awayH2h: number;
  awayOdds: number;
  matchLink: string;
  type: string;
  tournament: string;
  tournamentLink: string;
}

export class LegacyPortScraper {
  private client: ScrapingClient;
  private playerScraper: PlayerScraper;
  private matchDetailScraper: MatchDetailScraper;
  private playerProfileScraper: PlayerProfileScraper;
  private baseUrl = "https://www.tennisexplorer.com"; // Original NEXT_PUBLIC_SCRAPING_SCHEDULE_URL
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.client = new ScrapingClient();
    this.logger = logger;
    this.playerScraper = new PlayerScraper(this.client, this.logger);
    this.matchDetailScraper = new MatchDetailScraper(this.client, this.logger);
    this.playerProfileScraper = new PlayerProfileScraper(this.client, this.logger);
  }

  async scrapeSchedule(): Promise<ScrapeResult> {
    try {
      const message = "📅 Starting schedule scrape with ported legacy logic...";
      console.log(message);
      this.logger?.addLog(message);

      const result = await this.scrapeTournamentMatchesAndPlayers();
      
      if (!result) {
        throw new Error("Failed to scrape schedule");
      }

      const { tournaments: tournamentData, matches: matchData, players: playerData } = result;
      let totalInserted = 0;

      // ✅ Ready for full database population
      const foundMessage = `📊 Found ${tournamentData.length} tournaments, ${matchData.length} matches, ${playerData.length} players`;
      console.log(foundMessage);
      this.logger?.addLog(foundMessage);
      
      const insertMessage = "💾 Inserting data into database...";
      console.log(insertMessage);
      this.logger?.addLog(insertMessage);

      // ✅ Enable all database insertions for full population
      if (tournamentData.length > 0) {
        try {
          const dbTournaments = tournamentData.map(t => this.convertTournament(t));
          await db.insert(tournaments).values(dbTournaments).onConflictDoNothing();
          const message = `✅ Inserted ${dbTournaments.length} tournaments`;
          console.log(message);
          this.logger?.addLog(message);
          totalInserted += dbTournaments.length;
        } catch (error) {
          console.warn("⚠️ Tournament insert error:", error);
        }
      }

      if (matchData.length > 0) {
        try {
          const dbMatches = matchData.map(m => this.convertMatch(m));
          
          const batchSize = 50;
          let insertedCount = 0;
          
          for (let i = 0; i < dbMatches.length; i += batchSize) {
            const batch = dbMatches.slice(i, i + batchSize);
            await db.insert(matches).values(batch).onConflictDoNothing();
            insertedCount += batch.length;
          }
          
          const message = `✅ Inserted ${insertedCount} matches`;
          console.log(message);
          this.logger?.addLog(message);
          totalInserted += insertedCount;
        } catch (error) {
          console.warn("⚠️ Match insert error:", error);
        }
      }

      // Insert basic players so we can enhance them with detailed info
      if (playerData.length > 0) {
        try {
          const dbPlayers = playerData.map(p => this.convertPlayer(p));
          await db.insert(players).values(dbPlayers).onConflictDoNothing();
          const message = `✅ Inserted ${dbPlayers.length} basic players`;
          console.log(message);
          this.logger?.addLog(message);
          totalInserted += dbPlayers.length;
        } catch (error) {
          console.warn("⚠️ Player insert error:", error);
        }
      }

      const scheduleMessage = `📊 Schedule results: ${tournamentData.length} tournaments, ${matchData.length} matches, ${playerData.length} players`;
      console.log(scheduleMessage);
      this.logger?.addLog(scheduleMessage);
      return { success: true, count: totalInserted };

    } catch (error) {
      console.error("❌ Error in schedule scraping:", error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  private async scrapeTournamentMatchesAndPlayers(): Promise<{
    tournaments: LegacyTournamentEntity[], 
    matches: LegacyMatchEntity[], 
    players: LegacyPlayerEntity[]
  } | null> {
    
    // Get current date logic from original - ALWAYS get tomorrow's matches
    const today = new Date();
    const currentHour = today.getHours();
    const timeMessage = `🕐 Current time: ${today.toLocaleString()}, Hour: ${currentHour}`;
    console.log(timeMessage);
    this.logger?.addLog(timeMessage);
    
    // Force tomorrow's matches for tennis predictions
    const targetDate = addDays(today, 1);
    
    const day = targetDate.getDate().toString().padStart(2, '0');
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const year = targetDate.getFullYear().toString();

    const targetMessage = `🎯 Target date: ${targetDate.toLocaleDateString()} (${day}.${month}.${year})`;
    console.log(targetMessage);
    this.logger?.addLog(targetMessage);

    // Original types from legacy
    const types = ["atp-single", "wta-single"];
    
    const links = types.map(
      (type) => `${this.baseUrl}/matches/?type=${type}&year=${year}&month=${month}&day=${day}`
    );

    const scrapeMessage = `🔍 Scraping schedule from TennisExplorer for ${day}.${month}.${year}...`;
    console.log(scrapeMessage);
    this.logger?.addLog(scrapeMessage);
    
    const urlMessage = `📋 URLs to scrape: ${links.join(', ')}`;
    console.log(`📋 URLs to scrape:`, links);
    this.logger?.addLog(urlMessage);

    let tournaments: LegacyTournamentEntity[] = [];
    let matches: LegacyMatchEntity[] = [];
    let players: LegacyPlayerEntity[] = [];

    try {
      // Process each type (ATP/WTA) 
      for (const link of links) {
        const processMessage = `🔗 Processing: ${link}`;
        console.log(processMessage);
        this.logger?.addLog(processMessage);
        
        const result = await this.client.scrapeUrl(
          link,
          async (page: any) => {
            return await this.parseTournamentsMatchesAndPlayers(page, day, month, year);
          }
        );

        if (result) {
          tournaments.push(...result.tournaments);
          matches.push(...result.matches);
          players.push(...result.players);
        }
      }

      // Apply original filters
      const excludeKeywords = ["future"];
      
      tournaments = tournaments.filter((tournament) => {
        const isExcluded = excludeKeywords.some((keyword) =>
          tournament.name?.toLowerCase().includes(keyword)
        );
        return !isExcluded;
      });

      matches = matches.filter((match) => {
        const isExcluded = excludeKeywords.some((keyword) =>
          match.tournament?.toLowerCase().includes(keyword)
        );
        return !isExcluded;
      });

      return { tournaments, matches, players, scrapedUrls: links };

    } catch (error) {
      console.error("❌ Error in scrapeTournamentMatchesAndPlayers:", error);
      return null;
    }
  }

  private async parseTournamentsMatchesAndPlayers(
    page: any, 
    day: string, 
    month: string, 
    year: string
  ): Promise<{ tournaments: LegacyTournamentEntity[], matches: LegacyMatchEntity[], players: LegacyPlayerEntity[] }> {
    
    const dateFormatToMatch = `${day}. ${month}. ${year}`;
    
    return await page.evaluate((dateFormatToMatch: string) => {
      console.log(`🔍 Looking for date tab: ${dateFormatToMatch}`);
      
      // Original logic: Find the correct tab for tomorrow's matches
      const tabs = [...document.querySelectorAll(".tab")];
      const dates = tabs.map((tab) => tab.textContent?.trim());
      
      // Try multiple date formats that TennisExplorer might use
      const possibleFormats = [
        dateFormatToMatch,
        dateFormatToMatch.replace(/^0/, ''), // Remove leading zero from day
        dateFormatToMatch.replace(/\. 0/, '. '), // Remove leading zero from month
        dateFormatToMatch.replace(/^0/, '').replace(/\. 0/, '. ') // Remove both
      ];
      
      console.log(`📋 Found tabs:`, dates);
      console.log(`🎯 Trying date formats:`, possibleFormats);
      
      let tabIndex = -1;
      for (const format of possibleFormats) {
        tabIndex = dates.indexOf(format);
        if (tabIndex !== -1) {
          console.log(`✅ Found match with format: ${format} at index ${tabIndex}`);
          break;
        }
      }
      
      console.log(`🎯 Final tab index: ${tabIndex}`);

      if (tabIndex === -1) {
        console.log(`⚠️ Date ${dateFormatToMatch} not found in tabs`);
        return { tournaments: [], matches: [], players: [] };
      }

      // Get the table for the target date
      const tables = document.querySelectorAll(".content .result tbody");
      const table = tables[tabIndex];
      
      if (!table) {
        console.log(`⚠️ No table found for tab index ${tabIndex}`);
        return { tournaments: [], matches: [], players: [] };
      }

      const rows = table.querySelectorAll("tr");
      console.log(`📊 Processing ${rows.length} rows in target table`);

      // Entities to populate - using original structure
      const tournaments: LegacyTournamentEntity[] = [];
      const matches: LegacyMatchEntity[] = [];
      const players: LegacyPlayerEntity[] = [];

      // Track current tournament context
      let currentType: string | undefined = undefined;
      let currentTournament: string | undefined = undefined;
      let currentTournamentLink: string | undefined = undefined;
      let currentSex: string | undefined = undefined;

      // Track current match being built
      let match: LegacyMatchEntity = {} as LegacyMatchEntity;
      let homePlayer: LegacyPlayerEntity = {} as LegacyPlayerEntity;
      let awayPlayer: LegacyPlayerEntity = {} as LegacyPlayerEntity;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Row is tournament header
        if (row.className === "head flags") {
          console.log(`🏆 Found tournament header at row ${i}`);
          
          const tournamentName =
            row.querySelector("a")?.textContent ||
            row.querySelector(".t-name")?.textContent;

          currentTournament = tournamentName
            ?.replace(/[\n\r]+|[\s]{2,}/g, " ")
            .trim();

          currentTournamentLink = row.querySelector("a")?.getAttribute("href") ?? undefined;

          // Tournament country
          const countryCode = row
            .querySelector(".fl")
            ?.className.replace("fl fl-", "");

          // Tournament type
          let typeClass = row.querySelector("span[class*='type-']")?.className;
          currentType = typeClass?.split("type-")[1];

          // Sex determination
          let sex = "men";

          switch (currentType) {
            case "men2":
              currentType = "singles";
              sex = "men";
              break;
            case "men4":
              currentType = "doubles";
              sex = "men";
              break;
            case "women2":
              currentType = "singles";
              sex = "women";
              break;
            case "women4":
              currentType = "doubles";
              sex = "women";
              break;
          }

          currentSex = sex;

          const tournament: LegacyTournamentEntity = {
            tournamentId: currentTournamentLink || '',
            name: currentTournament || '',
            type: currentType || '',
            countryCode: countryCode || '',
            sex,
          };

          tournaments.push(tournament);
          console.log(`✅ Added tournament: ${currentTournament}`);
        }
        // Row is a player from a match
        else {
          // Row is home player (contains odds info & match link)
          if (row.className.includes("bott")) {
            console.log(`🏠 Processing home player at row ${i}`);
            
            // Get date string
            let date: string | Date | undefined = row
              .querySelector("td[class='first time']")
              ?.textContent?.slice(0, 5);

            // Omit invalid dates
            if (date?.includes("--:--")) {
              date = undefined;
            } else if (date) {
              // Convert time to Date object using tomorrow's date
              const hours = Number(date.substring(0, 2));
              const minutes = Number(date.substring(3, 5));
              
              // Create date for tomorrow (when matches are scheduled)
              const today = new Date();
              const matchDate = new Date(today);
              matchDate.setDate(today.getDate() + 1); // Set to tomorrow
              matchDate.setHours(hours, minutes, 0, 0);
              date = matchDate;
            }

            // Home player info
            const home = row.querySelector("td[class*='t-name'] > a")?.textContent ?? undefined;
            const homeLink = row.querySelector("td[class*='t-name'] > a")?.getAttribute("href") ?? undefined;
            const homeH2h = Number(row.querySelector("td[class*='h2h']")?.textContent) || 0;

            // Odds
            const homeOdds = Number(row.querySelectorAll("td[class*='course']")[0]?.textContent) || 0;
            const awayOdds = Number(row.querySelectorAll("td[class*='course']")[1]?.textContent) || 0;

            // Match link  
            const matchLink = row.querySelector("a[href*='match-detail']")?.getAttribute("href") ?? undefined;
            const matchId = matchLink?.split("/match-detail/?id=")[1];

            // Build match object
            match = {
              matchId: matchId || '',
              date,
              home: home || '',
              homeLink: homeLink || '',
              homeH2h,
              homeOdds,
              awayOdds,
              matchLink: matchLink || '',
              type: currentType || '',
              tournament: currentTournament || '',
              tournamentLink: currentTournamentLink || '',
            } as LegacyMatchEntity;

            // Build home player
            homePlayer = {
              playerId: homeLink || '',
              profile: {
                name: home || '',
                sex: currentSex === "men" ? "man" : "woman",
              },
            } as LegacyPlayerEntity;

            console.log(`✅ Home player: ${home} (${homeLink})`);
          }
          // Row is away player  
          else {
            console.log(`🏃 Processing away player at row ${i}`);
            
            const away = row.querySelector("td[class*='t-name'] > a")?.textContent ?? undefined;
            const awayLink = row.querySelector("td[class*='t-name'] > a")?.getAttribute("href") ?? undefined;
            const awayH2h = Number(row.querySelector("td[class*='h2h']")?.textContent) || 0;

            // Complete match object
            match = {
              ...match,
              away: away || '',
              awayLink: awayLink || '',
              awayH2h,
            } as LegacyMatchEntity;

            // Build away player
            awayPlayer = {
              playerId: awayLink || '',
              profile: {
                name: away || '',
                sex: currentSex === "men" ? "man" : "woman",
              },
            } as LegacyPlayerEntity;

            console.log(`✅ Away player: ${away} (${awayLink})`);

            // Complete match - push all entities (original logic)
            // Check if this is actually an away row by looking for "b" in id
            if (row.id.includes("b")) {
              console.log(`🎾 Completing match: ${match.home} vs ${match.away}`);
              
              // Only push if we have odds (original filter)
              if (match.homeOdds && match.awayOdds) {
                matches.push(match);
                players.push(homePlayer);
                players.push(awayPlayer);
                
                console.log(`✅ Added complete match with odds: ${match.homeOdds}/${match.awayOdds}`);
              } else {
                console.log(`⚠️ Skipping match without odds`);
              }

              // Reset for next match
              match = {} as LegacyMatchEntity;
              homePlayer = {} as LegacyPlayerEntity; 
              awayPlayer = {} as LegacyPlayerEntity;
            }
          }
        }
      }

      console.log(`📊 Final parsed results: ${tournaments.length} tournaments, ${matches.length} matches, ${players.length} players`);

      return { tournaments, matches, players };
    }, dateFormatToMatch);
  }

  // Convert legacy entities to new database format
  private convertTournament(legacy: LegacyTournamentEntity): NewTournament {
    return {
      tournamentId: legacy.tournamentId.replace(/\//g, '-') || 'unknown-tournament',
      name: legacy.name || 'Unknown Tournament',
      country: legacy.countryCode || 'Unknown',
      surface: 'Hard', // Default
      type: legacy.type === 'singles' ? 'ATP' : 'ATP',
      sex: legacy.sex as 'men' | 'women',
      prize: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private convertMatch(legacy: LegacyMatchEntity): NewMatch {
    // Handle date safely - use tomorrow as default if invalid
    let finalDate: Date;
    try {
      if (legacy.date && legacy.date instanceof Date && !isNaN(legacy.date.getTime())) {
        finalDate = legacy.date;
      } else {
        finalDate = addDays(new Date(), 1); // Default to tomorrow
      }
    } catch (error) {
      finalDate = addDays(new Date(), 1); // Fallback to tomorrow
    }
    
    // Clean up match ID and tournament ID
    const cleanMatchId = (legacy.matchId || `${legacy.home}-vs-${legacy.away}`)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 255);
      
    const cleanTournamentId = (legacy.tournamentLink || 'unknown-tournament')
      .replace(/\//g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 255);
    
    return {
      matchId: cleanMatchId,
      tournament: (legacy.tournament || 'Unknown Tournament').substring(0, 255),
      tournamentId: cleanTournamentId,
      tournamentLink: legacy.tournamentLink || '',
      year: finalDate.getFullYear(),
      type: (legacy.type === 'singles' ? 'ATP' : 'ATP').substring(0, 100),
      surface: 'Hard',
      round: 'Unknown',
      date: finalDate, // Store as Date object for JSONB field
      homeLink: legacy.homeLink || '',
      awayLink: legacy.awayLink || '',
      home: (legacy.home || '').substring(0, 255),
      away: (legacy.away || '').substring(0, 255),
      homeH2h: legacy.homeH2h || 0,
      awayH2h: legacy.awayH2h || 0, 
      homeOdds: (legacy.homeOdds || 0),
      awayOdds: (legacy.awayOdds || 0),
      matchLink: legacy.matchLink || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private convertPlayer(legacy: LegacyPlayerEntity): NewPlayer {
    // Keep the full playerId path for URL construction
    const playerId = legacy.playerId || 'unknown-player';
    // Extract clean name for image filename
    const cleanId = legacy.playerId.replace(/\//g, '').replace('player', '') || 'unknown-player';
    
    return {
      playerId,
      name: legacy.profile.name || 'Unknown Player',
      image: '/placeholder/player.jpg', // Placeholder image to satisfy notNull constraint
      country: 'Unknown',
      age: 0,
      birthday: '1990-01-01',
      singlesRank: 0,
      sex: legacy.profile.sex === 'man' ? 'men' : 'women',
      hand: 'Right',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async scrapeTournaments(): Promise<ScrapeResult> {
    try {
      const message = "🏆 Enhancing tournament details...";
      console.log(message);
      this.logger?.addLog(message);
      const tournamentData = await db.select().from(tournaments);
      let updatedCount = 0;
      
      for (const tournament of tournamentData) {
        try {
          const tournamentUrl = `${this.baseUrl}/tournament/${tournament.tournamentId}`;
          const result = await this.client.scrapeUrl(tournamentUrl, this.parseTournamentDetails.bind(this));
          
          if (result && Object.keys(result).length > 0) {
            await db.update(tournaments).set({ ...result, updatedAt: new Date() })
              .where(eq(tournaments.tournamentId, tournament.tournamentId));
            updatedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to enhance tournament ${tournament.tournamentId}:`, error);
        }
      }

      return { success: true, count: updatedCount };
    } catch (error) {
      console.error("❌ Error scraping tournaments:", error);
      return { success: false, count: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async scrapeMatches(): Promise<ScrapeResult> {
    try {
      const message = "🎾 Step 3: Scraping detailed match data...";
      console.log(message);
      this.logger?.addLog(message);
      
      // Get all matches from database to enhance with detailed data
      const matchData = await db.select().from(matches);
      
      if (matchData.length === 0) {
        const message = "❌ No matches found in database to enhance";
        console.log(message);
        this.logger?.addLog(message);
        return { success: true, count: 0 };
      }

      const foundMessage = `📊 Found ${matchData.length} matches to enhance with detailed data`;
      console.log(foundMessage);
      this.logger?.addLog(foundMessage);

      // Get match links for detailed scraping
      const matchLinks = matchData
        .filter(match => match.matchLink)
        .map(match => match.matchLink);

      if (matchLinks.length === 0) {
        const message = "⚠️ No match links found for detailed scraping";
        console.log(message);
        this.logger?.addLog(message);
        return { success: true, count: matchData.length };
      }

      // Scrape detailed match data using legacy selectors
      const detailedMatches = await this.matchDetailScraper.scrapeMatchDetails(matchLinks);

      // Update matches with detailed data
      let updatedCount = 0;
      for (const detailedMatch of detailedMatches) {
        if (detailedMatch?.matchId) {
          try {
            await db.update(matches)
              .set({
                headToHeadMatches: detailedMatch.headToHeadMatches,
                homeH2h: detailedMatch.homeH2h,
                awayH2h: detailedMatch.awayH2h,
                odds: detailedMatch.odds,
                updatedAt: new Date()
              })
              .where(eq(matches.matchLink, `/match-detail/?id=${detailedMatch.matchId}`));
            
            updatedCount++;
          } catch (error) {
            console.warn(`⚠️ Failed to update match ${detailedMatch.matchId}:`, error);
          }
        }
      }

      const enhancedMatchMessage = `✅ Enhanced ${updatedCount} matches with detailed data`;
      console.log(enhancedMatchMessage);
      this.logger?.addLog(enhancedMatchMessage);
      return { success: true, count: updatedCount };
    } catch (error) {
      console.error("❌ Error in scrapeMatches:", error);
      return { success: false, count: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async scrapePlayers(): Promise<ScrapeResult> {
    try {
      const message = "👤 Enhancing player details...";
      console.log(message);
      this.logger?.addLog(message);
      
      // ✅ Get all players from database to enhance with detailed information  
      const playerData = await db.select().from(players); // Process all players
      
      if (playerData.length === 0) {
        const message = "❌ No players found in database to enhance";
        console.log(message);
        this.logger?.addLog(message);
        return { success: true, count: 0 };
      }

      const enhancingMessage = `👤 Enhancing ${playerData.length} players with detailed information...`;
      console.log(enhancingMessage);
      this.logger?.addLog(enhancingMessage);
      
      // Use the sophisticated PlayerScraper to get images, rankings, stats, etc.
      const enhancedPlayers = await this.playerScraper.enhancePlayers(playerData);
      
      const enhancedMessage = `📊 Successfully enhanced ${enhancedPlayers.length} players`;
      console.log(enhancedMessage);
      this.logger?.addLog(enhancedMessage);

      // Step 4b: Use detailed PlayerProfileScraper to get records and last matches
      const playerLinks = playerData
        .filter(player => player.playerId)
        .map(player => player.playerId);

      const detailedProfiles = await this.playerProfileScraper.scrapePlayerProfiles(playerLinks);
      const profileMessage = `📊 Successfully scraped ${detailedProfiles.length} detailed profiles`;
      console.log(profileMessage);
      this.logger?.addLog(profileMessage);

      // ✅ Enable player enhancement database updates
      let updatedCount = 0;
      
      for (const enhancedPlayer of enhancedPlayers) {
        try {
          if (enhancedPlayer && enhancedPlayer.playerId && Object.keys(enhancedPlayer).length > 0) {
            // Find matching detailed profile
            const detailedProfile = detailedProfiles.find(
              profile => profile?.playerId === enhancedPlayer.playerId
            );

            // Combine basic and detailed data
            const combinedData = {
              ...enhancedPlayer,
              ...(detailedProfile && {
                record: detailedProfile.record,
                lastMatches: detailedProfile.lastMatches
              }),
              updatedAt: new Date()
            };

            await db.update(players).set(combinedData)
              .where(eq(players.playerId, enhancedPlayer.playerId));
            updatedCount++;
            
            // Store the lastMatches data in the matches table for proper querying
            if (detailedProfile?.lastMatches && Array.isArray(detailedProfile.lastMatches)) {
              for (const matchData of detailedProfile.lastMatches) {
                try {
                  const cleanMatchId = `player-${enhancedPlayer.playerId?.replace('/player/', '').replace('/', '') || 'unknown'}-${matchData.date}-${matchData.opponent}-${matchData.tournament}`.replace(/[^\w-]/g, '');
                  
                  // Parse date properly - format is "DD.MM."
                  let parsedDate = new Date();
                  try {
                    const dateParts = matchData.date.match(/(\d+)\.(\d+)\./);
                    if (dateParts) {
                      const day = parseInt(dateParts[1]);
                      const month = parseInt(dateParts[2]) - 1; // Month is 0-indexed
                      const year = new Date().getFullYear(); // Use current year
                      parsedDate = new Date(year, month, day);
                    }
                  } catch (e) {
                    // Use current date if parsing fails
                  }
                  
                  const homeLink = matchData.result === 'W' ? enhancedPlayer.playerId : `/player/${matchData.opponent.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')}/`;
                  const awayLink = matchData.result === 'W' ? `/player/${matchData.opponent.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')}/` : enhancedPlayer.playerId;
                  
                  await db.insert(matches).values({
                    matchId: cleanMatchId,
                    tournament: matchData.tournament?.trim() || 'Unknown',
                    tournamentId: matchData.tournamentLink?.replace(/\//g, '').replace(/-/g, '') || cleanMatchId,
                    tournamentLink: matchData.tournamentLink || '',
                    home: matchData.result === 'W' ? enhancedPlayer.name : matchData.opponent,
                    away: matchData.result === 'W' ? matchData.opponent : enhancedPlayer.name,
                    homeLink,
                    awayLink,
                    homeOdds: Number(matchData.result === 'W' ? (matchData.homeOdds || 0) : (matchData.awayOdds || 0)),
                    awayOdds: Number(matchData.result === 'W' ? (matchData.awayOdds || 0) : (matchData.homeOdds || 0)),
                    surface: (matchData.surface || 'Hard').charAt(0).toUpperCase() + (matchData.surface || 'Hard').slice(1).toLowerCase(),
                    round: matchData.round || 'Unknown',
                    date: parsedDate,
                    year: parsedDate.getFullYear(),
                    type: enhancedPlayer.sex === 'women' ? 'WTA' : 'ATP',
                    matchLink: matchData.matchLink,
                    result: {
                      winner: matchData.result === 'W' ? enhancedPlayer.name : matchData.opponent,
                      homeSets: 0,
                      awaySets: 0,
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }).onConflictDoUpdate({
                    target: [matches.matchId],
                    set: {
                      homeOdds: String(matchData.result === 'W' ? (matchData.homeOdds || 0) : (matchData.awayOdds || 0)),
                      awayOdds: String(matchData.result === 'W' ? (matchData.awayOdds || 0) : (matchData.homeOdds || 0)),
                      updatedAt: new Date()
                    }
                  });
                  
                } catch (matchError) {
                  console.warn(`⚠️ Error storing match for ${enhancedPlayer.name}:`, matchError);
                }
              }
            }
            
            const recordInfo = detailedProfile?.record ? 
              `record: ${JSON.stringify(detailedProfile.record.all?.summary || {})}` : 
              'no record';
            const matchesInfo = detailedProfile?.lastMatches ? 
              `${detailedProfile.lastMatches.length} matches` : 
              'no matches';
              
            const logMessage = `✅ Enhanced player: ${enhancedPlayer.name} with image: ${enhancedPlayer.image}, ${recordInfo}, ${matchesInfo}`;
            console.log(logMessage);
            this.logger?.addLog(logMessage);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to update player ${enhancedPlayer?.playerId}:`, error);
        }
      }

      return { success: true, count: updatedCount };
    } catch (error) {
      console.error("❌ Error in scrapePlayers:", error);
      return { success: false, count: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async scrapeStats(): Promise<ScrapeResult> {
    try {
      const message = "📊 Creating player statistics...";
      console.log(message);
      this.logger?.addLog(message);
      const playerData = await db.select().from(players);
      const statsToInsert: NewPlayerStats[] = playerData.map(player => ({
        playerId: player.playerId,
        player: player.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (statsToInsert.length > 0) {
        await db.insert(playerStats).values(statsToInsert).onConflictDoNothing();
      }

      return { success: true, count: statsToInsert.length };
    } catch (error) {
      return { success: false, count: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private async parseTournamentDetails(page: any): Promise<Partial<NewTournament>> {
    try {
      const details = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        let prize = '';
        const prizeRegex = /\$[\d,]+/;
        const prizeMatch = bodyText.match(prizeRegex);
        if (prizeMatch) prize = prizeMatch[0];
        
        let surface = 'Hard';
        if (bodyText.toLowerCase().includes('grass')) surface = 'Grass';
        else if (bodyText.toLowerCase().includes('clay')) surface = 'Clay';
        
        return { prize, surface };
      });
      return details;
    } catch (error) {
      return {};
    }
  }

  private async parsePlayerDetails(page: any): Promise<Partial<NewPlayer>> {
    try {
      const playerData = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        
        let country = 'Unknown';
        const countryRegex = /country[:\s]+([a-zA-Z\s]+)/i;
        const countryMatch = bodyText.match(countryRegex);
        if (countryMatch) country = countryMatch[1].trim();
        
        let age = 0;
        const ageRegex = /(\d{1,2})\s*years?\s*old/i;
        const ageMatch = bodyText.match(ageRegex);
        if (ageMatch) age = parseInt(ageMatch[1]) || 0;
        
        let singlesRank = 0;
        const rankRegex = /rank:?\s*#?(\d+)/i;
        const rankMatch = bodyText.match(rankRegex);
        if (rankMatch) singlesRank = parseInt(rankMatch[1]) || 0;
        
        return { country: country !== 'Unknown' ? country : undefined, age: age > 0 ? age : undefined, singlesRank: singlesRank > 0 ? singlesRank : undefined };
      });
      return playerData;
    } catch (error) {
      return {};
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}