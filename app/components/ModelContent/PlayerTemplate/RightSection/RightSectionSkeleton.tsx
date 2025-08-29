import React from "react";
import type { FC } from "react";

interface Props {}

const RightSectionSkeleton: FC<Props> = () => (
  <div className="flex flex-col">
    {Array(10)
      .fill(0)
      .map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 animate-pulse hover:bg-secondary px-5 my-2"
        >
          <div className="h-5 w-1/2 bg-secondary rounded-md" />
          <div className="h-5 w-4/5 bg-secondary rounded-md" />
        </div>
      ))}
  </div>
);

export { RightSectionSkeleton };
