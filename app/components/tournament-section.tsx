import React from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import {
  getTournamentLevel,
  getLevelDisplayName,
  TournamentLevel,
} from "~/lib/tournament-utils";

interface TournamentSectionProps {
  tournamentName: string;
  category: string;
  matchCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function TournamentSection({
  tournamentName,
  category,
  matchCount,
  isExpanded,
  onToggle,
  children,
  className,
}: TournamentSectionProps) {
  const level = getTournamentLevel(tournamentName, category);
  const levelDisplayName = getLevelDisplayName(level);

  // Get styling based on tournament importance
  const getTournamentStyling = (level: TournamentLevel) => {
    switch (level) {
      case TournamentLevel.GRAND_SLAM:
        return {
          badgeVariant: "default" as const,
          badgeClass:
            "bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold",
          headerClass: "text-yellow-600 dark:text-yellow-400",
        };
      case TournamentLevel.MASTERS_1000:
      case TournamentLevel.WTA_1000:
        return {
          badgeVariant: "secondary" as const,
          badgeClass:
            "bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium",
          headerClass: "text-blue-600 dark:text-blue-400",
        };
      case TournamentLevel.ATP_500:
      case TournamentLevel.WTA_500:
        return {
          badgeVariant: "secondary" as const,
          badgeClass: "bg-gradient-to-r from-green-500 to-teal-500 text-white",
          headerClass: "text-green-600 dark:text-green-400",
        };
      default:
        return {
          badgeVariant: "outline" as const,
          badgeClass: "",
          headerClass: "text-muted-foreground",
        };
    }
  };

  const styling = getTournamentStyling(level);

  return (
    <div className={cn("space-y-5", className)}>
      {/* Tournament Header - Clickable with Stacked Effect */}
      <button onClick={onToggle} className="w-full group focus:outline-none">
        {/* Stacked Card Effect - Only when collapsed */}
        <div className="relative">
          {!isExpanded && (
            <>
              {/* Stacked cards with center origin and progressive scaling - further vertically spaced */}
              <div className="absolute inset-0 translate-y-6 scale-90 origin-center bg-card/80 rounded-lg border border-border/50 shadow-sm" />
              <div className="absolute inset-0 translate-y-3 scale-95 origin-center bg-card/90 rounded-lg border border-border/60 shadow-md" />
            </>
          )}

          {/* Main tournament header */}
          <div className="relative flex items-center justify-between p-4 bg-card hover:bg-card/90 rounded-lg border border-border shadow-md transition-all duration-200 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 z-10">
            <div className="flex items-center space-x-3">
              {/* Expand/Collapse Icon */}
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDownIcon className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                )}
              </div>

              {/* Tournament Info */}
              <div className="text-left">
                <h3
                  className={cn(
                    "text-lg font-semibold transition-colors",
                    styling.headerClass
                  )}
                >
                  {tournamentName}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant={styling.badgeVariant}
                    className={cn("text-xs", styling.badgeClass)}
                  >
                    {levelDisplayName}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {category}
                  </span>
                </div>
              </div>
            </div>

            {/* Match Count */}
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {matchCount} match{matchCount !== 1 ? "es" : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                {isExpanded ? "Click to collapse" : "Click to expand"}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Tournament Matches - Collapsible (No Stacked Effect) */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "opacity-100 max-h-none" : "opacity-0 max-h-0"
        )}
      >
        <div className="pl-8 pr-4 pb-2">
          <div className="space-y-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
