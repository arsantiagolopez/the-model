import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useParams } from "react-router";
import { getTournamentById } from "~/lib/data-loader";
import type { Tournament, Match } from "~/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { AppleSportsBackButton } from "~/components/back-button";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  
  if (!id) {
    throw new Response("Tournament ID required", { status: 400 });
  }

  const tournament = await getTournamentById(id);
  
  if (!tournament) {
    throw new Response("Tournament not found", { status: 404 });
  }

  return { tournament };
}

export default function ModelTournament() {
  const { tournament } = useLoaderData<{ tournament: Tournament }>();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <div className="mb-4">
        <AppleSportsBackButton to="/model/today" label="Tennis" />
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link to="/model/today" className="hover:text-primary">Model</Link>
          <span>/</span>
          <span>Tournaments</span>
          <span>/</span>
          <span className="text-foreground font-medium">{tournament.name}</span>
        </nav>
      </div>

      {/* Tournament Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">{tournament.name}</h1>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground mb-4">
              <Badge>
                {tournament.category}
              </Badge>
              {tournament.surface && (
                <Badge variant="secondary">
                  {tournament.surface}
                </Badge>
              )}
              {tournament.location && tournament.country && (
                <span>{tournament.location}, {tournament.country}</span>
              )}
            </div>

            {tournament.year && (
              <div className="text-lg text-foreground mb-2">{tournament.year}</div>
            )}

            {tournament.startDate && tournament.endDate && (
              <div className="text-sm text-muted-foreground">
                {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
              </div>
            )}

            {tournament.prizeMoney && (
              <div className="text-lg font-semibold text-foreground mt-2">
                Prize Money: {tournament.prizeMoney}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tournament Matches */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tournament Matches</CardTitle>
                {tournament.matches && (
                  <span className="text-sm text-muted-foreground">
                    {tournament.matches.length} match{tournament.matches.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!tournament.matches || tournament.matches.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No matches available for this tournament</p>
                  <p className="text-sm mt-2">Check back later for updated match information</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tournament.matches.map((match) => (
                    <TournamentMatchRow key={match.id} match={match} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tournament Information Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{tournament.category}</span>
                </div>
                {tournament.surface && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Surface:</span>
                    <span className="font-medium">{tournament.surface}</span>
                  </div>
                )}
                {tournament.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{tournament.location}</span>
                  </div>
                )}
                {tournament.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-medium">{tournament.country}</span>
                  </div>
                )}
                {tournament.year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="font-medium">{tournament.year}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tournament Draw Information */}
          {tournament.draw && (
            <Card>
              <CardHeader>
                <CardTitle>Draw Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Draw Size:</span>
                    <span className="font-medium">{tournament.draw.size} players</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seeded Players:</span>
                    <span className="font-medium">{tournament.draw.seededPlayers}</span>
                  </div>
                  {tournament.draw.rounds && tournament.draw.rounds.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Rounds:</span>
                      <div className="mt-2 space-y-1">
                        {tournament.draw.rounds.map((round, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {round}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tournament Statistics */}
          {tournament.matches && tournament.matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Matches:</span>
                    <span className="font-medium">{tournament.matches.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium text-foreground">
                      {tournament.matches.filter(m => m.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="font-medium text-foreground">
                      {tournament.matches.filter(m => m.status === 'scheduled').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Live:</span>
                    <span className="font-medium text-foreground">
                      {tournament.matches.filter(m => m.status === 'live').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/model/today">
                  Today's Matches
                </Link>
              </Button>
              <Button variant="secondary" asChild className="w-full">
                <Link to="/model/tomorrow">
                  Tomorrow's Predictions
                </Link>
              </Button>
              {tournament.url && (
                <Button variant="outline" asChild className="w-full">
                  <a 
                    href={`https://www.tennisexplorer.com${tournament.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Tennis Explorer ↗
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TournamentMatchRow({ match }: { match: Match }) {
  const getStatusVariant = (status: Match['status']) => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'live':
        return 'destructive';
      case 'scheduled':
        return 'outline';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-4 hover:bg-muted/50 rounded-lg border">
      <Link 
        to={`/model/matches/${match.id}`}
        className="block"
      >
        <div className="flex items-center justify-between">
          {/* Match Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-sm text-muted-foreground">{match.time}</span>
              <Badge variant={getStatusVariant(match.status)}>
                {match.status}
              </Badge>
              {match.round && (
                <span className="text-sm text-muted-foreground">{match.round}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Player 1 */}
              <div className="flex items-center space-x-3 flex-1">
                <Avatar className="size-8">
                  <AvatarImage 
                    src={match.player1.imageUrl || `https://via.placeholder.com/32x32/e5e7eb/6b7280?text=${match.player1.name.charAt(0)}`}
                    alt={match.player1.name}
                  />
                  <AvatarFallback>{match.player1.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">{match.player1.name}</div>
                  <div className="text-sm text-muted-foreground">{match.player1.country}</div>
                </div>
              </div>

              <div className="text-muted-foreground font-bold">vs</div>

              {/* Player 2 */}
              <div className="flex items-center space-x-3 flex-1">
                <Avatar className="size-8">
                  <AvatarImage 
                    src={match.player2.imageUrl || `https://via.placeholder.com/32x32/e5e7eb/6b7280?text=${match.player2.name.charAt(0)}`}
                    alt={match.player2.name}
                  />
                  <AvatarFallback>{match.player2.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">{match.player2.name}</div>
                  <div className="text-sm text-muted-foreground">{match.player2.country}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Score/Odds */}
          <div className="text-right">
            {match.score ? (
              <div className="text-lg font-bold text-foreground">
                {match.score}
              </div>
            ) : match.odds ? (
              <div className="space-y-1">
                <div className="text-sm font-medium">{match.odds.player1}</div>
                <div className="text-sm font-medium">{match.odds.player2}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">-</div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}