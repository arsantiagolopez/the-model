import type { ActionFunctionArgs } from "react-router";
import { UpdatedScraper } from "~/lib/scraping/updated-scraper";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const scraper = new UpdatedScraper();

  try {
    console.log("🧪 Testing updated scraper with real selectors...");
    
    // Test schedule scraping
    console.log("📅 Testing schedule scrape...");
    const scheduleResult = await scraper.scrapeSchedule();
    
    // Test player enhancement (if schedule found players)
    let playerResult = { success: true, count: 0 };
    if (scheduleResult.success && scheduleResult.count > 0) {
      console.log("👤 Testing player enhancement...");
      playerResult = await scraper.scrapePlayers();
    }
    
    return Response.json({
      success: true,
      results: {
        schedule: scheduleResult,
        players: playerResult,
        summary: {
          totalDataPoints: scheduleResult.count + playerResult.count,
          scheduleWorking: scheduleResult.success,
          playersWorking: playerResult.success
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Updated scraper test failed:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  } finally {
    await scraper.close();
  }
}

export async function loader() {
  return Response.json({ 
    message: "POST to this endpoint to test the updated scraper with current selectors" 
  });
}