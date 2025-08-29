import React from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import type { PlayerEntity } from "~/types";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Avatar } from "~/components/ModelContent/Avatar";
import { FormGraph } from "~/components/ModelContent/FormGraph";

interface Props {
  player?: PlayerEntity;
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
}

const PlayerStreakCard: FC<Props> = ({ player, setActivePlayerId }) => {
  const { playerId, profile, lastMatches, streak } = player || {};
  let { image, name } = profile || {};

  // Format name in "Federed R." format - handle cases where name might not have multiple parts
  let formattedName = name;
  if (name && name.includes(' ')) {
    let nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      const last = nameParts[nameParts.length - 1]; // Last name
      const first = nameParts[0]; // First name
      const initial = first.charAt(0) + ".";
      formattedName = `${last} ${initial}`;
    }
  }

  const wins = lastMatches?.reduce(
    (acc, { home, result }) => (home === result?.winner ? ++acc : acc),
    0
  );
  const losses = lastMatches && wins && lastMatches.length - wins;
  const record = wins && losses ? `(${wins}-${losses})` : null;

  const avatarProps = { image: getPlayerImageUrl(image), width: "3rem" };
  const formGraphProps = {
    lastMatches,
    graphHeight: "h-10",
    graphGap: 0.1,
  };

  const handleClick = () => {
    if (playerId) {
      setActivePlayerId(playerId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-row justify-start items-center px-6 py-3 hover:bg-secondary rounded-sm text-xs text-white cursor-pointer"
    >
      <div className="px-2 flex justify-center">
        <Avatar {...avatarProps} />
      </div>

      <div className="flex flex-col justify-center items-start w-[85%] px-2">
        {/* Details */}
        <div className="flex flex-row items-center w-full">
          <p className="text-sm font-semibold mr-1">{formattedName}</p>
          <p className="text-xs font-[800] tracking-wide">
            <span className="text-tertiary">{record}</span> {streak} 🔥
          </p>
        </div>

        {/* Form graph */}
        <div className="h-full w-[100%]">
          <FormGraph {...formGraphProps} />
        </div>
      </div>
    </div>
  );
};

export { PlayerStreakCard };
