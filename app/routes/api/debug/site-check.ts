import type { ActionFunctionArgs } from "react-router";
import { checkTennisExplorerSite, checkSchedulePage } from "~/lib/scraping/site-checker";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    console.log("🔍 Starting site structure check...");
    
    // Check player page structure
    console.log("👤 Checking player page...");
    const playerResult = await checkTennisExplorerSite();
    
    // Check schedule page structure  
    console.log("📅 Checking schedule page...");
    const scheduleResult = await checkSchedulePage();
    
    return Response.json({
      success: true,
      results: {
        playerPage: playerResult,
        schedulePage: scheduleResult,
      }
    });
    
  } catch (error) {
    console.error("❌ Site check failed:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function loader() {
  return Response.json({ 
    message: "POST to this endpoint to run site structure check" 
  });
}