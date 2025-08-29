import type { LoaderFunctionArgs } from "react-router";
import { db, players, tournaments } from "~/lib/db";
import { eq } from "drizzle-orm";

interface PlayerAndCountry {
  player: any;
  country: string;
  countryCode?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get all players and tournaments
    const [allPlayers, allTournaments] = await Promise.all([
      db.select().from(players),
      db.select().from(tournaments)
    ]);

    // Create tournament to country mapping
    const tournamentCountryMap: Record<string, { country: string; countryCode?: string }> = {};
    
    for (const tournament of allTournaments) {
      if (tournament.countryCode && tournament.country) {
        tournamentCountryMap[tournament.tournamentId] = {
          country: tournament.country,
          countryCode: tournament.countryCode
        };
      }
    }

    const playersAndCountry: PlayerAndCountry[] = [];

    // Find players playing in their home country
    for (const player of allPlayers) {
      const upcomingMatch = player.upcomingMatch;
      if (upcomingMatch && typeof upcomingMatch === 'object' && 'tournamentId' in upcomingMatch) {
        const tournamentId = (upcomingMatch as any).tournamentId;
        const playerCountry = player.country?.toLowerCase();
        const tournamentData = tournamentCountryMap[tournamentId];
        
        if (tournamentData && playerCountry) {
          const tournamentCountry = tournamentData.country.toLowerCase();
          
          // If player is playing in their home country
          if (playerCountry === tournamentCountry) {
            playersAndCountry.push({
              player,
              country: tournamentData.country,
              countryCode: tournamentData.countryCode
            });
          }
        }
      }
    }

    // Sort by country name
    playersAndCountry.sort((a, b) => a.country.localeCompare(b.country));

    return Response.json(playersAndCountry);
  } catch (error) {
    console.error("Error fetching country stats:", error);
    throw new Response("Internal server error", { status: 500 });
  }
}