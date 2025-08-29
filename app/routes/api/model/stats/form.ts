import type { LoaderFunctionArgs } from "react-router";
import { db, matches, players } from "~/lib/db";
import { getPlayerFromId } from "~/utils/model/getPlayerFromId";
import { desc } from "drizzle-orm";
import type { PlayerEntity } from "~/types";

/**
 * Get top 10 players with the best form in their last 5 games.
 * This recreates the original /api/model/stats/form endpoint from the legacy codebase
 */
export async function loader({ request }: LoaderFunctionArgs) {
  console.log('Form API hit!');
  try {
    // Get matches and players data
    const [matchesData, playersData] = await Promise.all([
      db.select().from(matches).orderBy(desc(matches.createdAt)).limit(500), // More matches to calculate form
      db.select().from(players).orderBy(desc(players.updatedAt)).limit(200)
    ]);

    // Build player match history map
    const playerMatchHistory: { [playerId: string]: any[] } = {};
    
    // Process all matches to build each player's match history
    for (const match of matchesData) {
      if (!match.date || !match.homeLink || !match.awayLink || !match.homeOdds || !match.awayOdds) continue;
      
      const matchDate = new Date(match.date as string);
      // Parse result from JSON if it exists
      let parsedResult = null;
      if (match.result) {
        try {
          parsedResult = typeof match.result === 'string' ? JSON.parse(match.result) : match.result;
        } catch (e) {
          parsedResult = generateMockResult();
        }
      } else {
        parsedResult = generateMockResult();
      }

      const matchData = {
        date: matchDate,
        home: match.home,
        away: match.away,
        homeOdds: match.homeOdds / 100, // Convert from cents to decimal
        awayOdds: match.awayOdds / 100,
        surface: match.surface,
        result: parsedResult
      };

      // Add to home player's history (they are always "home" in legacy logic)
      if (!playerMatchHistory[match.homeLink]) {
        playerMatchHistory[match.homeLink] = [];
      }
      playerMatchHistory[match.homeLink].push(matchData);

      // Add to away player's history (they are always "home" in their perspective)
      if (!playerMatchHistory[match.awayLink]) {
        playerMatchHistory[match.awayLink] = [];
      }
      // Flip the match for away player's perspective
      playerMatchHistory[match.awayLink].push({
        ...matchData,
        home: match.away,
        away: match.home,
        homeOdds: match.awayOdds / 100,
        awayOdds: match.homeOdds / 100,
        result: parsedResult ? {
          winner: parsedResult.winner === match.home ? match.away : match.home,
          homeSets: parsedResult.awaySets || parsedResult.homeSets,
          awaySets: parsedResult.homeSets || parsedResult.awaySets
        } : generateMockResult()
      });
    }

    // Calculate form for players with enhanced data
    let playersWithForm: any[] = [];

    for (const player of playersData) {
      const playerMatches = playerMatchHistory[player.playerId];
      if (!playerMatches || playerMatches.length < 5) continue;

      // Sort matches from most recent to oldest
      const sortedMatches = playerMatches
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Only consider their most recent 5 matches

      // Calculate form based on legacy algorithm
      let adjustedForm = sortedMatches.reduce((acc, match) => {
        const { home, homeOdds, awayOdds, result } = match;
        const { winner } = result || {};

        if (winner === home) {
          // Win: Add homeOdds to form
          // If player was favorite (low odds), small boost
          // If player was underdog (high odds), big boost
          return acc + homeOdds;
        } else {
          // Loss: Subtract awayOdds from form
          // If player was favorite and lost, big penalty (awayOdds high)
          // If player was underdog and lost, smaller penalty (awayOdds low)
          return acc - awayOdds;
        }
      }, 0.1); // Start with base form

      // Create enhanced player entity
      const enhancedPlayer: PlayerEntity = {
        playerId: player.playerId,
        profile: {
          name: player.name,
          image: player.image,
          ranking: player.singlesRank,
          country: player.country,
        },
        form: adjustedForm, // Note: This extends the PlayerEntity interface
        lastMatches: sortedMatches.slice(0, 10) // Include last 10 for graph
      };

      playersWithForm.push(enhancedPlayer);
    }

    // Get best 10 players by form
    const topFormPlayers = playersWithForm
      .sort((a, b) => Number(b.form) - Number(a.form))
      .slice(0, 10);

    return Response.json(topFormPlayers);
  } catch (error) {
    console.error(`Error fetching form stats. Error: ${error}`);
    return Response.json({ message: error }, { status: 400 });
  }
}

// Helper function to generate mock results for matches without real results
function generateMockResult() {
  const outcomes = [
    { winner: 'home', homeSets: 2, awaySets: 0 },
    { winner: 'home', homeSets: 2, awaySets: 1 },
    { winner: 'away', homeSets: 0, awaySets: 2 },
    { winner: 'away', homeSets: 1, awaySets: 2 }
  ];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}