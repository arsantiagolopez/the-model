import React from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { RiSunLine } from "react-icons/ri";
import type { MatchPlayerProfilesAndDates } from "~/types";
import { Dropdown } from "~/components/shared/Dropdown";
import { MatchRustCard } from "./MatchRustCard";

interface Props {
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
  matches?: MatchPlayerProfilesAndDates[];
}

const RustSection: FC<Props> = ({ setActivePlayerId, matches = [] }) => {

  const matchRustCardProps = { setActivePlayerId };

  return (
    <div className="select-none border-b-[0.5px] border-borders">
      <Dropdown
        Button={
          <div className="flex flex-row items-center">
            <RiSunLine className="text-2xl text-yellow-400 mr-4" />
            <h1 className="text-white text-xl font-[800] truncate py-6">
              Most Time Away
            </h1>
          </div>
        }
        Content={
          <div className="overflow-scroll pt-2 pb-8  ">
            {matches?.map((match, index) => (
              <MatchRustCard
                key={index}
                match={match}
                {...matchRustCardProps}
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

export { RustSection };
