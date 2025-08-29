import { pgTable, serial, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  tournamentId: varchar("tournament_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  countryCode: varchar("country_code", { length: 10 }),
  surface: varchar("surface", { length: 100 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  sex: varchar("sex", { length: 10 }).notNull(),
  prize: varchar("prize", { length: 255 }).notNull(),
  pastYearsResults: jsonb("past_years_results"),
  details: jsonb("details"),
  nextMatches: jsonb("next_matches"),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;