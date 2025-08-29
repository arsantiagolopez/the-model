import React from "react";
import type { FC } from "react";

interface Props {}

const ScheduleSkeleton: FC<Props> = () => (
  <div className="flex flex-col -mx-3">
    {/* New tournament */}
    {HeaderSkeleton}
    {Array(5)
      .fill(0)
      .map((_, index) => (
        <div key={index}>{MatchSkeleton}</div>
      ))}

    {/* New tournament */}
    {HeaderSkeleton}
    {Array(10)
      .fill(0)
      .map((_, index) => (
        <div key={index}>{MatchSkeleton}</div>
      ))}
  </div>
);

export { ScheduleSkeleton };

// Match skeleton
const MatchSkeleton = (
  <div className="flex flex-row items-center w-full text-center py-1 hover:bg-tertiary cursor-pointer h-12 px-3">
    <p className="w-[10%] min-w-[2rem] flex justify-center items-center px-1 h-4 bg-primary animate-pulse rounded-sm"></p>
    <div className="flex flex-col items-start w-[60%] min-w-[6rem] md:min-w-[9rem] ml-4">
      <p className="h-4 w-[40%] bg-primary animate-pulse my-0.5 rounded-sm"></p>
      <p className="h-4 w-[50%] bg-primary animate-pulse my-0.5 rounded-sm"></p>
    </div>
    <div className="w-[10%] min-w-[3rem]">
      <p className="h-4 w-[50%] bg-primary animate-pulse my-0.5 rounded-sm"></p>
      <p className="h-4 w-[50%] bg-primary animate-pulse my-0.5 rounded-sm"></p>
    </div>
    <p className="h-4 w-[10%] bg-primary animate-pulse min-w-[3rem] mx-2 self-center"></p>
    <p className="h-4 w-[10%] bg-primary animate-pulse min-w-[3rem] mx-2 self-center"></p>
  </div>
);

// Tournament header skeleton
const HeaderSkeleton = (
  <div className="flex flex-row w-auto bg-primary text-center font-semibold py-1 my-1 rounded-sm hover:bg-tertiary cursor-pointer h-6 animate-pulse mx-3"></div>
);
