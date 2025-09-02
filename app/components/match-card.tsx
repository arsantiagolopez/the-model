import * as React from "react"
import { Link } from "react-router"
import { cn } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar"

interface Player {
  name: string;
  url?: string;
  country?: string;
  id?: string;
}

interface Tournament {
  name: string;
  url?: string;
  category?: string;
}

interface MatchCardProps extends React.ComponentProps<"div"> {
  player1: Player;
  player2: Player;
  tournament?: Tournament;
  time?: string;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  score?: string;
  odds?: {
    player1?: number;
    player2?: number;
  };
  matchId?: string;
  round?: string;
  league?: string;
  // Apple Sports style props
  variant?: 'default' | 'compact' | 'detailed';
  stacked?: boolean; // For stacked card appearance
}

function MatchCard({ 
  className,
  player1,
  player2, 
  tournament,
  time,
  status = 'scheduled',
  score,
  odds,
  matchId,
  round,
  league,
  variant = 'default',
  stacked = false,
  ...props 
}: MatchCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-muted-foreground';
      case 'live':
        return 'text-red-500 font-semibold';
      case 'scheduled':
        return 'text-foreground';
      case 'cancelled':
        return 'text-muted-foreground line-through';
      default:
        return 'text-foreground';
    }
  };

  const getPlayerScore = (playerNum: 1 | 2) => {
    if (!score) return null;
    const scores = score.split('-').map(s => s.trim());
    return scores[playerNum - 1] || null;
  };

  const getPlayerRecord = (playerNum: 1 | 2) => {
    // You could add win-loss records here from player data
    return null;
  };

  const content = (
    <div
      className={cn(
        // Apple Sports card styling
        "bg-card hover:bg-card/80 transition-colors",
        "flex items-center justify-between",
        "min-h-[70px] sm:min-h-[80px]",
        // Conditional styling based on stacked prop
        stacked 
          ? "p-3 sm:p-4 first:rounded-t-2xl last:rounded-b-2xl" // Stacked appearance
          : "rounded-2xl border border-border/50 shadow-sm p-3 sm:p-4", // Default appearance
        className
      )}
      {...props}
    >
      {/* Left Player */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg">
          <AvatarImage 
            src={player1.imageUrl || `https://via.placeholder.com/32x32/666/fff?text=${player1.name.charAt(0)}`}
            alt={player1.name}
          />
          <AvatarFallback className="rounded-lg text-xs font-semibold">
            {player1.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate text-sm sm:text-base">
            {/* Show shorter names on mobile, longer on desktop */}
            <span className="sm:hidden">
              {player1.name.length > 12 ? `${player1.name.substring(0, 9)}...` : player1.name}
            </span>
            <span className="hidden sm:inline">
              {player1.name.length > 20 ? `${player1.name.substring(0, 17)}...` : player1.name}
            </span>
          </p>
          {getPlayerRecord(1) && (
            <p className="text-xs text-muted-foreground hidden sm:block">{getPlayerRecord(1)}</p>
          )}
        </div>
        {/* Player 1 Score */}
        {status === 'completed' && getPlayerScore(1) && (
          <div className="text-xl sm:text-2xl font-bold text-foreground mr-1 sm:mr-2">
            {getPlayerScore(1)}
          </div>
        )}
        {odds?.player1 && status === 'scheduled' && (
          <div className="text-xs sm:text-sm text-muted-foreground mr-1 sm:mr-2">
            {odds.player1}
          </div>
        )}
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center justify-center px-3 sm:px-6 min-w-0">
        {status === 'completed' ? (
          <div className="text-sm font-semibold text-muted-foreground">
            Final
          </div>
        ) : status === 'live' ? (
          <div className="text-sm font-semibold text-red-500">
            Live
          </div>
        ) : (
          <div className="text-sm font-semibold text-foreground">
            {time || 'TBD'}
          </div>
        )}
        
        {tournament && (
          <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1 text-center max-w-20 sm:max-w-none truncate">
            {tournament.category || tournament.name}
          </div>
        )}
        
        {status === 'scheduled' && round && (
          <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            {round}
          </div>
        )}
      </div>

      {/* Right Player */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 justify-end">
        {/* Player 2 Score */}
        {status === 'completed' && getPlayerScore(2) && (
          <div className="text-xl sm:text-2xl font-bold text-foreground ml-1 sm:ml-2">
            {getPlayerScore(2)}
          </div>
        )}
        {odds?.player2 && status === 'scheduled' && (
          <div className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2">
            {odds.player2}
          </div>
        )}
        <div className="flex-1 min-w-0 text-right">
          <p className="font-medium text-foreground truncate text-sm sm:text-base">
            {/* Show shorter names on mobile, longer on desktop */}
            <span className="sm:hidden">
              {player2.name.length > 12 ? `${player2.name.substring(0, 9)}...` : player2.name}
            </span>
            <span className="hidden sm:inline">
              {player2.name.length > 20 ? `${player2.name.substring(0, 17)}...` : player2.name}
            </span>
          </p>
          {getPlayerRecord(2) && (
            <p className="text-xs text-muted-foreground hidden sm:block">{getPlayerRecord(2)}</p>
          )}
        </div>
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg">
          <AvatarImage 
            src={player2.imageUrl || `https://via.placeholder.com/32x32/666/fff?text=${player2.name.charAt(0)}`}
            alt={player2.name}
          />
          <AvatarFallback className="rounded-lg text-xs font-semibold">
            {player2.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );

  if (matchId) {
    return (
      <Link to={`/model/matches/${matchId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export { MatchCard };
export type { MatchCardProps };