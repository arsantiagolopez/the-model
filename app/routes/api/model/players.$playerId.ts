import type { LoaderFunctionArgs } from "react-router";
import { db, players } from "~/lib/db";
import { eq } from "drizzle-orm";

export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId } = params;
  
  if (!playerId) {
    throw new Response("Player ID required", { status: 400 });
  }

  // Handle playerId formats - legacy format is /player/{id}/, current format might just be {id}
  const formattedPlayerId = playerId.startsWith('/player/') ? playerId : `/player/${playerId}/`;

  try {
    const [player] = await db.select().from(players)
      .where(eq(players.playerId, formattedPlayerId))
      .limit(1);
    
    if (!player) {
      // Try with the original playerId format too
      const [playerAlt] = await db.select().from(players)
        .where(eq(players.playerId, playerId))
        .limit(1);
      
      if (!playerAlt) {
        throw new Response("Player not found", { status: 404 });
      }
      
      return Response.json(playerAlt);
    }

    return Response.json(player);
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Error fetching player:", error);
    throw new Response("Internal server error", { status: 500 });
  }
}