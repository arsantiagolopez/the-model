import type { ActionFunctionArgs } from "react-router";
import { LegacyPortScraper } from "~/lib/scraping/legacy-port-scraper";
import { ScrapingClient } from "~/lib/scraping/scraping-client";

// Validation functions
const validators = {
  // Tournament List Validation
  tournamentList: (data: any) => ({
    isValid: Array.isArray(data) && data.length > 0,
    checks: [
      { field: 'isArray', valid: Array.isArray(data), expected: 'Array of tournaments' },
      { field: 'hasItems', valid: data.length > 0, expected: 'At least 1 tournament' },
      { field: 'firstItem', valid: data[0] && typeof data[0] === 'object', expected: 'Tournament object' }
    ]
  }),

  // Tournament Details Validation  
  tournament: (tournament: any) => ({
    isValid: tournament && 
             typeof tournament.name === 'string' && tournament.name.length > 0 &&
             typeof tournament.surface === 'string' && tournament.surface.length > 0,
    checks: [
      { field: 'name', valid: typeof tournament?.name === 'string' && tournament.name.length > 0, expected: 'Non-empty string', actual: tournament?.name },
      { field: 'surface', valid: typeof tournament?.surface === 'string' && tournament.surface.length > 0, expected: 'Hard/Clay/Grass', actual: tournament?.surface },
      { field: 'prize', valid: typeof tournament?.prize === 'string', expected: 'Prize money string (e.g. $50,000)', actual: tournament?.prize },
      { field: 'location', valid: typeof tournament?.location === 'string', expected: 'Location string', actual: tournament?.location },
      { field: 'dates', valid: typeof tournament?.dates === 'string', expected: 'Date range string', actual: tournament?.dates },
      { field: 'category', valid: typeof tournament?.category === 'string', expected: 'ATP/WTA/ITF', actual: tournament?.category }
    ]
  }),

  // Match Data Validation
  match: (match: any) => ({
    isValid: match &&
             typeof match.home === 'string' && match.home.length > 0 &&
             typeof match.away === 'string' && match.away.length > 0,
    checks: [
      { field: 'home', valid: typeof match?.home === 'string' && match.home.length > 0, expected: 'Player name', actual: match?.home },
      { field: 'away', valid: typeof match?.away === 'string' && match.away.length > 0, expected: 'Player name', actual: match?.away },
      { field: 'homeOdds', valid: typeof match?.homeOdds === 'number' && match.homeOdds > 0, expected: 'Positive number', actual: match?.homeOdds },
      { field: 'awayOdds', valid: typeof match?.awayOdds === 'number' && match.awayOdds > 0, expected: 'Positive number', actual: match?.awayOdds },
      { field: 'homeH2h', valid: typeof match?.homeH2h === 'number' && match.homeH2h >= 0, expected: 'Number >= 0', actual: match?.homeH2h },
      { field: 'awayH2h', valid: typeof match?.awayH2h === 'number' && match.awayH2h >= 0, expected: 'Number >= 0', actual: match?.awayH2h },
      { field: 'date', valid: match?.date !== undefined, expected: 'Date or time string', actual: match?.date },
      { field: 'matchId', valid: typeof match?.matchId === 'string' && match.matchId.length > 0, expected: 'Match ID string', actual: match?.matchId }
    ]
  }),

  // Match Details Validation
  matchDetails: (details: any) => ({
    isValid: details && typeof details === 'object',
    checks: [
      { field: 'tournament', valid: typeof details?.tournament === 'string' && details.tournament.length > 0, expected: 'Tournament name', actual: details?.tournament },
      { field: 'round', valid: typeof details?.round === 'string', expected: 'Round info (R1, R2, QF, etc.)', actual: details?.round },
      { field: 'surface', valid: typeof details?.surface === 'string', expected: 'Surface type', actual: details?.surface },
      { field: 'status', valid: typeof details?.status === 'string', expected: 'Match status', actual: details?.status },
      { field: 'score', valid: details?.score !== undefined, expected: 'Match score', actual: details?.score },
      { field: 'stats', valid: typeof details?.stats === 'object', expected: 'Match statistics object', actual: details?.stats ? 'Object' : details?.stats }
    ]
  }),

  // Player Data Validation
  player: (player: any) => ({
    isValid: player &&
             typeof player.name === 'string' && player.name.length > 0,
    checks: [
      { field: 'name', valid: typeof player?.name === 'string' && player.name.length > 0, expected: 'Player name', actual: player?.name },
      { field: 'country', valid: typeof player?.country === 'string', expected: 'Country name', actual: player?.country },
      { field: 'age', valid: typeof player?.age === 'number' && player.age > 0 && player.age < 60, expected: 'Age (15-50)', actual: player?.age },
      { field: 'ranking', valid: typeof player?.ranking === 'number' && player.ranking > 0, expected: 'ATP/WTA ranking', actual: player?.ranking },
      { field: 'points', valid: typeof player?.points === 'number' && player.points >= 0, expected: 'Ranking points', actual: player?.points },
      { field: 'height', valid: typeof player?.height === 'string', expected: 'Height (e.g. 185cm)', actual: player?.height },
      { field: 'weight', valid: typeof player?.weight === 'string', expected: 'Weight (e.g. 80kg)', actual: player?.weight },
      { field: 'plays', valid: typeof player?.plays === 'string', expected: 'Playing style (Right/Left handed)', actual: player?.plays },
      { field: 'prize_money', valid: typeof player?.prize_money === 'string', expected: 'Career prize money', actual: player?.prize_money },
      { field: 'record', valid: typeof player?.record === 'string', expected: 'W-L record (e.g. 45-23)', actual: player?.record }
    ]
  })
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const formData = await request.formData();
    const testType = formData.get("testType") as string;

    // Create scraper instance with console logger
    const consoleLogger = {
      addLog: (message: string) => console.log(`[TEST] ${message}`)
    };
    const scraper = new LegacyPortScraper(consoleLogger);

    let result: any = {};

    switch (testType) {
      case "schedule-raw": {
        console.log("🧪 Testing raw schedule scraping...");
        
        // Test the raw schedule scraping method
        const rawResult = await scraper['scrapeTournamentMatchesAndPlayers']();
        
        if (rawResult) {
          result = {
            success: true,
            testType: "schedule-raw",
            data: {
              tournaments: rawResult.tournaments.slice(0, 3), // First 3 for brevity
              matches: rawResult.matches.slice(0, 5), // First 5 matches
              players: rawResult.players.slice(0, 5), // First 5 players
              summary: {
                totalTournaments: rawResult.tournaments.length,
                totalMatches: rawResult.matches.length,
                totalPlayers: rawResult.players.length
              }
            }
          };
        } else {
          result = { success: false, error: "Failed to scrape raw data" };
        }
        break;
      }

      case "schedule-converted": {
        console.log("🧪 Testing converted schedule data...");
        
        // Test the raw scraping and conversion
        const rawResult = await scraper['scrapeTournamentMatchesAndPlayers']();
        
        if (rawResult && rawResult.matches.length > 0) {
          // Test conversion methods
          const sampleMatch = rawResult.matches[0];
          const convertedMatch = scraper['convertMatch'](sampleMatch);
          
          result = {
            success: true,
            testType: "schedule-converted",
            data: {
              originalMatch: sampleMatch,
              convertedMatch: convertedMatch,
              dateInfo: {
                originalDate: sampleMatch.date,
                originalDateType: typeof sampleMatch.date,
                convertedDate: convertedMatch.date,
                convertedDateType: typeof convertedMatch.date,
                isValidDate: sampleMatch.date instanceof Date ? !isNaN(sampleMatch.date.getTime()) : false
              }
            }
          };
        } else {
          result = { success: false, error: "No matches found to convert" };
        }
        break;
      }

      case "date-parsing": {
        console.log("🧪 Testing date parsing logic...");
        
        // Test date parsing with sample data
        const testDates = ["14:30", "09:15", "--:--", undefined];
        const results = [];
        
        for (const testTime of testDates) {
          const today = new Date();
          let parsedDate: Date | undefined;
          
          if (testTime?.includes("--:--")) {
            parsedDate = undefined;
          } else if (testTime) {
            const hours = Number(testTime.substring(0, 2));
            const minutes = Number(testTime.substring(3, 5));
            
            const matchDate = new Date(today);
            matchDate.setDate(today.getDate() + 1); // Set to tomorrow
            matchDate.setHours(hours, minutes, 0, 0);
            parsedDate = matchDate;
          }
          
          results.push({
            input: testTime,
            parsed: parsedDate,
            formatted: parsedDate ? parsedDate.toISOString() : null,
            timeDisplay: parsedDate ? `${parsedDate.getHours().toString().padStart(2, '0')}:${parsedDate.getMinutes().toString().padStart(2, '0')}` : "--:--"
          });
        }
        
        result = {
          success: true,
          testType: "date-parsing",
          data: {
            currentTime: new Date().toISOString(),
            tomorrowDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString(),
            testResults: results
          }
        };
        break;
      }

      case "tournament-list": {
        console.log("🧪 Testing tournament list scraping...");
        
        // Test tournament list scraping
        const rawResult = await scraper['scrapeTournamentMatchesAndPlayers']();
        
        if (rawResult && rawResult.tournaments.length > 0) {
          const tournament = rawResult.tournaments[0];
          const validation = validators.tournament(tournament);
          
          result = {
            success: true,
            testType: "tournament-list",
            data: {
              tournament: tournament,
              validation: validation,
              summary: {
                totalTournaments: rawResult.tournaments.length,
                sampleTournament: tournament.name,
                surface: tournament.surface,
                category: tournament.category
              },
              scrapedUrls: rawResult.scrapedUrls || []
            }
          };
        } else {
          result = { success: false, error: "No tournaments found" };
        }
        break;
      }

      case "tournament-details": {
        console.log("🧪 Testing tournament details scraping...");
        
        // Test detailed tournament scraping (first tournament)
        const rawResult = await scraper['scrapeTournamentMatchesAndPlayers']();
        
        if (rawResult && rawResult.tournaments.length > 0) {
          const tournament = rawResult.tournaments[0];
          const validation = validators.tournament(tournament);
          
          // Additional tournament-specific checks
          const extendedValidation = {
            ...validation,
            checks: [
              ...validation.checks,
              { field: 'tournamentId', valid: typeof tournament?.tournamentId === 'string' && tournament.tournamentId.length > 0, expected: 'Tournament ID string', actual: tournament?.tournamentId },
              { field: 'link', valid: typeof tournament?.link === 'string' && tournament.link.includes('tennisexplorer'), expected: 'TennisExplorer URL', actual: tournament?.link }
            ]
          };
          
          result = {
            success: true,
            testType: "tournament-details", 
            data: {
              tournament: tournament,
              validation: extendedValidation,
              detailsFound: {
                hasName: !!tournament.name,
                hasSurface: !!tournament.surface,
                hasPrize: !!tournament.prize,
                hasLocation: !!tournament.location,
                hasDates: !!tournament.dates,
                hasCategory: !!tournament.category
              },
              scrapedUrls: rawResult.scrapedUrls || []
            }
          };
        } else {
          result = { success: false, error: "No tournaments found for details test" };
        }
        break;
      }

      case "match-data": {
        console.log("🧪 Testing match data scraping...");
        
        // Test match data scraping
        const rawResult = await scraper['scrapeTournamentMatchesAndPlayers']();
        
        if (rawResult && rawResult.matches.length > 0) {
          const match = rawResult.matches[0];
          const validation = validators.match(match);
          
          result = {
            success: true,
            testType: "match-data",
            data: {
              match: match,
              validation: validation,
              summary: {
                totalMatches: rawResult.matches.length,
                sampleMatch: `${match.home} vs ${match.away}`,
                hasOdds: !!(match.homeOdds && match.awayOdds),
                hasH2H: !!(match.homeH2h !== undefined && match.awayH2h !== undefined),
                hasValidDate: match.date instanceof Date
              },
              scrapedUrls: rawResult.scrapedUrls || []
            }
          };
        } else {
          result = { success: false, error: "No matches found" };
        }
        break;
      }

      case "match-details": {
        console.log("🧪 Testing match details scraping...");
        
        // For this test, we'll simulate match details validation
        // In a real implementation, you would scrape a specific match detail page
        const sampleMatchDetails = {
          tournament: "US Open",
          round: "Round 1",
          surface: "Hard",
          status: "Scheduled",
          score: null,
          stats: {
            aces: { home: 0, away: 0 },
            doubleFaults: { home: 0, away: 0 }
          }
        };
        
        const validation = validators.matchDetails(sampleMatchDetails);
        
        result = {
          success: true,
          testType: "match-details",
          data: {
            matchDetails: sampleMatchDetails,
            validation: validation,
            note: "This is sample data - implement actual match detail scraping here",
            scrapedUrls: ["Sample - no actual URLs scraped for match details yet"]
          }
        };
        break;
      }

      case "player-profile": {
        console.log("🧪 Testing player profile scraping...");
        
        // Test player data from scraped matches
        const rawResult = await scraper['scrapeTournamentMatchesAndPlayers']();
        
        if (rawResult && rawResult.players.length > 0) {
          const player = rawResult.players[0];
          const validation = validators.player(player);
          
          result = {
            success: true,
            testType: "player-profile",
            data: {
              player: player,
              validation: validation,
              summary: {
                totalPlayers: rawResult.players.length,
                playerName: player.name,
                hasRanking: !!player.ranking,
                hasCountry: !!player.country,
                hasAge: !!player.age
              },
              scrapedUrls: rawResult.scrapedUrls || []
            }
          };
        } else {
          result = { success: false, error: "No players found" };
        }
        break;
      }

      case "quick-test": {
        console.log("🧪 Running quick test (no scraping)...");
        
        result = {
          success: true,
          testType: "quick-test",
          data: {
            message: "Quick test completed successfully!",
            timestamp: new Date().toISOString(),
            sample: {
              tournament: "Sample Tournament",
              match: "Player A vs Player B", 
              player: "Sample Player"
            }
          }
        };
        break;
      }

      case "run-all-tests": {
        console.log("🧪 Running all scraper tests (lightweight mode)...");
        
        try {
          const allTestTypes = ["tournament-list", "tournament-details", "match-data", "match-details", "player-profile"];
          const testResults: any[] = [];
          let overallSuccess = true;
          
          console.log("⚡ Starting lightweight scraper run...");
          
          // LIGHTWEIGHT: Run the main scraper once to get minimal data (just first results)
          const rawResult = await scraper['scrapeTournamentMatchesAndPlayers']();
          
          console.log("📊 Scraper results:", {
            tournaments: rawResult?.tournaments?.length || 0,
            matches: rawResult?.matches?.length || 0, 
            players: rawResult?.players?.length || 0
          });
          
          if (rawResult) {
            // Tournament tests (first tournament only)
            if (rawResult.tournaments.length > 0) {
              const tournament = rawResult.tournaments[0];
              console.log("🏆 Testing first tournament:", tournament.name);
              
              const tournamentValidation = validators.tournament(tournament);
              testResults.push({
                testType: "tournament-list",
                success: tournamentValidation.isValid,
                validation: tournamentValidation,
                data: tournament
              });
              
              const extendedValidation = {
                ...tournamentValidation,
                checks: [
                  ...tournamentValidation.checks,
                  { field: 'tournamentId', valid: typeof tournament?.tournamentId === 'string' && tournament.tournamentId.length > 0, expected: 'Tournament ID string', actual: tournament?.tournamentId },
                  { field: 'link', valid: typeof tournament?.link === 'string' && tournament.link.includes('tennisexplorer'), expected: 'TennisExplorer URL', actual: tournament?.link }
                ]
              };
              testResults.push({
                testType: "tournament-details",
                success: extendedValidation.isValid,
                validation: extendedValidation,
                data: tournament
              });
              
              if (!tournamentValidation.isValid) overallSuccess = false;
            } else {
              testResults.push({ testType: "tournament-list", success: false, error: "No tournaments found" });
              testResults.push({ testType: "tournament-details", success: false, error: "No tournaments found" });
              overallSuccess = false;
            }
            
            // Match tests (first match only)
            if (rawResult.matches.length > 0) {
              const match = rawResult.matches[0];
              console.log("⚾ Testing first match:", `${match.home} vs ${match.away}`);
              
              const matchValidation = validators.match(match);
              testResults.push({
                testType: "match-data",
                success: matchValidation.isValid,
                validation: matchValidation,
                data: match
              });
              
              if (!matchValidation.isValid) overallSuccess = false;
            } else {
              testResults.push({ testType: "match-data", success: false, error: "No matches found" });
              overallSuccess = false;
            }
            
            // Match details test (sample data - not scraped)
            const sampleMatchDetails = {
              tournament: "US Open",
              round: "Round 1", 
              surface: "Hard",
              status: "Scheduled",
              score: null,
              stats: { aces: { home: 0, away: 0 }, doubleFaults: { home: 0, away: 0 } }
            };
            const matchDetailsValidation = validators.matchDetails(sampleMatchDetails);
            testResults.push({
              testType: "match-details",
              success: matchDetailsValidation.isValid,
              validation: matchDetailsValidation,
              data: sampleMatchDetails,
              note: "Sample data - implement actual match detail scraping"
            });
            
            // Player tests (first player only)
            if (rawResult.players.length > 0) {
              const player = rawResult.players[0];
              console.log("👤 Testing first player:", player.name);
              
              const playerValidation = validators.player(player);
              testResults.push({
                testType: "player-profile",
                success: playerValidation.isValid,
                validation: playerValidation,
                data: player
              });
              
              if (!playerValidation.isValid) overallSuccess = false;
            } else {
              testResults.push({ testType: "player-profile", success: false, error: "No players found" });
              overallSuccess = false;
            }
            
            console.log("✅ All validations complete");
            
            result = {
              success: overallSuccess,
              testType: "run-all-tests",
              data: {
                overallSuccess,
                testResults,
                summary: {
                  totalTests: testResults.length,
                  passedTests: testResults.filter(t => t.success).length,
                  failedTests: testResults.filter(t => !t.success).length,
                  totalTournaments: rawResult.tournaments.length,
                  totalMatches: rawResult.matches.length,
                  totalPlayers: rawResult.players.length,
                  sampleMode: "Testing first entity only (not all)"
                },
                scrapedUrls: rawResult.scrapedUrls || []
              }
            };
          } else {
            result = { success: false, error: "Failed to scrape any data" };
          }
        } catch (error) {
          console.error("❌ Run all tests error:", error);
          result = { 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error during testing"
          };
        }
        break;
      }

      default: {
        result = {
          success: false,
          error: "Invalid test type. Use: schedule-raw, schedule-converted, date-parsing, tournament-list, tournament-details, match-data, match-details, player-profile, or run-all-tests"
        };
      }
    }

    return Response.json(result, {
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("❌ Test scraper error:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// GET handler to show available tests
export async function loader() {
  return Response.json({
    message: "Scraper Test Route",
    availableTests: [
      {
        name: "schedule-raw",
        description: "Test raw schedule scraping from TennisExplorer",
        method: "POST",
        body: "testType=schedule-raw"
      },
      {
        name: "schedule-converted", 
        description: "Test schedule scraping and database conversion",
        method: "POST", 
        body: "testType=schedule-converted"
      },
      {
        name: "date-parsing",
        description: "Test date/time parsing logic with sample data",
        method: "POST",
        body: "testType=date-parsing"
      },
      {
        name: "tournament-list",
        description: "Test tournament list scraping with validation",
        method: "POST",
        body: "testType=tournament-list"
      },
      {
        name: "tournament-details",
        description: "Test detailed tournament data scraping",
        method: "POST",
        body: "testType=tournament-details"
      },
      {
        name: "match-data",
        description: "Test match data scraping (players, odds, h2h)",
        method: "POST",
        body: "testType=match-data"
      },
      {
        name: "match-details",
        description: "Test match detail page scraping",
        method: "POST",
        body: "testType=match-details"
      },
      {
        name: "player-profile",
        description: "Test player profile data scraping",
        method: "POST",
        body: "testType=player-profile"
      },
      {
        name: "run-all-tests",
        description: "Run all scraper tests sequentially (single scrape, all validations)",
        method: "POST",
        body: "testType=run-all-tests"
      }
    ],
    example: "curl -X POST http://localhost:5173/api/test-scraper -d 'testType=tournament-list'"
  });
}