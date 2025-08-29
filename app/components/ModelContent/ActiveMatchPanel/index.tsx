import moment from "moment";
import { Link, useNavigate } from "react-router";
import React from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { ExternalLink, ArrowLeft } from "lucide-react";
import countryCodes from "~/data/model/countries.json";
import type { MatchEntity, ParlayLeg, PlayerProfile } from "~/types/model";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { useMatchData } from "~/hooks/use-match-data";
import { usePlayerProfile } from "~/hooks/use-player-profile";
import { Avatar } from "../Avatar";
import { SurfaceBadge } from "../SurfaceBadge";
import { CountdownToDate } from "./CountdownToDate";
import { Head2Head } from "./Head2Head";
import { LastMatches } from "./LastMatches";
import { Odds } from "./Odds";
import { Records } from "./Records";

interface Props {
  activeMatchId: string | null;
  resetActiveIds: () => void;
  toggleOdds: () => void;
  oddsFormat: 'american' | 'decimal';
  isParlayActive: boolean;
  setIsParlayActive: Dispatch<SetStateAction<boolean>>;
  parlayLegs?: ParlayLeg[];
  setParlayLegs: Dispatch<SetStateAction<ParlayLeg[] | undefined>>;
}

const ActiveMatchPanel: FC<Props> = ({
  activeMatchId,
  resetActiveIds,
  toggleOdds,
  oddsFormat,
  isParlayActive,
  setIsParlayActive,
  parlayLegs,
  setParlayLegs,
}) => {
  const navigate = useNavigate();
  
  // Fetch match data with last matches using React Router 7 pattern
  const { data: match, loading: matchLoading } = useMatchData(activeMatchId, true);
  const TENNIS_EXPLORER_MATCH_INFO_LINK =
    match && `https://tennisexplorer.com${match.matchLink}`;

  let { tournament, round, home, away, homeLink, awayLink, surface, date } =
    match || {};

  // Fetch player profiles using React Router 7 pattern
  const { data: homeProfile, loading: homeLoading } = usePlayerProfile(homeLink);
  const { data: awayProfile, loading: awayLoading } = usePlayerProfile(awayLink);

  const {
    image: homeImage,
    singlesRank: homeRank,
    country: homeCountry,
    sex: homeSex,
  } = homeProfile || {};
  const {
    image: awayImage,
    singlesRank: awayRank,
    country: awayCountry,
    sex: awaySex,
  } = awayProfile || {};

  // Deduce tour by players' sex
  const tour = homeSex === "woman" || awaySex === "woman" ? "wta" : "atp";

  // Get country flags
  const homeCountryCode =
    homeCountry &&
    countryCodes
      .find(({ name }) =>
        name.toLowerCase().includes(homeCountry.toLowerCase())
      )
      ?.code.toLowerCase();
  const awayCountryCode =
    awayCountry &&
    countryCodes
      .find(({ name }) =>
        name.toLowerCase().includes(awayCountry.toLowerCase())
      )
      ?.code.toLowerCase();

  const homeFlag = homeCountryCode ? `${import.meta.env.VITE_SCRAPING_FLAGS_URL}${homeCountryCode}.png` : undefined;
  const awayFlag = awayCountryCode ? `${import.meta.env.VITE_SCRAPING_FLAGS_URL}${awayCountryCode}.png` : undefined;

  // Get start time
  date = moment(date).toDate();
  const isStartTomorrow = moment(date).isAfter(moment(new Date()).endOf("day"));
  const formattedDate = moment(date).format("h:mm A");
  
  const homeAvatarProps = { image: getPlayerImageUrl(homeImage), width: "5rem" };
  const awayAvatarProps = { image: getPlayerImageUrl(awayImage), width: "5rem" };
  const homeFlagAvatarProps = { image: homeFlag };
  const awayFlagAvatarProps = { image: awayFlag };
  const countdownToDateProps = { date };
  const recordsProps = { match, homeLink, awayLink };
  const lastMatchesProps = { match };
  
  // Legacy API returns PlayerProfile directly, not wrapped in profile object
  const head2HeadProps = { match, homeProfile, awayProfile };
  const oddsProps = {
    match,
    toggleOdds,
    oddsFormat,
    homeImage,
    awayImage,
    isParlayActive,
    setIsParlayActive,
    parlayLegs,
    setParlayLegs,
    resetActiveIds,
  };

  // Show loading or error state
  if (matchLoading || homeLoading || awayLoading) {
    return (
      <div className="relative w-full h-auto mb-10 md:mb-4 pt-3 pb-4 px-5 text-sm text-white">
        <div className="flex flex-col items-center justify-center py-20">
          <button
            onClick={resetActiveIds}
            className="mb-4 rounded-full px-2 py-2 hover:bg-gray-800"
          >
            <ArrowLeft className="text-2xl h-6 w-6" />
          </button>
          <p className="text-xl font-bold text-blue-400">Loading match data...</p>
        </div>
      </div>
    );
  }
  
  // Show message if match not found
  if (!match) {
    return (
      <div className="relative w-full h-auto mb-10 md:mb-4 pt-3 pb-4 px-5 text-sm text-white">
        <div className="flex flex-col items-center justify-center py-20">
          <button
            onClick={resetActiveIds}
            className="mb-4 rounded-full px-2 py-2 hover:bg-gray-800"
          >
            <ArrowLeft className="text-2xl h-6 w-6" />
          </button>
          <p className="text-xl font-bold text-red-400">Match not found</p>
          <p className="text-gray-400">ActiveMatchId: {activeMatchId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-auto mb-10 md:mb-4 pt-3 pb-4 px-5 text-sm text-white">
      {/* Page Header */}
      <div className="flex flex-row items-start justify-between w-full">
        {/* Left */}
        <div className="flex flex-row items-center w-full">
          {/* Back / Close panel button */}
          <button
            onClick={resetActiveIds}
            className="rounded-full px-2 -ml-3 mr-1 hover:py-2 h-10 hover:bg-gray-800"
          >
            <ArrowLeft className="text-2xl h-6 w-6" />
          </button>

          {/* Middle */}
          <div className="flex flex-col w-full max-w-[85%] md:max-w-full">
            {/* Tournament & round */}
            <p className="truncate mb-1 font-[800] text-gray-400 tracking-wide text-xs max-w-full">
              {/* <Link to={`/model/tournament${tournamentLink}`}> */}
              <span
                className="inline"
                // className="inline underline cursor-pointer"
              >
                {tournament}{" "}
              </span>
              {/* </Link> */}– <span className="capitalize">{round}</span>
            </p>

            {/* Headline */}
            <h1 className="flex flex-row items-center text-2xl tracking-tight truncate text-white font-[800] leading-6">
              <span className="truncate py-0.5">
                {home ? getLastAndFirstInitial(home) : '[NO HOME]'}
              </span>
              <span className="mx-1 md:mx-2">–</span>
              <span className="truncate py-0.5">
                {away ? getLastAndFirstInitial(away) : '[NO AWAY]'}
              </span>
              <span className="h-6 w-auto mx-3">
                <SurfaceBadge surface={surface || 'hard'} withText />
              </span>
            </h1>
          </div>
        </div>

        {/* External link button */}
        <a
          href={TENNIS_EXPLORER_MATCH_INFO_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-6 mt-1 md:mt-0 md:block p-2 hover:bg-gray-800 rounded-full -mr-3 "
        >
          <ExternalLink className="text-white text-xl hover:animate-pulse h-5 w-5" />
        </a>
      </div>

      {/* Simplified match info */}
      <div className="flex flex-row justify-around items-center pt-14 md:pt-20 pb-12">
        {/* Home Player */}
        <div className="flex flex-col justify-center items-center">
          {homeRank && homeRank > 0 ? (
            <p className="flex flex-row text-center uppercase rounded-full w-auto min-w-[2rem] px-2 py-0.5 bg-gray-800 text-blue-500 hover:bg-gray-700 hover:text-white mb-4 -mt-6 text-[0.6rem]">
              {tour} {homeRank}
            </p>
          ) : null}

          {homeLink ? (
            <Link 
              to={`/player/${homeLink.replace('/player/', '').replace(/\/$/, '')}`}
              className="relative cursor-pointer"
              onClick={() => console.log('HOME LINK CLICKED:', homeLink)}
            >
              <Avatar {...homeAvatarProps} />
              {homeFlag && (
                <div className="absolute -bottom-1.5 -left-1.5 md:bottom-0 md:right-0 w-5 h-5 mx-2 md:mx-3 rounded-full aspect-square">
                  <Avatar {...homeFlagAvatarProps} />
                </div>
              )}
            </Link>
          ) : (
            <div className="relative">
              <Avatar {...homeAvatarProps} />
              {homeFlag && (
                <div className="absolute -bottom-1.5 -left-1.5 md:bottom-0 md:right-0 w-5 h-5 mx-2 md:mx-3 rounded-full aspect-square">
                  <Avatar {...homeFlagAvatarProps} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Match Info */}
        <div className="flex flex-col justify-center items-center text-xs text-gray-400">
          <p className="text-gray-400 font-semibold">
            {isStartTomorrow ? "Tomorrow" : "Today"}
          </p>
          <p className="text-white text-lg font-semibold">{formattedDate}</p>
          <CountdownToDate {...countdownToDateProps} />
        </div>

        {/* Away Player */}
        <div className="flex flex-col justify-center items-center">
          {awayRank && awayRank > 0 ? (
            <p className="flex flex-row text-center uppercase rounded-full w-auto min-w-[2rem] px-2 py-0.5 bg-gray-800 text-blue-500 hover:bg-gray-700 hover:text-white mb-4 -mt-6 text-[0.6rem]">
              {tour} {awayRank}
            </p>
          ) : null}
          
          {awayLink ? (
            <Link 
              to={`/player/${awayLink.replace('/player/', '').replace(/\/$/, '')}`}
              className="relative cursor-pointer"
              onClick={() => console.log('AWAY LINK CLICKED:', awayLink)}
            >
              <Avatar {...awayAvatarProps} />
              {awayFlag && (
                <div className="absolute -bottom-1.5 -right-1.5 md:bottom-0 md:-right-2 w-5 h-5 mx-2 md:mx-3 rounded-full aspect-square">
                  <Avatar {...awayFlagAvatarProps} />
                </div>
              )}
            </Link>
          ) : (
            <div className="relative">
              <Avatar {...awayAvatarProps} />
              {awayFlag && (
                <div className="absolute -bottom-1.5 -right-1.5 md:bottom-0 md:-right-2 w-5 h-5 mx-2 md:mx-3 rounded-full aspect-square">
                  <Avatar {...awayFlagAvatarProps} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Head 2 Head */}
      <Head2Head {...head2HeadProps} />

      {/* Records */}
      <Records {...recordsProps} />

      {/* Odds */}
      <Odds {...oddsProps} />

      {/* Players Last Matches */}
      <LastMatches {...lastMatchesProps} />
    </div>
  );
};

export { ActiveMatchPanel };
