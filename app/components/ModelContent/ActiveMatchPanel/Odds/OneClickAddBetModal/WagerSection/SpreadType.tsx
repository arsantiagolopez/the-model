import React from "react";
import type { FC } from "react";
import { getFormattedOdds } from "../../../../../../utils/model/getFormattedOdds";
// Image component - using img for now
const Image = ({ src, alt, className, ...props }: any) => <img src={src} alt={alt || ""} className={className} {...props} />;

interface Props {
  type: string;
  imageSrc?: string;
  wagerStr?: string;
  odds: number;
  oddsFormat: string;
  toggleOdds: () => void;
}

const SpreadType: FC<Props> = ({
  type,
  imageSrc,
  wagerStr,
  odds,
  oddsFormat,
  toggleOdds,
}) => {
  const typeStr = type === "spreadGames" ? "Game Spread" : "Set Spread";

  return (
    <div className="flex flex-row justify-between items-center">
      {/* Left – Image, Wager & Type */}
      <div className="flex flex-row items-center">
        {/* Image */}
        <Image src={imageSrc} className="object-cover rounded-full w-12 h-12" />

        {/*  Wager & Type */}
        <div className="flex flex-col ml-3">
          <p className="text-xl text-white font-black tracking-tight line-clamp-2">
            {wagerStr}
          </p>
          <p className="text-sm text-tertiary leading-4">{typeStr}</p>
        </div>
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

export { SpreadType };
