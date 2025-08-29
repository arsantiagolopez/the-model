import React, { useMemo } from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { BsStars } from "react-icons/bs";
import type { PlayerEntity } from "~/types";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Dropdown } from "~/components/shared/Dropdown";
import { PlayerFormCard } from "./PlayerFormCard";

interface Props {
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
  players?: any[];
}

const FormSection: FC<Props> = ({ setActivePlayerId, players: dbPlayers }) => {
  // Generate form players with mock data until API is working
  const players = useMemo(() => {
    if (!dbPlayers || dbPlayers.length === 0) {
      return [];
    }

    // Generate mock form data based on player rankings
    const formPlayers: PlayerEntity[] = dbPlayers.slice(0, 10).map(player => {
      // Generate mock match history for form calculation
      const mockMatches = Array.from({ length: 10 }, (_, i) => ({
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
          winner: Math.random() > 0.5 ? player.name : `Opponent ${i + 1}`,
          homeSets: Math.floor(Math.random() * 3) + 1,
          awaySets: Math.floor(Math.random() * 3) + 1,
        }
      }));

      return {
        playerId: player.playerId,
        profile: {
          name: player.name,
          image: player.image,
          ranking: player.singlesRank,
          country: player.country,
        },
        lastMatches: mockMatches
      };
    });

    // Sort by ranking (better players first) as a proxy for form
    formPlayers.sort((a, b) => (a.profile.ranking || 999) - (b.profile.ranking || 999));
    
    return formPlayers;
  }, [dbPlayers]);

  const playerFormCardProps = { setActivePlayerId };

  return (
    <div className="select-none border-b-[0.5px] border-borders">
      <Dropdown
        Button={
          <div className="flex flex-row items-center">
            <BsStars className="text-2xl text-yellow-400 mr-4" />
            <h1 className="text-white text-xl font-[800] truncate py-6">
              Top Form
            </h1>
          </div>
        }
        Content={
          <div className="overflow-scroll pt-2 pb-8">
            {players?.map((player) => (
              <PlayerFormCard
                key={player?.playerId}
                player={player}
                {...playerFormCardProps}
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

export { FormSection };
