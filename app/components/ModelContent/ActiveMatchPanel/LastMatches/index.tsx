import React, { useState } from "react";
import type { FC } from "react";
import { ChevronDown } from "lucide-react";
import type { MatchEntity } from "~/types/model";
import { MatchList } from "./MatchList";

interface Props {
  match?: MatchEntity;
}

const LastMatches: FC<Props> = ({ match }) => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  const { home, away, playersLastMatches } = match || {};

  if (!home || !away || !playersLastMatches) {
    return null;
  }

  const { homeLastMatches, awayLastMatches } = playersLastMatches;

  const toggleActive = () => setIsPanelOpen(!isPanelOpen);

  const homeMatchList = { player: home };
  const awayMatchList = { player: away };

  return (
    <div
      onClick={toggleActive}
      className={`pt-4 w-full cursor-pointer ${
        !isPanelOpen && "hover:animate-pulse"
      }`}
    >
      <div className="relative flex flex-row justify-center items-center rounded-md select-none text-white font-semibold text-sm tracking-tighter bg-gray-800 w-full p-3 md:px-[6%] md:py-2 hover:bg-gray-700">
        <h1 className="truncate text-center">Last Matches</h1>
        <ChevronDown
          className={`ml-2 -mr-3 text-xl ${isPanelOpen && "rotate-180"}`}
        />
      </div>

      {/* Matches */}
      {isPanelOpen && (
        <div className="flex flex-row justify-center items-start w-full py-3">
          {/* Home matches */}
          {homeLastMatches && (
            <MatchList
              isHome
              lastMatches={homeLastMatches}
              {...homeMatchList}
            />
          )}

          {/* Away matches */}
          {awayLastMatches && (
            <MatchList lastMatches={awayLastMatches} {...awayMatchList} />
          )}
        </div>
      )}
    </div>
  );
};

export { LastMatches };
