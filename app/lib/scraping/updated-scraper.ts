import { addDays, format } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "~/lib/db";
import { matches, players, tournaments, playerStats } from "~/lib/db/schema";
import type { NewMatch, NewPlayer, NewTournament, NewPlayerStats } from "~/lib/db/schema";
import { ScrapingClient } from "./scraping-client";

type ScrapeResult = {
  success: boolean;
  count: number;
  error?: string;
};

export class UpdatedScraper {
  private client: ScrapingClient;
  private baseUrl = "https://www.tennisexplorer.com";

  constructor() {
    this.client = new ScrapingClient();
  }

  async scrapeSchedule(): Promise<ScrapeResult> {
    try {
      console.log("📅 Starting real schedule scrape with updated selectors...");

      // Create tomorrow's schedule URL
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day = tomorrow.getDate().toString().padStart(2, '0');
      const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
      const year = tomorrow.getFullYear().toString();
      
      const scheduleUrl = `${this.baseUrl}/matches/?type=atp-single&year=${year}&month=${month}&day=${day}`;
      console.log(`🔗 Scraping: ${scheduleUrl}`);

      const result = await this.client.scrapeUrl(
        scheduleUrl,
        this.parseSchedulePage.bind(this)
      );

      if (!result) {
        throw new Error("Failed to scrape schedule page");
      }

      const { tournaments: tournamentData, matches: matchData, players: playerData } = result;
      let totalInserted = 0;

      // Insert tournaments if any found
      if (tournamentData.length > 0) {
        try {
          await db.insert(tournaments).values(tournamentData).onConflictDoNothing();
          console.log(`✅ Inserted ${tournamentData.length} tournaments`);
          totalInserted += tournamentData.length;
        } catch (error) {
          console.warn("⚠️ Tournament insert error:", error);
        }
      }

      // Insert matches if any found
      if (matchData.length > 0) {
        try {
          await db.insert(matches).values(matchData).onConflictDoNothing();
          console.log(`✅ Inserted ${matchData.length} matches`);
          totalInserted += matchData.length;
        } catch (error) {
          console.warn("⚠️ Match insert error:", error);
        }
      }

      // Insert players if any found
      if (playerData.length > 0) {
        try {
          await db.insert(players).values(playerData).onConflictDoNothing();
          console.log(`✅ Inserted ${playerData.length} players`);
          totalInserted += playerData.length;
        } catch (error) {
          console.warn("⚠️ Player insert error:", error);
        }
      }

      console.log(`📊 Schedule scrape results: ${tournamentData.length} tournaments, ${matchData.length} matches, ${playerData.length} players`);
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

  private async parseSchedulePage(page: any): Promise<{tournaments: NewTournament[], matches: NewMatch[], players: NewPlayer[]}> {
    try {
      console.log("🔍 Parsing schedule page with updated selectors...");

      const data = await page.evaluate(() => {
        // Based on debug analysis, matches are in .fRow containers (found 14 of them)
        const matchRows = document.querySelectorAll('.fRow');
        console.log(`Found ${matchRows.length} match rows`);

        const matches = [];
        const tournaments = new Set<string>();
        const players = new Set<{id: string, name: string}>();

        // Also check for table rows as backup
        const allRows = document.querySelectorAll('tr');
        console.log(`Found ${allRows.length} table rows`);

        // Process .fRow elements - each row represents one player, matches span consecutive rows
        for (let i = 0; i < matchRows.length; i += 2) { // Process in pairs
          const homeRow = matchRows[i];
          const awayRow = matchRows[i + 1];
          
          if (!homeRow || !awayRow) continue; // Skip if we don't have both rows
          
          try {
            const homeRowText = homeRow.textContent?.trim() || '';
            const awayRowText = awayRow.textContent?.trim() || '';
            
            console.log(`Processing match ${i/2 + 1}: Row ${i} and ${i+1}`);
            
            // Extract home player info
            const homePlayerLinks = homeRow.querySelectorAll('a[href*="/player/"]');
            const awayPlayerLinks = awayRow.querySelectorAll('a[href*="/player/"]');
            
            if (homePlayerLinks.length >= 1 && awayPlayerLinks.length >= 1) {
              const homePlayer = homePlayerLinks[0].textContent?.trim() || '';
              const awayPlayer = awayPlayerLinks[0].textContent?.trim() || '';
              const homeLink = homePlayerLinks[0].getAttribute('href') || '';
              const awayLink = awayPlayerLinks[0].getAttribute('href') || '';
              
              // Extract time (should be same for both rows, take from first)
              const timeMatch = homeRowText.match(/(\d{1,2}:\d{2})/);
              const time = timeMatch ? timeMatch[1] : 'TBD';
              
              // Look for tournament info in parent table
              let tournament = 'Unknown Tournament';
              let tournamentId = 'unknown-tournament';
              
              const tournamentLink = homeRow.closest('table')?.querySelector('a[href*="/tournament/"]') ||
                                   awayRow.closest('table')?.querySelector('a[href*="/tournament/"]');
              
              if (tournamentLink) {
                tournament = tournamentLink.textContent?.trim() || 'Unknown Tournament';
                const href = tournamentLink.getAttribute('href') || '';
                tournamentId = href.replace('/tournament/', '').replace('/', '') || 'unknown-tournament';
                tournaments.add(tournament);
              }
              
              // Extract odds from both rows
              const homeOddElements = homeRow.querySelectorAll('.course');
              const awayOddElements = awayRow.querySelectorAll('.course');
              
              let homeOdds = 0;
              let awayOdds = 0;
              
              // Get first odds value from each row
              if (homeOddElements.length >= 1) {
                const homeOddsText = homeOddElements[0]?.textContent?.trim() || '';
                const homeOddsNum = parseFloat(homeOddsText);
                homeOdds = homeOddsNum ? Math.round(homeOddsNum * 100) : 0;
              }
              
              if (awayOddElements.length >= 1) {
                const awayOddsText = awayOddElements[0]?.textContent?.trim() || '';
                const awayOddsNum = parseFloat(awayOddsText);
                awayOdds = awayOddsNum ? Math.round(awayOddsNum * 100) : 0;
              }
              
              // Add players to set
              if (homePlayer && homeLink) {
                const playerId = homeLink.replace('/player/', '').replace('/', '');
                players.add({id: playerId, name: homePlayer});
              }
              if (awayPlayer && awayLink) {
                const playerId = awayLink.replace('/player/', '').replace('/', '');
                players.add({id: playerId, name: awayPlayer});
              }
              
              matches.push({
                homePlayer,
                awayPlayer,
                homeLink,
                awayLink,
                tournament,
                tournamentId,
                tournamentLink: tournamentLink?.getAttribute('href') || '',
                time,
                homeOdds,
                awayOdds,
                rowIndex: i,
                debug: `Match from rows ${i} and ${i+1}: ${homePlayer} vs ${awayPlayer} at ${time}`
              });
              
              console.log(`✅ Extracted match: ${homePlayer} vs ${awayPlayer} at ${time}`);
            } else {
              console.log(`⚠️ Rows ${i}/${i+1}: insufficient player links (${homePlayerLinks.length}/${awayPlayerLinks.length})`);
            }
            
          } catch (error) {
            console.warn(`Error parsing match rows ${i}/${i+1}:`, error);
          }
        }

        console.log(`Final results: ${matches.length} matches, ${tournaments.size} tournaments, ${players.size} players`);

        return {
          matches,
          tournaments: Array.from(tournaments),
          players: Array.from(players),
          debug: {
            fRowCount: matchRows.length,
            trCount: allRows.length,
            successfulMatches: matches.length
          }
        };
      });

      // Convert to database format
      const currentDate = new Date();
      const tomorrow = addDays(currentDate, 1);

      const tournamentData: NewTournament[] = data.tournaments.map(name => ({
        tournamentId: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        country: "Unknown",
        surface: "Hard",
        type: "ATP",
        sex: "men",
        prize: "",
        createdAt: currentDate,
        updatedAt: currentDate,
      }));

      const matchData: NewMatch[] = data.matches.map((match, index) => ({
        matchId: `${match.homePlayer}-vs-${match.awayPlayer}-${format(tomorrow, 'yyyy-MM-dd')}-${index}`.toLowerCase().replace(/\s+/g, '-'),
        tournament: match.tournament || "Unknown Tournament",
        tournamentId: match.tournamentId || "unknown-tournament",
        tournamentLink: match.tournamentLink || "",
        year: tomorrow.getFullYear(),
        type: "ATP",
        surface: "Hard",
        round: "Unknown",
        date: tomorrow,
        homeLink: match.homeLink,
        awayLink: match.awayLink,
        home: match.homePlayer,
        away: match.awayPlayer,
        homeOdds: match.homeOdds,
        awayOdds: match.awayOdds,
        matchLink: `/match/${match.homePlayer}-vs-${match.awayPlayer}`.toLowerCase().replace(/\s+/g, '-'),
        createdAt: currentDate,
        updatedAt: currentDate,
      }));

      const playerData: NewPlayer[] = data.players.map(player => ({
        playerId: player.id,
        name: player.name,
        image: `/players/${player.id}.jpg`,
        country: "Unknown",
        age: 0,
        birthday: "1990-01-01", // Use placeholder date instead of empty string
        singlesRank: 0,
        sex: "men",
        hand: "Right",
        createdAt: currentDate,
        updatedAt: currentDate,
      }));

      console.log(`🎯 Parsed: ${tournamentData.length} tournaments, ${matchData.length} matches, ${playerData.length} players`);
      
      return {
        tournaments: tournamentData,
        matches: matchData,
        players: playerData
      };

    } catch (error) {
      console.error("❌ Error parsing schedule page:", error);
      return {
        tournaments: [],
        matches: [],
        players: []
      };
    }
  }

  async scrapePlayers(): Promise<ScrapeResult> {
    try {
      console.log("👤 Enhancing player details with updated selectors...");
      
      // Get existing players from database
      const playerData = await db.select().from(players).limit(5); // Limit for testing
      
      let updatedCount = 0;
      
      for (const player of playerData) {
        try {
          const playerUrl = `${this.baseUrl}/player/${player.playerId}/`;
          const result = await this.client.scrapeUrl(
            playerUrl,
            this.parsePlayerDetails.bind(this)
          );

          if (result && Object.keys(result).length > 0) {
            // Update player with enhanced details
            await db
              .update(players)
              .set({
                ...result,
                updatedAt: new Date(),
              })
              .where(eq(players.playerId, player.playerId));
            
            updatedCount++;
            console.log(`✅ Enhanced player: ${player.name}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to enhance player ${player.playerId}:`, error);
        }
      }

      console.log(`👤 Enhanced ${updatedCount} players`);
      return { success: true, count: updatedCount };

    } catch (error) {
      console.error("❌ Error scraping players:", error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  private async parsePlayerDetails(page: any): Promise<Partial<NewPlayer>> {
    try {
      console.log("🔍 Parsing player page...");

      const playerData = await page.evaluate(() => {
        // Based on analysis, player data is sparse on current site
        // Extract what we can find
        const h1Elements = document.querySelectorAll('h1');
        let name = '';
        
        // Look for player name in h1 elements
        for (const h1 of h1Elements) {
          const text = h1.textContent?.trim() || '';
          if (text && text !== "Player's profile" && !text.toLowerCase().includes('tennis')) {
            name = text;
            break;
          }
        }
        
        // Try to find country info
        let country = 'Unknown';
        const flagElements = document.querySelectorAll('[class*="flag"], [class*="country"]');
        if (flagElements.length > 0) {
          country = flagElements[0].textContent?.trim() || 'Unknown';
        }
        
        // Look for age information
        let age = 0;
        const ageRegex = /(\d{1,2})\s*years?\s*old/i;
        const bodyText = document.body.textContent || '';
        const ageMatch = bodyText.match(ageRegex);
        if (ageMatch) {
          age = parseInt(ageMatch[1]) || 0;
        }
        
        // Look for ranking
        let singlesRank = 0;
        const rankRegex = /rank:?\s*#?(\d+)/i;
        const rankMatch = bodyText.match(rankRegex);
        if (rankMatch) {
          singlesRank = parseInt(rankMatch[1]) || 0;
        }
        
        return {
          name: name || undefined,
          country: country !== 'Unknown' ? country : undefined,
          age: age > 0 ? age : undefined,
          singlesRank: singlesRank > 0 ? singlesRank : undefined,
        };
      });

      // Filter out undefined values
      const result: Partial<NewPlayer> = {};
      Object.entries(playerData).forEach(([key, value]) => {
        if (value !== undefined) {
          (result as any)[key] = value;
        }
      });

      console.log(`🎯 Extracted player data:`, result);
      return result;

    } catch (error) {
      console.error("❌ Error parsing player details:", error);
      return {};
    }
  }

  async scrapeTournaments(): Promise<ScrapeResult> {
    try {
      console.log("🏆 Enhancing tournament details...");
      
      // Get existing tournaments from database
      const tournamentData = await db.select().from(tournaments);
      
      let updatedCount = 0;
      
      for (const tournament of tournamentData) {
        try {
          const tournamentUrl = `${this.baseUrl}/tournament/${tournament.tournamentId}`;
          const result = await this.client.scrapeUrl(
            tournamentUrl,
            this.parseTournamentDetails.bind(this)
          );

          if (result && Object.keys(result).length > 0) {
            // Update tournament with enhanced details
            await db
              .update(tournaments)
              .set({
                ...result,
                updatedAt: new Date(),
              })
              .where(eq(tournaments.tournamentId, tournament.tournamentId));
            
            updatedCount++;
            console.log(`✅ Enhanced tournament: ${tournament.name}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to enhance tournament ${tournament.tournamentId}:`, error);
        }
      }

      console.log(`🏆 Enhanced ${updatedCount} tournaments`);
      return { success: true, count: updatedCount };

    } catch (error) {
      console.error("❌ Error scraping tournaments:", error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  async scrapeMatches(): Promise<ScrapeResult> {
    try {
      console.log("🎾 Match details already included in schedule scrape");
      
      // Match details are already captured in scrapeSchedule()
      // This method exists for interface compatibility
      const matchData = await db.select().from(matches);
      
      console.log(`🎾 Found ${matchData.length} matches in database`);
      return { success: true, count: matchData.length };

    } catch (error) {
      console.error("❌ Error checking matches:", error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  async scrapeStats(): Promise<ScrapeResult> {
    try {
      console.log("📊 Creating player statistics...");
      
      const playerData = await db.select().from(players);
      const statsToInsert: NewPlayerStats[] = [];
      
      for (const player of playerData) {
        try {
          // Create basic stats entry for each player
          const stats: NewPlayerStats = {
            playerId: player.playerId,
            player: player.name, // Use 'player' field as required by schema
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          statsToInsert.push(stats);
        } catch (error) {
          console.warn(`⚠️ Failed to create stats for player ${player.playerId}:`, error);
        }
      }

      if (statsToInsert.length > 0) {
        await db.insert(playerStats).values(statsToInsert).onConflictDoNothing();
      }

      console.log(`📊 Created ${statsToInsert.length} player stats`);
      return { success: true, count: statsToInsert.length };

    } catch (error) {
      console.error("❌ Error scraping stats:", error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  private async parseTournamentDetails(page: any): Promise<Partial<NewTournament>> {
    try {
      // Extract tournament details from current page structure
      const details = await page.evaluate(() => {
        // Look for prize money
        let prize = '';
        const prizeRegex = /\$[\d,]+/;
        const bodyText = document.body.textContent || '';
        const prizeMatch = bodyText.match(prizeRegex);
        if (prizeMatch) {
          prize = prizeMatch[0];
        }
        
        // Look for surface info
        let surface = 'Hard'; // default
        if (bodyText.toLowerCase().includes('grass')) surface = 'Grass';
        else if (bodyText.toLowerCase().includes('clay')) surface = 'Clay';
        
        return { prize, surface };
      });

      return details;
    } catch (error) {
      console.warn("⚠️ Error parsing tournament details:", error);
      return {};
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}