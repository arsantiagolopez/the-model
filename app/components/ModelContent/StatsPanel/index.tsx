import React from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { CountrySection } from "./Sections/CountrySection";
import { FormSection } from "./Sections/FormSection";
import { RustSection } from "./Sections/RustSection";
import { StreakSection } from "./Sections/StreakSection";
import { SurfaceSection } from "./Sections/SurfaceSection";

interface Props {
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
  matches?: any[];
  tournaments?: any[];
  players?: any[];
  totalPlayers?: number;
  surfaceMatches?: any[];
  rustMatches?: any[];
}

const StatsPanels: FC<Props> = (props) => (
  <div className="flex flex-col mb-10 md:mb-3 h-auto">
    <FormSection {...props} />

    <StreakSection {...props} />

    <SurfaceSection 
      setActivePlayerId={props.setActivePlayerId} 
      matches={props.surfaceMatches}
    />

    <CountrySection {...props} />

    <RustSection 
      setActivePlayerId={props.setActivePlayerId}
      matches={props.rustMatches}
    />

    {/*
        <EloSection {...props} />
       */}
  </div>
);

export { StatsPanels };
