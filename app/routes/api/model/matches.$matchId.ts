import type { LoaderFunctionArgs } from "react-router";
import { db, matches, players } from "~/lib/db";
import { eq } from "drizzle-orm";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { matchId } = params;
  
  if (!matchId) {
    throw new Response("Match ID required", { status: 400 });
  }

  const url = new URL(request.url);
  const withLastMatches = url.searchParams.get('withLastMatches') === 'true';

  try {
    // Get the match by matchId
    const [match] = await db.select().from(matches).where(eq(matches.matchId, matchId)).limit(1);
    
    if (!match) {
      throw new Response("Match not found", { status: 404 });
    }

    // If withLastMatches is requested, get the players' last matches
    if (withLastMatches && match.homeLink && match.awayLink) {
      const [homePlayer] = await db.select().from(players)
        .where(eq(players.playerId, match.homeLink))
        .limit(1);
      
      const [awayPlayer] = await db.select().from(players)
        .where(eq(players.playerId, match.awayLink))
        .limit(1);

      const playersLastMatches = {
        homeLastMatches: homePlayer?.lastMatches,
        awayLastMatches: awayPlayer?.lastMatches,
      };

      return Response.json({ ...match, playersLastMatches });
    }

    return Response.json(match);
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Error fetching match:", error);
    throw new Response("Internal server error", { status: 500 });
  }
}