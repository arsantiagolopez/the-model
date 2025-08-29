import { db } from "~/lib/db";
import { matches, tournaments, players, playerStats } from "~/lib/db/schema";
import type { Match, Tournament, Player, PlayerStats } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { ScrapingClient } from "../scraping/scraping-client";
import { ScheduleScraper } from "../scraping/scrapers/schedule-scraper";
import { TournamentScraper } from "../scraping/scrapers/tournament-scraper";
import { MatchScraper } from "../scraping/scrapers/match-scraper";
import { PlayerScraper } from "../scraping/scrapers/player-scraper";
import { StatsScraper } from "../scraping/scrapers/stats-scraper";

type JobResult = {
  success: boolean;
  error?: string;
  stats?: {
    tournaments: number;
    matches: number;
    players: number;
    playerStats: number;
  };
};

type StepResult = {
  success: boolean;
  error?: string;
  data?: any;
};

export class ModelJobOrchestrator {
  private scrapingClient: ScrapingClient;
  private stats = {
    tournaments: 0,
    matches: 0,
    players: 0,
    playerStats: 0,
  };

  constructor() {
    this.scrapingClient = new ScrapingClient();
  }

  async runFullScrape(): Promise<JobResult> {
    try {
      console.log("🔄 Starting full scrape process...");

      // Step 1: Scrape Schedule (tournaments, matches, basic players)
      const scheduleResult = await this.scrapeSchedule();
      if (!scheduleResult.success) {
        return { success: false, error: `Schedule scrape failed: ${scheduleResult.error}` };
      }

      // Step 2: Enhance tournaments with detailed information
      const tournamentsResult = await this.enhanceTournaments();
      if (!tournamentsResult.success) {
        return { success: false, error: `Tournament enhancement failed: ${tournamentsResult.error}` };
      }

      // Step 3: Enhance matches with detailed information
      const matchesResult = await this.enhanceMatches();
      if (!matchesResult.success) {
        return { success: false, error: `Match enhancement failed: ${matchesResult.error}` };
      }

      // Step 4: Enhance players with detailed profiles
      const playersResult = await this.enhancePlayers();
      if (!playersResult.success) {
        return { success: false, error: `Player enhancement failed: ${playersResult.error}` };
      }

      // Step 5: Generate and store statistics
      const statsResult = await this.generateStats();
      if (!statsResult.success) {
        return { success: false, error: `Stats generation failed: ${statsResult.error}` };
      }

      await this.scrapingClient.close();

      return {
        success: true,
        stats: this.stats,
      };
    } catch (error) {
      await this.scrapingClient.close();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async scrapeSchedule(): Promise<StepResult> {
    try {
      console.log("📅 Scraping schedule...");
      
      const scraper = new ScheduleScraper(this.scrapingClient);
      const scheduleData = await scraper.scrapeSchedule();

      // Store tournaments
      if (scheduleData.tournaments.length > 0) {
        await db.insert(tournaments).values(scheduleData.tournaments);
        this.stats.tournaments += scheduleData.tournaments.length;
      }

      // Store matches
      if (scheduleData.matches.length > 0) {
        await db.insert(matches).values(scheduleData.matches);
        this.stats.matches += scheduleData.matches.length;
      }

      // Store basic players
      if (scheduleData.players.length > 0) {
        await db.insert(players).values(scheduleData.players);
        this.stats.players += scheduleData.players.length;
      }

      console.log(`✅ Schedule scraped: ${this.stats.tournaments} tournaments, ${this.stats.matches} matches, ${this.stats.players} players`);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Schedule scraping failed",
      };
    }
  }

  private async enhanceTournaments(): Promise<StepResult> {
    try {
      console.log("🏆 Enhancing tournaments...");
      
      const existingTournaments = await db.select().from(tournaments);
      const scraper = new TournamentScraper(this.scrapingClient);
      
      const enhancedData = await scraper.enhanceTournaments(existingTournaments);

      // Update tournaments with enhanced data
      for (const tournament of enhancedData.tournaments) {
        if (tournament.tournamentId) {
          await db
            .update(tournaments)
            .set(tournament)
            .where(eq(tournaments.tournamentId, tournament.tournamentId));
        }
      }

      // Add any new matches found during tournament enhancement
      if (enhancedData.matches.length > 0) {
        await db.insert(matches).values(enhancedData.matches);
        this.stats.matches += enhancedData.matches.length;
      }

      // Add any new players found during tournament enhancement
      if (enhancedData.players.length > 0) {
        await db.insert(players).values(enhancedData.players);
        this.stats.players += enhancedData.players.length;
      }

      console.log(`✅ Tournaments enhanced`);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tournament enhancement failed",
      };
    }
  }

  private async enhanceMatches(): Promise<StepResult> {
    try {
      console.log("🎾 Enhancing matches...");
      
      const existingMatches = await db.select().from(matches);
      const scraper = new MatchScraper(this.scrapingClient);
      
      const enhancedData = await scraper.enhanceMatches(existingMatches);

      // Update matches with enhanced data
      for (const match of enhancedData.matches) {
        if (match.matchId) {
          await db
            .update(matches)
            .set(match)
            .where(eq(matches.matchId, match.matchId));
        }
      }

      // Update players with new information found during match enhancement
      if (enhancedData.players.length > 0) {
        for (const player of enhancedData.players) {
          if (player.playerId) {
            await db
              .update(players)
              .set(player)
              .where(eq(players.playerId, player.playerId));
          }
        }
      }

      console.log(`✅ Matches enhanced`);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Match enhancement failed",
      };
    }
  }

  private async enhancePlayers(): Promise<StepResult> {
    try {
      console.log("👤 Enhancing players...");
      
      const existingPlayers = await db.select().from(players);
      const scraper = new PlayerScraper(this.scrapingClient);
      
      const enhancedPlayers = await scraper.enhancePlayers(existingPlayers);

      // Update players with enhanced data
      for (const player of enhancedPlayers) {
        if (player.playerId) {
          await db
            .update(players)
            .set(player)
            .where(eq(players.playerId, player.playerId));
        }
      }

      console.log(`✅ Players enhanced`);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Player enhancement failed",
      };
    }
  }

  private async generateStats(): Promise<StepResult> {
    try {
      console.log("📊 Generating statistics...");
      
      const existingPlayers = await db.select().from(players);
      const scraper = new StatsScraper(this.scrapingClient);
      
      const statsData = await scraper.generatePlayerStats(existingPlayers);

      // Store player statistics
      if (statsData.length > 0) {
        await db.insert(playerStats).values(statsData);
        this.stats.playerStats += statsData.length;
      }

      console.log(`✅ Statistics generated: ${this.stats.playerStats} player stats`);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Stats generation failed",
      };
    }
  }
}