import type { ScrapingClient } from "../scraping-client";
import type { Tournament, NewMatch, NewPlayer } from "~/lib/db/schema";

interface Logger {
  addLog(message: string): void;
}

type TournamentEnhancementData = {
  tournaments: Partial<Tournament>[];
  matches: NewMatch[];
  players: NewPlayer[];
};

export class TournamentScraper {
  private client: ScrapingClient;
  private baseUrl = "https://www.flashscore.com";

  constructor(client: ScrapingClient, private logger?: Logger) {
    this.client = client;
  }

  async enhanceTournaments(tournaments: Tournament[]): Promise<TournamentEnhancementData> {
    const enhancingMessage = `🏆 Enhancing ${tournaments.length} tournaments...`;
    console.log(enhancingMessage);
    this.logger?.addLog(enhancingMessage);

    const tournamentLinks = tournaments.map(tournament => 
      `${this.baseUrl}/tournament/${tournament.tournamentId}`
    );

    const results = await this.client.scrapeUrls(
      tournamentLinks,
      this.parseTournamentPage.bind(this)
    );

    const enhancedData: TournamentEnhancementData = {
      tournaments: [],
      matches: [],
      players: [],
    };

    results.forEach((result, index) => {
      if (result) {
        const originalTournament = tournaments[index];
        enhancedData.tournaments.push({
          ...originalTournament,
          ...result.tournament,
          updatedAt: new Date(),
        });

        enhancedData.matches.push(...result.matches);
        enhancedData.players.push(...result.players);
      }
    });

    const enhancedMessage = `✅ Enhanced ${enhancedData.tournaments.length} tournaments`;
    console.log(enhancedMessage);
    this.logger?.addLog(enhancedMessage);
    return enhancedData;
  }

  private async parseTournamentPage(page: any): Promise<{
    tournament: Partial<Tournament>;
    matches: NewMatch[];
    players: NewPlayer[];
  } | null> {
    try {
      // Wait for tournament page to load
      const hasContent = await this.client.waitForSelector(page, ".tournament-info", 10000);
      if (!hasContent) {
        console.warn("⚠️ Tournament info not found");
        return null;
      }

      // Extract enhanced tournament details
      const details = await this.extractTournamentDetails(page);
      const pastResults = await this.extractPastYearResults(page);
      const upcomingMatches = await this.extractUpcomingMatches(page);

      return {
        tournament: {
          ...details,
          pastYearsResults: pastResults,
          nextMatches: upcomingMatches,
        },
        matches: [], // Additional matches found during tournament scraping
        players: [], // Additional players found during tournament scraping
      };

    } catch (error) {
      console.error("❌ Error parsing tournament page:", error);
      return null;
    }
  }

  private async extractTournamentDetails(page: any): Promise<Partial<Tournament>> {
    const details: Partial<Tournament> = {};

    try {
      // Extract tournament details
      const countryCode = await this.client.extractText(page, ".tournament-country-code");
      if (countryCode) {
        details.countryCode = countryCode;
      }

      const prize = await this.client.extractText(page, ".tournament-prize");
      if (prize) {
        details.prize = prize;
      }

      // Extract additional details
      const detailsElement = await page.$(".tournament-details");
      if (detailsElement) {
        const detailsText = await detailsElement.evaluate((el: Element) => {
          const details: any = {};
          const rows = el.querySelectorAll(".detail-row");
          
          rows.forEach((row: Element) => {
            const label = row.querySelector(".label")?.textContent?.trim();
            const value = row.querySelector(".value")?.textContent?.trim();
            if (label && value) {
              details[label.toLowerCase().replace(/\s+/g, "_")] = value;
            }
          });
          
          return details;
        }).catch(() => ({}));

        details.details = detailsText;
      }

    } catch (error) {
      console.error("❌ Error extracting tournament details:", error);
    }

    return details;
  }

  private async extractPastYearResults(page: any): Promise<any[] | null> {
    try {
      // Look for past results section
      const pastResultsSection = await page.$(".past-results");
      if (!pastResultsSection) {
        return null;
      }

      const pastResults = await pastResultsSection.evaluate((section: Element) => {
        const results: any[] = [];
        const yearElements = section.querySelectorAll(".year-result");
        
        yearElements.forEach((yearEl: Element) => {
          const year = yearEl.querySelector(".year")?.textContent?.trim();
          const winner = yearEl.querySelector(".winner")?.textContent?.trim();
          const finalist = yearEl.querySelector(".finalist")?.textContent?.trim();
          
          if (year && winner) {
            results.push({
              year: parseInt(year),
              winner,
              finalist,
            });
          }
        });
        
        return results;
      });

      return pastResults;

    } catch (error) {
      console.error("❌ Error extracting past year results:", error);
      return null;
    }
  }

  private async extractUpcomingMatches(page: any): Promise<any[] | null> {
    try {
      // Look for upcoming matches in tournament
      const matchesSection = await page.$(".upcoming-matches");
      if (!matchesSection) {
        return null;
      }

      const matches = await matchesSection.evaluate((section: Element) => {
        const matchList: any[] = [];
        const matchElements = section.querySelectorAll(".match-item");
        
        matchElements.forEach((matchEl: Element) => {
          const home = matchEl.querySelector(".player-home")?.textContent?.trim();
          const away = matchEl.querySelector(".player-away")?.textContent?.trim();
          const time = matchEl.querySelector(".match-time")?.textContent?.trim();
          const round = matchEl.querySelector(".match-round")?.textContent?.trim();
          
          if (home && away) {
            matchList.push({
              home,
              away,
              time,
              round,
            });
          }
        });
        
        return matchList;
      });

      return matches;

    } catch (error) {
      console.error("❌ Error extracting upcoming matches:", error);
      return null;
    }
  }
}