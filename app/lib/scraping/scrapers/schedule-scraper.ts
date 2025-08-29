import { addDays, format } from "date-fns";
import type { ScrapingClient } from "../scraping-client";
import type { NewMatch, NewTournament, NewPlayer } from "~/lib/db/schema";

type ScheduleData = {
  tournaments: NewTournament[];
  matches: NewMatch[];
  players: NewPlayer[];
};

export class ScheduleScraper {
  private client: ScrapingClient;
  private baseUrl = "https://www.flashscore.com"; // Replace with actual tennis site

  constructor(client: ScrapingClient) {
    this.client = client;
  }

  async scrapeSchedule(): Promise<ScheduleData> {
    console.log("📅 Starting schedule scrape...");

    // Get tomorrow's date
    const tomorrow = addDays(new Date(), 1);
    const tomorrowFormatted = format(tomorrow, "yyyy-MM-dd");
    
    // Construct URL for tomorrow's matches
    const scheduleUrl = `${this.baseUrl}/tennis/fixtures/?date=${tomorrowFormatted}`;

    const result = await this.client.scrapeUrl(
      scheduleUrl,
      this.parseSchedulePage.bind(this)
    );

    if (!result) {
      console.warn("⚠️ No schedule data found, returning empty results");
      return { tournaments: [], matches: [], players: [] };
    }

    // Filter out unwanted tournaments (futures, etc.)
    const excludeKeywords = ["futures", "qualifying", "junior"];
    
    const filteredTournaments = result.tournaments.filter(tournament => 
      !excludeKeywords.some(keyword => 
        tournament.name.toLowerCase().includes(keyword)
      )
    );

    const tournamentIds = new Set(filteredTournaments.map(t => t.tournamentId));
    const filteredMatches = result.matches.filter(match => 
      tournamentIds.has(match.tournamentId)
    );

    const playerIds = new Set([
      ...filteredMatches.map(m => m.home),
      ...filteredMatches.map(m => m.away)
    ]);
    const filteredPlayers = result.players.filter(player => 
      playerIds.has(player.name)
    );

    console.log(`📊 Filtered results: ${filteredTournaments.length} tournaments, ${filteredMatches.length} matches, ${filteredPlayers.length} players`);

    return {
      tournaments: filteredTournaments,
      matches: filteredMatches,
      players: filteredPlayers,
    };
  }

  private async parseSchedulePage(page: any): Promise<ScheduleData> {
    try {
      // Wait for the schedule to load
      const hasSchedule = await this.client.waitForSelector(page, ".schedule-table", 10000);
      if (!hasSchedule) {
        console.warn("⚠️ Schedule table not found");
        return { tournaments: [], matches: [], players: [] };
      }

      // Extract tournament data
      const tournaments = await this.extractTournaments(page);
      const tournamentMap = new Map(tournaments.map(t => [t.name, t]));

      // Extract match data
      const matches = await this.extractMatches(page, tournamentMap);
      
      // Extract basic player data
      const players = await this.extractBasicPlayers(matches);

      return { tournaments, matches, players };

    } catch (error) {
      console.error("❌ Error parsing schedule page:", error);
      return { tournaments: [], matches: [], players: [] };
    }
  }

  private async extractTournaments(page: any): Promise<NewTournament[]> {
    const tournaments: NewTournament[] = [];

    try {
      // Extract tournament sections
      const tournamentElements = await page.$$(".tournament-section");
      
      for (const element of tournamentElements) {
        const name = await element.$eval(".tournament-name", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "Unknown Tournament");

        const country = await element.$eval(".tournament-location", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "Unknown");

        const surface = await element.$eval(".tournament-surface", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "Hard");

        const type = await element.$eval(".tournament-type", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "ATP");

        const prize = await element.$eval(".tournament-prize", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "");

        const tournamentId = `${name.toLowerCase().replace(/\s+/g, "-")}-${new Date().getFullYear()}`;

        tournaments.push({
          tournamentId,
          name,
          country,
          surface,
          type,
          sex: type.includes("WTA") ? "women" : "men",
          prize,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

    } catch (error) {
      console.error("❌ Error extracting tournaments:", error);
    }

    return tournaments;
  }

  private async extractMatches(page: any, tournamentMap: Map<string, NewTournament>): Promise<NewMatch[]> {
    const matches: NewMatch[] = [];

    try {
      // Extract match rows
      const matchElements = await page.$$(".match-row");
      
      for (const element of matchElements) {
        const home = await element.$eval(".player-home .player-name", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "");

        const away = await element.$eval(".player-away .player-name", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "");

        if (!home || !away) continue;

        const tournamentName = await element.$eval(".tournament-name", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "Unknown Tournament");

        const tournament = Array.from(tournamentMap.values())
          .find(t => t.name.includes(tournamentName)) || 
          Array.from(tournamentMap.values())[0];

        if (!tournament) continue;

        const timeText = await element.$eval(".match-time", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "");

        const round = await element.$eval(".match-round", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "First Round");

        const homeOddsText = await element.$eval(".odds-home", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "2.00");

        const awayOddsText = await element.$eval(".odds-away", (el: Element) => 
          el.textContent?.trim() || ""
        ).catch(() => "2.00");

        const matchId = `${home.replace(/\s+/g, "-")}-vs-${away.replace(/\s+/g, "-")}-${Date.now()}`;
        const homeLink = `/player/${home.toLowerCase().replace(/\s+/g, "-")}`;
        const awayLink = `/player/${away.toLowerCase().replace(/\s+/g, "-")}`;
        const matchLink = `/match/${matchId}`;

        // Parse odds (convert from decimal to American if needed)
        const homeOdds = this.parseOdds(homeOddsText);
        const awayOdds = this.parseOdds(awayOddsText);

        // Parse time and create date
        const matchDate = this.parseMatchTime(timeText);

        matches.push({
          matchId,
          tournament: tournament.name,
          tournamentId: tournament.tournamentId,
          tournamentLink: `/tournament/${tournament.tournamentId}`,
          year: new Date().getFullYear(),
          type: tournament.type,
          surface: tournament.surface,
          round,
          date: matchDate,
          homeLink,
          awayLink,
          home,
          away,
          homeOdds,
          awayOdds,
          matchLink,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

    } catch (error) {
      console.error("❌ Error extracting matches:", error);
    }

    return matches;
  }

  private async extractBasicPlayers(matches: NewMatch[]): Promise<NewPlayer[]> {
    const playersMap = new Map<string, NewPlayer>();

    for (const match of matches) {
      // Create basic player entries for home and away players
      [match.home, match.away].forEach(playerName => {
        if (!playersMap.has(playerName)) {
          const playerId = playerName.toLowerCase().replace(/\s+/g, "-");
          
          playersMap.set(playerName, {
            playerId,
            name: playerName,
            image: "/placeholder-player.jpg", // Default image
            country: "Unknown", // Will be enhanced later
            age: 0, // Will be enhanced later
            birthday: new Date().toISOString().split('T')[0], // Will be enhanced later
            singlesRank: 0, // Will be enhanced later
            sex: "Unknown", // Will be enhanced later
            hand: "Unknown", // Will be enhanced later
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    }

    return Array.from(playersMap.values());
  }

  private parseOdds(oddsText: string): number {
    try {
      const cleanText = oddsText.replace(/[^\d.-]/g, "");
      const decimal = parseFloat(cleanText);
      
      if (isNaN(decimal)) return 200; // Default odds
      
      // Convert decimal to American odds
      if (decimal >= 2) {
        return Math.round((decimal - 1) * 100);
      } else {
        return Math.round(-100 / (decimal - 1));
      }
    } catch (error) {
      return 200; // Default odds
    }
  }

  private parseMatchTime(timeText: string): Date {
    try {
      const tomorrow = addDays(new Date(), 1);
      
      // Try to parse time from various formats
      if (timeText.includes(":")) {
        const [hours, minutes] = timeText.split(":").map(s => parseInt(s.trim()));
        if (!isNaN(hours) && !isNaN(minutes)) {
          tomorrow.setHours(hours, minutes, 0, 0);
        }
      }
      
      return tomorrow;
    } catch (error) {
      // Default to tomorrow at noon
      const tomorrow = addDays(new Date(), 1);
      tomorrow.setHours(12, 0, 0, 0);
      return tomorrow;
    }
  }
}