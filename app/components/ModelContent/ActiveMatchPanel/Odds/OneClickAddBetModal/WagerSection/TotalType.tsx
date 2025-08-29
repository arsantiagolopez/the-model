import React from "react";
import type { FC } from "react";
import { getFormattedOdds } from "../../../../../../utils/model/getFormattedOdds";

interface Props {
  type: string;
  wagerStr?: string;
  odds: number;
  oddsFormat: string;
  toggleOdds: () => void;
}

const TotalType: FC<Props> = ({
  type,
  wagerStr,
  odds,
  oddsFormat,
  toggleOdds,
}) => {
  const typeStr = type === "totalGames" ? "Total Games" : "Total Sets";

  return (
    <div className="flex flex-row justify-between items-center">
      {/*  Wager & Type */}
      <div className="flex flex-col">
        <p className="text-xl text-white font-black tracking-tight">
          {wagerStr}
        </p>
        <p className="text-sm text-tertiary leading-4">{typeStr}</p>
      </div>

      {/* Right – Odds */}
      <button
        onClick={toggleOdds}
        className="self-start text-xl text-white font-black mt-0.5"
      >
        {getFormattedOdds(odds, oddsFormat as "decimal" | "american")}
      </button>
    </div>
  );
};

export { TotalType };
