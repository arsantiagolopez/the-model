import moment from "moment";
import React, { useContext } from "react";
import type { FC, MouseEventHandler } from "react";
import { useNavigate } from "react-router";
import { PreferencesContext } from "~/contexts/preferences-context";
import type { MatchEntity } from "~/types/model";
import { getCountryEmoji } from "~/utils/model/getCountryEmoji";
import { getFormattedOdds } from "~/utils/model/getFormattedOdds";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
import { SurfaceBadge } from "../../SurfaceBadge";
import { ScheduleSkeleton } from "./ScheduleSkeleton";

// Temporary types
interface DetailsHash {
  [key: string]: {
    points: string;
    countryCode: string;
  };
}

interface TournamentDetails {
  tournamentId: string;
  points: string;
  countryCode: string;
  surface?: string;
  type?: string;
}

interface Props {
  matches: MatchEntity[] | null;
  handleToggleOdds: MouseEventHandler<HTMLDivElement>;
  handleSetActiveMatchId: (id: string) => void;
  detailsHash: DetailsHash | null;
  handleToggleSchedule?: () => void;
  tournamentDetails?: TournamentDetails[];
}

const Schedule: FC<Props> = ({
  matches,
  handleToggleOdds,
  handleSetActiveMatchId,
  detailsHash,
  handleToggleSchedule,
  tournamentDetails = [],
}) => {
  const preferencesContext = useContext(PreferencesContext);
  const { oddsFormat } = preferencesContext || { oddsFormat: 'american' as 'american' | 'decimal' };

  const navigate = useNavigate();

  const goToLink = (
    link: string,
    event?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (event) {
      event.stopPropagation();
    }
    navigate(link);
  };

  // Navigate to match and toggle schedule
  const handleSetActive = (matchId: string) => {
    navigate(`/match/${matchId}`);

    if (handleToggleSchedule) {
      handleToggleSchedule();
    }
  };

  return (
    <div className="text-white mx-3">
      {!matches ? (
        // Matches are loading
        <ScheduleSkeleton />
      ) : !matches.length ? (
        // No matches fetched
        <div className="flex flex-row justify-center pt-2 pb-6 text-center text-white font-[800]">
          No matches found.
        </div>
      ) : (
        <div className="flex flex-col pb-6">
          {
            // Display list of matches
            // @todo: isExpanded for mobile ?
            // isExpanded &&
            matches.map(
              (
                {
                  id,
                  matchId,
                  tournament,
                  tournamentLink,
                  date,
                  home,
                  away,
                  homeLink,
                  awayLink,
                  homeH2h,
                  awayH2h,
                  homeOdds,
                  awayOdds,
                },
                index
              ) => {
                const isNewTournament =
                  index === 0 ||
                  (matches &&
                    matches[index - 1]?.tournamentLink !== tournamentLink);

                // Handle date from database (could be JSONB or string)
                const parsedDate = typeof date === 'string' ? date : (date as any);
                const isValidDate = parsedDate && moment(parsedDate).isValid();
                const time = isValidDate
                  ? moment(parsedDate).format("HH:mm")
                  : "--:--";

                const { surface, type } =
                  tournamentDetails?.find(
                    (details) => details.tournamentId === tournamentLink
                  ) || {};

                const typeEmojis = type === "singles" ? "🎾" : "🎾🎾";
                const countryEmoji = detailsHash
                  ? getCountryEmoji(detailsHash[tournamentLink]?.countryCode)
                  : null;

                return (
                  <div key={matchId} className="flex flex-col -mx-3">
                    {/* New tournament header (1 row) */}
                    {isNewTournament && (
                      <div
                        // @todo: Update once Tournament integration
                        // onClick={() => goToLink(`/tournament${tournamentLink}`)}
                        className="flex flex-row items-baseline w-full text-xs text-center font-[800] tracking-wide text-gray-400 py-1 mt-2 px-3 xl:px-6"
                      >
                        <div className="flex flex-row items-center justify-center w-[12%] min-w-[3rem] text-[0.5rem]">
                          <div className="flex items-center w-3 h-3 mr-1">
                            <SurfaceBadge surface={surface} />
                          </div>
                          <div className="text-xs mr-1">{typeEmojis}</div>
                        </div>
                        <p className="w-[60%] min-w-[6rem] md:min-w-[6rem] text-left truncate hover:underline">
                          {tournament}{" "}
                          <span className="text-sm ml-2">{countryEmoji}</span>
                        </p>
                        <p className="w-[10%] min-w-[3rem] tracking-tight">
                          H2H
                        </p>
                        <p className="w-[10%] min-w-[3rem] tracking-tight">
                          Home
                        </p>
                        <p className="w-[10%] min-w-[3rem] tracking-tight">
                          Away
                        </p>
                      </div>
                    )}

                    {/* Matches row */}
                    <div
                      onClick={() => handleSetActive(matchId)}
                      className="flex flex-row w-full text-center py-1 hover:bg-gray-700 cursor-pointer text-xs px-3 xl:px-6"
                    >
                      <p className="w-[12%] min-w-[3rem] flex justify-center items-center pl-1 pr-2 text-xs text-gray-400 font-semibold tracking-tightest">
                        {time}
                      </p>
                      <div className="flex flex-col items-start w-[60%] min-w-[6rem] md:min-w-[6rem] truncate">
                        <button
                          className="truncate max-w-[100%] text-xs"
                          onClick={(event) =>
                            homeLink && goToLink(`/model/${homeLink.replace('/player/', '').replace('/', '')}`, event)
                          }
                        >
                          {home && getLastAndFirstInitial(home)}
                        </button>
                        <button
                          className="truncate max-w-[100%] text-xs"
                          onClick={(event) =>
                            awayLink && goToLink(`/model/${awayLink.replace('/player/', '').replace('/', '')}`, event)
                          }
                        >
                          {away && getLastAndFirstInitial(away)}
                        </button>
                      </div>
                      <div className="w-[10%] min-w-[3rem] font-semibold">
                        <p>{homeH2h}</p>
                        <p>{awayH2h}</p>
                      </div>
                      <p
                        onClick={handleToggleOdds}
                        className="w-[10%] min-w-[3rem] self-center font-semibold"
                      >
                        {getFormattedOdds(homeOdds, oddsFormat)}
                      </p>
                      <p
                        onClick={handleToggleOdds}
                        className="w-[10%] min-w-[3rem] self-center font-semibold"
                      >
                        {getFormattedOdds(awayOdds, oddsFormat)}
                      </p>
                    </div>
                  </div>
                );
              }
            )
          }
        </div>
      )}
    </div>
  );
};

export { Schedule };
