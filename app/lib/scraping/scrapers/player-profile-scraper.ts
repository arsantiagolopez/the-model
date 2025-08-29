import type { ScrapingClient } from "../scraping-client";

interface Logger {
  addLog(message: string): void;
}

// Enhanced player scraper that ports legacy player scraping logic
export class PlayerProfileScraper {
  private client: ScrapingClient;
  private baseUrl = "https://www.tennisexplorer.com";

  constructor(client: ScrapingClient, private logger?: Logger) {
    this.client = client;
  }

  async scrapePlayerProfiles(playerLinks: string[]) {
    const scrapingMessage = `👤 Scraping detailed profiles for ${playerLinks.length} players...`;
    console.log(scrapingMessage);
    this.logger?.addLog(scrapingMessage);

    const fullUrls = playerLinks.map(link => `${this.baseUrl}${link}`);
    
    const results = await this.client.scrapeUrls(
      fullUrls,
      this.parsePlayerProfilePage.bind(this)
    );

    const enhancedPlayers = results.filter(result => result !== null);
    const scrapedMessage = `✅ Successfully scraped ${enhancedPlayers.length} player profiles`;
    console.log(scrapedMessage);
    this.logger?.addLog(scrapedMessage);
    
    return enhancedPlayers;
  }

  private async parsePlayerProfilePage(page: any) {
    try {
      // Wait for player profile to load
      const hasContent = await this.client.waitForSelector(page, "table:first-of-type", 10000);
      if (!hasContent) {
        console.warn("⚠️ Player profile content not found");
        return null;
      }

      const url = await page.url();
      const playerId = url.replace(this.baseUrl, "");

      // Extract player data using legacy selectors
      const playerData = await page.evaluate((playerId: string) => {
        try {
          /**********************************
           * Section - Parse Player Records (ported from parseRecord.ts)
           **********************************/
          
          const tables = document.querySelectorAll("table[class*='result balance']");
          let playerRecord: any = { years: [], all: {} };

          if (tables.length > 0) {
            const singles = tables[0].querySelectorAll("tr");
            let years: any[] = [];
            let totalWins = 0, totalLosses = 0;
            let clayWins = 0, clayLosses = 0;
            let hardWins = 0, hardLosses = 0;
            let grassWins = 0, grassLosses = 0;
            let indoorsWins = 0, indoorsLosses = 0;

            // Parse each year row (skip header and summary rows)
            for (const [rowIndex, row] of singles.entries()) {
              if (rowIndex > 1) { // Skip header and summary
                const year = Number(row.querySelector("td a")?.textContent ?? 0);
                const yearLink = row.querySelector("a")?.getAttribute("href") ?? undefined;

                // Parse total record
                const totalRecord = row?.querySelectorAll("td")[1]?.textContent;
                const totalWin = Number(totalRecord?.split("/")[0] ?? 0);
                const totalLoss = Number(totalRecord?.split("/")[1] ?? 0);

                // Parse clay record  
                const clayRecord = row?.querySelectorAll("td")[2]?.textContent;
                const clayWin = Number(clayRecord?.split("/")[0] ?? 0);
                const clayLoss = Number(clayRecord?.split("/")[1] ?? 0);

                // Parse hard record
                const hardRecord = row?.querySelectorAll("td")[3]?.textContent;
                const hardWin = Number(hardRecord?.split("/")[0] ?? 0);
                const hardLoss = Number(hardRecord?.split("/")[1] ?? 0);

                // Parse indoor record
                const indoorRecord = row?.querySelectorAll("td")[4]?.textContent;
                const indoorWin = Number(indoorRecord?.split("/")[0] ?? 0);
                const indoorLoss = Number(indoorRecord?.split("/")[1] ?? 0);

                // Parse grass record  
                const grassRecord = row?.querySelectorAll("td")[5]?.textContent;
                const grassWin = Number(grassRecord?.split("/")[0] ?? 0);
                const grassLoss = Number(grassRecord?.split("/")[1] ?? 0);

                const yearRecord = {
                  year,
                  yearLink,
                  summary: { win: totalWin, loss: totalLoss },
                  clay: { win: clayWin, loss: clayLoss },
                  hard: { win: hardWin, loss: hardLoss },
                  indoors: { win: indoorWin, loss: indoorLoss },
                  grass: { win: grassWin, loss: grassLoss }
                };

                years.push(yearRecord);

                // Accumulate totals
                totalWins += totalWin;
                totalLosses += totalLoss;
                clayWins += clayWin;
                clayLosses += clayLoss;
                hardWins += hardWin;
                hardLosses += hardLoss;
                grassWins += grassWin;
                grassLosses += grassLoss;
                indoorsWins += indoorWin;
                indoorsLosses += indoorLoss;
              }
            }

            playerRecord = {
              years,
              all: {
                summary: { win: totalWins, loss: totalLosses },
                clay: { win: clayWins, loss: clayLosses },
                hard: { win: hardWins, loss: hardLosses },
                indoors: { win: indoorsWins, loss: indoorsLosses },
                grass: { win: grassWins, loss: grassLosses }
              }
            };
          }

          /**********************************
           * Section - Parse Last Matches (ported from parseLastMatches.ts)
           **********************************/
          
          const content = document.querySelectorAll("div[id*='matches']");
          let lastMatches: any[] = [];

          if (content.length > 0) {
            const table = content[0].querySelectorAll("tr"); // Singles matches
            let currentTournament: string | undefined = undefined;
            let currentTournamentLink: string | undefined = undefined;

            for (const row of table) {
              // Tournament header row
              if (row.className.includes("head")) {
                const tournamentWrapper = row.querySelector("td > a");
                currentTournamentLink = tournamentWrapper?.getAttribute("href") ?? undefined;
                currentTournament = tournamentWrapper?.textContent ?? undefined;
              }
              // Match row
              else {
                const date = row.querySelector(".time")?.textContent ?? undefined;
                const surface = row
                  .querySelectorAll("td")[1]
                  ?.querySelector("span")
                  ?.getAttribute("title") ?? undefined;
                
                const round = row.querySelector(".round")?.textContent ?? undefined;
                const opponent = row.querySelector("td[class*='name']")?.textContent ?? undefined;
                const opponentLink = row.querySelector("td[class*='name'] a")?.getAttribute("href") ?? undefined;
                
                // Result parsing
                const homeResult = row.querySelector(".result")?.textContent ?? undefined;
                const homeSets = Number(homeResult ?? 0);
                
                // Parse games per set
                const homeGamesWrapper = row.querySelectorAll(".score");
                const homeGamesFirstSet = Number(homeGamesWrapper[0]?.textContent ?? 0) > 59 
                  ? 6 : Number(homeGamesWrapper[0]?.textContent ?? 0);
                const homeGamesSecondSet = Number(homeGamesWrapper[1]?.textContent ?? 0) > 59 
                  ? 6 : Number(homeGamesWrapper[1]?.textContent ?? 0);
                const homeGamesThirdSet = Number(homeGamesWrapper[2]?.textContent ?? 0) > 59 
                  ? 6 : Number(homeGamesWrapper[2]?.textContent ?? 0);

                if (date && opponent && currentTournament) {
                  const match = {
                    date,
                    tournament: currentTournament,
                    tournamentLink: currentTournamentLink,
                    surface,
                    round,
                    opponent,
                    opponentLink,
                    result: homeSets > 0 ? "W" : "L",
                    homeSets,
                    homeGamesFirstSet,
                    homeGamesSecondSet,
                    homeGamesThirdSet
                  };
                  
                  lastMatches.push(match);
                }
              }
            }

            // Limit to most recent 20 matches
            lastMatches = lastMatches.slice(0, 20);
          }

          return {
            playerId,
            record: playerRecord,
            lastMatches
          };
        } catch (error) {
          console.error("Error in player profile extraction:", error);
          return null;
        }
      }, playerId);

      return playerData;
    } catch (error) {
      console.error("❌ Error parsing player profile page:", error);
      return null;
    }
  }
}