import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { db } from "~/lib/db";
import { matches, tournaments, players, playerStats, results } from "~/lib/db/schema";
import { LegacyPortScraper } from "~/lib/scraping/legacy-port-scraper";
import { logStore } from "~/routes/api/logs/stream";

type ScrapeResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    // TODO: Add authentication check
    // const user = await getAuthenticatedUser(request);
    // if (!user?.isAdmin) {
    //   return Response.json(
    //     { success: false, error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    console.log("🚀 Starting model scraping process...");
    logStore.addLog("🚀 Starting model scraping process...");

    // Clear existing data (following legacy pattern)
    console.log("🗑️ Clearing existing data...");
    logStore.addLog("🗑️ Clearing existing data...");
    try {
      await Promise.all([
        db.delete(matches),
        db.delete(tournaments),
        db.delete(players),
        db.delete(playerStats),
        db.delete(results),
      ]);
      console.log("✅ Data cleared successfully");
      logStore.addLog("✅ Data cleared successfully");
    } catch (error) {
      console.log("⚠️ Tables may not exist yet, continuing with scraping...");
      logStore.addLog("⚠️ Tables may not exist yet, continuing with scraping...");
    }

    // Create legacy port scraper instance with logger
    const scraper = new LegacyPortScraper(logStore);
    
    // Run the full scraping sequence (following legacy pattern)
    console.log("📅 Step 1: Scraping schedule...");
    logStore.addLog("📅 Step 1: Scraping schedule...");
    const scheduleResult = await scraper.scrapeSchedule();
    if (!scheduleResult.success) {
      const errorMsg = `Schedule scraping failed: ${scheduleResult.error}`;
      logStore.addLog(`❌ ${errorMsg}`);
      return Response.json({ 
        success: false, 
        error: errorMsg 
      }, { status: 500 });
    }
    logStore.addLog(`✅ Schedule complete: ${scheduleResult.count} items`);

    console.log("🏆 Step 2: Scraping tournaments...");
    logStore.addLog("🏆 Step 2: Scraping tournaments...");
    const tournamentsResult = await scraper.scrapeTournaments();
    if (!tournamentsResult.success) {
      const errorMsg = `Tournament scraping failed: ${tournamentsResult.error}`;
      logStore.addLog(`❌ ${errorMsg}`);
      return Response.json({ 
        success: false, 
        error: errorMsg 
      }, { status: 500 });
    }
    logStore.addLog(`✅ Tournaments complete: ${tournamentsResult.count} items`);

    console.log("🎾 Step 3: Scraping matches...");
    logStore.addLog("🎾 Step 3: Scraping matches...");
    const matchesResult = await scraper.scrapeMatches();
    if (!matchesResult.success) {
      const errorMsg = `Match scraping failed: ${matchesResult.error}`;
      logStore.addLog(`❌ ${errorMsg}`);
      return Response.json({ 
        success: false, 
        error: errorMsg 
      }, { status: 500 });
    }
    logStore.addLog(`✅ Matches complete: ${matchesResult.count} items`);

    console.log("👤 Step 4: Scraping players...");
    logStore.addLog("👤 Step 4: Scraping players...");
    const playersResult = await scraper.scrapePlayers();
    if (!playersResult.success) {
      const errorMsg = `Player scraping failed: ${playersResult.error}`;
      logStore.addLog(`❌ ${errorMsg}`);
      return Response.json({ 
        success: false, 
        error: errorMsg 
      }, { status: 500 });
    }
    logStore.addLog(`✅ Players complete: ${playersResult.count} items`);

    console.log("📊 Step 5: Scraping stats...");
    logStore.addLog("📊 Step 5: Scraping stats...");
    const statsResult = await scraper.scrapeStats();
    if (!statsResult.success) {
      const errorMsg = `Stats scraping failed: ${statsResult.error}`;
      logStore.addLog(`❌ ${errorMsg}`);
      return Response.json({ 
        success: false, 
        error: errorMsg 
      }, { status: 500 });
    }
    logStore.addLog(`✅ Stats complete: ${statsResult.count} items`);

    console.log("✅ Model scraping completed successfully");
    logStore.addLog("🎉 Model scraping completed successfully! All data is ready.");
    
    return Response.json({
      success: true,
      message: "Model scraping completed successfully",
      stats: {
        schedule: scheduleResult.count,
        tournaments: tournamentsResult.count,
        matches: matchesResult.count,
        players: playersResult.count,
        stats: statsResult.count,
      },
    }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("💥 Fatal error in model scraping:", error);
    logStore.addLog(`💥 Fatal error in model scraping: ${errorMsg}`);
    return Response.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

export async function loader() {
  return redirect("/model");
}