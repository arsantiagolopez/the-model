import type { ActionFunctionArgs } from "react-router";
import { analyzePlayerPageSelectors, analyzeSchedulePageSelectors } from "~/lib/scraping/selector-analyzer";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    console.log("🔍 Starting detailed selector analysis...");
    
    // Analyze player page selectors
    console.log("👤 Analyzing player page selectors...");
    const playerSelectors = await analyzePlayerPageSelectors(
      "https://www.tennisexplorer.com/player/novak-djokovic/"
    );
    
    // Create tomorrow's schedule URL for analysis
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.getDate().toString().padStart(2, '0');
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const year = tomorrow.getFullYear().toString();
    
    const scheduleUrl = `https://www.tennisexplorer.com/matches/?type=atp-single&year=${year}&month=${month}&day=${day}`;
    
    // Analyze schedule page selectors
    console.log("📅 Analyzing schedule page selectors...");
    const scheduleSelectors = await analyzeSchedulePageSelectors(scheduleUrl);
    
    return Response.json({
      success: true,
      analysis: {
        playerPage: {
          url: "https://www.tennisexplorer.com/player/novak-djokovic/",
          selectors: playerSelectors
        },
        schedulePage: {
          url: scheduleUrl,
          selectors: scheduleSelectors
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Selector analysis failed:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function loader() {
  return Response.json({ 
    message: "POST to this endpoint to analyze current site selectors" 
  });
}