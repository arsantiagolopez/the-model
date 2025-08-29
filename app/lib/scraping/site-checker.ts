import { ScrapingClient } from "./scraping-client";

export async function checkTennisExplorerSite() {
  const client = new ScrapingClient();
  
  try {
    console.log("🔍 Checking TennisExplorer.com structure...");
    
    const result = await client.scrapeUrl(
      "https://www.tennisexplorer.com/player/novak-djokovic", 
      async (page: any) => {
        try {
          // Basic site accessibility check
          const title = await page.title();
          const url = page.url();
          
          console.log(`✅ Page loaded: ${title}`);
          console.log(`🔗 URL: ${url}`);
          
          // Check if we're blocked
          if (title.toLowerCase().includes('cloudflare') || 
              title.toLowerCase().includes('just a moment') ||
              title.toLowerCase().includes('access denied')) {
            return { blocked: true, title, url };
          }
          
          // Try to find basic page structure
          const bodyContent = await page.evaluate(() => {
            return {
              hasPlayerName: !!document.querySelector('h1, .player-name, .name'),
              hasPlayerStats: !!document.querySelector('.stats, .player-stats, .ranking'),
              hasCountry: !!document.querySelector('.country, .flag'),
              selectors: {
                allH1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()),
                allClasses: Array.from(new Set(Array.from(document.querySelectorAll('*')).map(el => el.className).filter(c => c))).slice(0, 20),
              }
            };
          });
          
          return { 
            blocked: false, 
            title, 
            url,
            structure: bodyContent
          };
          
        } catch (error) {
          console.error("Error checking page structure:", error);
          return { error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    );
    
    console.log("🔍 Site check result:", JSON.stringify(result, null, 2));
    return result;
    
  } finally {
    await client.close();
  }
}

export async function checkSchedulePage() {
  const client = new ScrapingClient();
  
  try {
    console.log("🔍 Checking TennisExplorer schedule page...");
    
    // Create tomorrow's schedule URL
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.getDate().toString().padStart(2, '0');
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const year = tomorrow.getFullYear().toString();
    
    const scheduleUrl = `https://www.tennisexplorer.com/matches/?type=atp-single&year=${year}&month=${month}&day=${day}`;
    console.log(`📅 Checking schedule URL: ${scheduleUrl}`);
    
    const result = await client.scrapeUrl(
      scheduleUrl, 
      async (page: any) => {
        try {
          const title = await page.title();
          console.log(`✅ Schedule page loaded: ${title}`);
          
          // Check for matches structure
          const scheduleStructure = await page.evaluate(() => {
            return {
              hasMatches: !!document.querySelector('.match, .fixture, .game'),
              hasTournaments: !!document.querySelector('.tournament, .event'),
              hasPlayers: !!document.querySelector('.player, .participant'),
              matchCount: document.querySelectorAll('.match, .fixture, .game').length,
              tournamentCount: document.querySelectorAll('.tournament, .event').length,
              sampleSelectors: Array.from(document.querySelectorAll('*')).map(el => el.className).filter(c => c && c.includes('match')).slice(0, 10),
            };
          });
          
          return { 
            title, 
            url: page.url(),
            structure: scheduleStructure
          };
          
        } catch (error) {
          console.error("Error checking schedule structure:", error);
          return { error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    );
    
    console.log("📅 Schedule check result:", JSON.stringify(result, null, 2));
    return result;
    
  } finally {
    await client.close();
  }
}