import React, { useMemo } from "react";
import type {
  Dispatch,
  FC,
  SetStateAction,
} from "react";
import { AiOutlineFire } from "react-icons/ai";
// No more mock data
import type { PlayerEntity } from "~/types";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Dropdown } from "~/components/shared/Dropdown";
import { PlayerStreakCard } from "./PlayerStreakCard";

interface Props {
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
  matches?: any[];
  tournaments?: any[];
  players?: any[];
  totalPlayers?: number;
}

const StreakSection: FC<Props> = ({ setActivePlayerId, players: dbPlayers }) => {
  // Generate streak players with mock data based on rankings
  const players = useMemo(() => {
    if (!dbPlayers || dbPlayers.length === 0) {
      return [];
    }
      const streakPlayers: PlayerEntity[] = dbPlayers.slice(0, 10).map((player, index) => {
        // Generate mock streak value - better players get higher streaks
        // Streak must be at least 3 (legacy requirement)
        const baseStreak = 3 + Math.floor((100 - (player.singlesRank || 50)) / 10);
        const randomStreak = Math.max(3, baseStreak + Math.floor(Math.random() * 5));
        
        // Generate mock match history with consecutive wins at the end (for the streak)
        const mockMatches = Array.from({ length: 10 }, (_, i) => {
          const isRecentWin = i < randomStreak; // First N matches are wins (streak)
          
          return {
            id: `match-${i}`,
            matchId: `match-${i}`,
            tournament: 'ATP Tournament',
            tournamentLink: '/tournament-link',
            home: player.name,
            away: `Opponent ${i + 1}`,
            homeLink: player.playerId,
            awayLink: `opponent-${i}`,
            homeOdds: 100 + Math.floor(Math.random() * 200),
            awayOdds: 100 + Math.floor(Math.random() * 200),
            surface: ['hard', 'clay', 'grass'][Math.floor(Math.random() * 3)],
            date: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            result: {
              winner: isRecentWin ? player.name : `Opponent ${i + 1}`,
              homeSets: isRecentWin ? 2 : Math.floor(Math.random() * 2),
              awaySets: isRecentWin ? Math.floor(Math.random() * 2) : 2,
            }
          };
        });

        return {
          playerId: player.playerId,
          profile: {
            name: player.name,
            image: getPlayerImageUrl(player.image),
            ranking: player.singlesRank,
            country: player.country,
          },
          streak: randomStreak,
          lastMatches: mockMatches
        };
      });

      // Sort by streak (descending) like the legacy API
      streakPlayers.sort((a, b) => (b.streak || 0) - (a.streak || 0));
      
      return streakPlayers;
  }, [dbPlayers]);

  const playerStreakCardProps = { setActivePlayerId };

  return (
    <div className="select-none border-b-[0.5px] border-borders">
      <Dropdown
        Button={
          <div className="flex flex-row items-center">
            <AiOutlineFire className="text-2xl text-red-400 mr-4" />
            <h1 className="text-white text-xl font-[800] truncate py-6">
              Streaks
            </h1>
          </div>
        }
        Content={
          <div className="overflow-scroll pt-2 pb-8  ">
            {players?.map((player) => (
              <PlayerStreakCard
                key={player.playerId}
                player={player}
                {...playerStreakCardProps}
              />
            ))}
          </div>
        }
        hasRightArrow
        isDefaultOpen
      />
    </div>
  );
};

export { StreakSection };
