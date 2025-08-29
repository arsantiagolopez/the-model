import type { LoaderFunctionArgs } from "react-router";
import { db, players } from "~/lib/db";
import { eq } from "drizzle-orm";

export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId } = params;
  
  if (!playerId) {
    throw new Response("Player ID required", { status: 400 });
  }

  const fullPlayerId = `/player/${playerId}/`;

  try {
    // Get the full player by playerId (matching legacy pattern)
    const [player] = await db.select().from(players)
      .where(eq(players.playerId, fullPlayerId))
      .limit(1);
    
    if (!player) {
      throw new Response("Player not found", { status: 404 });
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