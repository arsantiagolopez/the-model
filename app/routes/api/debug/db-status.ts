import type { ActionFunctionArgs } from "react-router";
import { db } from "~/lib/db";
import { matches, players, tournaments, playerStats } from "~/lib/db/schema";
import { desc } from "drizzle-orm";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    console.log("🔍 Checking database status...");
    
    const [playersData, matchesData, tournamentsData, statsData] = await Promise.all([
      db.select().from(players).orderBy(desc(players.updatedAt)).limit(200),
      db.select().from(matches).orderBy(desc(matches.createdAt)).limit(20), 
      db.select().from(tournaments).limit(20),
      db.select().from(playerStats).limit(20)
    ]);
    
    return Response.json({
      success: true,
      database: {
        players: {
          count: playersData.length,
          sample: playersData.map(p => ({ 
            id: p.playerId, 
            name: p.name, 
            image: p.image,
            createdAt: p.createdAt 
          }))
        },
        matches: {
          count: matchesData.length,
          sample: matchesData.map(m => ({ 
            id: m.matchId, 
            home: m.home, 
            away: m.away, 
            homeLink: m.homeLink,
            awayLink: m.awayLink,
            surface: m.surface,
            date: m.date,
            createdAt: m.createdAt
          }))
        },
        tournaments: {
          count: tournamentsData.length,
          sample: tournamentsData.map(t => ({ 
            id: t.tournamentId, 
            name: t.name, 
            createdAt: t.createdAt 
          }))
        },
        stats: {
          count: statsData.length
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Database status check failed:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function loader() {
  return Response.json({ 
    message: "POST to this endpoint to check database contents" 
  });
}