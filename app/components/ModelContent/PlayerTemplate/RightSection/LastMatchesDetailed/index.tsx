import moment from "moment";
import React from "react";
import type { FC } from "react";
import { CgCheck } from "react-icons/cg";
import { IoCloseSharp } from "react-icons/io5";
import type { MatchEntity } from "../../../../../types";
import { getLastAndFirstInitial } from "../../../../../utils/model/getLastAndFirstInitial";
import { SurfaceBadge } from "../../../SurfaceBadge";
import { RightSectionSkeleton } from "../RightSectionSkeleton";
import { HoverMatchResult } from "./HoverMatchResult";

interface Props {
  player?: string;
  lastMatches?: MatchEntity[];
}

const LastMatchesDetailed: FC<Props> = ({ player, lastMatches }) => {
  // Get abbreviated name
  player = player && getLastAndFirstInitial(player);

  return (
    <div className="w-full max-w-full overflow-scroll md:py-6 md:pb-12 h-full md:min-w-[30rem] md:pr-[40%]">
      {
        // Show skeleton
        !lastMatches ? (
          <RightSectionSkeleton />
        ) : (
          // Matches list
          lastMatches.map(
            ({
              matchId,
              tournament,
              round,
              date,
              home,
              away,
              result,
              surface,
            }) => {
              const { winner } = result || {};
              const isPlayerWon = home === winner;
              const loser = home === winner ? away : home;

              const dateStr = moment(date).format("M/D");

              const hoverMatchResultProps = { result, home, away };

              return (
                <div
                  key={matchId}
                  className="relative flex flex-col justify-center w-full md:px-6 pb-1 py-2 md:py-2 hover:bg-secondary"
                >
                  {/* Match Details */}
                  <div className="flex flex-row items-center text-xs text-tertiary font-[800] tracking-wide truncate">
                    {/* Surface */}
                    <div className="w-3 h-3 mx-1.5 mr-3">
                      <SurfaceBadge surface={surface} />
                    </div>

                    {/* Date */}
                    <p className="text-xs text-white">{dateStr} – </p>

                    {/* Tournament */}
                    <p>{tournament}</p>

                    {/* Round */}
                    <p>, {round}</p>
                  </div>

                  {/* Result */}
                  <div className="flex flex-row items-center w-full h-full">
                    {/* Left */}
                    <div className="flex flex-row items-center truncate max-w-[90%]">
                      {/* Win/Loss Icon */}
                      {isPlayerWon ? (
                        <CgCheck className="text-2xl text-green-400 mr-1" />
                      ) : (
                        <IoCloseSharp className="text-xl text-red-500 mr-1" />
                      )}

                      {/* Headline */}
                      <div className="flex flex-row items-center text-sm font-semibold tracking-tight truncate max-w-[90%]">
                        {/* Winner */}
                        <p
                          className={`truncate ${
                            winner === player
                              ? "font-[800] text-white"
                              : "text-fourth"
                          }`}
                        >
                          {winner && getLastAndFirstInitial(winner)}
                        </p>

                        <p className="px-0.5 text-fourth">–</p>

                        {/* Loser */}
                        <p
                          className={`truncate ${
                            loser === player
                              ? "font-[800] text-white"
                              : "text-fourth"
                          }`}
                        >
                          {loser && getLastAndFirstInitial(loser)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right - Result, Sets & Games */}
                  <HoverMatchResult {...hoverMatchResultProps} />
                </div>
              );
            }
          )
        )
      }
    </div>
  );
};

export { LastMatchesDetailed };
