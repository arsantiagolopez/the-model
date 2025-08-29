import React, {
  useContext,
} from "react";
import type {
  Dispatch,
  FC,
  MouseEventHandler,
  SetStateAction,
} from "react";
import { useNavigate } from "react-router";
import { PreferencesContext } from "~/contexts/preferences-context";
import type { MatchPlayerProfilesAndSurfaceRecords } from "~/types";
import { getFormattedOdds } from "~/utils/model/getFormattedOdds";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Avatar } from "~/components/ModelContent/Avatar";
import { SurfaceBadge } from "~/components/ModelContent/SurfaceBadge";

interface Props {
  match: MatchPlayerProfilesAndSurfaceRecords;
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
}

const MatchDominanceCard: FC<Props> = ({ match, setActivePlayerId }) => {
  const navigate = useNavigate();
  const {
    match: matchEntity,
    homeProfile,
    awayProfile,
    homeCurrentSurfaceRecord,
    awayCurrentSurfaceRecord,
  } = match;

  const { name: homeName, image: homeImage } = homeProfile || {};
  const { name: awayName, image: awayImage } = awayProfile || {};

  const { matchId, homeLink, homeOdds, awayOdds } = matchEntity || {};

  const preferencesContext = useContext(PreferencesContext);
  const { oddsFormat, toggleOdds } = preferencesContext || { 
    oddsFormat: 'american' as 'american' | 'decimal', 
    toggleOdds: () => {} 
  };

  // Toggle odds
  const handleToggleOdds: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    toggleOdds();
  };

  const homeRecord = homeCurrentSurfaceRecord 
    ? `${homeCurrentSurfaceRecord.win}/${homeCurrentSurfaceRecord.loss}` 
    : "N/A";
  const awayRecord = awayCurrentSurfaceRecord 
    ? `${awayCurrentSurfaceRecord.win}/${awayCurrentSurfaceRecord.loss}` 
    : "N/A";

  const homeAvatarProps = { image: getPlayerImageUrl(homeImage), width: "3rem" };
  const awayAvatarProps = { image: getPlayerImageUrl(awayImage), width: "3rem" };

  const handleMatchClick = () => {
    if (matchId) {
      navigate(`/match/${matchId}`);
    }
  };

  return (
    <div
      onClick={handleMatchClick}
      className="flex flex-row justify-between items-center px-6 py-3 hover:bg-secondary text-xs cursor-pointer"
    >
      {/* Home info */}
      <div className="flex flex-row justify-start items-center w-full max-w-[50%]">
        <div className="px-2 flex justify-start">
          <Avatar {...homeAvatarProps} />
        </div>

        <div
          onClick={handleToggleOdds}
          className="flex flex-col text-left ml-2 text-white"
        >
          <p className="text-sm font-semibold truncate">
            {homeName && getLastAndFirstInitial(homeName)}
          </p>
          <div className="flex flex-row items-center text-sm text-white font-semibold truncate">
            <div className="h-3.5 w-3.5 mr-2">
              <SurfaceBadge surface={match?.match.surface} />
            </div>
            {homeRecord}{" "}
            <span className="text-xs text-tertiary font-[800] mx-1">
              ({getFormattedOdds(homeOdds, oddsFormat)})
            </span>
            <span className="text-base">
              {/* {Math.abs(homeDaysSinceLastMatch) > 50 ? " 💥" : " "} */}
            </span>
          </div>
        </div>
      </div>

      {/* Away info */}
      <div className="flex flex-row justify-end items-center w-full max-w-[50%]">
        <div
          onClick={handleToggleOdds}
          className="z-10 flex flex-col text-right mr-2 text-white"
        >
          <p className="text-sm font-semibold truncate">
            {awayName && getLastAndFirstInitial(awayName)}
          </p>
          <div className="flex flex-row justify-end items-center text-sm text-white font-semibold truncate">
            <span className="text-base">
              {/* {Math.abs(awayDaysSinceLastMatch) > 50 && "💥 "} */}
            </span>
            <span className="text-xs text-tertiary font-[800] mx-1">
              ({getFormattedOdds(awayOdds, oddsFormat)})
            </span>{" "}
            {awayRecord}
            <div className="h-3.5 w-3.5 ml-2">
              <SurfaceBadge surface={match?.match.surface} />
            </div>
          </div>
        </div>

        <div className="px-2 flex justify-end">
          <Avatar {...awayAvatarProps} />
        </div>
      </div>
    </div>
  );
};

export { MatchDominanceCard };
