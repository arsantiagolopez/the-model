import type { ScrapingClient } from "../scraping-client";
import type { Match, NewPlayer } from "~/lib/db/schema";

interface Logger {
  addLog(message: string): void;
}

type MatchEnhancementData = {
  matches: Partial<Match>[];
  players: Partial<NewPlayer>[];
};

export class MatchScraper {
  private client: ScrapingClient;
  private baseUrl = "https://www.flashscore.com";

  constructor(client: ScrapingClient, private logger?: Logger) {
    this.client = client;
  }

  async enhanceMatches(matches: Match[]): Promise<MatchEnhancementData> {
    const enhancingMessage = `🎾 Enhancing ${matches.length} matches...`;
    console.log(enhancingMessage);
    this.logger?.addLog(enhancingMessage);

    const matchLinks = matches
      .filter(match => match.matchLink)
      .map(match => `${this.baseUrl}${match.matchLink}`);

    const results = await this.client.scrapeUrls(
      matchLinks,
      this.parseMatchPage.bind(this)
    );

    const enhancedData: MatchEnhancementData = {
      matches: [],
      players: [],
    };

    results.forEach((result, index) => {
      if (result) {
        const originalMatch = matches.find(m => m.matchLink === matchLinks[index].replace(this.baseUrl, ""));
        if (originalMatch) {
          enhancedData.matches.push({
            ...originalMatch,
            ...result.match,
            updatedAt: new Date(),
          });

          enhancedData.players.push(...result.players);
        }
      }
    });

    const enhancedMessage = `✅ Enhanced ${enhancedData.matches.length} matches`;
    console.log(enhancedMessage);
    this.logger?.addLog(enhancedMessage);
    return enhancedData;
  }

  private async parseMatchPage(page: any): Promise<{
    match: Partial<Match>;
    players: Partial<NewPlayer>[];
  } | null> {
    try {
      // Wait for match page to load
      const hasContent = await this.client.waitForSelector(page, ".match-info", 10000);
      if (!hasContent) {
        console.warn("⚠️ Match info not found");
        return null;
      }

      // Extract enhanced match details
      const matchDetails = await this.extractMatchDetails(page);
      const odds = await this.extractDetailedOdds(page);
      const headToHead = await this.extractHeadToHead(page);
      const playerUpdates = await this.extractPlayerUpdates(page);

      return {
        match: {
          ...matchDetails,
          odds,
          headToHeadMatches: headToHead,
        },
        players: playerUpdates,
      };

    } catch (error) {
      console.error("❌ Error parsing match page:", error);
      return null;
    }
  }

  private async extractMatchDetails(page: any): Promise<Partial<Match>> {
    const details: Partial<Match> = {};

    try {
      // Extract head-to-head record
      const homeH2h = await this.client.extractText(page, ".h2h-home-wins");
      const awayH2h = await this.client.extractText(page, ".h2h-away-wins");

      if (homeH2h) details.homeH2h = parseInt(homeH2h);
      if (awayH2h) details.awayH2h = parseInt(awayH2h);

      // Extract match result if available
      const resultElement = await page.$(".match-result");
      if (resultElement) {
        const result = await resultElement.evaluate((el: Element) => {
          const winner = el.querySelector(".winner")?.textContent?.trim();
          const sets = el.querySelector(".sets")?.textContent?.trim();
          const games = el.querySelector(".games")?.textContent?.trim();
          
          return {
            winner,
            sets,
            games,
            status: "completed"
          };
        }).catch(() => null);

        if (result) {
          details.result = result;
        }
      }

    } catch (error) {
      console.error("❌ Error extracting match details:", error);
    }

    return details;
  }

  private async extractDetailedOdds(page: any): Promise<any | null> {
    try {
      const oddsSection = await page.$(".odds-section");
      if (!oddsSection) {
        return null;
      }

      const odds = await oddsSection.evaluate((section: Element) => {
        const oddsData: any = {};
        
        // Extract different betting markets
        const markets = section.querySelectorAll(".betting-market");
        
        markets.forEach((market: Element) => {
          const marketName = market.querySelector(".market-name")?.textContent?.trim();
          const oddsItems = market.querySelectorAll(".odds-item");
          
          if (marketName) {
            const marketOdds: any = {};
            
            oddsItems.forEach((item: Element) => {
              const selection = item.querySelector(".selection")?.textContent?.trim();
              const odd = item.querySelector(".odd")?.textContent?.trim();
              
              if (selection && odd) {
                marketOdds[selection] = odd;
              }
            });
            
            oddsData[marketName.toLowerCase().replace(/\s+/g, "_")] = marketOdds;
          }
        });
        
        return oddsData;
      });

      return odds;

    } catch (error) {
      console.error("❌ Error extracting detailed odds:", error);
      return null;
    }
  }

  private async extractHeadToHead(page: any): Promise<any[] | null> {
    try {
      const h2hSection = await page.$(".head-to-head-matches");
      if (!h2hSection) {
        return null;
      }

      const h2hMatches = await h2hSection.evaluate((section: Element) => {
        const matches: any[] = [];
        const matchElements = section.querySelectorAll(".h2h-match");
        
        matchElements.forEach((matchEl: Element) => {
          const date = matchEl.querySelector(".match-date")?.textContent?.trim();
          const tournament = matchEl.querySelector(".tournament")?.textContent?.trim();
          const winner = matchEl.querySelector(".winner")?.textContent?.trim();
          const score = matchEl.querySelector(".score")?.textContent?.trim();
          
          if (date && tournament && winner) {
            matches.push({
              date,
              tournament,
              winner,
              score,
            });
          }
        });
        
        return matches;
      });

      return h2hMatches;

    } catch (error) {
      console.error("❌ Error extracting head-to-head matches:", error);
      return null;
    }
  }

  private async extractPlayerUpdates(page: any): Promise<Partial<NewPlayer>[]> {
    const playerUpdates: Partial<NewPlayer>[] = [];

    try {
      // Extract player information from match page
      const playerElements = await page.$$(".player-info");
      
      for (const playerEl of playerElements) {
        const name = await playerEl.$eval(".player-name", (el: Element) => 
          el.textContent?.trim()
        ).catch(() => null);

        if (!name) continue;

        const ranking = await playerEl.$eval(".player-ranking", (el: Element) => 
          el.textContent?.replace(/\D/g, "")
        ).catch(() => null);

        const country = await playerEl.$eval(".player-country", (el: Element) => 
          el.textContent?.trim()
        ).catch(() => null);

        const age = await playerEl.$eval(".player-age", (el: Element) => 
          el.textContent?.replace(/\D/g, "")
        ).catch(() => null);

        const playerId = name.toLowerCase().replace(/\s+/g, "-");

        playerUpdates.push({
          playerId,
          name,
          ...(ranking && { singlesRank: parseInt(ranking) }),
          ...(country && { country }),
          ...(age && { age: parseInt(age) }),
          updatedAt: new Date(),
        });
      }

    } catch (error) {
      console.error("❌ Error extracting player updates:", error);
    }

    return playerUpdates;
  }
}