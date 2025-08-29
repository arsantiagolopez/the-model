import React from "react";
import type { FC } from "react";
import { IoClose } from "react-icons/io5";
import type { ParlayLeg } from "../../../../../../types";
import { getFormattedOdds } from "../../../../../../utils/model/getFormattedOdds";
// Image component - using img for now
const Image = ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />;

interface Props {
  leg: ParlayLeg;
  toggleOdds: () => void;
  oddsFormat: string;
  handleRemoveLeg: (matchId: string) => void;
}

const Leg: FC<Props> = ({ leg, toggleOdds, oddsFormat, handleRemoveLeg }) => {
  const { wager, headline, odds, imageSrc, matchId } = leg;

  return (
    <div className="flex flex-row justify-between items-start py-4 w-full">
      {/* Left – Image, Wager & Type */}
      <div className="flex flex-row items-center">
        {/* Image */}
        <Image
          src={imageSrc}
          defaultImage="/logo.png"
          className="object-cover rounded-full w-12 h-12"
        />

        {/*  Wager & Type */}
        <div className="flex flex-col ml-3">
          <p className="text-xl text-white font-black tracking-tight self-start">
            {wager}
          </p>
          <p className="text-sm text-tertiary truncate leading-4">{headline}</p>
        </div>
      </div>

      {/* Right – Odds */}
      <div className="flex flex-row items-start h-full">
        <button
          onClick={toggleOdds}
          className="self-start text-xl text-tertiary font-black mt-0.5"
        >
          {getFormattedOdds(odds, oddsFormat as "decimal" | "american")}
        </button>

        {/* Remove parlay leg button */}
        <button
          onClick={() => handleRemoveLeg(matchId)}
          className="text-tertiary hover:scale-125 hover:text-red-500 pl-2.5 py-2"
        >
          <IoClose className="text-xl " />
        </button>
      </div>
    </div>
  );
};

export { Leg };
