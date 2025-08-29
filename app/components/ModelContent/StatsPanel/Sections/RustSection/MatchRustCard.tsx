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
import type { MatchPlayerProfilesAndDates } from "~/types";
import { getFormattedOdds } from "~/utils/model/getFormattedOdds";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Avatar } from "~/components/ModelContent/Avatar";

interface Props {
  match: MatchPlayerProfilesAndDates;
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
}

const MatchRustCard: FC<Props> = ({ match, setActivePlayerId }) => {
  const navigate = useNavigate();
  const {
    match: matchEntity,
    homeProfile,
    awayProfile,
    homeDaysSinceLastMatch,
    awayDaysSinceLastMatch,
  } = match;

  const { name: homeName, image: homeImage } = homeProfile;
  const { name: awayName, image: awayImage } = awayProfile;

  const { matchId, homeLink, homeOdds, awayOdds } = matchEntity;

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
      className="flex flex-row justify-between items-center px-6 py-3 hover:bg-secondary rounded-sm text-xs cursor-pointer"
    >
      {/* Home info */}
      <div className="flex flex-row justify-start w-full max-w-[50%]">
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
          <p className="flex flex-row items-baseline text-sm font-semibold truncate">
            {Math.abs(homeDaysSinceLastMatch || 0)}d{" "}
            <span className="text-xs text-tertiary font-[800] mx-1">
              ({getFormattedOdds(homeOdds, oddsFormat)})
            </span>
            <span className="text-xl self-center leading-5">
              {Math.abs(homeDaysSinceLastMatch || 0) > 50 ? " 💥" : " "}
            </span>
          </p>
        </div>
      </div>

      {/* Away info */}
      <div className="flex flex-row justify-end w-full max-w-[50%]">
        <div
          onClick={handleToggleOdds}
          className="z-10 flex flex-col text-right mr-2 text-white"
        >
          <p className="text-sm font-semibold truncate">
            {awayName && getLastAndFirstInitial(awayName)}
          </p>
          <p className="flex flex-row justify-end items-baseline text-sm text-white font-semibold truncate">
            <span className="text-xl self-center leading-5">
              {Math.abs(awayDaysSinceLastMatch || 0) > 50 && "💥 "}
            </span>
            <span className="text-xs text-tertiary font-[800] mx-1">
              ({getFormattedOdds(awayOdds, oddsFormat)})
            </span>{" "}
            {Math.abs(awayDaysSinceLastMatch || 0)}d{" "}
          </p>
        </div>

        <div className="px-2 flex justify-end">
          <Avatar {...awayAvatarProps} />
        </div>
      </div>
    </div>
  );
};

export { MatchRustCard };
