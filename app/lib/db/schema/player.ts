import { pgTable, serial, text, varchar, integer, timestamp, jsonb, date } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  playerId: varchar("player_id", { length: 255 }).notNull().unique(),
  
  // Profile information
  name: varchar("name", { length: 255 }).notNull(),
  image: text("image").notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  age: integer("age").notNull(),
  birthday: date("birthday").notNull(),
  singlesRank: integer("singles_rank").notNull(),
  sex: varchar("sex", { length: 10 }).notNull(),
  hand: varchar("hand", { length: 10 }).notNull(),
  
  // Additional data stored as JSON
  record: jsonb("record"),
  form: integer("form"),
  streak: integer("streak"),
  lastMatches: jsonb("last_matches"),
  upcomingMatch: jsonb("upcoming_match"),
  pastTournamentResults: jsonb("past_tournament_results"),
  injuries: jsonb("injuries"),
  playerStats: jsonb("player_stats"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;