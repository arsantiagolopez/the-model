import { useContext, useState, useMemo } from "react";
import type { FC, MouseEventHandler } from "react";
import { PreferencesContext } from "~/contexts/preferences-context";
import type { MatchEntity } from "~/types/model";
import { Dropdown } from "~/components/shared/Dropdown";
import { SearchBar } from "./SearchBar";
import { Schedule } from "./Schedule";

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
}

// Temporary RightSectionFooter
const RightSectionFooter = () => (
  <div className="mt-6 p-4 text-center text-gray-500 text-sm">
    Tennis Match Predictor
  </div>
);

interface Props {
  activePlayerId?: string;
  handleToggleSchedule?: () => void;
  matches: any[];
  tournaments: any[];
  players?: any[];
  setActiveMatchesSource: (matches: any[]) => void;
}

const RightSection: FC<Props> = ({
  activePlayerId,
  handleToggleSchedule,
  matches: matchesData,
  tournaments: tournamentsData,
  setActiveMatchesSource,
}) => {
  const [query, setQuery] = useState<string>("");
  const { toggleOdds } = useContext(PreferencesContext);

  // Toggle odds
  const handleToggleOdds: MouseEventHandler<HTMLDivElement> = (event): void => {
    event.stopPropagation();
    toggleOdds();
  };

  // Process matches data with useMemo
  const allMatches = useMemo(() => {
    if (matchesData && matchesData.length > 0) {
      // Update the active matches source so ActiveMatchPanel can find the matches
      setActiveMatchesSource(matchesData);
      return matchesData;
    }
    return [];
  }, [matchesData, setActiveMatchesSource]);

  // Create tournament & points hashmap from tournaments data
  const detailsHash = useMemo(() => {
    if (tournamentsData && tournamentsData.length > 0) {
      const hashmap = tournamentsData.reduce((obj, tournament) => ({
        ...obj,
        [tournament.id]: { 
          points: tournament.points || '0',
          countryCode: tournament.countryCode || 'US' 
        },
      }), {});
      return hashmap;
    }
    return null;
  }, [tournamentsData]);

  // Filter matches by names: tournament, home or away player
  const matches = useMemo(() => {
    if (query === "") {
      return allMatches;
    } else {
      let searchQuery = query.toLowerCase();
      const filteredMatches = allMatches?.filter(
        ({ home, away, tournament }) =>
          tournament?.toLowerCase().includes(searchQuery) ||
          home?.toLowerCase().includes(searchQuery) ||
          away?.toLowerCase().includes(searchQuery)
      ) ?? [];
      return filteredMatches;
    }
  }, [query, allMatches]);

  const searchBarProps = {
    query,
    setQuery,
    placeholder: "Search by name...",
  };

  // Handle setting active match (for navigation to match page)
  const handleSetActiveMatchId = (matchId: string) => {
    // This can be extended later for navigation logic
    console.log('Setting active match:', matchId);
  };

  const scheduleProps = {
    matches,
    handleToggleOdds,
    handleSetActiveMatchId,
    detailsHash,
    handleToggleSchedule,
    tournamentDetails: tournamentsData,
  };

  return (
    <div className="w-full xl:w-[80%] min-w-[21rem] mr-auto px-6 tracking-tight h-auto">
      {/* Search bar */}
      <div className="z-10 sticky top-0 pb-1">
        <SearchBar {...searchBarProps} />
      </div>

      {/* Schedule */}
      <div className="rounded-xl bg-secondary mt-3">
        <Dropdown
          Button={
            <div className="px-4 py-3">
              <h1 className="text-white text-xl font-[800] truncate">
                Schedule ({matches?.length || 0} matches)
              </h1>
            </div>
          }
          Content={
            <div className="p-4">
              <Schedule {...scheduleProps} />
            </div>
          }
          hasRightArrow
          isDefaultOpen
        />
      </div>

      {/* Footer */}
      <RightSectionFooter />
    </div>
  );
};

export { RightSection };
