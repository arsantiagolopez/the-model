import React from "react";
import type { FC } from "react";
import type { PlayerEntity } from "../../../../types";
import { LastMatchesDetailed } from "./LastMatchesDetailed";

interface Props {
  player?: PlayerEntity;
}

const RightSection: FC<Props> = ({ player }) => {
  const { profile, lastMatches } = player || {};
  const { name } = profile || {};

  const lastMatchesDetailedProps = { player: name, lastMatches };

  return (
    <div className="relative flex flex-col pt-4 max-h-screen w-full">
      {/* Title */}
      <h1 className="text-white font-[800] text-3xl mx-6">Last Matches</h1>

      {/* Matches list */}
      <LastMatchesDetailed {...lastMatchesDetailedProps} />

      {/* Gradient scrollable bottom shadow */}
      <div className="black-gradient-bottom pointer-events-none" />
    </div>
  );
};

export { RightSection };
