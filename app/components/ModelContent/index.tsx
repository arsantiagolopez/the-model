import React, { useContext, useState } from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { Calendar, TrendingUp } from "lucide-react";
import { PreferencesContext } from "~/contexts/preferences-context";
import { PageHeader } from "~/components/page-header";
import { RightSection } from "./RightSection";
import { StatsPanels } from "./StatsPanel";

interface Props {
  activePlayerId: string | undefined;
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
  matches: any[];
  tournaments: any[];
  players: any[];
  totalPlayers: number;
  tomorrow: string;
  surfaceMatches?: any[];
  rustMatches?: any[];
  setActiveMatchesSource: Dispatch<SetStateAction<any[]>>;
}

const ModelContent: FC<Props> = ({
  activePlayerId,
  setActivePlayerId,
  matches,
  tournaments,
  players,
  totalPlayers,
  tomorrow,
  surfaceMatches,
  rustMatches,
  setActiveMatchesSource,
}) => {
  const [isScheduleActive, setIsScheduleActive] = useState<boolean>(false);
  
  const statsPanelsProps = {
    setActivePlayerId,
    activePlayerId,
    matches,
    tournaments,
    players,
    totalPlayers,
    surfaceMatches,
    rustMatches,
  };

  const handleToggleSchedule = () => setIsScheduleActive(!isScheduleActive);

  const rightSectionProps = {
    activePlayerId,
    matches,
    tournaments,
    players,
    setActiveMatchesSource,
    handleToggleSchedule,
  };

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <PageHeader
        title="Tomorrow's Matches"
        helper={tomorrow}
        RightItem={
          <button
            onClick={handleToggleSchedule}
            className="md:hidden rounded-full p-2 hover:bg-gray-800"
          >
            {!isScheduleActive ? (
              <Calendar className="h-6 w-6" />
            ) : (
              <TrendingUp className="h-6 w-6" />
            )}
          </button>
        }
        withMobileNavigation
      />

      {/* Mobile Content */}
      <div className="md:hidden">
        {!isScheduleActive ? (
          <StatsPanels {...statsPanelsProps} />
        ) : (
          <RightSection {...rightSectionProps} />
        )}
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block">
        <div className="flex flex-row gap-6">
          <div className="flex-1">
            <StatsPanels {...statsPanelsProps} />
          </div>
          <div className="w-96">
            <RightSection {...rightSectionProps} />
          </div>
        </div>
      </div>
    </div>
  );
};

export { ModelContent, RightSection };
