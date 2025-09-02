import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { useState } from "react";
import { getDailySchedule } from "~/lib/data-loader";
import type { DailySchedule, Match } from "~/lib/types";
import { MatchCard } from "~/components/match-card";
import { SegmentedNav } from "~/components/segmented-nav";
import { SectionHeader } from "~/components/section-header";
import { Badge } from "~/components/ui/badge";
import { TournamentSection } from "~/components/tournament-section";
import { AppleSportsBackButton } from "~/components/back-button";
import { groupMatchesByTournament } from "~/lib/tournament-utils";

// Helper function to get yesterday's date
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const yesterday = getYesterdayDate();
  const schedule = await getDailySchedule(yesterday);
  
  return { schedule };
}

export default function ModelYesterday() {
  const { schedule } = useLoaderData<{ schedule: DailySchedule }>();

  // Group matches by tournament and sort by importance
  const tournamentGroups = groupMatchesByTournament(schedule.matches);

  // State for expanded tournaments - use tournament URL as unique key
  const [expandedTournaments, setExpandedTournaments] = useState<Set<string>>(() => {
    // Expand top 3 tournaments by default
    const topTournaments = new Set<string>();
    tournamentGroups.slice(0, 3).forEach(group => {
      topTournaments.add(group.tournament.url);
    });
    return topTournaments;
  });

  const toggleTournament = (tournamentUrl: string) => {
    setExpandedTournaments(prev => {
      const next = new Set(prev);
      if (next.has(tournamentUrl)) {
        next.delete(tournamentUrl);
      } else {
        next.add(tournamentUrl);
      }
      return next;
    });
  };

  // Apple Sports navigation items
  const navItems = [
    { label: 'Yesterday', value: 'yesterday', href: '/model/yesterday' },
    { label: 'Today', value: 'today', href: '/model/today' },
    { label: 'Tomorrow', value: 'tomorrow', href: '/model/tomorrow' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Apple Sports Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          {/* Back Button */}
          <div className="mb-3">
            <AppleSportsBackButton to="/" label="Home" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              🎾 Tennis
            </h1>
            {/* You could add a league selector here like Apple Sports */}
          </div>
          
          {/* Apple Sports Segmented Navigation */}
          <div className="flex justify-center">
            <SegmentedNav items={navItems} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        {schedule.matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No matches found for yesterday</p>
            <p className="text-muted-foreground mt-2">Check today's schedule or tomorrow's matches</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date header */}
            <SectionHeader 
              title={schedule.date}
              variant="date"
            />
            
            {/* Tournament sections */}
            <div className="space-y-4">
              {tournamentGroups.map((group) => (
                <TournamentSection
                  key={group.tournament.url}
                  tournamentName={group.tournament.name}
                  category={group.tournament.category}
                  matchCount={group.tournament.matchCount}
                  isExpanded={expandedTournaments.has(group.tournament.url)}
                  onToggle={() => toggleTournament(group.tournament.url)}
                >
                  {/* Matches sorted by time within tournament */}
                  {group.matches
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((match) => (
                    <MatchCard
                      key={match.id}
                      player1={{
                        name: match.player1?.name || 'TBD',
                        url: match.player1?.url,
                        imageUrl: match.player1?.imageUrl,
                        country: match.player1?.country,
                        id: extractPlayerId(match.player1)
                      }}
                      player2={{
                        name: match.player2?.name || 'TBD',
                        url: match.player2?.url,
                        imageUrl: match.player2?.imageUrl,
                        country: match.player2?.country,
                        id: extractPlayerId(match.player2)
                      }}
                      tournament={{
                        name: match.tournament?.name || 'Unknown Tournament',
                        url: match.tournament?.url,
                        category: match.tournament?.category
                      }}
                      time={match.time}
                      status={match.status || 'completed'} // Yesterday's matches should be completed
                      score={match.score}
                      odds={match.odds}
                      matchId={match.id}
                      round={match.round}
                    />
                  ))}
                </TournamentSection>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// Helper function to extract player ID from player data
function extractPlayerId(player: Match['player1'] | Match['player2']): string {
  if (player.id) return player.id;
  
  // Extract from URL if available
  if (player.url) {
    const match = player.url.match(/\/player\/([^\/]+)\//);
    if (match) return match[1];
  }
  
  // Fallback to name-based ID
  return player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}