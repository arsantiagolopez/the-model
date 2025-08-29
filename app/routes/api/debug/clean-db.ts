import type { ActionFunctionArgs } from "react-router";
import { db } from "~/lib/db";
import { matches, players, tournaments, playerStats } from "~/lib/db/schema";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    console.log("🧹 Cleaning mock data from database...");
    
    // Delete all mock/test data
    await db.delete(playerStats);
    await db.delete(matches); 
    await db.delete(players);
    await db.delete(tournaments);
    
    console.log("✅ Database cleaned - all mock data removed");
    
    return Response.json({
      success: true,
      message: "Database cleaned - ready for fresh scraping"
    });
    
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function loader() {
  return Response.json({ 
    message: "POST to this endpoint to clean mock data from database" 
  });
}