import React, {
  useMemo,
} from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { GoPlus } from "react-icons/go";
import type { ParlayLeg } from "~/types/model";
import { getFormattedOdds } from "../../../../../../utils/model/getFormattedOdds";
import { Leg } from "./Leg";

interface Props {
  oddsFormat: string;
  toggleOdds: () => void;
  parlayLegs?: ParlayLeg[];
  setParlayLegs: Dispatch<SetStateAction<ParlayLeg[] | undefined>>;
  handleClose: () => void;
  resetActiveIds: () => void;
}

const ParlaySection: FC<Props> = ({
  oddsFormat,
  toggleOdds,
  parlayLegs,
  setParlayLegs,
  handleClose,
  resetActiveIds,
}) => {
  // Close modal & Go back to schedule
  const handleAddLeg = () => {
    // Send back to stats screen
    resetActiveIds();

    // Close modal
    handleClose();
  };

  // Remove leg
  const handleRemoveLeg = (matchId: string) => {
    const filtered = parlayLegs?.filter((leg) => leg.matchId !== matchId);
    setParlayLegs(filtered);
  };

  // Calculate parlay odds with useMemo
  const parlayOdds = useMemo(() => {
    if (parlayLegs && parlayLegs.length > 0) {
      return parlayLegs.reduce((acc, { odds }) => acc * odds, 1);
    }
    return undefined;
  }, [parlayLegs]);

  const legProps = { toggleOdds, oddsFormat, handleRemoveLeg };

  return (
    <div className="flex flex-col -mt-4">
      {/* Header */}
      <div className="flex flex-row justify-between items-center text-white">
        {/* Left Parlay & Number of Picks */}
        <h1 className="font-[800] text-xl">
          {parlayLegs
            ? parlayLegs.length === 1
              ? "1 Pick"
              : parlayLegs.length
              ? `${parlayLegs.length} Picks`
              : "0 Picks"
            : "0 Picks"}
        </h1>

        {/* Right – Odds */}
        <button
          onClick={toggleOdds}
          className="self-start text-2xl text-white font-black mt-0.5"
        >
          {getFormattedOdds(parlayOdds, oddsFormat)}
        </button>
      </div>

      {/* Legs */}
      <div className="relative">
        <div className="relative flex flex-col py-2 pb-6 max-h-[20rem] md:max-h-[16rem] overflow-scroll">
          {parlayLegs?.map((leg, index) => (
            <Leg key={index} leg={leg} {...legProps} />
          ))}
        </div>

        {/* Gradient Scrollable Bottom Shadow */}
        {parlayLegs && parlayLegs.length > 3 && (
          <div className="black-gradient-bottom pointer-events-none" />
        )}
      </div>

      {/* Add parlay leg */}
      <button
        onClick={handleAddLeg}
        className="flex flex-row items-center border-tertiary border-[1px] rounded-md px-6 py-5 text-base text-tertiary font-[800] hover:text-white hover:border-white"
      >
        <GoPlus className="text-base mr-2" />
        Add a leg
      </button>
    </div>
  );
};

export { ParlaySection };
