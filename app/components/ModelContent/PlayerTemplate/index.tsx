import { useNavigate } from "react-router";
import React from "react";
import type { FC } from "react";
import { IoArrowBackSharp } from "react-icons/io5";
import countryCodes from "../../../data/model/countries.json";
import type { PlayerEntity } from "../../../types";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Avatar } from "../Avatar";
import { FormGraph } from "../FormGraph";
import { SurfaceRecords } from "../SurfaceRecords";
import { RightSection } from "./RightSection";
import { LastMatchesDetailed } from "./RightSection/LastMatchesDetailed";

interface Props {
  player: PlayerEntity;
}

const PlayerTemplate: FC<Props> = ({ player }) => {
  const { profile, lastMatches, upcomingMatch, record } = player as any; // Type compatibility

  let { name, image, country, age, hand, height, singlesRank } = profile || {};

  const navigate = useNavigate();

  // Get country's flag
  const countryCode =
    country &&
    countryCodes
      .find(
        ({ name }) =>
          country && name.toLowerCase().includes(country.toLowerCase())
      )
      ?.code.toLowerCase();
  const flag = countryCode ? `${import.meta.env.VITE_SCRAPING_FLAGS_URL}${countryCode}.png` : undefined;

  // Camelcase hand & country fields
  hand = hand && hand.charAt(0).toUpperCase() + hand.slice(1, hand.length);
  country =
    country &&
    country.charAt(0).toUpperCase() + country.slice(1, country.length);

  // Navigate back
  const handleNavigateBack = () => navigate(-1);

  const avatarProps = { image: getPlayerImageUrl(image), width: "3rem" };
  const flagAvatarProps = { image: flag };
  const nationalityAvatarProps = { image: flag, width: "0.75rem" };
  const formGraphProps = {
    lastMatches,
    graphHeight: "h-[25vh] md:h-[30vh]",
  };
  const surfaceRecordsProps = {
    allSurfaces: true,
    currentSurface: upcomingMatch?.surface,
    record,
  };
  const lastMatchesDetailedProps = { player: name, lastMatches };

  return (
    <div className="flex flex-col w-full h-full px-5 py-2">
      {/* Go back */}
      <div className="flex flex-row items-center pb-6">
        {/* Back / Close panel button */}
        <button
          onClick={handleNavigateBack}
          className="rounded-full px-2 -ml-3 mr-1 hover:py-2 h-10 hover:bg-secondary"
        >
          <IoArrowBackSharp className="text-2xl text-white" />
        </button>

        {/* Avatar & Name */}
        <div className="flex flex-col w-full max-w-[90%] text-white ml-1 mr-2">
          <div className="flex flex-row items-center mt-2">
            {/* Headshot and country flag */}
            <div className="relative">
              <div className="mr-2 md:mr-4">
                <Avatar {...avatarProps} />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 md:bottom-0 md:right-0 w-4 h-4 mx-2 md:mx-3 rounded-full aspect-square">
                <Avatar {...flagAvatarProps} />
              </div>
            </div>

            {/* Name */}
            <h1 className="text-3xl text-white font-[800] tracking-tight truncate">
              {name}
            </h1>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="flex flex-col gap-2 text-sm text-white py-3 md:py-6 w-full px-4">
        {/* Rank & Nationality */}
        <div className="flex flex-row w-full md:w-[70%]">
          {singlesRank ? (
            <p className="font-bold w-full">
              {singlesRank}{" "}
              <span className="text-[0.6rem] font-[800] text-fourth">
                RANK{" "}
              </span>
              🏆
            </p>
          ) : null}

          {country && (
            <div className="flex flex-row justify-end md:justify-start items-baseline w-full">
              <span className="truncate">{country}</span>

              <span className="text-[0.6rem] mx-1 text-fourth font-[800]">
                NATIONALITY
              </span>
              <Avatar {...nationalityAvatarProps} />
            </div>
          )}
        </div>

        {/* Age & Hand */}
        <div className="flex flex-row w-full md:w-[70%]">
          {age ? (
            <p className="font-bold w-full">
              {age}{" "}
              <span className="text-[0.6rem] font-[800] text-fourth">YRS </span>
              🎂
            </p>
          ) : null}

          {hand && (
            <p className="flex justify-end md:justify-start w-full truncate">
              {hand}-Handed
              <span className="text-[0.6rem] font-[800] text-fourth mx-1">
                PLAYS
              </span>
              👋
            </p>
          )}
        </div>

        {/* Height */}
        <div className="flex flex-row w-full md:w-[70%]">
          {height && (
            <p className="font-bold self-center">
              {hand}{" "}
              <span className="text-[0.6rem] font-[800] text-fourth">TALL</span>{" "}
              📏
            </p>
          )}
        </div>
      </div>

      {/* Form graph */}
      <div className="my-4">
        <h1 className="font-[800] tracking-tight text-xl md:text-2xl mb-4 text-white">
          Recent Form
        </h1>
        <div className="w-full p-6 rounded-md bg-secondary">
          <FormGraph isDetailed {...formGraphProps} />
        </div>
      </div>

      {/* Overall record */}
      <div className="my-4">
        <h1 className="font-[800] tracking-tight text-xl md:text-2xl mb-4 text-white">
          Records
        </h1>
        <div className="w-full rounded-md bg-secondary p-2 py-4 md:py-5 md:px-4 text-fourth text-xs md:mb-10">
          <SurfaceRecords {...surfaceRecordsProps} />
        </div>
      </div>

      {/* Mobile only matches */}
      <div className="md:hidden my-4">
        <h1 className="font-[800] tracking-tight text-xl md:text-2xl mb-4 text-white">
          Last Matches
        </h1>

        <LastMatchesDetailed {...lastMatchesDetailedProps} />
      </div>
    </div>
  );
};

export { PlayerTemplate, RightSection };
