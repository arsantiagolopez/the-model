CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" varchar(255) NOT NULL,
	"tournament" varchar(255) NOT NULL,
	"tournament_id" varchar(255) NOT NULL,
	"tournament_link" text NOT NULL,
	"year" integer,
	"type" varchar(100) NOT NULL,
	"surface" varchar(100),
	"round" varchar(100),
	"date" jsonb,
	"home_link" text,
	"away_link" text,
	"home" varchar(255) NOT NULL,
	"away" varchar(255) NOT NULL,
	"home_h2h" integer,
	"away_h2h" integer,
	"home_odds" integer NOT NULL,
	"away_odds" integer NOT NULL,
	"match_link" text NOT NULL,
	"result" jsonb,
	"odds" jsonb,
	"head_to_head_matches" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" text NOT NULL,
	"country" varchar(100) NOT NULL,
	"age" integer NOT NULL,
	"birthday" date NOT NULL,
	"singles_rank" integer NOT NULL,
	"sex" varchar(10) NOT NULL,
	"hand" varchar(10) NOT NULL,
	"record" jsonb,
	"form" integer,
	"streak" integer,
	"last_matches" jsonb,
	"upcoming_match" jsonb,
	"past_tournament_results" jsonb,
	"injuries" jsonb,
	"player_stats" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "players_player_id_unique" UNIQUE("player_id")
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" varchar(255),
	"player" varchar(255) NOT NULL,
	"elo_ranking" jsonb,
	"y_elo_ranking" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" varchar(255) NOT NULL,
	"match_link" text NOT NULL,
	"tournament" varchar(255) NOT NULL,
	"tournament_link" text NOT NULL,
	"winner_link" text NOT NULL,
	"loser_link" text NOT NULL,
	"winner" varchar(255) NOT NULL,
	"loser" varchar(255) NOT NULL,
	"winner_sets" integer NOT NULL,
	"loser_sets" integer NOT NULL,
	"graded_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" varchar(100) NOT NULL,
	"country_code" varchar(10),
	"surface" varchar(100) NOT NULL,
	"type" varchar(100) NOT NULL,
	"sex" varchar(10) NOT NULL,
	"prize" varchar(255) NOT NULL,
	"past_years_results" jsonb,
	"details" jsonb,
	"next_matches" jsonb,
	"results" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tournaments_tournament_id_unique" UNIQUE("tournament_id")
);
