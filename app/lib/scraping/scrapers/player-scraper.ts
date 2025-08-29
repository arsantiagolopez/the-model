import type { ScrapingClient } from "../scraping-client";
import type { Player } from "~/lib/db/schema";

interface Logger {
  addLog(message: string): void;
}

export class PlayerScraper {
  private client: ScrapingClient;
  private baseUrl = "https://www.tennisexplorer.com";
  private logger?: Logger;

  constructor(client: ScrapingClient, logger?: Logger) {
    this.client = client;
    this.logger = logger;
  }

  async enhancePlayers(players: Player[]): Promise<Partial<Player>[]> {
    const message = `👤 Enhancing ${players.length} players...`;
    console.log(message);
    this.logger?.addLog(message);

    const playerLinks = players.map(
      (player) => `${this.baseUrl}${player.playerId}`
    );

    const results = await this.client.scrapeUrls(
      playerLinks,
      this.parsePlayerPage.bind(this)
    );

    const enhancedPlayers: Partial<Player>[] = [];

    results.forEach((result, index) => {
      if (result) {
        const originalPlayer = players[index];
        const enhancedPlayer = {
          ...originalPlayer,
          ...result,
          updatedAt: new Date(),
        };

        // Calculate form and streak from recent matches
        if (result.lastMatches && Array.isArray(result.lastMatches)) {
          const { form, streak } = this.calculateFormAndStreak(
            result.lastMatches,
            originalPlayer.name
          );
          enhancedPlayer.form = form;
          enhancedPlayer.streak = streak;
        }

        enhancedPlayers.push(enhancedPlayer);
      }
    });

    console.log(`✅ Enhanced ${enhancedPlayers.length} players`);
    return enhancedPlayers;
  }

  private async parsePlayerPage(page: any): Promise<Partial<Player> | null> {
    try {
      // Wait for player page to load - use table structure instead of class
      const hasContent = await this.client.waitForSelector(
        page,
        "table:first-of-type",
        10000
      );
      if (!hasContent) {
        console.warn("⚠️ Player profile table not found");
        return null;
      }

      // Extract player profile information
      const profile = await this.extractPlayerProfile(page);
      const record = await this.extractPlayerRecord(page);
      const lastMatches = await this.extractRecentMatches(page);
      const injuries = await this.extractInjuries(page);
      const pastTournamentResults =
        await this.extractPastTournamentResults(page);
      const upcomingMatch = await this.extractUpcomingMatch(page);

      return {
        ...profile,
        record,
        lastMatches,
        injuries,
        pastTournamentResults,
        upcomingMatch,
      };
    } catch (error) {
      console.error("❌ Error parsing player page:", error);
      return null;
    }
  }

  private async extractPlayerProfile(page: any): Promise<Partial<Player>> {
    const profile: Partial<Player> = {};

    try {
      // Extract comprehensive player data using actual TennisExplorer structure
      const extractedData = await page.evaluate(() => {
        try {
          // Get the main player detail table - table.plDetail
          const playerTable = document.querySelector('table.plDetail');
          if (!playerTable) {
            console.warn('Player detail table not found');
            return null;
          }

          // Extract player name from h3 inside the table
          const nameElement = playerTable.querySelector('h3');
          const playerName = nameElement?.textContent?.trim();

          // Get all the profile data from the second column
          const profileCell = playerTable.querySelector('tr td:nth-child(2)');
          const profileText = profileCell?.textContent?.trim() || '';

          // Extract player image
          const imageElement = playerTable.querySelector('td.photo img') as HTMLImageElement;
          const imageSrc = imageElement?.src;

          // Parse profile data using the actual TennisExplorer format - be more specific with country
          const countryMatch = profileText.match(/Country:\s*([A-Za-z\s]+?)(?:Height|Age|Current)/i);
          const heightWeightMatch = profileText.match(/Height \/ Weight:\s*([^\n]+)/i);
          const ageMatch = profileText.match(/Age:\s*(\d+)\s*\(([^)]+)\)/i);
          const singlesRankMatch = profileText.match(/Current\/Highest rank - singles:\s*([\d-]+)\.?\s*\/\s*([\d-]+)/i);
          const doublesRankMatch = profileText.match(/Current\/Highest rank - doubles:\s*([\d-]+)\.?\s*\/\s*([\d-]+)/i);
          const sexMatch = profileText.match(/Sex:\s*(\w+)/i);
          const handMatch = profileText.match(/Plays:\s*(\w+)/i);

          return {
            name: playerName,
            image: imageSrc,
            country: countryMatch?.[1]?.trim(),
            age: ageMatch?.[1] ? parseInt(ageMatch[1]) : null,
            birthDate: ageMatch?.[2]?.trim(),
            heightWeight: heightWeightMatch?.[1]?.trim(),
            currentSinglesRank: singlesRankMatch?.[1] === '-' ? null : parseInt(singlesRankMatch?.[1] || '0'),
            highestSinglesRank: singlesRankMatch?.[2] === '-' ? null : parseInt(singlesRankMatch?.[2] || '0'),
            currentDoublesRank: doublesRankMatch?.[1] === '-' ? null : parseInt(doublesRankMatch?.[1] || '0'),
            highestDoublesRank: doublesRankMatch?.[2] === '-' ? null : parseInt(doublesRankMatch?.[2] || '0'),
            sex: sexMatch?.[1]?.toLowerCase(),
            hand: handMatch?.[1]?.toLowerCase(),
            profileText: profileText
          };
        } catch (error) {
          console.error('Error in profile extraction:', error);
          return null;
        }
      });

      if (!extractedData) {
        console.warn('❌ Failed to extract player profile data');
        return profile;
      }

      // Process and assign extracted data
      if (extractedData.name) {
        profile.name = extractedData.name;
      }

      // Always set image - even if it's a default placeholder
      if (extractedData.image) {
        try {
          const imageUrl = new URL(extractedData.image);
          profile.image = imageUrl.pathname;
        } catch (error) {
          // If URL parsing fails, use as-is
          profile.image = extractedData.image;
        }
      }

      if (extractedData.country) {
        profile.country = extractedData.country;
      }

      if (extractedData.age) {
        profile.age = extractedData.age;
      }

      if (extractedData.birthDate) {
        // Parse birth date format "29. 4. 2003" to "2003-04-29"
        const dateParts = extractedData.birthDate.match(/(\d+)\.\s*(\d+)\.\s*(\d+)/);
        if (dateParts) {
          const day = dateParts[1].padStart(2, '0');
          const month = dateParts[2].padStart(2, '0');
          const year = dateParts[3];
          profile.birthday = `${year}-${month}-${day}`;
        }
      }

      if (extractedData.currentSinglesRank) {
        profile.singlesRank = extractedData.currentSinglesRank;
      }

      if (extractedData.hand) {
        profile.hand = extractedData.hand;
      }

      // Set sex based on extracted data 
      if (extractedData.sex) {
        profile.sex = extractedData.sex === 'woman' ? 'women' : 'men';
      } else {
        // Default to men if not specified
        profile.sex = 'men';
      }

      console.log(`✅ Extracted player profile: ${profile.name} (${profile.country}) - Rank: ${profile.singlesRank} - Sex: ${profile.sex}`);
    } catch (error) {
      console.error("❌ Error extracting player profile:", error);
    }

    return profile;
  }

  private async extractPlayerRecord(page: any): Promise<any | null> {
    try {
      // Extract player record from the actual TennisExplorer structure
      const record = await page.evaluate(() => {
        try {
          // Find the "Player's record" section and the balance table
          const recordTable = document.querySelector('table.result.balance');
          if (!recordTable) {
            console.warn('Player record table not found');
            return null;
          }

          // Get the summary row (tfoot)
          const summaryRow = recordTable.querySelector('tfoot tr.summary');
          if (!summaryRow) {
            console.warn('Summary row not found in record table');
            return null;
          }

          // Extract summary statistics from the footer row
          const cells = summaryRow.querySelectorAll('td');
          if (cells.length < 6) {
            console.warn('Not enough cells in summary row');
            return null;
          }

          // Parse W/L ratios - format is "290/152"
          const parseWL = (text: string) => {
            const match = text.match(/(\d+)\/(\d+)/);
            return match ? { win: parseInt(match[1]), loss: parseInt(match[2]) } : { win: 0, loss: 0 };
          };

          const summary = parseWL(cells[1].textContent?.trim() || '0/0');
          const clay = parseWL(cells[2].textContent?.trim() || '0/0');
          const hard = parseWL(cells[3].textContent?.trim() || '0/0');
          const indoors = parseWL(cells[4].textContent?.trim() || '0/0');
          const grass = parseWL(cells[5].textContent?.trim() || '0/0');

          // Also extract yearly records from tbody
          const yearRows = recordTable.querySelectorAll('tbody tr');
          const years: any[] = [];
          
          yearRows.forEach((row) => {
            const yearCell = row.querySelector('td.year a');
            const cells = row.querySelectorAll('td');
            
            if (yearCell && cells.length >= 6) {
              const year = parseInt(yearCell.textContent?.trim() || '0');
              const yearSummary = parseWL(cells[1].textContent?.trim() || '0/0');
              const yearClay = parseWL(cells[2].textContent?.trim() || '0/0');
              const yearHard = parseWL(cells[3].textContent?.trim() || '0/0');
              const yearIndoors = parseWL(cells[4].textContent?.trim() || '0/0');
              const yearGrass = parseWL(cells[5].textContent?.trim() || '0/0');
              
              years.push({
                year,
                summary: yearSummary,
                clay: yearClay,
                hard: yearHard,
                indoors: yearIndoors,
                grass: yearGrass
              });
            }
          });

          return {
            all: {
              summary,
              clay,
              hard,
              indoors,
              grass
            },
            years
          };
        } catch (error) {
          console.error('Error in record extraction:', error);
          return null;
        }
      });

      return record;
    } catch (error) {
      console.error("❌ Error extracting player record:", error);
      return null;
    }
  }

  private async extractRecentMatches(page: any): Promise<any[] | null> {
    try {
      // Extract recent matches from the actual TennisExplorer structure
      const matches = await page.evaluate(() => {
        try {
          // Find the matches section - it's in a tab with id matches-2025-1-data or similar
          const matchesDiv = document.querySelector('[id*="matches-"][id*="-1-data"]');
          if (!matchesDiv) {
            console.warn('Matches section not found');
            return [];
          }

          const matchList: any[] = [];
          const matchTable = matchesDiv.querySelector('table.result.balance');
          if (!matchTable) {
            console.warn('Matches table not found');
            return [];
          }

          let currentTournament: string | undefined;
          let currentTournamentLink: string | undefined;

          // Parse each row in the matches table
          const rows = matchTable.querySelectorAll('tbody tr');
          
          rows.forEach((row) => {
            // Tournament header row
            if (row.classList.contains('head') && row.classList.contains('flags')) {
              const tournamentLink = row.querySelector('td.t-name a');
              currentTournament = tournamentLink?.textContent?.trim();
              currentTournamentLink = tournamentLink?.getAttribute('href') || undefined;
            }
            // Match row
            else if (!row.classList.contains('head')) {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 7) {
                const date = cells[0]?.textContent?.trim();
                
                // Surface info from span with title attribute
                const surfaceSpan = cells[1]?.querySelector('span[title]');
                const surface = surfaceSpan?.getAttribute('title');
                
                // Match info - extract player names
                const matchCell = cells[2];
                const matchText = matchCell?.textContent?.trim();
                const playerLinks = matchCell?.querySelectorAll('a');
                
                // Determine if our player won (based on strong tag)
                const strongPlayer = matchCell?.querySelector('strong');
                const playerName = strongPlayer?.textContent?.trim();
                
                const round = cells[3]?.textContent?.trim();
                
                // Score link
                const scoreLink = cells[4]?.querySelector('a');
                const score = scoreLink?.textContent?.trim();
                const matchLink = scoreLink?.getAttribute('href');
                
                // Odds
                const homeOdds = parseFloat(cells[5]?.textContent?.trim() || '0');
                const awayOdds = parseFloat(cells[6]?.textContent?.trim() || '0');
                
                // Determine opponent
                let opponent = '';
                if (playerLinks && playerLinks.length >= 2) {
                  playerLinks.forEach(link => {
                    const linkText = link.textContent?.trim();
                    if (linkText && !link.classList.contains('notU')) {
                      opponent = linkText;
                    }
                  });
                }
                
                // Determine result (W/L) - if our player has the strong tag, they're highlighted
                let result = 'L'; // default to loss
                if (strongPlayer && matchText) {
                  // If our player is in strong tags, they likely won
                  result = 'W';
                }
                
                if (date && currentTournament && opponent) {
                  matchList.push({
                    date,
                    tournament: currentTournament,
                    tournamentLink: currentTournamentLink,
                    surface: surface?.toLowerCase(),
                    round,
                    opponent,
                    result,
                    score,
                    matchLink,
                    homeOdds,
                    awayOdds
                  });
                }
              }
            }
          });

          // Limit to most recent 20 matches
          return matchList.slice(0, 20);
        } catch (error) {
          console.error('Error in recent matches extraction:', error);
          return [];
        }
      });

      return matches;
    } catch (error) {
      console.error("❌ Error extracting recent matches:", error);
      return null;
    }
  }

  private async extractInjuries(page: any): Promise<any[] | null> {
    try {
      const injuriesSection = await page.$(".player-injuries");
      if (!injuriesSection) {
        return null;
      }

      const injuries = await injuriesSection.evaluate((section: Element) => {
        const injuryList: any[] = [];
        const injuryElements = section.querySelectorAll(".injury-item");

        injuryElements.forEach((injuryEl: Element) => {
          const type = injuryEl
            .querySelector(".injury-type")
            ?.textContent?.trim();
          const status = injuryEl
            .querySelector(".injury-status")
            ?.textContent?.trim();
          const date = injuryEl
            .querySelector(".injury-date")
            ?.textContent?.trim();

          if (type && status) {
            injuryList.push({
              type,
              status,
              date,
            });
          }
        });

        return injuryList;
      });

      return injuries;
    } catch (error) {
      console.error("❌ Error extracting injuries:", error);
      return null;
    }
  }

  private async extractPastTournamentResults(page: any): Promise<any[] | null> {
    try {
      // Extract past tournament results from the actual structure
      const results = await page.evaluate(() => {
        try {
          const resultList: any[] = [];
          
          // Find the past tournament results table
          const resultsTable = document.querySelector('table#playerPastTournamentResults0');
          if (!resultsTable) {
            console.warn('Past tournament results table not found');
            return [];
          }

          // Get all tournament year rows (not the expanded match details)
          const yearRows = resultsTable.querySelectorAll('tbody tr:not(.pastTournamentGames)');
          
          yearRows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const yearCell = cells[0];
              const resultCell = cells[1];
              
              const yearLink = yearCell?.querySelector('a');
              const year = parseInt(yearLink?.textContent?.trim() || '0');
              const tournamentUrl = yearLink?.getAttribute('href');
              
              const result = resultCell?.textContent?.trim();
              
              if (year && result) {
                resultList.push({
                  year,
                  result,
                  tournamentUrl
                });
              }
            }
          });

          return resultList;
        } catch (error) {
          console.error('Error in past tournament results extraction:', error);
          return [];
        }
      });

      return results;
    } catch (error) {
      console.error("❌ Error extracting past tournament results:", error);
      return null;
    }
  }

  private async extractUpcomingMatch(page: any): Promise<any | null> {
    try {
      // Extract upcoming match from the "Next match" section
      const upcomingMatch = await page.evaluate(() => {
        try {
          // Find the "Next match" table
          const nextMatchTable = document.querySelector('table.result.gamedetail');
          if (!nextMatchTable) {
            console.warn('Next match table not found');
            return null;
          }

          // Get the match row (first tbody tr)
          const matchRow = nextMatchTable.querySelector('tbody tr');
          if (!matchRow) {
            console.warn('Next match row not found');
            return null;
          }

          const cells = matchRow.querySelectorAll('td, th');
          if (cells.length < 6) {
            console.warn('Not enough cells in next match row');
            return null;
          }

          // Extract tournament info
          const tournamentCell = cells[0];
          const tournamentLink = tournamentCell?.querySelector('a');
          const tournament = tournamentLink?.textContent?.trim();
          const tournamentUrl = tournamentLink?.getAttribute('href');

          // Extract round
          const round = cells[1]?.textContent?.trim();

          // Extract start time
          const startTime = cells[2]?.textContent?.trim();

          // Extract match info (opponent)
          const matchCell = cells[3];
          const matchLink = matchCell?.querySelector('a');
          const matchText = matchLink?.textContent?.trim();
          const matchUrl = matchLink?.getAttribute('href');

          // Extract odds
          const homeOdds = parseFloat(cells[4]?.textContent?.trim() || '0');
          const awayOdds = parseFloat(cells[5]?.textContent?.trim() || '0');

          // Parse opponent from match text (format: "PlayerA - PlayerB")
          let opponent = '';
          if (matchText) {
            const parts = matchText.split(' - ');
            if (parts.length === 2) {
              // Determine which part is the opponent (not the current player)
              // We can check which one doesn't match the current page player
              opponent = parts.join(' vs ');
            }
          }

          return {
            tournament,
            tournamentUrl,
            round,
            startTime,
            opponent,
            matchText,
            matchUrl,
            homeOdds,
            awayOdds
          };
        } catch (error) {
          console.error('Error in upcoming match extraction:', error);
          return null;
        }
      });

      return upcomingMatch;
    } catch (error) {
      console.error("❌ Error extracting upcoming match:", error);
      return null;
    }
  }

  private calculateFormAndStreak(
    matches: any[],
    _playerName: string
  ): { form: number; streak: number } {
    try {
      if (!matches || matches.length === 0) {
        return { form: 0, streak: 0 };
      }

      // Sort matches by date (most recent first)
      const sortedMatches = matches
        .filter((match) => match.result && match.date)
        .sort((a, b) => {
          // Parse TennisExplorer date format "25.08." to comparable format
          const parseDate = (dateStr: string) => {
            const parts = dateStr.replace('.', '').split('.');
            if (parts.length >= 2) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]);
              const year = new Date().getFullYear(); // Current year
              return new Date(year, month - 1, day).getTime();
            }
            return 0;
          };
          
          return parseDate(b.date) - parseDate(a.date);
        });

      if (sortedMatches.length === 0) {
        return { form: 0, streak: 0 };
      }

      // Calculate current streak
      let streak = 0;
      let streakActive = true;
      const lastResult = sortedMatches[0].result;

      for (const match of sortedMatches) {
        if (streakActive && match.result === lastResult) {
          streak++;
        } else {
          streakActive = false;
          break;
        }
      }

      // Make streak negative if it's a losing streak
      if (lastResult === "L") {
        streak = -streak;
      }

      // Calculate form (win percentage over last 10 matches)
      const recentMatches = sortedMatches.slice(0, 10);
      const wins = recentMatches.filter((match) => match.result === "W").length;
      const form =
        recentMatches.length > 0 ? (wins / recentMatches.length) * 100 : 0;

      return { form: Math.round(form), streak };
    } catch (error) {
      console.error("❌ Error calculating form and streak:", error);
      return { form: 0, streak: 0 };
    }
  }
}
