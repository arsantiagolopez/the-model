import type { ActionFunctionArgs } from "react-router";
import { ScrapingClient } from "~/lib/scraping/scraping-client";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const client = new ScrapingClient();

  try {
    console.log("🔍 Debug mode: Examining actual page content...");

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
        console.log("📋 Extracting detailed page structure...");
        
        const debug = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodyText: document.body.textContent?.substring(0, 1000) || '', // First 1000 chars
            allSelectors: {
              fRow: document.querySelectorAll('.fRow').length,
              game: document.querySelectorAll('.game').length,
              match: document.querySelectorAll('.match').length,
              fixture: document.querySelectorAll('.fixture').length,
              row: document.querySelectorAll('.row').length,
              tr: document.querySelectorAll('tr').length,
              table: document.querySelectorAll('table').length,
            },
            sampleHTML: document.querySelector('body')?.innerHTML?.substring(0, 2000) || '', // First 2000 chars of HTML
            links: Array.from(document.querySelectorAll('a[href*="player"]')).slice(0, 10).map(link => ({
              text: link.textContent?.trim(),
              href: link.getAttribute('href')
            })),
            divStructure: Array.from(document.querySelectorAll('div')).slice(0, 50).map(div => ({
              className: div.className,
              id: div.id,
              textContent: div.textContent?.trim()?.substring(0, 100) || ''
            })).filter(div => div.className || div.id || div.textContent)
          };
        });
        
        return debug;
      }
    );
    
    console.log("📊 Page debug analysis complete");
    
    return Response.json({
      success: true,
      debug: result
    });
    
  } catch (error) {
    console.error("❌ Page debug failed:", error);
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
    message: "POST to this endpoint to debug actual page content" 
  });
}