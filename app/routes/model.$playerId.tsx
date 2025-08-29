import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useNavigate, Link } from "react-router";
import { db, players, matches } from "~/lib/db";
import { eq, or } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Player Profile | Tennis App" },
    { name: "description", content: "Player statistics and match history" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const playerId = params.playerId;
  
  if (!playerId) {
    throw new Response("Player ID required", { status: 400 });
  }

  try {
    // For now, we'll just get player matches since we don't have a dedicated players table with profiles
    const playerMatches = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.homeLink, playerId),
          eq(matches.awayLink, playerId)
        )
      )
      .limit(20);

    return { 
      playerId,
      matches: playerMatches,
      playerName: playerMatches[0]?.homeLink === playerId 
        ? playerMatches[0]?.home 
        : playerMatches[0]?.away
    };
  } catch (error) {
    console.error("Error loading player data:", error);
    return { 
      playerId,
      matches: [],
      playerName: null
    };
  }
}

export default function PlayerProfilePage() {
  const { playerId, matches, playerName } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/model" 
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {playerName || "Player Profile"}
          </h1>
          <p className="text-gray-400">Player ID: {playerId}</p>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="bg-secondary rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
        
        {matches.length === 0 ? (
          <p className="text-gray-400">No matches found for this player</p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const isHome = match.homeLink === playerId;
              const opponent = isHome ? match.away : match.home;
              const playerScore = isHome ? match.result?.homeSets : match.result?.awaySets;
              const opponentScore = isHome ? match.result?.awaySets : match.result?.homeSets;
              
              return (
                <div 
                  key={match.matchId}
                  className="p-4 bg-tertiary rounded-lg hover:bg-opacity-80 cursor-pointer transition-colors"
                  onClick={() => navigate(`/model?matchId=${match.matchId}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        vs {opponent}
                      </p>
                      <p className="text-sm text-gray-400">
                        {match.tournament} • {match.round}
                      </p>
                    </div>
                    
                    {match.result && (
                      <div className="text-right">
                        <p className="font-bold">
                          {playerScore !== undefined && opponentScore !== undefined && (
                            <>
                              {playerScore} - {opponentScore}
                              {playerScore > opponentScore ? (
                                <span className="ml-2 text-green-500">W</span>
                              ) : (
                                <span className="ml-2 text-red-500">L</span>
                              )}
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(match.date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-secondary rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">Win Rate</h3>
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm text-gray-400">Data coming soon</p>
        </div>
        
        <div className="bg-secondary rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">Current Form</h3>
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm text-gray-400">Data coming soon</p>
        </div>
        
        <div className="bg-secondary rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">Ranking</h3>
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm text-gray-400">Data coming soon</p>
        </div>
      </div>
    </div>
  );
}