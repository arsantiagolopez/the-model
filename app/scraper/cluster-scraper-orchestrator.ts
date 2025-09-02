import { PuppeteerClusterScraper } from "./cluster-scraper";
import { TennisDataParsersCluster } from "./tennis-parsers-cluster";
import type { MatchData, PlayerProfile } from "./types";
import type { Page } from "puppeteer";
import * as fs from "fs/promises";

export class ClusterScraperOrchestrator {
  private clusterScraper: PuppeteerClusterScraper;

  constructor() {
    // High-performance cluster settings with stealth
    this.clusterScraper = new PuppeteerClusterScraper({
      // maxConcurrency: 25,    // High concurrency
      maxConcurrency: 50, // Max concurrency
      timeout: 15000, // Quick timeout
      retryLimit: 1, // Minimal retries for speed
      monitor: true, // Keep monitoring for debugging
      logLevel: "info",
      // Stealth configuration
      enableStealth: true,
      minDelay: 50, // 50ms min delay per worker
      maxDelay: 150, // 150ms max delay per worker
      // requestsPerMinute: 1500  // Optional rate limiting if needed
    });
  }

  async testBatch(
    matchCount: number,
    tournamentCount: number
  ): Promise<{
    matches: MatchData[];
    players: PlayerProfile[];
    tournaments: any[];
  }> {
    console.log(
      `🚀 Starting cluster batch: ${matchCount} matches from ${tournamentCount} tournaments...`
    );

    await this.clusterScraper.initialize();

    try {
      const allMatches: MatchData[] = [];
      const allPlayers: PlayerProfile[] = [];
      const allTournaments: any[] = [];

      const baseUrl = "https://www.tennisexplorer.com";
      const urlPatterns = TennisDataParsersCluster.getURLPatterns();

      // Get matches from today, tomorrow, and yesterday
      const dates = this.getDateRange();
      const matchTasks = dates.map((date) => ({
        url: urlPatterns.dailyMatches(date.year, date.month, date.day),
        parser: (page: Page) =>
          TennisDataParsersCluster.parseDailyMatches(page),
        metadata: {
          type: "matches",
          date: `${date.year}-${date.month}-${date.day}`,
        },
      }));

      console.log(
        `📊 Scraping matches from ${dates.length} dates in parallel...`
      );

      // PARALLEL MATCH SCRAPING - This is the speed magic!
      const matchResults = await this.clusterScraper.scrapeUrls(matchTasks);

      // Process successful match results
      let processedMatches = 0;
      const tournamentGroups = new Map<string, MatchData[]>();

      for (const result of matchResults) {
        if (result.success && result.data) {
          const dailyMatches = result.data as MatchData[];

          for (const match of dailyMatches) {
            if (processedMatches >= matchCount) break;

            const tournamentKey =
              match.tournament?.name || "Unknown Tournament";
            if (!tournamentGroups.has(tournamentKey)) {
              tournamentGroups.set(tournamentKey, []);
            }
            tournamentGroups.get(tournamentKey)!.push(match);
            allMatches.push(match);
            processedMatches++;
          }

          if (processedMatches >= matchCount) break;
        }
      }

      console.log(
        `✅ Got ${allMatches.length} matches, now scraping ALL players in parallel...`
      );

      // PARALLEL PLAYER SCRAPING - Here's where we get MASSIVE speed gains!
      const uniquePlayerUrls = new Set<string>();
      for (const match of allMatches) {
        if (match.player1?.url) uniquePlayerUrls.add(match.player1.url);
        if (match.player2?.url) uniquePlayerUrls.add(match.player2.url);
      }

      console.log(
        `👥 Found ${uniquePlayerUrls.size} unique players to scrape in parallel...`
      );

      // Create player scraping tasks - ALL AT ONCE!
      const playerTasks = Array.from(uniquePlayerUrls).map((playerUrl) => ({
        url: playerUrl.startsWith("http")
          ? playerUrl
          : `${baseUrl}${playerUrl}`,
        parser: (page: Page) =>
          TennisDataParsersCluster.parsePlayerProfile(page),
        metadata: { type: "player", url: playerUrl },
      }));

      // SCRAPE ALL PLAYERS IN PARALLEL - This is the game changer!
      const playerResults = await this.clusterScraper.scrapeUrls(playerTasks);

      // Process player results
      for (const result of playerResults) {
        if (result.success && result.data) {
          const playerProfile = result.data as PlayerProfile;
          const playerUrl = result.metadata?.url || result.url;

          allPlayers.push({
            ...playerProfile,
            url: playerUrl,
            name: playerProfile.name || "Unknown Player",
          } as PlayerProfile);
        }
      }

      // Create tournament summaries
      let tournamentCounter = 0;
      for (const [tournamentName, matches] of tournamentGroups) {
        if (tournamentCounter >= tournamentCount) break;

        allTournaments.push({
          name: tournamentName,
          matches: matches,
          category: matches[0]?.tournament?.category || "Unknown",
          matchCount: matches.length,
        });

        tournamentCounter++;
      }

      console.log(`🎯 Cluster scraping completed!`);
      console.log(`   Matches: ${allMatches.length}/${matchCount}`);
      console.log(
        `   Tournaments: ${allTournaments.length}/${tournamentCount}`
      );
      console.log(`   Players: ${allPlayers.length}/${uniquePlayerUrls.size}`);

      return {
        matches: allMatches,
        players: allPlayers,
        tournaments: allTournaments,
      };
    } finally {
      await this.clusterScraper.shutdown();
    }
  }

  async testSingleMatch(): Promise<{
    match: MatchData | null;
    player1: PlayerProfile | null;
    player2: PlayerProfile | null;
  }> {
    console.log("🧪 Starting single match test...");

    await this.clusterScraper.initialize();

    try {
      const urlPatterns = TennisDataParsersCluster.getURLPatterns();
      const today = new Date();
      const matchesUrl = urlPatterns.dailyMatches(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );

      // Get matches
      const matchResult = await this.clusterScraper.scrapeUrl(
        matchesUrl,
        (page: Page) => TennisDataParsersCluster.parseDailyMatches(page)
      );

      if (
        !matchResult.success ||
        !matchResult.data ||
        matchResult.data.length === 0
      ) {
        return { match: null, player1: null, player2: null };
      }

      const testMatch = matchResult.data.find((m) => m.matchDetailUrl);
      if (!testMatch) {
        return { match: null, player1: null, player2: null };
      }

      console.log(
        `🎾 Selected match: ${testMatch.player1.name} vs ${testMatch.player2.name}`
      );

      // Scrape both players in parallel
      const baseUrl = "https://www.tennisexplorer.com";
      const playerTasks = [
        {
          url: testMatch.player1.url.startsWith("http")
            ? testMatch.player1.url
            : `${baseUrl}${testMatch.player1.url}`,
          parser: (page: Page) =>
            TennisDataParsersCluster.parsePlayerProfile(page),
          metadata: { playerNum: 1 },
        },
        {
          url: testMatch.player2.url.startsWith("http")
            ? testMatch.player2.url
            : `${baseUrl}${testMatch.player2.url}`,
          parser: (page: Page) =>
            TennisDataParsersCluster.parsePlayerProfile(page),
          metadata: { playerNum: 2 },
        },
      ];

      const playerResults = await this.clusterScraper.scrapeUrls(playerTasks);

      const player1 =
        (playerResults.find((r) => r.metadata?.playerNum === 1)
          ?.data as PlayerProfile) || null;
      const player2 =
        (playerResults.find((r) => r.metadata?.playerNum === 2)
          ?.data as PlayerProfile) || null;

      return {
        match: testMatch,
        player1: player1
          ? {
              ...player1,
              url: testMatch.player1.url,
              name: player1.name || testMatch.player1.name,
            }
          : null,
        player2: player2
          ? {
              ...player2,
              url: testMatch.player2.url,
              name: player2.name || testMatch.player2.name,
            }
          : null,
      };
    } finally {
      await this.clusterScraper.shutdown();
    }
  }

  private getDateRange() {
    const dates = [];
    const today = new Date();

    // Today
    dates.push({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    });

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dates.push({
      year: tomorrow.getFullYear(),
      month: tomorrow.getMonth() + 1,
      day: tomorrow.getDate(),
    });

    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    dates.push({
      year: yesterday.getFullYear(),
      month: yesterday.getMonth() + 1,
      day: yesterday.getDate(),
    });

    return dates;
  }

  async saveBatchResults(
    results: any,
    matchCount: number,
    tournamentCount: number
  ): Promise<string> {
    await fs.mkdir("./test-data", { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `./test-data/cluster-${matchCount}x${tournamentCount}-${timestamp}.json`;

    const batchTestData = {
      timestamp: new Date().toISOString(),
      testType: "cluster-validation",
      parameters: {
        requestedMatches: matchCount,
        requestedTournaments: tournamentCount,
        actualMatches: results.matches.length,
        actualTournaments: results.tournaments.length,
        actualPlayers: results.players.length,
      },
      data: {
        matches: results.matches,
        players: results.players,
        tournaments: results.tournaments,
      },
      validation: {
        matchesWithBothPlayers: results.matches.filter(
          (m: any) => m.player1 && m.player2
        ).length,
        playersWithImages: results.players.filter(
          (p: any) => p.imageUrl && !p.imageUrl.includes("default-avatar")
        ).length,
        playersWithDefaultImages: results.players.filter(
          (p: any) => p.imageUrl && p.imageUrl.includes("default-avatar")
        ).length,
        playersWithoutImages: results.players.filter((p: any) => !p.imageUrl)
          .length,
        tournamentsWithMatches: results.tournaments.filter(
          (t: any) => t.matches && t.matches.length > 0
        ).length,
      },
      performance: this.clusterScraper.getStats(),
    };

    await fs.writeFile(filename, JSON.stringify(batchTestData, null, 2));

    console.log(`💾 Cluster results saved to: ${filename}`);
    console.log(`   📊 Matches: ${results.matches.length}`);
    console.log(
      `   👥 Players: ${results.players.length} (${batchTestData.validation.playersWithImages} with real images)`
    );
    console.log(`   🏆 Tournaments: ${results.tournaments.length}`);

    return filename;
  }
}
