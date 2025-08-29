import { pgTable, serial, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  matchId: varchar("match_id", { length: 255 }).notNull(),
  matchLink: text("match_link").notNull(),
  tournament: varchar("tournament", { length: 255 }).notNull(),
  tournamentLink: text("tournament_link").notNull(),
  winnerLink: text("winner_link").notNull(),
  loserLink: text("loser_link").notNull(),
  winner: varchar("winner", { length: 255 }).notNull(),
  loser: varchar("loser", { length: 255 }).notNull(),
  winnerSets: integer("winner_sets").notNull(),
  loserSets: integer("loser_sets").notNull(),
  gradedBy: varchar("graded_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;