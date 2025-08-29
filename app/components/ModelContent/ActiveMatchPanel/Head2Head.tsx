import React, { useState } from "react";
import type { FC } from "react";
import { ChevronDown } from "lucide-react";
import type { MatchEntity, PlayerProfile } from "~/types/model";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Avatar } from "../Avatar";
import { SurfaceBadge } from "../SurfaceBadge";

interface Props {
  match?: MatchEntity;
  homeProfile?: PlayerProfile;
  awayProfile?: PlayerProfile;
}

const Head2Head: FC<Props> = ({ match, homeProfile, awayProfile }) => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  let { homeH2h = 0, awayH2h = 0, headToHeadMatches = [] } = match || {};

  const { image: homeImage, name: homeName } = homeProfile || {};
  const { image: awayImage, name: awayName } = awayProfile || {};

  const toggleActive = () => setIsPanelOpen(!isPanelOpen);

  const isFacedEachOther = Number(homeH2h) + Number(awayH2h) !== 0;

  const homeAvatarProps = { image: getPlayerImageUrl(homeImage), width: "2.25rem" };
  const awayAvatarProps = { image: getPlayerImageUrl(awayImage), width: "2.25rem" };

  return (
    <div
      onClick={toggleActive}
      className={`bg-gray-800 rounded-md w-full p-3 md:px-[6%] md:py-6 pb-4 select-none hover:bg-gray-700 cursor-pointer ${
        !isPanelOpen && "hover:animate-pulse"
      }`}
    >
      <div className="relative flex flex-row justify-center items-center font-semibold text-white text-sm tracking-tighter">
        <h1 className="font-semibold truncate text-center pb-2">H2H</h1>
        <ChevronDown
          className={`ml-2 -mr-3 -mt-2 text-xl ${isPanelOpen && "rotate-180"}`}
        />
      </div>

      {/* Summary H2H */}
      <div className="flex flex-row justify-between items-center px-4">
        {/* Home */}
        <div className="flex flex-row justify-start items-center max-w-[50%] truncate">
          <Avatar {...homeAvatarProps} />

          <div className="flex flex-col justify-start text-white max-w-[65%] md:max-w-[100%]">
            <p className="text-base font-bold ml-2">{homeH2h}</p>
            <p className="ml-2 truncate text-left">
              {homeName && getLastAndFirstInitial(homeName)}
            </p>
          </div>
        </div>

        {/* Away */}
        <div className="flex flex-row justify-end items-center max-w-[50%]">
          <div className="flex flex-col justify-end text-white max-w-[65%] md:max-w-[100%] truncate">
            <p className="text-right text-base font-bold mr-2">{awayH2h}</p>
            <p className="mr-2 truncate text-right">
              {awayName && getLastAndFirstInitial(awayName)}
            </p>
          </div>

          <Avatar {...awayAvatarProps} />
        </div>
      </div>

      {/* Matches */}
      {isPanelOpen && (
        <div className="flex flex-col justify-center items-center pb-2 pt-6">
          {headToHeadMatches &&
            (isFacedEachOther ? (
              headToHeadMatches.map(
                ({ tournament, home, away, year, surface, result }: any, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col items-start py-2 text-sm text-gray-400 w-full px-3"
                  >
                    <div className="flex flex-row items-center w-full pb-2 font-[800] tracking-wide text-[0.65rem]">
                      <div className="h-2.5 w-2.5 mr-2">
                        <SurfaceBadge surface={surface ?? "hard"} />
                      </div>
                      <p>{tournament}</p>
                    </div>
                    <div className="flex flex-row justify-between w-full">
                      {/* Date */}
                      <div className="flex flex-col justify-center text-[0.6rem] text-center">
                        <p>{year}</p>
                        <p>FT</p>
                      </div>

                      {/* Players */}
                      <div className="flex flex-col justify-start w-1/3">
                        <p className="text-white font-semibold truncate">
                          {home}
                        </p>
                        <p className="truncate">{away}</p>
                      </div>

                      {/* Results: Games */}
                      <div className="flex flex-row w-1/4">
                        {/* First set */}
                        <div className="flex flex-col pr-3">
                          <p className="text-white font-semibold">
                            {result?.homeGamesFirstSet}
                          </p>
                          <p>{result?.awayGamesFirstSet}</p>
                        </div>

                        {/* Second set */}
                        <div className="flex flex-col pr-3">
                          <p className="text-white font-semibold">
                            {result?.homeGamesSecondSet}
                          </p>
                          <p>{result?.awayGamesSecondSet}</p>
                        </div>

                        {/* Possible third set */}
                        {result?.homeGamesThirdSet ||
                        result?.awayGamesThirdSet ? (
                          <div className="flex flex-col pr-3">
                            <p className="text-white font-semibold">
                              {result?.homeGamesThirdSet}
                            </p>
                            <p>{result?.awayGamesThirdSet}</p>
                          </div>
                        ) : null}

                        {/* Possible fourth set */}
                        {result?.homeGamesFourthSet ||
                        result?.awayGamesFourthSet ? (
                          <div className="flex flex-col pr-3">
                            <p className="text-white font-semibold">
                              {result?.homeGamesFourthSet}
                            </p>
                            <p>{result?.awayGamesFourthSet}</p>
                          </div>
                        ) : null}

                        {/* Possible fifth set */}
                        {result?.homeGamesFifthSet ||
                        result?.awayGamesFifthSet ? (
                          <div className="flex flex-col pr-3">
                            <p className="text-white font-semibold">
                              {result?.homeGamesFifthSet}
                            </p>
                            <p>{result?.awayGamesFifthSet}</p>
                          </div>
                        ) : null}
                      </div>

                      {/* Results: Sets */}
                      <div className="flex flex-col">
                        <p className="text-white font-semibold">
                          {result?.homeSets}
                        </p>
                        <p>{result?.awaySets}</p>
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="text-gray-400">
                This is their first time facing each other.
              </p>
            ))}
        </div>
      )}
    </div>
  );
};

export { Head2Head };
