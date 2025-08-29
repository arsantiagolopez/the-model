import { ScrapingClient } from "./scraping-client";

export interface PlayerPageSelectors {
  name: string[];
  country: string[];
  age: string[];
  ranking: string[];
  image: string[];
  stats: string[];
  birthday: string[];
  hand: string[];
}

export interface SchedulePageSelectors {
  matches: string[];
  tournaments: string[];
  players: string[];
  dates: string[];
  odds: string[];
  rounds: string[];
}

export async function analyzePlayerPageSelectors(playerUrl: string): Promise<PlayerPageSelectors> {
  const client = new ScrapingClient();
  
  try {
    console.log(`🔍 Analyzing player page selectors: ${playerUrl}`);
    
    const result = await client.scrapeUrl(
      playerUrl,
      async (page: any) => {
        const selectors = await page.evaluate(() => {
          const findSelectorsContaining = (text: string[]) => {
            const elements: string[] = [];
            
            // Check all text nodes and their parent elements
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let textNode;
            while (textNode = walker.nextNode()) {
              const content = textNode.textContent?.toLowerCase() || '';
              if (text.some(t => content.includes(t.toLowerCase()))) {
                const parent = textNode.parentElement;
                if (parent) {
                  // Get various selector options for this element
                  const selectors = [];
                  if (parent.id) selectors.push(`#${parent.id}`);
                  if (parent.className) {
                    parent.className.split(' ').forEach(cls => {
                      if (cls.trim()) selectors.push(`.${cls.trim()}`);
                    });
                  }
                  selectors.push(parent.tagName.toLowerCase());
                  elements.push(...selectors);
                }
              }
            }
            
            return [...new Set(elements)];
          };
          
          // Look for elements that might contain player data
          const getElementsWithText = (searchTexts: string[]) => {
            const selectors = new Set<string>();
            
            searchTexts.forEach(searchText => {
              // Find elements containing this text
              const xpath = `//text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${searchText.toLowerCase()}')]/parent::*`;
              const result = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
              
              for (let i = 0; i < result.snapshotLength; i++) {
                const element = result.snapshotItem(i) as Element;
                if (element) {
                  if (element.id) selectors.add(`#${element.id}`);
                  if (element.className) {
                    element.className.split(' ').forEach(cls => {
                      if (cls.trim()) selectors.add(`.${cls.trim()}`);
                    });
                  }
                  selectors.add(element.tagName.toLowerCase());
                  
                  // Also check parent element
                  const parent = element.parentElement;
                  if (parent && parent.className) {
                    parent.className.split(' ').forEach(cls => {
                      if (cls.trim()) selectors.add(`.${cls.trim()}`);
                    });
                  }
                }
              }
            });
            
            return Array.from(selectors);
          };
          
          return {
            name: getElementsWithText(['djokovic', 'novak', 'player name']),
            country: getElementsWithText(['serbia', 'country', 'nation', 'flag']),
            age: getElementsWithText(['age', 'born', 'years old']),
            ranking: getElementsWithText(['rank', 'ranking', 'atp', '#']),
            image: Array.from(document.querySelectorAll('img')).map(img => {
              const selectors = [];
              if (img.id) selectors.push(`#${img.id}`);
              if (img.className) {
                img.className.split(' ').forEach(cls => {
                  if (cls.trim()) selectors.push(`.${cls.trim()}`);
                });
              }
              return selectors;
            }).flat(),
            stats: getElementsWithText(['wins', 'losses', 'titles', 'prize money', 'statistics']),
            birthday: getElementsWithText(['birthday', 'born', 'birth', '1987']),
            hand: getElementsWithText(['right', 'left', 'handed', 'hand']),
          };
        });
        
        return selectors;
      }
    );
    
    console.log("🎯 Player page selector analysis complete");
    return result || {
      name: [],
      country: [],
      age: [],
      ranking: [],
      image: [],
      stats: [],
      birthday: [],
      hand: []
    };
    
  } finally {
    await client.close();
  }
}

export async function analyzeSchedulePageSelectors(scheduleUrl: string): Promise<SchedulePageSelectors> {
  const client = new ScrapingClient();
  
  try {
    console.log(`🔍 Analyzing schedule page selectors: ${scheduleUrl}`);
    
    const result = await client.scrapeUrl(
      scheduleUrl,
      async (page: any) => {
        const selectors = await page.evaluate(() => {
          const getRepeatingPatterns = () => {
            // Find elements that appear multiple times (likely match containers)
            const elementCounts: { [key: string]: number } = {};
            const classPattern: { [key: string]: Element[] } = {};
            
            document.querySelectorAll('*').forEach(el => {
              if (el.className) {
                const classes = el.className.split(' ').filter(c => c.trim());
                classes.forEach(className => {
                  if (!classPattern[className]) classPattern[className] = [];
                  classPattern[className].push(el);
                  elementCounts[className] = (elementCounts[className] || 0) + 1;
                });
              }
            });
            
            // Find classes that appear multiple times (likely match/player containers)
            const repeatingClasses = Object.keys(elementCounts)
              .filter(className => elementCounts[className] >= 3 && elementCounts[className] <= 20)
              .sort((a, b) => elementCounts[b] - elementCounts[a]);
            
            return {
              matches: repeatingClasses.filter(cls => 
                cls.toLowerCase().includes('match') || 
                cls.toLowerCase().includes('game') ||
                cls.toLowerCase().includes('fixture') ||
                cls.toLowerCase().includes('row')
              ).map(cls => `.${cls}`),
              tournaments: repeatingClasses.filter(cls => 
                cls.toLowerCase().includes('tournament') || 
                cls.toLowerCase().includes('event') ||
                cls.toLowerCase().includes('competition')
              ).map(cls => `.${cls}`),
              players: repeatingClasses.filter(cls => 
                cls.toLowerCase().includes('player') || 
                cls.toLowerCase().includes('participant') ||
                cls.toLowerCase().includes('name')
              ).map(cls => `.${cls}`),
              dates: Array.from(document.querySelectorAll('*')).filter(el => {
                const text = el.textContent || '';
                return text.match(/\d{1,2}:\d{2}/) || text.match(/\d{1,2}\/\d{1,2}/) || text.includes('2025');
              }).map(el => {
                const selectors = [];
                if (el.id) selectors.push(`#${el.id}`);
                if (el.className) {
                  el.className.split(' ').forEach(cls => {
                    if (cls.trim()) selectors.push(`.${cls.trim()}`);
                  });
                }
                return selectors;
              }).flat(),
              odds: Array.from(document.querySelectorAll('*')).filter(el => {
                const text = el.textContent || '';
                return text.match(/\d+\.\d{2}/) || text.match(/\d+\/\d+/);
              }).map(el => {
                const selectors = [];
                if (el.className) {
                  el.className.split(' ').forEach(cls => {
                    if (cls.trim()) selectors.push(`.${cls.trim()}`);
                  });
                }
                return selectors;
              }).flat(),
              rounds: Array.from(document.querySelectorAll('*')).filter(el => {
                const text = (el.textContent || '').toLowerCase();
                return text.includes('final') || text.includes('semi') || text.includes('quarter') || 
                       text.includes('round') || text.includes('r1') || text.includes('r2');
              }).map(el => {
                const selectors = [];
                if (el.className) {
                  el.className.split(' ').forEach(cls => {
                    if (cls.trim()) selectors.push(`.${cls.trim()}`);
                  });
                }
                return selectors;
              }).flat()
            };
          };
          
          return getRepeatingPatterns();
        });
        
        return selectors;
      }
    );
    
    console.log("🎯 Schedule page selector analysis complete");
    return result || {
      matches: [],
      tournaments: [],
      players: [],
      dates: [],
      odds: [],
      rounds: []
    };
    
  } finally {
    await client.close();
  }
}