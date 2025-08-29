import React from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import type { PlayerEntity } from "~/types";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Avatar } from "~/components/ModelContent/Avatar";
import { FormGraph } from "~/components/ModelContent/FormGraph";

interface Props {
  player?: PlayerEntity;
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
}

const PlayerFormCard: FC<Props> = ({ player, setActivePlayerId }) => {
  const { playerId, profile, lastMatches } = player || {};
  let { image, name } = profile || {};

  let formattedName = name && getLastAndFirstInitial(name);

  const wins = lastMatches?.reduce(
    (acc, { home, result }) => (home === result?.winner ? ++acc : acc),
    0
  );
  const losses = lastMatches && wins && lastMatches.length - wins;
  const record = wins && losses ? `(${wins}-${losses})` : null;

  const avatarProps = { image: getPlayerImageUrl(image || profile?.image), width: "3rem" };
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
      className="flex flex-row justify-start items-center px-6 py-2 hover:bg-secondary text-xs text-white cursor-pointer"
    >
      <div className="px-2 flex justify-center">
        <Avatar {...avatarProps} />
      </div>

      <div className="flex flex-col justify-center items-start w-[85%] px-2 ">
        {/* Details */}
        <div className="flex flex-row items-baseline w-full text-sm leading-4">
          <p className="font-semibold text-sm mr-1">{formattedName}</p>
          <p className="text-xs font-[800] tracking-wide text-tertiary">
            {record}
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

export { PlayerFormCard };
