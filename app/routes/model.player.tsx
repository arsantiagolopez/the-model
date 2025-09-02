import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link, useParams } from "react-router";
import { getPlayerById } from "~/lib/data-loader";
import type { Player, MatchSets } from "~/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { AppleSportsBackButton } from "~/components/back-button";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  
  if (!id) {
    throw new Response("Player ID required", { status: 400 });
  }

  const player = await getPlayerById(id);
  
  if (!player) {
    throw new Response("Player not found", { status: 404 });
  }

  return { player };
}

export default function ModelPlayer() {
  const { player } = useLoaderData<{ player: Player }>();
  const params = useParams();

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
          <span>Players</span>
          <span>/</span>
          <span className="text-foreground font-medium">{player.name}</span>
        </nav>
      </div>

      {/* Player Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-6">
            {/* Player Photo */}
            <div className="flex-shrink-0">
              <Avatar className="size-30 border-4">
                <AvatarImage
                  src={player.imageUrl || `https://via.placeholder.com/120x120/e5e7eb/6b7280?text=${player.name.charAt(0)}`}
                  alt={player.name}
                />
                <AvatarFallback className="text-2xl">{player.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            
            {/* Player Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-foreground">{player.name}</h1>
                {player.ranking?.current && (
                  <Badge>
                    #{player.ranking.current}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Country:</span>
                  <p className="font-medium">{player.country}</p>
                </div>
                {player.age && (
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <p className="font-medium">{player.age}</p>
                  </div>
                )}
                {player.plays && (
                  <div>
                    <span className="text-muted-foreground">Plays:</span>
                    <p className="font-medium">{player.plays}</p>
                  </div>
                )}
                {player.sex && (
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{player.sex}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Career Statistics */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Career Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Overall Record */}
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">Overall Singles</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wins:</span>
                      <span className="font-semibold text-foreground">{player.singlesRecord.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Losses:</span>
                      <span className="font-semibold text-foreground">{player.singlesRecord.losses}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Win Rate:</span>
                      <span className="font-semibold">
                        {((player.singlesRecord.wins / (player.singlesRecord.wins + player.singlesRecord.losses)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Titles Summary */}
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">Titles</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Singles Main:</span>
                      <span className="font-semibold">{player.titles.singles.main}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Singles Challenger:</span>
                      <span className="font-semibold">{player.titles.singles.challenger}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doubles Main:</span>
                      <span className="font-semibold">{player.titles.doubles.main}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doubles Challenger:</span>
                      <span className="font-semibold">{player.titles.doubles.challenger}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Surface Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(player.surfaceRecords).map(([surface, record]) => {
                  const total = record.wins + record.losses;
                  const winRate = total > 0 ? (record.wins / total * 100).toFixed(1) : '0.0';
                  
                  return (
                    <Card key={surface} className="text-center p-4">
                      <h3 className="text-sm font-medium text-foreground capitalize mb-2">{surface}</h3>
                      <div className="text-2xl font-bold text-foreground mb-1">{winRate}%</div>
                      <div className="text-sm text-muted-foreground">
                        {record.wins}W - {record.losses}L
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tournament Titles */}
          {(player.titles.singles.tournaments && Object.keys(player.titles.singles.tournaments).length > 0) ||
           (player.titles.doubles.tournaments && Object.keys(player.titles.doubles.tournaments).length > 0) ? (
            <Card>
              <CardHeader>
                <CardTitle>Tournament Titles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Singles Titles */}
                  {player.titles.singles.tournaments && Object.keys(player.titles.singles.tournaments).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">Singles Titles</h3>
                      <div className="space-y-4">
                        {Object.entries(player.titles.singles.tournaments)
                          .sort(([a], [b]) => parseInt(b) - parseInt(a))
                          .map(([year, categories]) => (
                            <div key={year} className="border-l-2 border-primary pl-4">
                              <h4 className="font-semibold text-foreground mb-2">{year}</h4>
                              
                              {/* Main Tour Titles */}
                              {categories.main && categories.main.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Main Tour ({categories.main.length})</h5>
                                  <div className="grid gap-2">
                                    {categories.main.map((tournament, index) => (
                                      <div key={index} className="bg-muted/30 rounded-lg p-3 text-sm">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            {tournament.url ? (
                                              <a href={`https://www.tennisexplorer.com${tournament.url}`} 
                                                 target="_blank" 
                                                 rel="noopener noreferrer"
                                                 className="font-medium text-primary hover:underline">
                                                {tournament.name}
                                              </a>
                                            ) : (
                                              <span className="font-medium text-foreground">{tournament.name}</span>
                                            )}
                                            <div className="mt-1 space-y-1">
                                              {tournament.surface && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-muted-foreground">Surface:</span>
                                                  <Badge variant="outline" className="text-xs">{tournament.surface}</Badge>
                                                </div>
                                              )}
                                              {tournament.prizeMoney && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-muted-foreground">Prize:</span>
                                                  <span className="text-xs font-medium">{tournament.prizeMoney}</span>
                                                </div>
                                              )}
                                              {tournament.date && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-muted-foreground">Date:</span>
                                                  <span className="text-xs">{tournament.date}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Challenger Titles */}
                              {categories.challenger && categories.challenger.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Challenger ({categories.challenger.length})</h5>
                                  <div className="grid gap-2">
                                    {categories.challenger.map((tournament, index) => (
                                      <div key={index} className="bg-muted/20 rounded-lg p-3 text-sm">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            {tournament.url ? (
                                              <a href={`https://www.tennisexplorer.com${tournament.url}`} 
                                                 target="_blank" 
                                                 rel="noopener noreferrer"
                                                 className="font-medium text-primary hover:underline">
                                                {tournament.name}
                                              </a>
                                            ) : (
                                              <span className="font-medium text-foreground">{tournament.name}</span>
                                            )}
                                            <div className="mt-1 space-y-1">
                                              {tournament.surface && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-muted-foreground">Surface:</span>
                                                  <Badge variant="outline" className="text-xs">{tournament.surface}</Badge>
                                                </div>
                                              )}
                                              {tournament.prizeMoney && (
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs text-muted-foreground">Prize:</span>
                                                  <span className="text-xs font-medium">{tournament.prizeMoney}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Doubles Titles */}
                  {player.titles.doubles.tournaments && Object.keys(player.titles.doubles.tournaments).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">Doubles Titles</h3>
                      <div className="space-y-4">
                        {Object.entries(player.titles.doubles.tournaments)
                          .sort(([a], [b]) => parseInt(b) - parseInt(a))
                          .map(([year, categories]) => (
                            <div key={year} className="border-l-2 border-secondary pl-4">
                              <h4 className="font-semibold text-foreground mb-2">{year}</h4>
                              
                              {/* Main Tour Titles */}
                              {categories.main && categories.main.length > 0 && (
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Main Tour ({categories.main.length})</h5>
                                  <div className="grid gap-2">
                                    {categories.main.map((tournament, index) => (
                                      <div key={index} className="bg-secondary/10 rounded-lg p-3 text-sm">
                                        <div className="font-medium text-foreground">{tournament.name}</div>
                                        {tournament.surface && (
                                          <div className="mt-1">
                                            <Badge variant="outline" className="text-xs">{tournament.surface}</Badge>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Challenger Titles */}
                              {categories.challenger && categories.challenger.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Challenger ({categories.challenger.length})</h5>
                                  <div className="grid gap-2">
                                    {categories.challenger.map((tournament, index) => (
                                      <div key={index} className="bg-secondary/5 rounded-lg p-3 text-sm">
                                        <div className="font-medium text-foreground">{tournament.name}</div>
                                        {tournament.surface && (
                                          <div className="mt-1">
                                            <Badge variant="outline" className="text-xs">{tournament.surface}</Badge>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Recent Matches */}
          {player.yearMatches && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tournament</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRecentMatches(player.yearMatches, 10).map((match, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">
                          {match.date}
                        </TableCell>
                        <TableCell className="text-sm">
                          {match.tournament}
                        </TableCell>
                        <TableCell className="text-sm">
                          {match.opponent}
                        </TableCell>
                        <TableCell className="text-sm">
                          {match.round}
                        </TableCell>
                        <TableCell>
                          <Badge variant={match.result === 'won' ? 'secondary' : 'destructive'}>
                            {match.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatMatchScore(match.sets)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {(player.singlesRank || player.doublesRank) && (
            <Card>
              <CardHeader>
                <CardTitle>Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Singles Rankings */}
                  {player.singlesRank && (player.singlesRank.current || player.singlesRank.highest) && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-3">Singles</h3>
                      <div className="space-y-3">
                        {player.singlesRank.current && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Current:</span>
                            <span className="text-2xl font-bold text-primary">#{player.singlesRank.current}</span>
                          </div>
                        )}
                        {player.singlesRank.highest && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Career High:</span>
                            <span className="text-xl font-semibold text-foreground">#{player.singlesRank.highest}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Doubles Rankings */}
                  {player.doublesRank && (player.doublesRank.current || player.doublesRank.highest) && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-3">Doubles</h3>
                      <div className="space-y-3">
                        {player.doublesRank.current && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Current:</span>
                            <span className="text-2xl font-bold text-secondary">#{player.doublesRank.current}</span>
                          </div>
                        )}
                        {player.doublesRank.highest && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Career High:</span>
                            <span className="text-xl font-semibold text-foreground">#{player.doublesRank.highest}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tournament Achievements */}
          {player.tournamentAchievements && Object.keys(player.tournamentAchievements).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tournament Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(player.tournamentAchievements).slice(0, 5).map(([tournament, achievements]) => (
                    <div key={tournament}>
                      <h4 className="font-medium text-foreground text-sm">{tournament}</h4>
                      <div className="mt-1 space-y-1">
                        {achievements.slice(0, 3).map((achievement, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{achievement.year}:</span>
                            <span className="text-foreground capitalize">{achievement.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Injuries */}
          {player.injuries && player.injuries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Injuries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {player.injuries.slice(0, 5).map((injury, index) => (
                    <div key={index} className="bg-muted/20 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-foreground">{injury.year}</div>
                        {injury.tournament && (
                          <Badge variant="outline" className="text-xs">{injury.tournament}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">{injury.description}</div>
                      {injury.matchStatus && (
                        <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1 mt-2">
                          Match Status: {injury.matchStatus}
                        </div>
                      )}
                      {injury.startDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Date: {injury.startDate}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get recent matches from yearMatches data
function getRecentMatches(yearMatches: Player['yearMatches'], limit: number = 10) {
  if (!yearMatches) return [];
  
  const allMatches: Array<{
    date: string;
    tournament: string;
    opponent: string;
    round: string;
    result: 'won' | 'lost';
    sets: MatchSets;
    odds: { player: number; opponent: number };
  }> = [];
  
  // Flatten all matches from all years and tournaments
  Object.entries(yearMatches).forEach(([year, tournaments]) => {
    Object.entries(tournaments).forEach(([tournament, matches]) => {
      matches.forEach(match => {
        allMatches.push({
          ...match,
          tournament,
        });
      });
    });
  });
  
  // Sort by date (most recent first) and limit
  return allMatches
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Helper function to format match score
function formatMatchScore(sets: MatchSets): string {
  if (!sets.sets || sets.sets.length === 0) return '-';
  
  return sets.sets
    .map(set => {
      const baseScore = `${set.player1}-${set.player2}`;
      if (set.tiebreak) {
        return `${baseScore}(${set.tiebreak.player1})`;
      }
      return baseScore;
    })
    .join(', ');
}