import type { Page } from 'puppeteer';
import type { MatchData, PlayerProfile, TournamentInfo, MatchSets } from './types';

export class TennisDataParsersCluster {
  
  // Parse daily matches from the main matches page using Puppeteer Page
  static async parseDailyMatches(page: Page): Promise<MatchData[]> {
    const matches: MatchData[] = [];
    
    // Use page.evaluate to run the parsing logic in the browser context
    return await page.evaluate(() => {
      const matches: any[] = [];
      
      // Use the same parsing logic but adapted for browser context
      const tables = document.querySelectorAll('.content .result tbody, .result tbody');
      
      tables.forEach((tbody) => {
        const rows = tbody.querySelectorAll('tr');
        
        let currentTournament = 'Unknown Tournament';
        let currentTournamentUrl = '';
        let currentTournamentCategory: 'ATP' | 'WTA' | 'ITF' | 'Challenger' | 'UTR Pro' | 'Mixed' = 'Mixed';
        let homePlayerData: any = null;
        
        rows.forEach((row) => {
          const rowClass = row.getAttribute('class') || '';
          
          // Tournament header row
          if (rowClass.includes('head') && rowClass.includes('flags')) {
            const tournamentCell = row.querySelector('.t-name');
            const tournamentLink = tournamentCell?.querySelector('a');
            
            if (tournamentLink) {
              currentTournament = tournamentLink.textContent?.trim() || '';
              currentTournamentUrl = tournamentLink.getAttribute('href') || '';
            } else if (tournamentCell) {
              currentTournament = tournamentCell.textContent?.trim() || '';
            }
            
            // Clean tournament name
            currentTournament = currentTournament.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();
            
            // Determine category from tournament URL
            if (currentTournamentUrl) {
              if (currentTournamentUrl.includes('wta-women')) {
                currentTournamentCategory = 'WTA';
              } else if (currentTournamentUrl.includes('atp-men')) {
                currentTournamentCategory = 'ATP';
              } else if (currentTournamentUrl.includes('/itf/') || currentTournament.toLowerCase().includes('itf')) {
                currentTournamentCategory = 'ITF';
              } else if (currentTournamentUrl.includes('/challenger/') || currentTournament.toLowerCase().includes('challenger')) {
                currentTournamentCategory = 'Challenger';
              } else if (currentTournamentUrl.includes('/utr-') || currentTournament.toLowerCase().includes('utr')) {
                currentTournamentCategory = 'UTR Pro';
              }
            }
            
            // Fallback category detection logic
            if (currentTournamentCategory === 'Mixed') {
              if (currentTournament.toLowerCase().includes('wta')) {
                currentTournamentCategory = 'WTA';
              } else if (currentTournament.toLowerCase().includes('atp')) {
                currentTournamentCategory = 'ATP';
              } else if (currentTournament.toLowerCase().includes('itf')) {
                currentTournamentCategory = 'ITF';
              } else if (currentTournament.toLowerCase().includes('challenger')) {
                currentTournamentCategory = 'Challenger';
              } else if (currentTournament.toLowerCase().includes('utr')) {
                currentTournamentCategory = 'UTR Pro';
              }
            }
          }
          // Match rows - home player
          else if (rowClass.includes('bott')) {
            const timeCell = row.querySelector('td.first.time, td.time');
            const timeText = timeCell?.textContent?.trim() || '';
            const timeMatch = timeText.match(/(\d{1,2}:\d{2})/);
            const matchTime = timeMatch ? timeMatch[1] : '';
            
            const homePlayerLink = row.querySelector('td[class*="t-name"] a, td.t-name a');
            const homePlayerName = homePlayerLink?.textContent?.trim() || '';
            const homePlayerUrl = homePlayerLink?.getAttribute('href') || '';
            
            const matchDetailLink = row.querySelector('a[href*="match-detail"]');
            const matchDetailUrl = matchDetailLink?.getAttribute('href') || '';
            
            const oddsElements = row.querySelectorAll('td[class*="course"]');
            let homeOdds: number | undefined;
            let awayOdds: number | undefined;
            
            if (oddsElements.length >= 2) {
              homeOdds = parseFloat(oddsElements[0]?.textContent?.trim() || '') || undefined;
              awayOdds = parseFloat(oddsElements[1]?.textContent?.trim() || '') || undefined;
            }
            
            homePlayerData = {
              time: matchTime,
              homePlayer: {
                name: homePlayerName,
                url: homePlayerUrl
              },
              matchDetailUrl,
              homeOdds,
              awayOdds
            };
          }
          // Away player row
          else if (homePlayerData && !rowClass.includes('head') && !rowClass.includes('bott')) {
            const awayPlayerLink = row.querySelector('td[class*="t-name"] a, td.t-name a');
            const awayPlayerName = awayPlayerLink?.textContent?.trim() || '';
            const awayPlayerUrl = awayPlayerLink?.getAttribute('href') || '';
            
            // Only create match if we have both players
            if (homePlayerData.homePlayer.name && awayPlayerName && 
                homePlayerData.homePlayer.url && awayPlayerUrl &&
                homePlayerData.matchDetailUrl) {
              
              const match = {
                time: homePlayerData.time,
                player1: {
                  name: homePlayerData.homePlayer.name,
                  url: homePlayerData.homePlayer.url
                },
                player2: {
                  name: awayPlayerName,
                  url: awayPlayerUrl
                },
                tournament: {
                  name: currentTournament,
                  url: currentTournamentUrl,
                  category: currentTournamentCategory
                },
                status: 'scheduled',
                date: new Date().toISOString().split('T')[0],
                matchDetailUrl: homePlayerData.matchDetailUrl
              };
              
              // Add odds if available
              if (homePlayerData.homeOdds && homePlayerData.awayOdds) {
                match.odds = {
                  player1: homePlayerData.homeOdds,
                  player2: homePlayerData.awayOdds
                };
              }
              
              matches.push(match);
            }
            
            homePlayerData = null;
          }
        });
      });
      
      return matches;
    });
  }
  
  // Parse match details using Puppeteer Page
  static async parseMatchDetail(page: Page): Promise<Partial<MatchData>> {
    return await page.evaluate(() => {
      const matchData: any = {};
      
      // Extract match ID from URL
      const urlMatch = window.location.href.match(/id=(\d+)/);
      if (urlMatch) {
        matchData.matchId = urlMatch[1];
      }
      
      // Extract match status
      let matchStatus = 'scheduled';
      const statusElements = document.querySelectorAll('.status, [class*="status"], .match-status');
      if (statusElements.length) {
        const statusText = Array.from(statusElements).map(el => el.textContent).join(' ').toLowerCase();
        if (statusText.includes('completed') || statusText.includes('finished') || statusText.includes('final')) {
          matchStatus = 'completed';
        } else if (statusText.includes('live') || statusText.includes('progress')) {
          matchStatus = 'live';
        }
      }
      
      // Extract score
      const scoreContainer = document.querySelector('.match-score, .score-container, [class*="score"]');
      if (scoreContainer) {
        const rawScore = scoreContainer.textContent?.trim();
        if (rawScore && rawScore !== '' && matchStatus !== 'scheduled') {
          matchData.score = rawScore;
        }
      }
      
      matchData.status = matchStatus;
      
      // Extract tournament info
      let tournamentName = '';
      const tournamentSelectors = [
        '.tournament-header, .tournament-title',
        'h1:not(:contains("-")):not(:contains("vs"))',
        'h2:not(:contains("-")):not(:contains("vs"))',
        '[class*="tournament"]:not(:contains("-"))',
        '.breadcrumb a, .nav-breadcrumb a'
      ];
      
      for (const selector of tournamentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim() || '';
          if (text && !text.includes(' - ') && !text.includes(' vs ') && text.length > 3) {
            tournamentName = text;
            break;
          }
        }
      }
      
      if (tournamentName) {
        matchData.tournament = {
          name: tournamentName,
          url: '',
          category: 'Mixed' // Will be determined by context
        };
      }
      
      // Extract round
      const roundElement = document.querySelector('.round, [class*="round"]');
      if (roundElement) {
        matchData.round = roundElement.textContent?.trim();
      }
      
      return matchData;
    });
  }
  
  // Parse player profile using Puppeteer Page - LEGACY-BASED VERSION
  static async parsePlayerProfile(page: Page): Promise<Partial<PlayerProfile>> {
    return await page.evaluate(() => {
      const profile: any = {};
      
      // Use proven legacy selectors from parseProfile.ts
      
      // Player image - using legacy selector
      let image = document.querySelector(".photo > .img > img")?.getAttribute("src");
      if (image) {
        profile.imageUrl = image.startsWith('http') ? image : `https://www.tennisexplorer.com${image}`;
      }
      
      // Player profile wrapper - using legacy selector
      const wrapper = document.querySelector(".plDetail");
      const info = wrapper?.querySelectorAll("td")[1];
      
      if (!info) {
        return profile; // Early return if profile structure not found
      }
      
      // Check if height is present (affects index positions)
      const hasHeight = info?.querySelectorAll("div")[1]?.textContent?.includes("Height");
      
      // Player name
      const name = info.querySelector("h3")?.textContent;
      if (name) {
        profile.name = name.trim();
      }
      
      // Player country
      const country = info.querySelectorAll("div")[0]?.textContent?.replace("Country: ", "");
      if (country) {
        profile.country = country.trim();
      }
      
      // Player height (if available)
      if (hasHeight) {
        const height = info.querySelectorAll("div")[1]?.textContent?.split(": ")[1]?.split(" / ")[0];
        if (height) {
          profile.height = height;
        }
      }
      
      // Age and birthday parsing
      const date = info.querySelectorAll("div")[hasHeight ? 2 : 1]?.textContent?.replace("Age: ", "");
      if (date) {
        const age = Number(date.split(" ")[0]);
        const birthday = date.slice(3).replace("(", "").replace(")", "");
        profile.age = age;
        profile.birthDate = birthday;
      }
      
      // Enhanced ranking parsing - extract both singles and doubles rankings
      const allDivs = info?.querySelectorAll("div") || [];
      
      // Initialize ranking objects
      profile.singlesRank = { current: undefined, highest: undefined };
      profile.doublesRank = { current: undefined, highest: undefined };
      
      for (const div of allDivs) {
        const divText = div.textContent || '';
        
        // Parse singles ranking
        if (divText.includes('singles:')) {
          const rankParts = divText.split('singles:')[1]?.trim();
          if (rankParts) {
            const [current, highest] = rankParts.split(' / ').map(r => {
              const num = r.replace('.', '').trim();
              return num ? Number(num) : undefined;
            });
            profile.singlesRank = {
              current: current || undefined,
              highest: highest || current || undefined
            };
          }
        }
        
        // Parse doubles ranking
        if (divText.includes('doubles:')) {
          const rankParts = divText.split('doubles:')[1]?.trim();
          if (rankParts) {
            const [current, highest] = rankParts.split(' / ').map(r => {
              const num = r.replace('.', '').trim();
              return num ? Number(num) : undefined;
            });
            profile.doublesRank = {
              current: current || undefined,
              highest: highest || current || undefined
            };
          }
        }
      }
      
      // Note: Removed redundant ranking object since singlesRank contains the same data
      
      // Player sex
      const sexText = info.querySelectorAll("div")[hasHeight ? 5 : 4]?.textContent?.replace("Sex: ", "");
      if (sexText) {
        const sexLower = sexText.toLowerCase().trim();
        profile.sex = (sexLower === 'female' || sexLower === 'woman') ? 'Female' : 'Male';
      }
      
      // Player hand
      const hand = info.querySelectorAll("div")[hasHeight ? 6 : 5]?.textContent?.replace("Plays: ", "");
      if (hand) {
        profile.plays = hand.includes('Left') ? 'Left-handed' : 'Right-handed';
      }
      
      // Initialize surface records and yearly records from record tables
      profile.surfaceRecords = {
        clay: { wins: 0, losses: 0 },
        hard: { wins: 0, losses: 0 },
        grass: { wins: 0, losses: 0 },
        indoor: { wins: 0, losses: 0 }
      };
      
      profile.yearlyRecords = {};
      
      // Parse record tables using legacy parseRecord.ts patterns
      const tables = document.querySelectorAll("table[class*='result balance']");
      
      if (tables.length > 0) {
        // The first balance table should contain yearly records
        const firstTable = tables[0];
        const rows = firstTable.querySelectorAll("tr");
        
        let summaryRow = null;
        
        // Find summary row and data rows
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          const cells = row.querySelectorAll("td");
          
          // Check if this is the summary row
          if (row.className.includes('summary') || (cells.length > 0 && cells[0]?.textContent?.toLowerCase().includes('summary'))) {
            summaryRow = row;
            continue;
          }
          
          // Skip header rows and empty rows
          if (cells.length < 6) continue;
          
          // Look for year in first cell (either direct text or in a link)
          const firstCellText = cells[0]?.textContent?.trim();
          const yearLink = cells[0]?.querySelector('a');
          const yearText = yearLink?.textContent || firstCellText;
          const year = Number(yearText);
          
          // Skip non-year rows
          if (year < 1990 || year > new Date().getFullYear()) continue;
          
          // Parse win/loss records from columns
          const totalRecord = cells[1]?.textContent?.trim();
          const clayRecord = cells[2]?.textContent?.trim(); 
          const hardRecord = cells[3]?.textContent?.trim();
          const indoorsRecord = cells[4]?.textContent?.trim();
          const grassRecord = cells[5]?.textContent?.trim();
          
          if (totalRecord && totalRecord.includes('/')) {
            const [totalWin, totalLoss] = totalRecord.split('/').map(x => Number(x.trim()) || 0);
            const [clayWin, clayLoss] = clayRecord?.includes('/') ? clayRecord.split('/').map(x => Number(x.trim()) || 0) : [0, 0];
            const [hardWin, hardLoss] = hardRecord?.includes('/') ? hardRecord.split('/').map(x => Number(x.trim()) || 0) : [0, 0];
            const [indoorsWin, indoorsLoss] = indoorsRecord?.includes('/') ? indoorsRecord.split('/').map(x => Number(x.trim()) || 0) : [0, 0];
            const [grassWin, grassLoss] = grassRecord?.includes('/') ? grassRecord.split('/').map(x => Number(x.trim()) || 0) : [0, 0];
            
            profile.yearlyRecords[year.toString()] = {
              summary: { wins: totalWin, losses: totalLoss },
              clay: { wins: clayWin, losses: clayLoss },
              hard: { wins: hardWin, losses: hardLoss },
              indoor: { wins: indoorsWin, losses: indoorsLoss },
              grass: { wins: grassWin, losses: grassLoss }
            };
          }
        }
        
        // Parse career totals from summary row
        if (summaryRow) {
          const cells = summaryRow.querySelectorAll("td");
          
          if (cells.length >= 6) {
            const summaryRecord = cells[1]?.textContent?.trim();
            const clayRecord = cells[2]?.textContent?.trim();
            const hardRecord = cells[3]?.textContent?.trim();
            const indoorsRecord = cells[4]?.textContent?.trim();
            const grassRecord = cells[5]?.textContent?.trim();
            
            // Update career summary
            if (summaryRecord?.includes('/')) {
              const [wins, losses] = summaryRecord.split('/').map(x => Number(x.trim()) || 0);
              profile.singlesRecord = { wins, losses };
            }
            
            // Update surface records
            if (clayRecord?.includes('/')) {
              const [wins, losses] = clayRecord.split('/').map(x => Number(x.trim()) || 0);
              profile.surfaceRecords.clay = { wins, losses };
            }
            if (hardRecord?.includes('/')) {
              const [wins, losses] = hardRecord.split('/').map(x => Number(x.trim()) || 0);
              profile.surfaceRecords.hard = { wins, losses };
            }
            if (indoorsRecord?.includes('/')) {
              const [wins, losses] = indoorsRecord.split('/').map(x => Number(x.trim()) || 0);
              profile.surfaceRecords.indoor = { wins, losses };
            }
            if (grassRecord?.includes('/')) {
              const [wins, losses] = grassRecord.split('/').map(x => Number(x.trim()) || 0);
              profile.surfaceRecords.grass = { wins, losses };
            }
          }
        }
      }
      
      // Enhanced tournament achievements - using legacy tr[id*='row'] pattern but with better inference
      profile.tournamentAchievements = {};
      
      // Primary method: Legacy selector pattern
      const yearRows = document.querySelectorAll("tr[id*='row']");
      for (const yearRow of yearRows) {
        const year = yearRow.querySelector(".year > a")?.textContent;
        const result = yearRow.querySelector(".tl > a")?.textContent;
        const tournamentLink = yearRow.querySelector(".year > a")?.getAttribute("href");
        
        if (year && result && tournamentLink) {
          const tournamentMatch = tournamentLink.match(/\/([^/]+)\/(\d{4})\//);          
          const tournamentName = tournamentMatch ? tournamentMatch[1].replace(/-/g, ' ') : 'Unknown';
          
          if (!profile.tournamentAchievements[tournamentName]) {
            profile.tournamentAchievements[tournamentName] = [];
          }
          
          profile.tournamentAchievements[tournamentName].push({
            year: year.trim(),
            result: result.trim().toLowerCase()
          });
        }
      }
      
      // Secondary method: Infer from tournament result tables (similar to record table pattern)
      const tournamentTables = document.querySelectorAll('table');
      for (const table of tournamentTables) {
        const rows = table.querySelectorAll('tr');
        for (const row of rows) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const firstCell = cells[0]?.textContent?.trim();
            const secondCell = cells[1]?.textContent?.trim();
            const thirdCell = cells[2]?.textContent?.trim();
            
            // Look for year patterns in first cell
            if (firstCell && /^\d{4}$/.test(firstCell)) {
              const year = firstCell;
              const tournament = secondCell || 'Unknown';
              const result = thirdCell || '';
              
              // Filter for meaningful results
              if (result && (result.toLowerCase().includes('winner') || 
                           result.toLowerCase().includes('finalist') ||
                           result.toLowerCase().includes('semi') ||
                           result.toLowerCase().includes('quarter') ||
                           result.includes('R') || result.includes('r'))) {
                
                if (!profile.tournamentAchievements[tournament]) {
                  profile.tournamentAchievements[tournament] = [];
                }
                
                profile.tournamentAchievements[tournament].push({
                  year,
                  result: result.toLowerCase()
                });
              }
            }
          }
        }
      }
      
      // Enhanced match history parsing - using legacy div[id*='matches'] pattern with broader inference
      profile.yearMatches = {};
      
      // Primary method: Legacy matches section pattern
      const matchesSections = document.querySelectorAll("div[id*='matches']");
      if (matchesSections.length > 0) {
        const singlesTable = matchesSections[0];
        const matchRows = singlesTable.querySelectorAll("tr");
        
        let currentTournament = '';
        const currentYear = new Date().getFullYear().toString();
        const yearMatches = {};
        
        for (const row of matchRows) {
          if (row.className.includes("head")) {
            const tournamentLink = row.querySelector("td > a");
            currentTournament = tournamentLink?.textContent?.trim() || 'Unknown';
          } else if (currentTournament) {
            const date = row.querySelector(".time")?.textContent?.trim();
            const headline = row.querySelector("td[class*='name']");
            const winner = headline?.querySelector("a")?.textContent?.trim();
            const loser = headline?.querySelectorAll("a")[1]?.textContent?.trim();
            const round = row.querySelector(".round")?.textContent?.trim();
            const resultStr = row.querySelectorAll("td")[4]?.textContent;
            const isPlayerWinner = headline?.querySelector("a")?.className === "notU";
            
            // Enhanced odds extraction using legacy .course pattern
            const oddsElements = row.querySelectorAll(".course");
            const playerOdds = oddsElements.length >= 2 ? 
              parseFloat(oddsElements[isPlayerWinner ? 0 : 1]?.textContent || '0') : 0;
            const opponentOdds = oddsElements.length >= 2 ? 
              parseFloat(oddsElements[isPlayerWinner ? 1 : 0]?.textContent || '0') : 0;
            
            if (date && winner && loser && resultStr) {
              if (!yearMatches[currentTournament]) {
                yearMatches[currentTournament] = [];
              }
              
              const sets = resultStr.split(", ").filter(s => s).map(set => {
                const setStr = set.trim();
                const scores = setStr.split("-");
                let score1 = parseInt(scores[0]) || 0;
                let score2 = parseInt(scores[1]) || 0;
                
                // Handle tiebreak parsing - look for patterns like "7-67" meaning 7-6(7)
                let tiebreak = undefined;
                
                if (score2 > 50) {
                  // Pattern: 7-67 means 7-6(7) - player1 won 7-6 with tiebreak 7-X
                  const loserTiebreakScore = score2 % 10;
                  score2 = Math.floor(score2 / 10);
                  // Player1 won the set, so player1 got at least 7 in tiebreak
                  const winnerTiebreakScore = Math.max(7, loserTiebreakScore + 2);
                  tiebreak = {
                    player1: isPlayerWinner ? winnerTiebreakScore : loserTiebreakScore,
                    player2: isPlayerWinner ? loserTiebreakScore : winnerTiebreakScore
                  };
                } else if (score1 > 50) {
                  // Pattern: 67-7 means 6(7)-7 - player2 won 7-6 with tiebreak 7-X
                  const loserTiebreakScore = score1 % 10;
                  score1 = Math.floor(score1 / 10);
                  // Player2 won the set, so player2 got at least 7 in tiebreak
                  const winnerTiebreakScore = Math.max(7, loserTiebreakScore + 2);
                  tiebreak = {
                    player1: isPlayerWinner ? loserTiebreakScore : winnerTiebreakScore,
                    player2: isPlayerWinner ? winnerTiebreakScore : loserTiebreakScore
                  };
                } else if (setStr.includes('(') && setStr.includes(')')) {
                  // Pattern: "7-6(5)" or "6-7(3)"
                  const tiebreakMatch = setStr.match(/\((\d+)\)/);
                  if (tiebreakMatch) {
                    const loserTiebreakScore = parseInt(tiebreakMatch[1]);
                    // Determine who won the tiebreak based on set score
                    const player1WonSet = score1 > score2;
                    const winnerTiebreakScore = Math.max(7, loserTiebreakScore + 2);
                    tiebreak = {
                      player1: player1WonSet ? winnerTiebreakScore : loserTiebreakScore,
                      player2: player1WonSet ? loserTiebreakScore : winnerTiebreakScore
                    };
                  }
                }
                
                const setData = {
                  player1: isPlayerWinner ? score1 : score2,
                  player2: isPlayerWinner ? score2 : score1
                };
                
                if (tiebreak) {
                  setData.tiebreak = tiebreak;
                }
                
                return setData;
              }).filter(s => s.player1 > 0 || s.player2 > 0);
              
              yearMatches[currentTournament].push({
                date: date,
                opponent: isPlayerWinner ? loser : winner,
                round: round || 'Unknown',
                result: isPlayerWinner ? 'won' : 'lost',
                sets: {
                  sets,
                  totalSets: sets.length,
                  player1SetsWon: sets.filter(s => s.player1 > s.player2).length,
                  player2SetsWon: sets.filter(s => s.player2 > s.player1).length,
                  matchFormat: sets.length <= 3 ? '3-set' : '5-set',
                  completed: true
                },
                odds: { player: playerOdds, opponent: opponentOdds }
              });
            }
          }
        }
        
        if (Object.keys(yearMatches).length > 0) {
          profile.yearMatches[currentYear] = yearMatches;
        }
      }
      
      // Secondary method: Infer from general match tables (broader pattern)
      if (Object.keys(profile.yearMatches).length === 0) {
        const allTables = document.querySelectorAll('table');
        const currentYear = new Date().getFullYear().toString();
        const fallbackMatches = {};
        
        for (const table of allTables) {
          const rows = table.querySelectorAll('tr');
          let currentTournament = 'Recent Matches';
          
          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
              const firstCell = cells[0]?.textContent?.trim();
              const secondCell = cells[1]?.textContent?.trim();
              const thirdCell = cells[2]?.textContent?.trim();
              const fourthCell = cells[3]?.textContent?.trim();
              
              // Look for date pattern in first cell (DD.MM. format from legacy)
              if (firstCell && /\d{1,2}\.\d{1,2}\./.test(firstCell)) {
                const date = firstCell;
                const opponent = secondCell || 'Unknown';
                const result = thirdCell || '';
                const score = fourthCell || '';
                
                if (result && score && (result.toLowerCase().includes('won') || 
                                      result.toLowerCase().includes('lost') ||
                                      score.includes('-'))) {
                  
                  if (!fallbackMatches[currentTournament]) {
                    fallbackMatches[currentTournament] = [];
                  }
                  
                  // Enhanced set parsing with tiebreak support
                  const sets = score.split(',').map(set => {
                    const setStr = set.trim();
                    const scores = setStr.split('-');
                    let score1 = parseInt(scores[0]) || 0;
                    let score2 = parseInt(scores[1]) || 0;
                    
                    // Handle tiebreak parsing with correct tennis logic
                    let tiebreak = undefined;
                    
                    if (score2 > 50) {
                      // Pattern: 7-67 means 7-6(7) - player1 won set
                      const loserTiebreakScore = score2 % 10;
                      score2 = Math.floor(score2 / 10);
                      const winnerTiebreakScore = Math.max(7, loserTiebreakScore + 2);
                      tiebreak = {
                        player1: winnerTiebreakScore, // player1 won the set
                        player2: loserTiebreakScore
                      };
                    } else if (score1 > 50) {
                      // Pattern: 67-7 means 6(7)-7 - player2 won set
                      const loserTiebreakScore = score1 % 10;
                      score1 = Math.floor(score1 / 10);
                      const winnerTiebreakScore = Math.max(7, loserTiebreakScore + 2);
                      tiebreak = {
                        player1: loserTiebreakScore,
                        player2: winnerTiebreakScore // player2 won the set
                      };
                    } else if (setStr.includes('(') && setStr.includes(')')) {
                      // Pattern: "7-6(5)" or "6-7(3)"
                      const tiebreakMatch = setStr.match(/\((\d+)\)/);
                      if (tiebreakMatch) {
                        const loserTiebreakScore = parseInt(tiebreakMatch[1]);
                        const player1WonSet = score1 > score2;
                        const winnerTiebreakScore = Math.max(7, loserTiebreakScore + 2);
                        tiebreak = {
                          player1: player1WonSet ? winnerTiebreakScore : loserTiebreakScore,
                          player2: player1WonSet ? loserTiebreakScore : winnerTiebreakScore
                        };
                      }
                    }
                    
                    const setData = {
                      player1: score1,
                      player2: score2
                    };
                    
                    if (tiebreak) {
                      setData.tiebreak = tiebreak;
                    }
                    
                    return setData;
                  }).filter(s => s.player1 > 0 || s.player2 > 0);
                  
                  fallbackMatches[currentTournament].push({
                    date,
                    opponent,
                    round: 'Unknown',
                    result: result.toLowerCase().includes('won') ? 'won' : 'lost',
                    sets: {
                      sets,
                      totalSets: sets.length,
                      player1SetsWon: sets.filter(s => s.player1 > s.player2).length,
                      player2SetsWon: sets.filter(s => s.player2 > s.player1).length,
                      matchFormat: sets.length <= 3 ? '3-set' : '5-set',
                      completed: true
                    },
                    odds: { player: 0, opponent: 0 }
                  });
                }
              }
            }
          }
        }
        
        if (Object.keys(fallbackMatches).length > 0) {
          profile.yearMatches[currentYear] = fallbackMatches;
        }
      }
      
      // Enhanced titles parsing - extract from actual titles tables with tournament details
      profile.titles = {
        singles: { 
          main: 0, 
          challenger: 0,
          tournaments: {}
        },
        doubles: { 
          main: 0, 
          challenger: 0,
          tournaments: {}
        }
      };
      
      // Find titles tables using discovered class pattern
      const titlesTables = document.querySelectorAll('table.result.titles, table[class*="titles"]');
      
      for (const titlesTable of titlesTables) {
        const allRows = titlesTable.querySelectorAll('tr');
        
        for (let i = 0; i < allRows.length; i++) {
          const row = allRows[i];
          const cells = row.querySelectorAll('td');
          
          // Check if this is a year row (has td.year)
          const yearCell = row.querySelector('td.year');
          if (yearCell && cells.length >= 3) {
            const year = yearCell.textContent?.trim() || '';
            
            // Extract title counts from the row
            const mainTitlesCell = cells[1];
            const challengerTitlesCell = cells[2];
            
            const mainCount = parseInt(mainTitlesCell?.textContent?.trim() || '0') || 0;
            const challengerCount = parseInt(challengerTitlesCell?.textContent?.trim() || '0') || 0;
            
            // Determine if this is singles or doubles based on table context or row position
            // For now, assume first titles table is singles, second is doubles
            const tableIndex = Array.from(titlesTables).indexOf(titlesTable);
            const isSingles = tableIndex === 0;
            
            if (isSingles) {
              profile.titles.singles.main += mainCount;
              profile.titles.singles.challenger += challengerCount;
              
              // Initialize year data
              if (!profile.titles.singles.tournaments[year]) {
                profile.titles.singles.tournaments[year] = {
                  main: [],
                  challenger: []
                };
              }
            } else {
              profile.titles.doubles.main += mainCount;
              profile.titles.doubles.challenger += challengerCount;
              
              // Initialize year data
              if (!profile.titles.doubles.tournaments[year]) {
                profile.titles.doubles.tournaments[year] = {
                  main: [],
                  challenger: []
                };
              }
            }
            
            // Look for hidden tournament detail rows immediately following this row
            let nextRowIndex = i + 1;
            while (nextRowIndex < allRows.length) {
              const nextRow = allRows[nextRowIndex];
              
              // Check if this is a tournament detail row (has "tournament hidden" class)
              if (nextRow.className.includes('tournament') && nextRow.className.includes('hidden')) {
                const tournamentCells = nextRow.querySelectorAll('td');
                if (tournamentCells.length >= 1) {
                  // Extract tournament name and URL from .name element
                  const nameElement = nextRow.querySelector('.name');
                  const tournamentName = nameElement?.textContent?.trim() || '';
                  const tournamentUrl = nameElement?.querySelector('a')?.getAttribute('href') || undefined;
                  
                  // Extract prize money from .t-type > span title attribute
                  const prizeElement = nextRow.querySelector('.t-type > span[title]');
                  const prizeMoney = prizeElement?.getAttribute('title')?.trim() || undefined;
                  
                  // Extract surface from .s-color > span title attribute  
                  const surfaceElement = nextRow.querySelector('.s-color > span[title]');
                  const surface = surfaceElement?.getAttribute('title')?.trim() || undefined;
                  
                  // Get date from date cell if available
                  const dateElement = nextRow.querySelector('.date, [class*="date"]');
                  const tournamentDate = dateElement?.textContent?.trim() || undefined;
                  
                  const tournamentData = {
                    name: tournamentName,
                    url: tournamentUrl,
                    prizeMoney: prizeMoney,
                    surface: surface,
                    date: tournamentDate
                  };
                  
                  // Determine if this is a main or challenger tournament based on name and prize money
                  const tournamentNameLower = tournamentName.toLowerCase();
                  const prizeMoneyLower = (prizeMoney || '').toLowerCase();
                  const isMainTournament = !tournamentNameLower.includes('challenger') && 
                                         !tournamentNameLower.includes('itf') &&
                                         !prizeMoneyLower.includes('challenger') &&
                                         !prizeMoneyLower.includes('itf');
                  
                  if (isSingles) {
                    if (isMainTournament) {
                      profile.titles.singles.tournaments[year].main.push(tournamentData);
                    } else {
                      profile.titles.singles.tournaments[year].challenger.push(tournamentData);
                    }
                  } else {
                    if (isMainTournament) {
                      profile.titles.doubles.tournaments[year].main.push(tournamentData);
                    } else {
                      profile.titles.doubles.tournaments[year].challenger.push(tournamentData);
                    }
                  }
                }
                nextRowIndex++;
              } else {
                // No more tournament detail rows for this year
                break;
              }
            }
          }
        }
      }
      
      // Enhanced injury parsing - extract from actual injury table
      profile.injuries = [];
      
      // Primary method: Find the injury table using the discovered class pattern
      const injuryTable = document.querySelector('table.result.flags.injured, table[class*="injured"]');
      
      if (injuryTable) {
        const injuryRows = injuryTable.querySelectorAll('tr');
        
        for (const row of injuryRows) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            // Extract data from injury table columns
            const dateCell = cells[0]?.textContent?.trim();
            const tournamentCell = cells[1]?.textContent?.trim();
            const reasonCell = cells[2];
            
            // Get the main reason text
            const reasonText = reasonCell?.textContent?.trim() || '';
            
            // Extract tooltip information (score at retirement)
            let tooltipText = '';
            
            // Check the cell itself first
            if (reasonCell) {
              tooltipText = reasonCell.getAttribute('title') || '';
            }
            
            // If not on the cell, check child elements
            if (!tooltipText && reasonCell) {
              const elementWithTitle = reasonCell.querySelector('[title]');
              if (elementWithTitle) {
                tooltipText = elementWithTitle.getAttribute('title') || '';
              }
            }
            
            // Parse date to get year
            let year = new Date().getFullYear().toString();
            if (dateCell) {
              // Handle different date formats: "15.04.2023", "15.04.", etc.
              const dateMatch = dateCell.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})?/);
              if (dateMatch && dateMatch[3]) {
                year = dateMatch[3];
              } else {
                // If no year in date, try to infer from nearby content
                const yearMatch = row.textContent?.match(/(20\d{2})/);
                if (yearMatch) {
                  year = yearMatch[1];
                }
              }
            }
            
            // Determine injury type from reason text
            let injuryType = 'injury';
            const reasonLower = reasonText.toLowerCase();
            if (reasonLower.includes('retired')) injuryType = 'retired';
            else if (reasonLower.includes('walkover') || reasonLower.includes('w.o.')) injuryType = 'walkover';
            else if (reasonLower.includes('withdrew')) injuryType = 'withdrew';
            
            // Build injury object with separate tooltip field
            const injury = {
              year,
              type: injuryType,
              description: reasonText, // Keep original description clean
              startDate: dateCell || '',
              tournament: tournamentCell || 'Unknown',
              matchStatus: tooltipText || undefined // Separate field for tooltip data
            };
            
            profile.injuries.push(injury);
          }
        }
      }
      
      // Fallback method: Look for injury indicators in match history if no injury table found
      if (profile.injuries.length === 0) {
        const injuryKeywords = ['retired', 'walkover', 'w.o.', 'withdrew', 'withdrawal'];
        const matchRows = document.querySelectorAll('tr');
        
        for (const row of matchRows) {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const dateCell = cells[0]?.textContent?.trim();
            const matchInfo = cells[1]?.textContent?.trim();
            const resultCell = cells[2];
            const resultText = resultCell?.textContent?.toLowerCase() || '';
            
            for (const keyword of injuryKeywords) {
              if (resultText.includes(keyword)) {
                // Extract year from date or context
                let year = new Date().getFullYear().toString();
                if (dateCell?.includes('.')) {
                  const dateMatch = dateCell.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})?/);
                  if (dateMatch && dateMatch[3]) {
                    year = dateMatch[3];
                  }
                }
                
                // Get detailed description and check for tooltip in fallback
                const fullDescription = resultCell?.textContent?.trim() || keyword;
                const tooltipInFallback = resultCell?.querySelector('[title], [data-title], span[title]')?.getAttribute('title') || 
                                        resultCell?.querySelector('[title], [data-title], span[title]')?.getAttribute('data-title');
                
                profile.injuries.push({
                  year,
                  type: keyword,
                  description: fullDescription,
                  startDate: dateCell || '',
                  tournament: matchInfo || 'Unknown',
                  matchStatus: tooltipInFallback || undefined
                });
                break;
              }
            }
          }
        }
      }
      
      return profile;
    });
  }

  // URL pattern generators
  static getURLPatterns() {
    const baseUrl = 'https://www.tennisexplorer.com';
    
    return {
      dailyMatches: (year: number, month: number, day: number) =>
        `${baseUrl}/matches/?type=all&year=${year}&month=${month.toString().padStart(2, '0')}&day=${day.toString().padStart(2, '0')}`,
      
      dailyResults: (year: number, month: number, day: number) =>
        `${baseUrl}/results/?type=all&year=${year}&month=${month.toString().padStart(2, '0')}&day=${day.toString().padStart(2, '0')}`,
      
      playerProfile: (playerSlug: string) =>
        `${baseUrl}/player/${playerSlug}/`,
      
      matchDetail: (matchId: string) =>
        `${baseUrl}/match-detail/?id=${matchId}`,
      
      tournament: (tournamentSlug: string, year: number, category: string) =>
        `${baseUrl}/${tournamentSlug}/${year}/${category}/`
    };
  }
}