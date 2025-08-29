import React from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import type { PlayerAndCountry } from "~/types";
import { getCountryEmoji } from "~/utils/model/getCountryEmoji";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Avatar } from "~/components/ModelContent/Avatar";

interface Props {
  player?: PlayerAndCountry;
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
}

const PlayerCountryCard: FC<Props> = ({ player, setActivePlayerId }) => {
  const { countryCode } = player || {};
  const { playerId, profile, lastMatches, upcomingMatch } =
    player?.player || {};
  let { image, name } = profile || {};

  let formattedName = name && getLastAndFirstInitial(name);

  const wins = lastMatches?.reduce(
    (acc, { home, result }) => (home === result?.winner ? ++acc : acc),
    0
  );
  const losses = lastMatches && wins && lastMatches.length - wins;
  const record = wins && losses ? `(${wins}-${losses})` : null;

  const avatarProps = { image: getPlayerImageUrl(image), width: "3rem" };

  const handleClick = () => {
    if (playerId) {
      setActivePlayerId(playerId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-row justify-start items-center px-6 py-3 hover:bg-secondary text-xs text-white cursor-pointer"
    >
      <div className="px-2 flex justify-center">
        <Avatar {...avatarProps} />
      </div>

      <div className="flex flex-col justify-center items-start w-[85%] px-2">
        {/* Tournament */}
        <div className="flex flex-row items-center w-full">
          <p className="text-2xl leading-6">{getCountryEmoji(countryCode)}</p>
          <p className="text-xs text-tertiary tracking-wider font-[800] capitalize pl-1">
            {upcomingMatch?.tournament}
          </p>
        </div>

        {/* Details */}
        <div className="flex flex-row w-full text-sm leading-4">
          <p className="pr-1">{formattedName}</p>
          <p className="text-xs font-[800] tracking-wide text-tertiary">
            {record}
          </p>
        </div>
      </div>
    </div>
  );
};

export { PlayerCountryCard };
