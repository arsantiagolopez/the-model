import moment from "moment";
import React, { useMemo, useState } from "react";
import type { FC } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts";
import type { MatchEntity } from "~/types/model";
import { SurfaceBadge } from "../SurfaceBadge";

interface Props {
  lastMatches?: MatchEntity[];
  graphHeight: string;
  graphGap?: number;
  isDetailed?: boolean;
}

interface BarItem {
  name: string;
  value: number;
}

const FormGraph: FC<Props> = ({
  lastMatches,
  graphHeight,
  graphGap,
  isDetailed,
}) => {
  const [activeBar, setActiveBar] = useState<number>();

  // Process matches and create graph data
  const { matches, graphData } = useMemo(() => {
    if (!lastMatches) {
      return { matches: [], graphData: [] };
    }

    // Get last 10 matches sorted by date (newest to oldest)
    const processedMatches = lastMatches
      .sort((a, b) =>
        moment(b.date).valueOf() > moment(a.date).valueOf() ? 1 : -1
      )
      .slice(0, 10)
      .reverse();

    // Create data points for bar graph
    const data: BarItem[] = processedMatches.map(
      ({ homeOdds, awayOdds, away, result }) => {
        let value = 0;

        if (result) {
          const { homeSets, awaySets } = result;
          const winner = (homeSets ?? 0) > (awaySets ?? 0) ? "home" : "away";
          // Some lower league games might not have odds
          if (!homeOdds || !awayOdds) {
            value = winner === "home" ? 1.5 : -1.5;
          } else {
            value = winner === "home" ? homeOdds : -1 * awayOdds;
            value = value === 0 ? 0.1 : value;
          }
        } else {
          // No result available - this could be an upcoming match
          // For now, set a small placeholder value to show something
          value = 0.1; // Very small bar to indicate upcoming/no result
        }

        return { name: away, value };
      }
    );

    return { matches: processedMatches, graphData: data };
  }, [lastMatches]);

  return (
    <div className="relative flex flex-col justify-center items-center w-full h-full">
      <div className="absolute -top-1 flex flex-row justify-start w-full text-xs text-white">
        {isDetailed && activeBar && matches ? (
          <div className="z-50 flex flex-col text-tertiary text-sm font-semibold">
            <div className="flex flex-row items-center">
              {matches[activeBar]?.home} vs{" "}
              <span className="text-white font-[800] ml-2">
                {matches[activeBar]?.away}
              </span>{" "}
              <span className="h-3.5 md:h-4 w-3.5 md:w-4 mx-2">
                <SurfaceBadge surface={matches[activeBar]?.surface} />
              </span>
            </div>
            <p>
              {matches[activeBar]?.result?.homeSets}–
              {matches[activeBar]?.result?.awaySets}
            </p>
          </div>
        ) : null}
      </div>
      <div className={`w-full self-start ${graphHeight}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={graphData}
            margin={{ top: isDetailed ? 30 : 0, bottom: 0, left: 0, right: 0 }}
            barCategoryGap={graphGap ?? 1.5}
            onMouseMove={(state) => {
              const { activeTooltipIndex } = state || {};

              if (activeTooltipIndex) {
                setActiveBar(activeTooltipIndex);
              } else {
                setActiveBar(undefined);
              }
            }}
            onMouseLeave={() => setActiveBar(undefined)}
            style={{ cursor: "pointer" }}
          >
            <Bar dataKey="value">
              {graphData.map(({ value }, index) => (
                <Cell
                  key={index}
                  fill={
                    activeBar === index
                      ? // Handle active
                        value > 1 // Has actual result
                        ? "#28d768"
                        : value < -1 // Lost with actual result 
                        ? "#dc2626"
                        : "#9ca3af" // No result/upcoming (gray)
                      : // Handle inactive
                      value > 1
                      ? "#4ade80"
                      : value < -1
                      ? "#ef4444"
                      : "#6b7280" // No result/upcoming (darker gray)
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export { FormGraph };
