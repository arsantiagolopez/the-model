import React, { useState } from "react";
import type { FC } from "react";
import { ChevronDown } from "lucide-react";
import type { MatchEntity } from "~/types/model";
import { usePlayerRecords } from "~/hooks/use-player-records";
import { SurfaceRecords } from "../SurfaceRecords";

interface PlayerRecord {
  // Add proper type definition based on your data structure
  [key: string]: any;
}

interface Props {
  match?: MatchEntity;
  homeLink?: string;
  awayLink?: string;
}

const Records: FC<Props> = ({ match, homeLink, awayLink }) => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  const { data: homeRecord } = usePlayerRecords(homeLink);
  const { data: awayRecord } = usePlayerRecords(awayLink);

  const toggleActive = () => setIsPanelOpen(!isPanelOpen);

  const currentSurface = match?.surface;

  const homeSurfaceRecordsProps = {
    record: homeRecord,
    allSurfaces: false,
    currentSurface,
  };
  const awaySurfaceRecordsProps = {
    record: awayRecord,
    allSurfaces: false,
    currentSurface,
  };

  return (
    <div
      onClick={toggleActive}
      className={`py-4 w-full cursor-pointer ${
        !isPanelOpen && "hover:animate-pulse"
      }`}
    >
      <div className="relative flex flex-row justify-center items-center rounded-md select-none text-white font-semibold text-sm tracking-tighter bg-gray-800 w-full p-3 md:px-[6%] md:py-2 hover:bg-gray-700">
        <h1 className="truncate text-center">Records</h1>
        <ChevronDown
          className={`ml-2 -mr-3 text-xl ${isPanelOpen && "rotate-180"}`}
        />
      </div>

      {/* Matches */}
      {isPanelOpen && (
        <div className="flex flex-row justify-center items-start py-3 w-full">
          {/* Home records */}
          <div className="w-full px-[2%]">
            <SurfaceRecords {...homeSurfaceRecordsProps} />
          </div>

          {/* Away records */}
          <div className="w-full px-[2%]">
            <SurfaceRecords {...awaySurfaceRecordsProps} />
          </div>
        </div>
      )}
    </div>
  );
};

export { Records };
