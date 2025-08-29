import { Cluster } from "puppeteer-cluster";
import puppeteer from "puppeteer";

type ScrapingTask<T = any> = {
  url: string;
  parser: (page: any, data: any) => Promise<T>;
  data?: any;
};

export class ScrapingClient {
  private cluster?: Cluster;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized && this.cluster) {
      return;
    }

    try {
      console.log("🔧 Initializing scraping cluster...");
      
      const isProduction = process.env.NODE_ENV === "production";
      
      this.cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: isProduction ? 5 : 10, // Reduce concurrency in production
        timeout: 30000, // 30 second timeout
        puppeteerOptions: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-extensions",
            "--disable-background-timer-throttling",
            "--disable-renderer-backgrounding",
            "--disable-backgrounding-occluded-windows",
          ],
          ...(isProduction && {
            executablePath: "/usr/bin/chromium-browser", // Adjust based on your deployment
          }),
        },
        monitor: false, // Disable monitoring in production
      });

      await this.cluster.task(async ({ page, data }) => {
        const { url, parser, taskData } = data as ScrapingTask & { taskData?: any };
        
        try {
          console.log(`🔍 Scraping: ${url}`);
          
          // Add anti-detection headers and user agent
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          });
          
          // Try with more lenient wait conditions and longer timeout
          await page.goto(url, { 
            waitUntil: 'domcontentloaded', // Less strict than networkidle2
            timeout: 45000 // Increase timeout to 45 seconds
          });
          
          // Wait for dynamic content to load
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Run the parser
          const result = await parser(page, taskData);
          
          return result;
        } catch (error) {
          console.error(`❌ Failed to scrape ${url}:`, error);
          
          // Debug information
          try {
            const title = await page.title();
            const currentUrl = page.url();
            console.log(`📄 Page title: "${title}"`);
            console.log(`🔗 Final URL: ${currentUrl}`);
            
            if (title.toLowerCase().includes('cloudflare') || title.toLowerCase().includes('just a moment')) {
              console.log('⚠️  Detected Cloudflare protection');
            }
            if (currentUrl !== url) {
              console.log('⚠️  URL redirect detected');
            }
            
            // Take screenshot for debugging (optional)
            // await page.screenshot({ path: `debug-${Date.now()}.png`, fullPage: false });
            
          } catch (debugError) {
            console.log('⚠️  Could not get page debug info');
          }
          
          return null;
        }
      });

      this.isInitialized = true;
      console.log("✅ Scraping cluster initialized");
      
    } catch (error) {
      console.error("💥 Failed to initialize scraping cluster:", error);
      throw new Error(`Scraping client initialization failed: ${error}`);
    }
  }

  async scrapeUrl<T>(url: string, parser: (page: any, data?: any) => Promise<T>, data?: any): Promise<T | null> {
    if (!this.cluster) {
      await this.initialize();
    }

    try {
      const result = await this.cluster!.execute({
        url,
        parser,
        taskData: data,
      });

      return result;
    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error);
      return null;
    }
  }

  async scrapeUrls<T>(
    urls: string[], 
    parser: (page: any, data?: any) => Promise<T>, 
    data?: any
  ): Promise<(T | null)[]> {
    if (!this.cluster) {
      await this.initialize();
    }

    console.log(`📊 Scraping ${urls.length} URLs in parallel...`);

    const tasks = urls.map(url => 
      this.scrapeUrl(url, parser, data)
    );

    const results = await Promise.all(tasks);
    
    const successful = results.filter(result => result !== null).length;
    console.log(`✅ Completed ${successful}/${urls.length} scraping tasks`);
    
    return results;
  }

  async close(): Promise<void> {
    if (this.cluster && this.isInitialized) {
      console.log("🔒 Closing scraping cluster...");
      await this.cluster.idle();
      await this.cluster.close();
      this.isInitialized = false;
      console.log("✅ Scraping cluster closed");
    }
  }

  // Utility method for common page operations
  async waitForSelector(page: any, selector: string, timeout = 5000): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Utility method for safe text extraction
  async extractText(page: any, selector: string): Promise<string | null> {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.evaluate((el: Element) => el.textContent?.trim());
        return text || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Utility method for extracting multiple elements
  async extractMultipleTexts(page: any, selector: string): Promise<string[]> {
    try {
      const elements = await page.$$(selector);
      const texts: string[] = [];
      
      for (const element of elements) {
        const text = await element.evaluate((el: Element) => el.textContent?.trim());
        if (text) {
          texts.push(text);
        }
      }
      
      return texts;
    } catch (error) {
      return [];
    }
  }

  // Utility method for extracting attributes
  async extractAttribute(page: any, selector: string, attribute: string): Promise<string | null> {
    try {
      const element = await page.$(selector);
      if (element) {
        const attr = await element.evaluate((el: Element, attr: string) => 
          el.getAttribute(attr), attribute);
        return attr;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}