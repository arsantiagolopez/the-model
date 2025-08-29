import type { ScrapingClient } from "../scraping-client";
import type { Player, NewPlayerStats } from "~/lib/db/schema";

interface Logger {
  addLog(message: string): void;
}

export class StatsScraper {
  private client: ScrapingClient;
  private baseUrl = "https://www.flashscore.com";

  constructor(client: ScrapingClient, private logger?: Logger) {
    this.client = client;
  }

  async generatePlayerStats(players: Player[]): Promise<NewPlayerStats[]> {
    const generatingMessage = `📊 Generating statistics for ${players.length} players...`;
    console.log(generatingMessage);
    this.logger?.addLog(generatingMessage);

    const playerStatsLinks = players.map(player => 
      `${this.baseUrl}/player/${player.playerId}/stats`
    );

    const results = await this.client.scrapeUrls(
      playerStatsLinks,
      this.parsePlayerStatsPage.bind(this)
    );

    const playerStats: NewPlayerStats[] = [];

    results.forEach((result, index) => {
      if (result) {
        const player = players[index];
        
        playerStats.push({
          playerId: player.playerId,
          player: player.name,
          eloRanking: result.eloRanking,
          yEloRanking: result.yEloRanking,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });

    const generatedMessage = `✅ Generated stats for ${playerStats.length} players`;
    console.log(generatedMessage);
    this.logger?.addLog(generatedMessage);
    return playerStats;
  }

  private async parsePlayerStatsPage(page: any): Promise<{
    eloRanking: any;
    yEloRanking: any;
  } | null> {
    try {
      // Wait for stats page to load
      const hasContent = await this.client.waitForSelector(page, ".player-stats", 10000);
      if (!hasContent) {
        console.warn("⚠️ Player stats not found");
        return null;
      }

      // Extract ELO rankings
      const eloRanking = await this.extractEloRanking(page);
      const yEloRanking = await this.extractYearlyEloRanking(page);

      return {
        eloRanking,
        yEloRanking,
      };

    } catch (error) {
      console.error("❌ Error parsing player stats page:", error);
      return null;
    }
  }

  private async extractEloRanking(page: any): Promise<any | null> {
    try {
      const eloSection = await page.$(".elo-rating-section");
      if (!eloSection) {
        return null;
      }

      const eloData = await eloSection.evaluate((section: Element) => {
        const currentRating = section.querySelector(".current-elo")?.textContent?.trim();
        const peakRating = section.querySelector(".peak-elo")?.textContent?.trim();
        const rankPosition = section.querySelector(".elo-rank")?.textContent?.trim();
        
        const surfaceElos: any = {};
        const surfaceElements = section.querySelectorAll(".surface-elo");
        
        surfaceElements.forEach((el: Element) => {
          const surface = el.querySelector(".surface-name")?.textContent?.trim()?.toLowerCase();
          const rating = el.querySelector(".surface-rating")?.textContent?.trim();
          
          if (surface && rating) {
            surfaceElos[surface] = parseInt(rating);
          }
        });

        return {
          current: currentRating ? parseInt(currentRating) : null,
          peak: peakRating ? parseInt(peakRating) : null,
          rank: rankPosition ? parseInt(rankPosition.replace(/\D/g, "")) : null,
          surfaces: surfaceElos,
        };
      });

      return eloData;

    } catch (error) {
      console.error("❌ Error extracting ELO ranking:", error);
      return null;
    }
  }

  private async extractYearlyEloRanking(page: any): Promise<any | null> {
    try {
      const yearlyEloSection = await page.$(".yearly-elo-section");
      if (!yearlyEloSection) {
        return null;
      }

      const yearlyEloData = await yearlyEloSection.evaluate((section: Element) => {
        const yearlyData: any = {};
        const yearElements = section.querySelectorAll(".year-elo");
        
        yearElements.forEach((el: Element) => {
          const year = el.querySelector(".year")?.textContent?.trim();
          const rating = el.querySelector(".year-rating")?.textContent?.trim();
          const rank = el.querySelector(".year-rank")?.textContent?.trim();
          
          if (year && rating) {
            yearlyData[year] = {
              rating: parseInt(rating),
              rank: rank ? parseInt(rank.replace(/\D/g, "")) : null,
            };
          }
        });

        return yearlyData;
      });

      return yearlyEloData;

    } catch (error) {
      console.error("❌ Error extracting yearly ELO ranking:", error);
      return null;
    }
  }

  // Additional methods for generating cached stats that were in the original system
  async generateCountryStats(players: Player[]): Promise<any[]> {
    const countryStats: any[] = [];
    const countryGroups = new Map<string, Player[]>();

    // Group players by country
    players.forEach(player => {
      const country = player.country || "Unknown";
      if (!countryGroups.has(country)) {
        countryGroups.set(country, []);
      }
      countryGroups.get(country)!.push(player);
    });

    // Generate stats for each country
    countryGroups.forEach((countryPlayers, country) => {
      const topPlayer = countryPlayers
        .filter(p => p.singlesRank > 0)
        .sort((a, b) => a.singlesRank - b.singlesRank)[0];

      if (topPlayer) {
        countryStats.push({
          country,
          topPlayer: topPlayer.name,
          topPlayerRank: topPlayer.singlesRank,
          totalPlayers: countryPlayers.length,
          averageRank: countryPlayers
            .filter(p => p.singlesRank > 0)
            .reduce((sum, p) => sum + p.singlesRank, 0) / 
            countryPlayers.filter(p => p.singlesRank > 0).length
        });
      }
    });

    return countryStats.sort((a, b) => a.topPlayerRank - b.topPlayerRank);
  }

  async generateFormStats(players: Player[]): Promise<any[]> {
    return players
      .filter(player => player.form !== null && player.form !== undefined)
      .sort((a, b) => (b.form || 0) - (a.form || 0))
      .slice(0, 20) // Top 20 in form
      .map(player => ({
        playerId: player.playerId,
        name: player.name,
        form: player.form,
        country: player.country,
        ranking: player.singlesRank,
      }));
  }

  async generateStreakStats(players: Player[]): Promise<any[]> {
    return players
      .filter(player => player.streak !== null && player.streak !== undefined)
      .sort((a, b) => Math.abs(b.streak || 0) - Math.abs(a.streak || 0))
      .slice(0, 20) // Top 20 streaks (positive or negative)
      .map(player => ({
        playerId: player.playerId,
        name: player.name,
        streak: player.streak,
        country: player.country,
        ranking: player.singlesRank,
      }));
  }
}