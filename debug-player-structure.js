const puppeteer = require('puppeteer');

async function debugPlayerStructure() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Go to a known player page
    await page.goto('https://www.tennisexplorer.com/player/bucsa/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('\n=== PLAYER PROFILE STRUCTURE DEBUG ===\n');
    
    // Check legacy selectors
    const structures = await page.evaluate(() => {
      const results = {};
      
      // Basic profile structure
      results.plDetail = !!document.querySelector('.plDetail');
      results.plDetailTds = document.querySelectorAll('.plDetail td').length;
      results.photo = !!document.querySelector('.photo > .img > img');
      
      // Table structures
      results.resultBalanceTables = document.querySelectorAll("table[class*='result balance']").length;
      results.allTables = document.querySelectorAll('table').length;
      results.tableClasses = Array.from(document.querySelectorAll('table')).map(t => t.className);
      
      // Row structures
      results.trWithId = document.querySelectorAll("tr[id*='row']").length;
      results.allRows = document.querySelectorAll('tr').length;
      
      // Match sections
      results.matchDivs = document.querySelectorAll("div[id*='matches']").length;
      results.allDivsWithId = Array.from(document.querySelectorAll("div[id]")).map(d => d.id);
      
      // Sample table content
      const firstTable = document.querySelector('table');
      if (firstTable) {
        results.firstTableHTML = firstTable.outerHTML.substring(0, 500) + '...';
      }
      
      // Profile detail content
      const plDetail = document.querySelector('.plDetail');
      if (plDetail) {
        results.plDetailHTML = plDetail.outerHTML.substring(0, 800) + '...';
      }
      
      return results;
    });
    
    console.log('STRUCTURE ANALYSIS:');
    console.log(JSON.stringify(structures, null, 2));
    
    // Take a screenshot for manual inspection
    await page.screenshot({ path: '/Users/alexandersantiago/Documents/apps/webapps/rest/the-model/player-structure-debug.png', fullPage: true });
    console.log('\nScreenshot saved to player-structure-debug.png');
    
  } catch (error) {
    console.error('Error debugging structure:', error);
  } finally {
    await browser.close();
  }
}

debugPlayerStructure();