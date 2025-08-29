import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { useState } from "react";
import { ModelContent } from "~/components/ModelContent";
import { db, matches, tournaments, players } from "~/lib/db";
import { desc } from "drizzle-orm";

import type { ParlayLeg } from "~/types/model";

export type ModelLoaderData = {
  tomorrow: string;
  matches: any[];
  tournaments: any[];
  players: any[];
  totalPlayers: number;
};

export const meta: MetaFunction = () => {
  return [
    { title: "Model | Tennis App" },
    { name: "description", content: "Tennis match predictions and statistics" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  try {
    // Fetch real scraped data from database
    const [matchesData, tournamentsData, playersData] = await Promise.all([
      db.select().from(matches).orderBy(desc(matches.createdAt)).limit(50),
      db.select().from(tournaments).orderBy(desc(tournaments.createdAt)).limit(20),
      db.select().from(players).orderBy(desc(players.updatedAt)).limit(200)
    ]);

    return { 
      tomorrow, 
      matches: matchesData,
      tournaments: tournamentsData,
      players: playersData,
      totalPlayers: playersData.length
    };
  } catch (error) {
    console.error("Error loading model data:", error);
    // Fallback to basic data if database query fails
    return { 
      tomorrow, 
      matches: [],
      tournaments: [],
      players: [],
      totalPlayers: 0
    };
  }
}

export default function ModelPage() {
  const { tomorrow, matches: dbMatches, tournaments: dbTournaments, players: dbPlayers, totalPlayers } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [activePlayerId, setActivePlayerId] = useState<string | undefined>(undefined);
  const [activeMatchesSource, setActiveMatchesSource] = useState<any[]>(dbMatches);

  const contentProps = {
    activePlayerId,
    setActivePlayerId,
    tomorrow,
    matches: dbMatches,
    tournaments: dbTournaments,
    players: dbPlayers,
    totalPlayers,
    activeMatchesSource,
    setActiveMatchesSource,
  };

  return (
    <ModelContent {...contentProps} />
  );
}