import { pgTable, serial, text, varchar, integer, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  matchId: varchar("match_id", { length: 255 }).notNull().unique(),
  tournament: varchar("tournament", { length: 255 }).notNull(),
  tournamentId: varchar("tournament_id", { length: 255 }).notNull(),
  tournamentLink: text("tournament_link").notNull(),
  year: integer("year"),
  type: varchar("type", { length: 100 }).notNull(),
  surface: varchar("surface", { length: 100 }),
  round: varchar("round", { length: 100 }),
  date: jsonb("date"),
  homeLink: text("home_link"),
  awayLink: text("away_link"),
  home: varchar("home", { length: 255 }).notNull(),
  away: varchar("away", { length: 255 }).notNull(),
  homeH2h: integer("home_h2h"),
  awayH2h: integer("away_h2h"),
  homeOdds: numeric("home_odds", { precision: 10, scale: 2 }).notNull(),
  awayOdds: numeric("away_odds", { precision: 10, scale: 2 }).notNull(),
  matchLink: text("match_link").notNull(),
  result: jsonb("result"),
  odds: jsonb("odds"),
  headToHeadMatches: jsonb("head_to_head_matches"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;