import type { ScrapingClient } from "../scraping-client";

interface Logger {
  addLog(message: string): void;
}

// Enhanced match scraper that ports legacy parseMatch.ts logic
export class MatchDetailScraper {
  private client: ScrapingClient;
  private baseUrl = "https://www.tennisexplorer.com";

  constructor(client: ScrapingClient, private logger?: Logger) {
    this.client = client;
  }

  async scrapeMatchDetails(matchLinks: string[]) {
    const detailMessage = `🎾 Scraping detailed data for ${matchLinks.length} matches...`;
    console.log(detailMessage);
    this.logger?.addLog(detailMessage);

    const fullUrls = matchLinks.map(link => `${this.baseUrl}${link}`);
    
    const results = await this.client.scrapeUrls(
      fullUrls,
      this.parseMatchDetailPage.bind(this)
    );

    const enhancedMatches = results.filter(result => result !== null);
    const detailEnhancedMessage = `✅ Successfully scraped ${enhancedMatches.length} match details`;
    console.log(detailEnhancedMessage);
    this.logger?.addLog(detailEnhancedMessage);
    
    return enhancedMatches;
  }

  private async parseMatchDetailPage(page: any) {
    try {
      // Wait for match detail page to load
      const hasContent = await this.client.waitForSelector(page, "#center .box", 10000);
      if (!hasContent) {
        console.warn("⚠️ Match detail content not found");
        return null;
      }

      // Extract match ID from URL
      const url = await page.url();
      const matchId = url.replace("https://www.tennisexplorer.com/match-detail/?id=", "");

      // Extract all the data using legacy selectors
      const matchData = await page.evaluate((matchId: string) => {
        try {
          /**********************************
           * Section - Get head to head data (ported from legacy)
           **********************************/
          
          const headToHeadWrapper: any = document.evaluate(
            "//h2[contains(., 'Head')]/following-sibling::div",
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          const rows = headToHeadWrapper?.querySelectorAll("tbody tr");
          let headToHeadMatches: any[] = [];
          let homeH2hCount = 0;
          let awayH2hCount = 0;

          // Parse H2H matches (ported logic from legacy)
          if (rows) {
            for (const [index, player] of rows.entries()) {
              const isHomePlayer = !(index % 2);

              if (isHomePlayer) {
                const year = Number(player.querySelector("td")?.textContent ?? 0);
                const tournament = player.querySelectorAll("td")[1]?.textContent ?? undefined;
                const home = player.querySelector("td[class*='name']")?.textContent ?? undefined;
                const homeSets = Number(player.querySelector(".result")?.textContent ?? 0);
                const surface = player
                  .querySelector("td[class*='sColor'] > span")
                  ?.getAttribute("title")
                  ?.toLowerCase();
                const round = player.querySelector(".round")?.textContent ?? undefined;

                // Parse games per set (legacy tiebreak handling)
                const homeGamesWrapper = player.querySelectorAll(".score");
                const homeGamesFirstSet = Number(homeGamesWrapper[0]?.textContent ?? 0) > 59 
                  ? 6 : Number(homeGamesWrapper[0]?.textContent ?? 0);
                const homeGamesSecondSet = Number(homeGamesWrapper[1]?.textContent ?? 0) > 59 
                  ? 6 : Number(homeGamesWrapper[1]?.textContent ?? 0);
                const homeGamesThirdSet = Number(homeGamesWrapper[2]?.textContent ?? 0) > 59 
                  ? 6 : Number(homeGamesWrapper[2]?.textContent ?? 0);

                // Store current match data
                (window as any).currentH2HMatch = {
                  year,
                  tournament,
                  home,
                  homeSets,
                  surface,
                  round,
                  homeGamesFirstSet,
                  homeGamesSecondSet,
                  homeGamesThirdSet
                };

                // Count home wins
                if (homeSets > 0) homeH2hCount++;
              } else {
                // Away player row
                const away = player.querySelector("td[class*='name']")?.textContent ?? undefined;
                const awaySets = Number(player.querySelector(".result")?.textContent ?? 0);
                
                // Parse away games
                const awayGamesWrapper = player.querySelectorAll(".score");
                const awayGamesFirstSet = Number(awayGamesWrapper[0]?.textContent ?? 0) > 59 
                  ? 6 : Number(awayGamesWrapper[0]?.textContent ?? 0);
                const awayGamesSecondSet = Number(awayGamesWrapper[1]?.textContent ?? 0) > 59 
                  ? 6 : Number(awayGamesWrapper[1]?.textContent ?? 0);
                const awayGamesThirdSet = Number(awayGamesWrapper[2]?.textContent ?? 0) > 59 
                  ? 6 : Number(awayGamesWrapper[2]?.textContent ?? 0);

                // Complete the H2H match
                const currentMatch = (window as any).currentH2HMatch;
                if (currentMatch) {
                  const h2hMatch = {
                    ...currentMatch,
                    away,
                    awaySets,
                    awayGamesFirstSet,
                    awayGamesSecondSet,  
                    awayGamesThirdSet,
                    winner: currentMatch.homeSets > awaySets ? currentMatch.home : away
                  };
                  
                  headToHeadMatches.push(h2hMatch);
                  
                  // Count away wins
                  if (awaySets > currentMatch.homeSets) awayH2hCount++;
                }
              }
            }
          }

          /**********************************
           * Section - Get match odds (ported from legacy)
           **********************************/
          
          const oddsWrapper = document.querySelectorAll("div[id*='odds']");
          let odds: any = {};

          if (oddsWrapper.length > 0) {
            // Moneyline odds
            const moneylineWrapper = oddsWrapper[0].querySelector(".average");
            if (moneylineWrapper) {
              const moneylineHomeOdds = Number(
                moneylineWrapper.querySelectorAll("td")[1]?.textContent ?? 0
              );
              const moneylineAwayOdds = Number(
                moneylineWrapper.querySelectorAll("td")[2]?.textContent ?? 0
              );

              odds.moneyline = {
                home: moneylineHomeOdds,
                away: moneylineAwayOdds
              };
            }

            // Total games odds
            const totalGamesWrapper = oddsWrapper[1]?.querySelector(".average");
            if (totalGamesWrapper) {
              const line = Number(totalGamesWrapper.querySelector("td:first-child")?.textContent ?? 0);
              const over = Number(totalGamesWrapper.querySelectorAll("td")[1]?.textContent ?? 0);
              const under = Number(totalGamesWrapper.querySelectorAll("td")[2]?.textContent ?? 0);

              odds.totalGames = [{
                line,
                over,
                under
              }];
            }

            // Spread games odds  
            const spreadGamesWrapper = oddsWrapper[2]?.querySelector(".average");
            if (spreadGamesWrapper) {
              const spread = Number(spreadGamesWrapper.querySelector("td:first-child")?.textContent ?? 0);
              const home = Number(spreadGamesWrapper.querySelectorAll("td")[1]?.textContent ?? 0);
              const away = Number(spreadGamesWrapper.querySelectorAll("td")[2]?.textContent ?? 0);

              odds.spreadGames = [{
                spread,
                home,
                away
              }];
            }

            // Set spread odds
            const spreadSetsWrapper = oddsWrapper[3]?.querySelector(".average"); 
            if (spreadSetsWrapper) {
              const spread = Number(spreadSetsWrapper.querySelector("td:first-child")?.textContent ?? 0);
              const home = Number(spreadSetsWrapper.querySelectorAll("td")[1]?.textContent ?? 0);
              const away = Number(spreadSetsWrapper.querySelectorAll("td")[2]?.textContent ?? 0);

              odds.spreadSets = [{
                spread,
                home,
                away
              }];
            }
          }

          return {
            matchId,
            headToHeadMatches,
            homeH2h: homeH2hCount,
            awayH2h: awayH2hCount,
            odds
          };
        } catch (error) {
          console.error("Error in match detail extraction:", error);
          return null;
        }
      }, matchId);

      return matchData;
    } catch (error) {
      console.error("❌ Error parsing match detail page:", error);
      return null;
    }
  }
}