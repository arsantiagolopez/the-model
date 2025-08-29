import { pgTable, serial, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  playerId: varchar("player_id", { length: 255 }),
  player: varchar("player", { length: 255 }).notNull(),
  eloRanking: jsonb("elo_ranking"),
  yEloRanking: jsonb("y_elo_ranking"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export type PlayerStats = typeof playerStats.$inferSelect;
export type NewPlayerStats = typeof playerStats.$inferInsert;