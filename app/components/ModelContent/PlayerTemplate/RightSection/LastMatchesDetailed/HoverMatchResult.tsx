import React from "react";
import type { FC } from "react";
import type { MatchResult } from "../../../../../types";
import { getLastAndFirstInitial } from "../../../../../utils/model/getLastAndFirstInitial";
import { Popover } from "../../../../shared/Popover";

interface Props {
  result?: MatchResult;
  home: string;
  away: string;
}

const HoverMatchResult: FC<Props> = ({ result, home, away }) => {
  const { winner, homeSets, awaySets } = result || {};

  const isPlayerWon = home === winner;
  const displayWinner = isPlayerWon
    ? getLastAndFirstInitial(home)
    : getLastAndFirstInitial(away);
  const displayLoser = isPlayerWon
    ? getLastAndFirstInitial(away)
    : getLastAndFirstInitial(home);

  const winnerSets = isPlayerWon ? homeSets : awaySets;
  const loserSets = isPlayerWon ? awaySets : homeSets;

  return (
    <Popover
      content={
        <div className="flex flex-row justify-end p-4 w-auto">
          {/* Players */}
          <div className="flex flex-col justify-start font-semibold tracking-tight text-[0.6rem]">
            <p
              className={`truncate ${
                isPlayerWon ? "text-white" : "text-fourth"
              }`}
            >
              {displayWinner}
            </p>
            <p
              className={`truncate ${
                isPlayerWon ? "text-fourth" : "text-white"
              }`}
            >
              {displayLoser}
            </p>
          </div>

          {/* Sets */}
          <div className="flex flex-col text-[0.6rem] font-[800] mx-3">
            <p
              className={`truncate ${
                isPlayerWon ? "text-white" : "text-fourth"
              }`}
            >
              {winnerSets}
            </p>
            <p
              className={`truncate ${
                isPlayerWon ? "text-fourth" : "text-white"
              }`}
            >
              {loserSets}
            </p>
          </div>
        </div>
      }
      className="absolute right-0 md:right-5"
    >
      <div className="flex flex-row items-center text-sm font-[800] text-white rounded-md p-2 bg-secondary hover:bg-tertiary cursor-default">
        {winnerSets}:{loserSets}
      </div>
    </Popover>
  );
};

export { HoverMatchResult };
