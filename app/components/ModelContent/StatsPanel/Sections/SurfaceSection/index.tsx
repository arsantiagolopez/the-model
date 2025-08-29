import React from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { AiOutlineTrophy } from "react-icons/ai";
import type { MatchPlayerProfilesAndSurfaceRecords } from "~/types";
import { Dropdown } from "~/components/shared/Dropdown";
import { MatchDominanceCard } from "./MatchDominanceCard";

interface Props {
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
  matches?: MatchPlayerProfilesAndSurfaceRecords[];
}

const SurfaceSection: FC<Props> = ({ setActivePlayerId, matches = [] }) => {

  const matchDominanceCardProps = { setActivePlayerId };

  return (
    <div className="select-none border-b-[0.5px] border-borders">
      <Dropdown
        Button={
          <div className="flex flex-row items-center">
            <AiOutlineTrophy className="text-2xl text-yellow-400 mr-4" />
            <h1 className="text-white text-xl font-[800] truncate py-6">
              Surface Dominance
            </h1>
          </div>
        }
        Content={
          <div className="overflow-scroll pt-2 pb-8  ">
            {matches?.map((match, index) => (
              <MatchDominanceCard
                key={index}
                match={match}
                {...matchDominanceCardProps}
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

export { SurfaceSection };
