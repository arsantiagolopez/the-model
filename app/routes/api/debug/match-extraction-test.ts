import type { ActionFunctionArgs } from "react-router";
import { ScrapingClient } from "~/lib/scraping/scraping-client";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const client = new ScrapingClient();

  try {
    console.log("🧪 Testing match extraction logic...");

    // Create tomorrow's schedule URL  
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.getDate().toString().padStart(2, '0');
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const year = tomorrow.getFullYear().toString();
    
    const scheduleUrl = `https://www.tennisexplorer.com/matches/?type=atp-single&year=${year}&month=${month}&day=${day}`;
    
    const result = await client.scrapeUrl(
      scheduleUrl,
      async (page: any) => {
        console.log("🔍 Testing match extraction step by step...");
        
        const extractionTest = await page.evaluate(() => {
          const matchRows = document.querySelectorAll('.fRow');
          const debugInfo = [];
          
          for (let i = 0; i < Math.min(matchRows.length, 5); i++) { // Test first 5 rows
            const row = matchRows[i];
            const rowText = row.textContent?.trim() || '';
            const playerLinks = row.querySelectorAll('a[href*="/player/"]');
            
            debugInfo.push({
              rowIndex: i,
              rowText: rowText.substring(0, 300),
              playerLinkCount: playerLinks.length,
              playerLinks: Array.from(playerLinks).map(link => ({
                text: link.textContent?.trim(),
                href: link.getAttribute('href')
              })),
              hasTimePattern: /\d{1,2}:\d{2}/.test(rowText),
              timeMatch: rowText.match(/(\d{1,2}:\d{2})/),
              courseElements: row.querySelectorAll('.course').length,
              tournamentLinks: Array.from(row.querySelectorAll('a[href*="/tournament/"]')).map(link => ({
                text: link.textContent?.trim(),
                href: link.getAttribute('href')
              }))
            });
          }
          
          return {
            totalFRows: matchRows.length,
            debugInfo
          };
        });
        
        return extractionTest;
      }
    );
    
    console.log("🎯 Match extraction test complete");
    
    return Response.json({
      success: true,
      extractionTest: result
    });
    
  } catch (error) {
    console.error("❌ Match extraction test failed:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function loader() {
  return Response.json({ 
    message: "POST to this endpoint to test match extraction logic" 
  });
}