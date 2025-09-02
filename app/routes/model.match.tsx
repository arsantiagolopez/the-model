import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useParams } from "react-router";
import { getMatchById } from "~/lib/data-loader";
import type { Match, MatchSets } from "~/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { AppleSportsBackButton } from "~/components/back-button";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  
  if (!id) {
    throw new Response("Match ID required", { status: 400 });
  }

  const match = await getMatchById(id);
  
  if (!match) {
    throw new Response("Match not found", { status: 404 });
  }

  return { match };
}

export default function ModelMatch() {
  const { match } = useLoaderData<{ match: Match }>();

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
          <span>Matches</span>
          <span>/</span>
          <span className="text-foreground font-medium">
            {match.player1.name} vs {match.player2.name}
          </span>
        </nav>
      </div>

      {/* Match Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {/* Tournament Info */}
          <div className="text-center mb-6">
            <Link 
              to={`/model/tournaments/${match.tournament.name.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-xl font-medium text-primary hover:text-primary/90"
            >
              {match.tournament.name}
            </Link>
            <div className="text-sm text-muted-foreground mt-1">
              {match.tournament.category} • {match.tournament.surface} • {match.round}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {match.date} at {match.time}
            </div>
          </div>

          {/* Players */}
          <div className="flex items-center justify-center space-x-8">
            {/* Player 1 */}
            <div className="flex flex-col items-center space-y-4 flex-1 max-w-xs">
              <Link 
                to={`/model/players/${extractPlayerId(match.player1)}`}
                className="flex flex-col items-center space-y-3 hover:bg-muted/50 p-4 rounded-lg transition-colors"
              >
                <Avatar className="size-25 border-4">
                  <AvatarImage
                    src={match.player1.imageUrl || `https://via.placeholder.com/100x100/e5e7eb/6b7280?text=${match.player1.name.charAt(0)}`}
                    alt={match.player1.name}
                  />
                  <AvatarFallback className="text-2xl">{match.player1.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-foreground">{match.player1.name}</h2>
                  <p className="text-sm text-muted-foreground">{match.player1.country}</p>
                  {match.player1.ranking && (
                    <Badge variant="outline" className="text-xs">#{match.player1.ranking}</Badge>
                  )}
                </div>
              </Link>
              
              {match.odds && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{match.odds.player1}</div>
                  <div className="text-xs text-muted-foreground">Odds</div>
                </div>
              )}
            </div>

            {/* VS / Score */}
            <div className="text-center px-6">
              {match.status === 'completed' && match.score ? (
                <div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {formatScore(match.score)}
                  </div>
                  <Badge variant={getStatusVariant(match.status)}>
                    {match.status}
                  </Badge>
                </div>
              ) : match.status === 'live' ? (
                <div>
                  <div className="text-3xl font-bold text-destructive mb-2 animate-pulse">LIVE</div>
                  {match.score && (
                    <div className="text-lg text-foreground">{formatScore(match.score)}</div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-4xl font-bold text-muted-foreground mb-2">VS</div>
                  <Badge variant={getStatusVariant(match.status)}>
                    {match.status}
                  </Badge>
                </div>
              )}
            </div>

            {/* Player 2 */}
            <div className="flex flex-col items-center space-y-4 flex-1 max-w-xs">
              <Link 
                to={`/model/players/${extractPlayerId(match.player2)}`}
                className="flex flex-col items-center space-y-3 hover:bg-muted/50 p-4 rounded-lg transition-colors"
              >
                <Avatar className="size-25 border-4">
                  <AvatarImage
                    src={match.player2.imageUrl || `https://via.placeholder.com/100x100/e5e7eb/6b7280?text=${match.player2.name.charAt(0)}`}
                    alt={match.player2.name}
                  />
                  <AvatarFallback className="text-2xl">{match.player2.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-foreground">{match.player2.name}</h2>
                  <p className="text-sm text-muted-foreground">{match.player2.country}</p>
                  {match.player2.ranking && (
                    <Badge variant="outline" className="text-xs">#{match.player2.ranking}</Badge>
                  )}
                </div>
              </Link>
              
              {match.odds && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{match.odds.player2}</div>
                  <div className="text-xs text-muted-foreground">Odds</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Set by Set Breakdown */}
          {match.sets && match.sets.sets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Set by Set</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      {match.sets.sets.map((_, index) => (
                        <TableHead key={index} className="text-center">
                          Set {index + 1}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Sets</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{match.player1.name}</TableCell>
                      {match.sets.sets.map((set, index) => (
                        <TableCell key={index} className="text-center">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded text-sm font-semibold ${
                            set.player1 > set.player2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {set.player1}
                            {set.tiebreak && set.player1 > set.player2 && (
                              <sup className="text-xs">({set.tiebreak.player1})</sup>
                            )}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <div className="text-lg font-bold text-primary">{match.sets.player1SetsWon}</div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{match.player2.name}</TableCell>
                      {match.sets.sets.map((set, index) => (
                        <TableCell key={index} className="text-center">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded text-sm font-semibold ${
                            set.player2 > set.player1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {set.player2}
                            {set.tiebreak && set.player2 > set.player1 && (
                              <sup className="text-xs">({set.tiebreak.player2})</sup>
                            )}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <div className="text-lg font-bold text-primary">{match.sets.player2SetsWon}</div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Match Information */}
          <Card>
            <CardHeader>
              <CardTitle>Match Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Tournament:</span>
                  <p className="font-medium">{match.tournament.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Surface:</span>
                  <p className="font-medium">{match.tournament.surface || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Round:</span>
                  <p className="font-medium">{match.round || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{match.date} {match.time}</p>
                </div>
                {match.duration && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{Math.floor(match.duration / 60)}h {match.duration % 60}m</p>
                  </div>
                )}
                {match.sets && (
                  <div>
                    <span className="text-muted-foreground">Format:</span>
                    <p className="font-medium">Best of {match.sets.matchFormat === '3-set' ? '3' : '5'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Betting Information */}
          {match.odds && (
            <Card>
              <CardHeader>
                <CardTitle>Betting Odds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-8">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">{match.player1.name}</div>
                    <div className="text-3xl font-bold text-primary">{match.odds.player1}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((1 / match.odds.player1) * 100).toFixed(1)}% implied
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">{match.player2.name}</div>
                    <div className="text-3xl font-bold text-primary">{match.odds.player2}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((1 / match.odds.player2) * 100).toFixed(1)}% implied
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link to={`/model/players/${extractPlayerId(match.player1)}`}>
                  View {match.player1.name.split(' ')[0]} Profile
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link to={`/model/players/${extractPlayerId(match.player2)}`}>
                  View {match.player2.name.split(' ')[0]} Profile
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to={`/model/tournaments/${match.tournament.name.replace(/\s+/g, '-').toLowerCase()}`}>
                  View Tournament
                </Link>
              </Button>
              {match.h2hUrl && (
                <Button variant="secondary" className="w-full">
                  Head-to-Head History
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Match Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Match Status:</span>
                  <Badge variant={getStatusVariant(match.status)} className="capitalize">
                    {match.status}
                  </Badge>
                </div>
                {match.sets && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sets Played:</span>
                    <span className="font-medium">{match.sets.totalSets}</span>
                  </div>
                )}
                {match.lastUpdated && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium text-sm">
                      {new Date(match.lastUpdated).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function extractPlayerId(player: Match['player1'] | Match['player2']): string {
  if (player.id) return player.id;
  
  if (player.url) {
    const match = player.url.match(/\/player\/([^\/]+)\//);
    if (match) return match[1];
  }
  
  return player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function getStatusVariant(status: Match['status']) {
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
}

function formatScore(score: string): string {
  // Simple score formatting - could be enhanced
  return score.replace(/,\s*/g, '  ');
}