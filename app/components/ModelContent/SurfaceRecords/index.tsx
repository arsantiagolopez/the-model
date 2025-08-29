import { useState } from "react";
import type { FC, MouseEventHandler } from "react";
import { GrFormAdd, GrFormSubtract } from "react-icons/gr";
import type { PlayerRecord } from "~/types";
import { SurfaceBadge } from "../SurfaceBadge";

interface Props {
  record?: PlayerRecord;
  currentSurface?: string;
  allSurfaces?: boolean;
}

const SurfaceRecords: FC<Props> = ({ record, currentSurface, allSurfaces }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!!allSurfaces);

  const { years, all } = record || {};

  const toggleExpand: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const calculateActualTotalsFromYears = (surface: string) => {
    if (!years) return { wins: 0, losses: 0 };

    let totalWins = 0;
    let totalLosses = 0;

    years.forEach((yearData: any) => {
      const surfaceData = yearData[surface];
      if (
        surfaceData &&
        Number.isFinite(surfaceData.win) &&
        Number.isFinite(surfaceData.loss)
      ) {
        totalWins += surfaceData.win;
        totalLosses += surfaceData.loss;
      }
    });

    return { wins: totalWins, losses: totalLosses };
  };

  const calculateRatio = (
    win: number | null,
    loss: number | null,
    surface?: string
  ) => {
    let wins = win ?? 0;
    let losses = loss ?? 0;

    // If wins is null but we have yearly data, calculate from years
    if (win === null && surface && years) {
      const actualTotals = calculateActualTotalsFromYears(surface);
      wins = actualTotals.wins;
      losses = actualTotals.losses;
    }

    const total = wins + losses;
    return total > 0 ? Number(wins / total).toFixed(2) : "0.00";
  };

  const allSummaryRatio = all?.summary
    ? calculateRatio(all.summary.win, all.summary.loss)
    : "–";
  const allHardRatio = all?.hard
    ? calculateRatio(all.hard.win, all.hard.loss, "hard")
    : "–";
  const allClayRatio = all?.clay
    ? calculateRatio(all.clay.win, all.clay.loss, "clay")
    : "–";
  const allGrassRatio = all?.grass
    ? calculateRatio(all.grass.win, all.grass.loss, "grass")
    : "–";
  const allIndoorsRatio = all?.indoors
    ? calculateRatio(all.indoors.win, all.indoors.loss, "indoors")
    : "–";

  return (
    <div className="flex-col w-full">
      {/* Header */}
      <div
        className={`flex flex-row justify-around items-center w-full text-xs font-semibold text-white  rounded-sm ${
          allSurfaces && "bg-primary pr-1"
        }`}
      >
        <p className="flex-1 text-center">Year</p>
        <p className="flex-1 text-center">{allSurfaces ? "Summary" : "Sum."}</p>

        {/* Hard header */}
        <div
          className={`flex-1 flex flex-row justify-center items-center py-1.5 ${
            currentSurface === "hard" ? "bg-secondary" : ""
          }`}
        >
          {allSurfaces && <p className="hidden md:block md:pr-2">Hard</p>}
          <div className="h-3 w-3">
            <SurfaceBadge surface="hard" />
          </div>
        </div>

        {/* Clay header */}
        <div
          className={`flex-1 flex flex-row justify-center items-center py-1.5 ${
            currentSurface === "clay" ? "bg-secondary" : ""
          }`}
        >
          {allSurfaces && <p className="hidden md:block md:pr-2">Clay</p>}
          <div className="h-3 w-3">
            <SurfaceBadge surface="clay" />
          </div>
        </div>

        {/* Grass header */}
        <div
          className={`flex-1 flex flex-row justify-center items-center py-1.5 ${
            currentSurface === "grass" ? "bg-secondary" : ""
          }`}
        >
          {allSurfaces && <p className="hidden md:block md:pr-2">Grass</p>}
          <div className="h-3 w-3">
            <SurfaceBadge surface="grass" />
          </div>
        </div>

        {/* Show indoors only if allSurfaces flag on */}
        {allSurfaces && (
          <div
            className={`flex-1 flex flex-row justify-center items-center py-1.5 ${
              currentSurface === "grass" ? "bg-secondary" : ""
            }`}
          >
            <p className="hidden md:block md:pr-2">Indoors</p>
            <div className="h-3 w-3">
              <SurfaceBadge surface="indoors" />
            </div>
          </div>
        )}
      </div>

      {/* Rows */}
      <div className={`w-full ${allSurfaces && "pt-2"}`}>
        {/* Records per year */}
        {(isExpanded ? years : years?.slice(0, 3))?.map(
          ({ year, summary, hard, clay, grass, indoors }, index) => (
            <div
              key={index}
              className={`grid w-full text-fourth text-[0.7rem] text-center tracking-tight ${
                allSurfaces ? "grid-cols-6" : "grid-cols-5"
              }`}
            >
              {/* Year */}
              <p className="text-center font-bold text-white py-1.5">
                {allSurfaces ? year : String(year).slice(-2)}
              </p>

              {/* Summary */}
              <div className="flex flex-row justify-center hover:text-white hover:font-semibold py-1.5">
                <p>{summary?.win}</p>
                <p> / </p>
                <p>{summary?.loss}</p>
              </div>

              {/* Hard */}
              <div
                className={`flex flex-row justify-center hover:text-white hover:font-semibold py-1.5 ${
                  currentSurface === "hard"
                    ? "text-white font-semibold bg-secondary"
                    : ""
                }`}
              >
                {Number.isFinite(hard?.win) && Number.isFinite(hard?.loss) ? (
                  <>
                    <p>{hard?.win}</p>
                    <p> / </p>
                    <p>{hard?.loss}</p>
                  </>
                ) : (
                  <p>–</p>
                )}
              </div>

              {/* Clay */}
              <div
                className={`flex flex-row justify-center hover:text-white hover:font-semibold py-1.5 ${
                  currentSurface === "clay"
                    ? "text-white font-semibold bg-secondary"
                    : ""
                }`}
              >
                {Number.isFinite(clay?.win) && Number.isFinite(clay?.loss) ? (
                  <>
                    <p>{clay?.win}</p>
                    <p> / </p>
                    <p>{clay?.loss}</p>
                  </>
                ) : (
                  <p>-</p>
                )}
              </div>

              {/* Grass */}
              <div
                className={`flex flex-row justify-center hover:text-white hover:font-semibold py-1.5 ${
                  currentSurface === "grass"
                    ? "text-white font-semibold bg-secondary"
                    : ""
                }`}
              >
                {Number.isFinite(grass?.win) && Number.isFinite(grass?.loss) ? (
                  <>
                    <p>{grass?.win}</p>
                    <p> / </p>
                    <p>{grass?.loss}</p>
                  </>
                ) : (
                  <p>–</p>
                )}
              </div>

              {/* Indoors */}
              {allSurfaces && (
                <div
                  className={`flex flex-row justify-center hover:text-white hover:font-semibold py-1 ${
                    currentSurface === "indoors"
                      ? "text-white font-semibold bg-secondary"
                      : ""
                  }`}
                >
                  {Number.isFinite(indoors?.win) &&
                  Number.isFinite(indoors?.loss) ? (
                    <>
                      <p>{indoors?.win}</p>
                      <p> / </p>
                      <p>{indoors?.loss}</p>
                    </>
                  ) : (
                    <p>–</p>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {/* Show more/less button */}
        {!allSurfaces && (
          <div
            onClick={toggleExpand}
            className="flex flex-row justify-center items-center w-full text-[0.6rem] font-[800] text-brand hover:text-brandHover hover:underline hover:animate-pulse rounded-sm py-1 cursor-pointer tracking-wide"
          >
            {!isExpanded ? (
              <GrFormAdd className="mr-1 text-[0.5rem] text-white" />
            ) : (
              <GrFormSubtract className="mr-1 text-[0.5rem] text-white" />
            )}
            {!isExpanded ? "Show more" : "Show less"}{" "}
          </div>
        )}

        {/* All surfaces summary */}
        <div
          className={`grid w-full text-fourth text-xs text-center tracking-tight ${
            allSurfaces ? "grid-cols-6 mt-3" : "grid-cols-5"
          }`}
        >
          {/* Year */}
          <p className="text-center font-bold text-white py-1 tracking-tighter">
            All %
          </p>

          {/* Summary */}
          <div className="flex flex-row justify-center hover:text-white hover:font-semibold py-1">
            <p>{allSummaryRatio}</p>
          </div>

          {/* Hard */}
          <div
            className={`flex flex-row justify-center hover:text-white hover:font-semibold py-1 ${
              currentSurface === "hard"
                ? "text-white font-semibold bg-secondary rounded-sm"
                : ""
            }`}
          >
            <p>{allHardRatio}</p>
          </div>

          {/* Clay */}
          <div
            className={`flex flex-row justify-center hover:text-white hover:font-semibold py-1 ${
              currentSurface === "clay"
                ? "text-white font-semibold bg-secondary rounded-sm"
                : ""
            }`}
          >
            <p>{allClayRatio}</p>
          </div>

          {/* Grass */}
          <div
            className={`flex flex-row justify-center hover:text-white hover:font-semibold py-1 ${
              currentSurface === "grass"
                ? "text-white font-semibold bg-secondary rounded-sm"
                : ""
            }`}
          >
            <p>{allGrassRatio}</p>
          </div>

          {/* Indoors */}
          {allSurfaces && (
            <div
              className={`flex flex-row justify-center hover:text-white hover:font-semibold py-1 ${
                currentSurface === "indoors"
                  ? "text-white font-semibold bg-secondary rounded-sm"
                  : ""
              }`}
            >
              <p>{allIndoorsRatio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { SurfaceRecords };
