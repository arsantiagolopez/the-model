import moment from "moment";
import React from "react";
import type { FC } from "react";
import type { MatchEntity, SelectedWagerData } from "../../../../../../types";
// Tournament logo helper - simplified
const getTournamentLogoSrc = (tournament: string) => `/logos/${tournament.toLowerCase().replace(/\s+/g, '-')}.png`;
import { getTourTypeFromTournamentName } from "../../../../../../utils/getTourTypeFromTournamentName";
import { getLastAndFirstInitial } from "../../../../../../utils/model/getLastAndFirstInitial";
// Image component - using img for now
const Image = ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />;
import { MoneylineType } from "./MoneylineType";
import { SpreadType } from "./SpreadType";
import { TotalType } from "./TotalType";

interface Props {
  match: MatchEntity;
  selectedWagerData: SelectedWagerData;
  imageSrc?: string;
  wagerStr?: string;
  oddsFormat: string;
  toggleOdds: () => void;
}

const WagerSection: FC<Props> = ({
  match,
  selectedWagerData,
  imageSrc,
  wagerStr,
  oddsFormat,
  toggleOdds,
}) => {
  const { type, odds } = selectedWagerData;
  const { home, away, tournament, date } = match;

  const tour = getTourTypeFromTournamentName(tournament);
  const homeName = getLastAndFirstInitial(home);
  const awayName = getLastAndFirstInitial(away);
  const dateStr = moment(date).format("M/D/YY, hh:mm A");

  const commonProps = { odds, oddsFormat, toggleOdds };
  const moneylineTypeProps = {
    type: "moneyline",
    imageSrc,
    wagerStr,
    ...commonProps,
  };
  const spreadGamesTypeProps = {
    type: "spreadGames",
    imageSrc,
    wagerStr,
    ...commonProps,
  };
  const spreadSetsTypeProps = {
    type: "spreadSets",
    imageSrc,
    wagerStr,
    ...commonProps,
  };
  const totalGamesTypeProps = { type: "totalGames", wagerStr, ...commonProps };

  const WagerComponent =
    type === "moneyline" ? (
      <MoneylineType {...moneylineTypeProps} />
    ) : type === "spreadGames" ? (
      <SpreadType {...spreadGamesTypeProps} />
    ) : type === "spreadSets" ? (
      <SpreadType {...spreadSetsTypeProps} />
    ) : type === "totalGames" ? (
      <TotalType {...totalGamesTypeProps} />
    ) : null;

  return (
    <div className="flex flex-col">
      {/* Wager Type */}
      {WagerComponent}

      {/* Match information (Slip) */}
      <div className="flex flex-col pt-6">
        {/* Top Line - Sport type, tour, tournament name */}
        <div className="flex flex-row items-center text-tertiary">
          <p className="text-sm">🎾</p>
          {tour && (
            <Image src={getTournamentLogoSrc(tour)} className="w-5 ml-1" />
          )}
          <p className="text-xs font-[800] tracking-wider ml-2">{tournament}</p>
        </div>

        {/* Headline */}
        <div className="flex flex-row text-tertiary text-base leading-5">
          <p>{homeName}</p>
          <p className="italic mx-1">vs</p>
          <p>{awayName}</p>
        </div>

        {/* Date & Time */}
        <p className="text-tertiary text-xs font-semibold leading-6">
          {dateStr}
        </p>
      </div>
    </div>
  );
};

export { WagerSection };
