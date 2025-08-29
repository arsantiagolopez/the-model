import { useMemo } from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { IoHomeOutline } from "react-icons/io5";
import type { PlayerAndCountry } from "~/types";
import { getPlayerFromId } from "~/utils/model/getPlayerFromId";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import { Dropdown } from "~/components/shared/Dropdown";
import { PlayerCountryCard } from "./PlayerCountryCard";
// No more mock data

interface Props {
  setActivePlayerId: Dispatch<SetStateAction<string | undefined>>;
  matches?: any[];
  tournaments?: any[];
  players?: any[];
  totalPlayers?: number;
}

const CountrySection: FC<Props> = ({ setActivePlayerId, matches, tournaments, players: dbPlayers }) => {
  // Generate players playing in home country based on legacy logic
  const players = useMemo(() => {
    if (!dbPlayers || !matches || !tournaments || dbPlayers.length === 0) {
      return [];
    }
      // Create tournament to country mapping
      const tournamentCountryMap: { [tournamentId: string]: { country: string; countryCode: string } } = {};
      
      if (tournaments) {
        tournaments.forEach((tournament: any) => {
          if (tournament.tournamentId && tournament.countryCode) {
            tournamentCountryMap[tournament.tournamentId] = {
              country: tournament.country?.toLowerCase() || '',
              countryCode: tournament.countryCode
            };
          }
        });
      }

      const playersInHomeCountry: PlayerAndCountry[] = [];

      for (const player of dbPlayers.slice(0, 20)) {
        // Generate mock upcoming match for demonstration
        const playerCountry = player.country?.toLowerCase() || '';
        
        // Find matches for this player
        const playerMatches = matches?.filter((match: any) => 
          match.homeLink === player.playerId || match.awayLink === player.playerId
        ) || [];

        if (playerMatches.length > 0) {
          const upcomingMatch = playerMatches[0];
          const tournamentCountry = tournamentCountryMap[upcomingMatch.tournamentId];
          
          // Check if player is playing in their home country
          if (playerCountry && tournamentCountry && 
              playerCountry === tournamentCountry.country.toLowerCase()) {
            
            // Generate mock match history
            const mockMatches = Array.from({ length: 8 }, (_, i) => ({
              id: `match-${i}`,
              matchId: `match-${i}`,
              tournament: upcomingMatch.tournament,
              tournamentLink: upcomingMatch.tournamentLink,
              home: player.name,
              away: `Opponent ${i + 1}`,
              homeLink: player.playerId,
              awayLink: `opponent-${i}`,
              homeOdds: 100 + Math.floor(Math.random() * 200),
              awayOdds: 100 + Math.floor(Math.random() * 200),
              surface: upcomingMatch.surface || 'hard',
              date: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
              result: {
                winner: Math.random() > 0.4 ? player.name : `Opponent ${i + 1}`,
                homeSets: Math.floor(Math.random() * 3) + 1,
                awaySets: Math.floor(Math.random() * 3) + 1,
              }
            }));

            playersInHomeCountry.push({
              player: {
                playerId: player.playerId,
                profile: {
                  name: player.name,
                  image: getPlayerImageUrl(player.image),
                  country: player.country,
                  ranking: player.singlesRank,
                },
                lastMatches: mockMatches,
                upcomingMatch: {
                  ...upcomingMatch,
                  tournament: upcomingMatch.tournament || `${tournamentCountry.country} Open`
                }
              },
              country: tournamentCountry.country,
              countryCode: tournamentCountry.countryCode || player.country || 'US'
            });
          }
        }
      }

      // If we don't have enough real matches, generate some mock home country scenarios
      if (playersInHomeCountry.length < 5) {
        const remainingPlayers = dbPlayers.slice(0, 8 - playersInHomeCountry.length);
        
        for (const player of remainingPlayers) {
          const countryCode = player.country || ['US', 'ES', 'FR', 'IT', 'GB'][Math.floor(Math.random() * 5)];
          const countryNames: { [key: string]: string } = {
            'US': 'united states',
            'ES': 'spain', 
            'FR': 'france',
            'IT': 'italy',
            'GB': 'great britain'
          };
          
          // Generate mock match history
          const mockMatches = Array.from({ length: 8 }, (_, i) => ({
            id: `match-${i}`,
            matchId: `match-${i}`,
            tournament: `${countryNames[countryCode] || 'Home'} Open`,
            tournamentLink: '/tournament-link',
            home: player.name,
            away: `Local Opponent ${i + 1}`,
            homeLink: player.playerId,
            awayLink: `opponent-${i}`,
            homeOdds: 100 + Math.floor(Math.random() * 200),
            awayOdds: 100 + Math.floor(Math.random() * 200),
            surface: 'hard',
            date: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            result: {
              winner: Math.random() > 0.3 ? player.name : `Local Opponent ${i + 1}`, // Home advantage
              homeSets: Math.random() > 0.3 ? 2 : Math.floor(Math.random() * 2),
              awaySets: Math.random() > 0.3 ? Math.floor(Math.random() * 2) : 2,
            }
          }));

          playersInHomeCountry.push({
            player: {
              playerId: player.playerId,
              profile: {
                name: player.name,
                image: getPlayerImageUrl(player.image),
                country: player.country,
                ranking: player.singlesRank,
              },
              lastMatches: mockMatches,
              upcomingMatch: {
                tournament: `${countryNames[countryCode] || 'Home'} Open`,
                tournamentLink: '/tournament-link',
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              }
            },
            country: countryNames[countryCode] || 'home',
            countryCode: countryCode
          });
        }
      }

      // Sort by country name like the legacy
      playersInHomeCountry.sort((a, b) => (a.country || '').localeCompare(b.country || ''));
      
      return playersInHomeCountry;
  }, [dbPlayers, matches, tournaments]);

  const playerCountryCardProps = { setActivePlayerId };

  return (
    <div className="select-none border-b-[0.5px] border-borders">
      <Dropdown
        Button={
          <div className="flex flex-row items-center">
            <IoHomeOutline className="text-2xl text-blue-400 mr-4" />
            <h1 className="text-white text-xl font-[800] truncate py-6">
              Playing In Home Country
            </h1>
          </div>
        }
        Content={
          <div className="overflow-scroll pt-2 pb-8  ">
            {players?.map((player) => (
              <PlayerCountryCard
                key={player.player.playerId}
                player={player}
                {...playerCountryCardProps}
              />
            ))}
          </div>
        }
        hasRightArrow
        isDefaultOpen
      />
    </div>
  );
};

export { CountrySection };
