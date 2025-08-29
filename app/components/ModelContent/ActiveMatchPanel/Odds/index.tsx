import React, { useState } from "react";
import type { Dispatch, FC, MouseEventHandler, SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import type { MatchEntity, ParlayLeg } from "~/types/model";
import { getFormattedOdds } from "~/utils/model/getFormattedOdds";
import { getLastAndFirstInitial } from "~/utils/model/getLastAndFirstInitial";
// import { OneClickAddBetModal } from "./OneClickAddBetModal";

type SelectedWagerData = {
  type: string;
  wager: string;
  odds: number;
  spread?: number;
  line?: number;
};

interface Props {
  match?: MatchEntity;
  toggleOdds: () => void;
  oddsFormat: 'american' | 'decimal';
  homeImage?: string;
  awayImage?: string;
  isParlayActive: boolean;
  setIsParlayActive: Dispatch<SetStateAction<boolean>>;
  parlayLegs?: ParlayLeg[];
  setParlayLegs: Dispatch<SetStateAction<ParlayLeg[] | undefined>>;
  resetActiveIds: () => void;
}

const Odds: FC<Props> = ({
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
}) => {
  const [activeType, setActiveType] = useState<string | null>("moneyline");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedWagerData, setSelectedWagerData] = useState<
    SelectedWagerData | undefined
  >(undefined);

  const {
    home,
    away,
    odds,
    homeOdds: matchHomeOdds,
    awayOdds: matchAwayOdds,
  } = match || {};
  const { moneyline, spreadGames, totalGames, spreadSets } = odds || {};

  const homeOdds = moneyline?.home || matchHomeOdds;
  const awayOdds = moneyline?.away || matchAwayOdds;

  // Switch between active odds type, close panel on same match click
  const handleSetActiveType = (id: string) => {
    if (!activeType || activeType !== id) setActiveType(id);
    else setActiveType(null);
  };

  const handleToggleOdds:
    | MouseEventHandler<HTMLParagraphElement>
    | undefined = (event) => {
    event.stopPropagation();
    toggleOdds();
  };

  // Add selected bet as one of your own
  const oneClickAdd = (values: SelectedWagerData) => {
    // Update selected wager data
    setSelectedWagerData(values);

    // Open modal
    setIsModalOpen(true);
  };

  const oneClickAddBetModalProps = {
    isModalOpen,
    setIsModalOpen,
    selectedWagerData,
    match,
    homeImage,
    awayImage,
    isParlayActive,
    setIsParlayActive,
    parlayLegs,
    setParlayLegs,
    resetActiveIds,
  };

  return (
    <div className="bg-gray-800 rounded-md w-full">
      {/* Moneyline */}
      <div
        onClick={() => handleSetActiveType("moneyline")}
        className={`relative flex flex-row justify-center items-center p-2 cursor-pointer hover:bg-gray-700 hover:rounded-t-md ${
          !activeType && "hover:animate-pulse"
        }`}
      >
        <p className="font-semibold text-white text-sm tracking-tighter">
          Moneyline
        </p>
        <ChevronDown
          className={`absolute right-3 text-white ${
            activeType === "moneyline" && "rotate-180"
          }`}
        />
      </div>

      {activeType === "moneyline" &&
        (homeOdds || awayOdds ? (
          <div className="bg-primary flex flex-row justify-center items-center cursor-pointer">
            {/* Home Moneyline */}
            <button
              onClick={() =>
                homeOdds &&
                oneClickAdd({
                  type: "moneyline",
                  wager: "home",
                  odds: homeOdds,
                })
              }
              className="flex flex-row justify-between w-full border-r-[1px] border-gray-800 pr-3 truncate py-2 px-[5%] hover:bg-gray-700 hover:animate-pulse"
            >
              <p className="truncate max-w-[75%]">
                {home && getLastAndFirstInitial(home)}
              </p>
              <p
                onClick={handleToggleOdds}
                className="text-xs text-white cursor-pointer"
              >
                {homeOdds ? getFormattedOdds(homeOdds, oddsFormat) : 'N/A'}
              </p>
            </button>

            {/* Away Moneyline */}
            <button
              onClick={() =>
                awayOdds &&
                oneClickAdd({
                  type: "moneyline",
                  wager: "away",
                  odds: awayOdds,
                })
              }
              className="flex flex-row justify-between w-full pl-3 truncate py-2 px-[5%] hover:bg-gray-700 hover:animate-pulse"
            >
              <p className="truncate max-w-[75%]">
                {away && getLastAndFirstInitial(away)}
              </p>
              <p
                onClick={handleToggleOdds}
                className="text-xs text-white cursor-pointer"
              >
                {awayOdds ? getFormattedOdds(awayOdds, oddsFormat) : 'N/A'}
              </p>
            </button>
          </div>
        ) : null)}

      {/* Spreads */}
      <div
        onClick={() => handleSetActiveType("spreads")}
        className={`relative flex flex-row justify-center items-center p-2 cursor-pointer hover:bg-gray-700 ${
          !activeType && "hover:animate-pulse"
        }`}
      >
        <p className="font-semibold text-white text-sm tracking-tighter">
          Spreads
        </p>
        <ChevronDown
          className={`absolute right-3 text-white ${
            activeType === "spreads" && "rotate-180"
          }`}
        />
      </div>

      {activeType === "spreads" &&
        spreadGames?.map(({ spread, home, away }, index) => {
          const homeSpread = spread;
          const awaySpread = spread * -1;

          if (home || away) {
            return (
              <div
                key={index}
                className="bg-primary flex flex-row justify-center items-center cursor-pointer"
              >
                {/* Home odds */}
                <button
                  onClick={() =>
                    oneClickAdd({
                      type: "spreadGames",
                      wager: "home",
                      odds: home,
                      spread: homeSpread,
                    })
                  }
                  className="flex flex-row justify-between w-full border-r-[1px] border-gray-800 pr-3 py-2 px-[5%] hover:bg-gray-700 hover:animate-pulse"
                >
                  <p>
                    {homeSpread >= 0 && "+"}
                    {homeSpread.toFixed(1)}
                  </p>
                  <p
                    onClick={handleToggleOdds}
                    className="text-xs text-white cursor-pointer"
                  >
                    {getFormattedOdds(home, oddsFormat)}
                  </p>
                </button>

                {/* Away odds */}
                <button
                  onClick={() =>
                    oneClickAdd({
                      type: "spreadGames",
                      wager: "away",
                      odds: away,
                      spread: awaySpread,
                    })
                  }
                  className="flex flex-row justify-between w-full pl-3 py-2 px-[5%] hover:bg-gray-700 hover:animate-pulse"
                >
                  <p>
                    {awaySpread >= 0 && "+"}
                    {awaySpread.toFixed(1)}
                  </p>
                  <p
                    onClick={handleToggleOdds}
                    className="text-xs text-white cursor-pointer"
                  >
                    {getFormattedOdds(away, oddsFormat)}
                  </p>
                </button>
              </div>
            );
          }
        })}

      {/* Totals */}
      <div
        onClick={() => handleSetActiveType("totals")}
        className={`relative flex flex-row justify-center items-center p-2 cursor-pointer hover:bg-gray-700 ${
          !activeType && "hover:animate-pulse"
        }`}
      >
        <p className="font-semibold text-white text-sm tracking-tighter">
          Totals
        </p>
        <ChevronDown
          className={`absolute right-3 text-white ${
            activeType === "totals" && "rotate-180"
          }`}
        />
      </div>

      {activeType === "totals" &&
        totalGames?.map(({ line, over, under }, index) =>
          over || under ? (
            <div
              key={index}
              className="bg-primary flex flex-row justify-center items-center cursor-pointer"
            >
              {/* Over odds */}
              <button
                onClick={() =>
                  oneClickAdd({
                    type: "totalGames",
                    wager: "over",
                    odds: over,
                    line,
                  })
                }
                className="flex flex-row justify-between w-full border-r-[1px] border-gray-800 pr-3 py-2 px-[5%] hover:bg-gray-700 hover:animate-pulse"
              >
                <p>Over {line.toFixed(1)}</p>
                <p
                  onClick={handleToggleOdds}
                  className="text-xs text-white cursor-pointer"
                >
                  {getFormattedOdds(over, oddsFormat)}
                </p>
              </button>

              {/* Under Odds */}
              <button
                onClick={() =>
                  oneClickAdd({
                    type: "totalGames",
                    wager: "under",
                    odds: under,
                    line,
                  })
                }
                className="flex flex-row justify-between w-full pl-3 py-2 px-[5%] hover:bg-gray-700 hover:animate-pulse"
              >
                <p>Under {line.toFixed(1)}</p>
                <p
                  onClick={handleToggleOdds}
                  className="text-xs text-white cursor-pointer"
                >
                  {getFormattedOdds(under, oddsFormat)}
                </p>
              </button>
            </div>
          ) : null
        )}

      {/* Set Props */}
      <div
        onClick={() => handleSetActiveType("sets")}
        className={`relative flex flex-row justify-center items-center p-2 cursor-pointer hover:bg-gray-700 ${
          !activeType
            ? "hover:animate-pulse hover:rounded-b-md"
            : "hover:rounded-none"
        }`}
      >
        <p className="font-semibold text-white text-sm tracking-tighter">
          Set Props
        </p>
        <ChevronDown
          className={`absolute right-3 text-white ${
            activeType === "sets" && "rotate-180"
          }`}
        />
      </div>

      {activeType === "sets" &&
        spreadSets?.map(({ spread, home, away }, index) => {
          const homeSpread = spread;
          const awaySpread = spread * -1;

          if (home || away) {
            return (
              <div
                key={index}
                className="bg-primary flex flex-row justify-center items-center cursor-pointer"
              >
                {/* Home Set Spread Odds */}
                <button
                  onClick={() =>
                    oneClickAdd({
                      type: "spreadSets",
                      wager: "home",
                      odds: home,
                      spread,
                    })
                  }
                  className="flex flex-row justify-between w-full border-r-[1px] border-gray-800 pr-3 py-2 px-[5%] hover:bg-gray-700 hover:animate-pulse"
                >
                  <p>
                    {homeSpread >= 0 && "+"}
                    {homeSpread.toFixed(1)} sets
                  </p>
                  <p
                    onClick={handleToggleOdds}
                    className="text-xs text-white cursor-pointer"
                  >
                    {getFormattedOdds(home, oddsFormat)}
                  </p>
                </button>

                {/* Away Set Sperad Odds */}
                <button
                  onClick={() =>
                    oneClickAdd({
                      type: "spreadSets",
                      wager: "away",
                      odds: away,
                      spread,
                    })
                  }
                  className="flex flex-row justify-between w-full pl-3 py-2 px-[5%] hover:bg-gray-700 hover:animate-pulse"
                >
                  <p>
                    {awaySpread >= 0 && "+"}
                    {awaySpread.toFixed(1)} sets
                  </p>

                  <p
                    onClick={handleToggleOdds}
                    className="text-xs text-white cursor-pointer"
                  >
                    {getFormattedOdds(away, oddsFormat)}
                  </p>
                </button>
              </div>
            );
          }
        })}

      {/* One Click Add Bet Modal */}
      {/* <OneClickAddBetModal {...oneClickAddBetModalProps} /> */}
    </div>
  );
};

export { Odds };
