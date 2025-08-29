import type { LoaderFunctionArgs } from "react-router";
import { db, players } from "~/lib/db";
import { desc, gte } from "drizzle-orm";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get up to 10 players with current win streaks of at least 3
    // Streak is positive for wins, negative for losses
    const playersWithStreaks = await db.select()
      .from(players)
      .where(gte(players.streak, 3)) // Only positive streaks of 3 or more
      .orderBy(desc(players.streak))
      .limit(10);

    return Response.json(playersWithStreaks);
  } catch (error) {
    console.error("Error fetching streak stats:", error);
    throw new Response("Internal server error", { status: 500 });
  }
}