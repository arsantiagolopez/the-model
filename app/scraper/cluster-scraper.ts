import { Cluster } from 'puppeteer-cluster';
import type { Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import winston from 'winston';

// Stealth configurations to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
];

const LANGUAGES = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9',
  'en-US,en;q=0.9,es;q=0.8',
  'en-US,en;q=0.9,fr;q=0.8',
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface ClusterConfig {
  maxConcurrency: number;
  timeout: number;
  retryLimit: number;
  monitor: boolean;
  logLevel: 'info' | 'debug' | 'warn' | 'error';
  logDirectory: string;
  // Stealth options
  enableStealth: boolean;
  minDelay: number;      // Minimum delay between requests (ms)
  maxDelay: number;      // Maximum delay between requests (ms)
  requestsPerMinute?: number; // Optional rate limiting
}

interface ScrapingTask<T> {
  url: string;
  parser: (page: Page) => Promise<T>;
  metadata?: Record<string, any>;
}

interface ScrapingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  url: string;
  duration: number;
  retryCount: number;
  metadata?: Record<string, any>;
}

export class PuppeteerClusterScraper {
  private cluster?: Cluster;
  private config: ClusterConfig;
  private logger: winston.Logger;
  private stats = {
    total: 0,
    success: 0,
    failed: 0,
    startTime: 0,
  };

  constructor(config: Partial<ClusterConfig> = {}) {
    this.config = {
      maxConcurrency: 10, // Much higher than your legacy (was 10)
      timeout: 30000,     // More generous than legacy (was 8000)
      retryLimit: 2,
      monitor: true,
      logLevel: 'info',
      logDirectory: './data/logs',
      // Stealth defaults
      enableStealth: true,
      minDelay: 50,       // 50ms minimum delay
      maxDelay: 200,      // 200ms maximum delay
      ...config
    };

    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    return winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: path.join(this.config.logDirectory, 'cluster-scraper.log') 
        })
      ]
    });
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.config.logDirectory, { recursive: true });

    this.cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE, // Same as your legacy
      maxConcurrency: this.config.maxConcurrency,
      timeout: this.config.timeout,
      retryLimit: this.config.retryLimit,
      monitor: this.config.monitor,
      
      puppeteerOptions: {
        headless: true,
        args: [
          // Performance args
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          
          // Stealth args to avoid detection
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-extensions',
          '--disable-features=TranslateUI',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--disable-web-security',
          '--hide-scrollbars',
          '--ignore-gpu-blacklist',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-experiments',
          '--no-pings',
          '--no-crash-upload',
          '--disable-dev-profile',
        ],
        defaultViewport: null // Will set dynamically per page
      }
    });

    this.cluster.on('taskerror', (err, data) => {
      this.logger.error(`Task failed for URL: ${data}`, { error: err.message });
    });

    this.logger.info('Puppeteer Cluster initialized', {
      maxConcurrency: this.config.maxConcurrency,
      timeout: this.config.timeout
    });
  }

  private async setupStealthPage(page: Page): Promise<void> {
    // Randomize viewport for each page
    const viewport = randomChoice(VIEWPORTS);
    await page.setViewport(viewport);

    // Randomize user agent for each page
    const userAgent = randomChoice(USER_AGENTS);
    await page.setUserAgent(userAgent);

    // Set realistic browser headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': randomChoice(LANGUAGES),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    });

    // Override webdriver detection
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      delete (window.navigator as any).webdriver;
      
      // Override the plugins property to mimic a real browser
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override the languages property
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override the permissions query
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Mock chrome runtime for detection scripts
      if (!window.chrome) {
        (window as any).chrome = {
          runtime: {}
        };
      }
    });
  }

  async scrapeUrls<T>(tasks: ScrapingTask<T>[]): Promise<ScrapingResult<T>[]> {
    if (!this.cluster) {
      throw new Error('Cluster not initialized. Call initialize() first.');
    }

    const results: ScrapingResult<T>[] = [];
    this.stats = {
      total: tasks.length,
      success: 0,
      failed: 0,
      startTime: Date.now(),
    };

    this.logger.info(`Starting to scrape ${tasks.length} URLs with ${this.config.maxConcurrency} workers`);

    // Set up the cluster task handler
    await this.cluster.task(async ({ page, data: task }: { page: Page, data: ScrapingTask<T> }) => {
      const startTime = Date.now();
      let retryCount = 0;

      try {
        // Apply stealth techniques to this page if enabled
        if (this.config.enableStealth) {
          await this.setupStealthPage(page);
          
          // Random delay between requests to mimic human behavior
          const delay = randomDelay(this.config.minDelay, this.config.maxDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Navigate to the URL with optimized settings
        await page.goto(task.url, { 
          waitUntil: 'domcontentloaded', // Faster than 'networkidle2'
          timeout: this.config.timeout 
        });

        // Execute the parser
        const data = await task.parser(page);
        const duration = Date.now() - startTime;

        const result: ScrapingResult<T> = {
          success: true,
          data,
          url: task.url,
          duration,
          retryCount,
          metadata: task.metadata
        };

        results.push(result);
        this.stats.success++;

        // Log progress every 10 successful requests
        if (this.stats.success % 10 === 0) {
          const progress = Math.round((results.length / this.stats.total) * 100);
          const elapsed = (Date.now() - this.stats.startTime) / 1000;
          const rate = results.length / elapsed;
          
          console.log(`   Progress: ${results.length}/${this.stats.total} (${progress}%) - ${rate.toFixed(1)} req/s`);
        }

        return result;

      } catch (error) {
        this.stats.failed++;
        const duration = Date.now() - startTime;
        
        const result: ScrapingResult<T> = {
          success: false,
          error: (error as Error).message,
          url: task.url,
          duration,
          retryCount,
          metadata: task.metadata
        };

        results.push(result);
        
        this.logger.warn(`Failed to scrape ${task.url}`, { 
          error: (error as Error).message,
          duration,
          retryCount 
        });

        return result;
      }
    });

    // Queue all tasks (this is the magic of puppeteer-cluster!)
    for (const task of tasks) {
      this.cluster.queue(task);
    }

    // Wait for all tasks to complete
    await this.cluster.idle();

    const totalDuration = Date.now() - this.stats.startTime;
    const avgRate = results.length / (totalDuration / 1000);

    this.logger.info('Scraping completed', {
      total: this.stats.total,
      success: this.stats.success,
      failed: this.stats.failed,
      duration: totalDuration,
      averageRate: avgRate.toFixed(2) + ' req/s'
    });

    return results;
  }

  async scrapeUrl<T>(url: string, parser: (page: Page) => Promise<T>): Promise<ScrapingResult<T>> {
    const results = await this.scrapeUrls([{ url, parser }]);
    return results[0];
  }

  async shutdown(): Promise<void> {
    if (this.cluster) {
      await this.cluster.close();
      this.cluster = undefined;
      this.logger.info('Puppeteer Cluster shutdown complete');
    }
  }

  getStats() {
    return {
      ...this.stats,
      isRunning: !!this.cluster,
      config: this.config
    };
  }
}