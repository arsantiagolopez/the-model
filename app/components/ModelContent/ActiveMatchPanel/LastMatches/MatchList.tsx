import moment from "moment";
import React, { useState } from "react";
import type { FC, MouseEventHandler } from "react";
import { Check, X } from "lucide-react";
import type { MatchEntity } from "~/types/model";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
import { SurfaceBadge } from "../../SurfaceBadge";

interface Props {
  player: string;
  lastMatches: MatchEntity[];
  isHome?: boolean;
}

const MatchList: FC<Props> = ({ player, lastMatches, isHome }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  player = getLastAndFirstInitial(player);

  const toggleExpanded: MouseEventHandler<HTMLButtonElement> | undefined = (
    event
  ) => {
    event.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`flex flex-col w-full max-w-[50%] truncate overflow-hidden ${
        isHome ? "px-2 md:px-[5%] pr-3 mr-auto" : "px-2 md:px-[5%] pl-3 ml-auto"
      }`}
    >
      {/* Player name */}
      <div className="flex flex-row justify-between items-center w-full truncate pb-2">
        {/* Player */}
        <p className="font-[800] truncate max-w-[75%] hover:underline hover:animate-pulse hover:font-[800]">
          {player}
        </p>

        {/* Show / Hide button */}
        <button
          onClick={toggleExpanded}
          className="text-xs font-[800] text-brand hover:underline hover:text-brandHover hover:animate-pulse"
        >
          {isExpanded ? "Show 10" : "Show All"}
        </button>
      </div>

      {/* Matches List */}
      <div className="flex flex-col w-full">
        {(isExpanded ? lastMatches : lastMatches.slice(0, 10)).map(
          (
            { id, tournament, round, date, home, away, result, surface },
            index
          ) => {
            const { winner, homeSets, awaySets } = result || {};

            const isPlayerWon = home === winner;

            const loser = home === winner ? away : home;

            const winnerSets = isPlayerWon ? homeSets : awaySets;
            const loserSets = isPlayerWon ? awaySets : homeSets;

            const dateStr = moment(date).format("M/D");

            return (
              <div
                key={id || index}
                className="flex flex-col w-full pb-1 py-2 md:py-1"
              >
                {/* Match Details */}
                <div className="flex flex-row items-center text-[0.6rem] text-tertiary font-[800] tracking-wide truncate leading-3">
                  {/* Surface */}
                  <div className="h-2.5 min-h-[0.625rem] w-2.5 min-w-[0.625rem] ml-1 mr-3">
                    <SurfaceBadge surface={surface} />
                  </div>
                  {/* Date */}
                  <p className="text-[0.5rem] text-gray-400">{dateStr} – </p>

                  {/* Tournament */}
                  <p>{tournament}</p>

                  {/* Round */}
                  <p>, {round}</p>
                </div>

                {/* Result */}
                <div className="flex flex-row justify-between items-center w-full overflow-hidden leading-3">
                  {/* Left */}
                  <div className="flex flex-row items-center truncate max-w-[90%] overflow-hidden">
                    {/* Win/Loss Icon */}
                    {isPlayerWon ? (
                      <Check className="text-lg text-green-400 mr-1" />
                    ) : (
                      <X className="text-lg text-red-500 mr-1" />
                    )}

                    {/* Headline */}
                    <div className="flex flex-row items-center text-xs tracking-tight truncate max-w-[90%] overflow-hidden">
                      {/* Winner */}
                      <p
                        className={`truncate max-w-[50%] ${
                          winner === player
                            ? "font-semibold text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {winner && getLastAndFirstInitial(winner)}
                      </p>

                      <p className="px-0.5">–</p>

                      {/* Loser */}
                      <p
                        className={`truncate max-w-[50%] ${
                          loser === player
                            ? "font-semibold text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {loser && getLastAndFirstInitial(loser)}
                      </p>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-xs font-[800]">
                    {winnerSets}:{loserSets}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export { MatchList };
