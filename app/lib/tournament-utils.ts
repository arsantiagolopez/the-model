// Tournament importance and classification utilities

export interface TournamentInfo {
  name: string;
  category: string;
  matchCount: number;
  importance: number;
  level: TournamentLevel;
  url: string;
}

export enum TournamentLevel {
  GRAND_SLAM = 1,      // US Open, Wimbledon, French Open, Australian Open
  MASTERS_1000 = 2,    // ATP Masters 1000
  WTA_1000 = 3,        // WTA 1000 events
  ATP_500 = 4,         // ATP 500
  WTA_500 = 5,         // WTA 500
  ATP_250 = 6,         // ATP 250
  WTA_250 = 7,         // WTA 250
  CHALLENGER = 8,      // ATP Challengers
  WTA_125 = 9,         // WTA 125
  ITF_100 = 10,        // ITF $100K+
  ITF_75 = 11,         // ITF $75K
  ITF_25 = 12,         // ITF $25K
  ITF_15 = 13,         // ITF $15K
  UTR_PRO = 14,        // UTR Pro events
  FUTURES = 15,        // ATP Futures
  OTHER = 16           // Other/Unknown tournaments
}

// Tournament name patterns for classification
const TOURNAMENT_PATTERNS = {
  [TournamentLevel.GRAND_SLAM]: [
    /us open/i, /wimbledon/i, /french open/i, /australian open/i,
    /roland garros/i
  ],
  [TournamentLevel.MASTERS_1000]: [
    /indian wells/i, /miami/i, /monte carlo/i, /madrid/i, /rome/i,
    /canada/i, /cincinnati/i, /shanghai/i, /paris/i
  ],
  [TournamentLevel.WTA_1000]: [
    /doha/i, /dubai/i, /indian wells/i, /miami/i, /madrid/i, /rome/i,
    /berlin/i, /canada/i, /cincinnati/i, /beijing/i, /wuhan/i
  ],
  [TournamentLevel.ATP_500]: [
    /atp 500/i, /barcelona/i, /london/i, /halle/i, /hamburg/i,
    /washington/i, /tokyo/i, /vienna/i, /basel/i
  ],
  [TournamentLevel.WTA_500]: [
    /wta 500/i, /stuttgart/i, /berlin/i, /eastbourne/i, /toronto/i,
    /cincinnati/i, /tokyo/i, /beijing/i, /charleston/i
  ],
  [TournamentLevel.CHALLENGER]: [
    /challenger/i
  ],
  [TournamentLevel.WTA_125]: [
    /wta 125/i
  ],
  [TournamentLevel.ITF_100]: [
    /itf.*100/i, /\$100/i
  ],
  [TournamentLevel.ITF_75]: [
    /itf.*75/i, /\$75/i
  ],
  [TournamentLevel.ITF_25]: [
    /itf.*25/i, /\$25/i
  ],
  [TournamentLevel.ITF_15]: [
    /itf.*15/i, /\$15/i, /itf/i
  ],
  [TournamentLevel.UTR_PRO]: [
    /utr pro/i
  ],
  [TournamentLevel.FUTURES]: [
    /futures/i
  ]
};

export function getTournamentLevel(name: string, category: string): TournamentLevel {
  // Check each pattern level
  for (const [level, patterns] of Object.entries(TOURNAMENT_PATTERNS)) {
    const tournamentLevel = parseInt(level) as TournamentLevel;
    for (const pattern of patterns) {
      if (pattern.test(name)) {
        return tournamentLevel;
      }
    }
  }
  
  // Fallback to category-based classification
  if (category === 'ATP' || category === 'WTA') {
    return TournamentLevel.ATP_250; // Default for main tour events
  }
  
  return TournamentLevel.OTHER;
}

export function getTournamentImportance(name: string, category: string, url: string = ''): number {
  const level = getTournamentLevel(name, category);
  const isDoubles = url.includes('type=double');
  const isATP = category === 'ATP';
  
  // Create a composite score: (level * 10) + (doubles penalty) + (gender penalty)
  // Lower number = higher importance (for sorting)
  let baseScore = 0;
  switch (level) {
    case TournamentLevel.GRAND_SLAM: baseScore = 10; break;
    case TournamentLevel.MASTERS_1000: baseScore = 20; break;
    case TournamentLevel.WTA_1000: baseScore = 30; break;
    case TournamentLevel.ATP_500: baseScore = 40; break;
    case TournamentLevel.WTA_500: baseScore = 50; break;
    case TournamentLevel.ATP_250: baseScore = 60; break;
    case TournamentLevel.WTA_250: baseScore = 70; break;
    case TournamentLevel.CHALLENGER: baseScore = 80; break;
    case TournamentLevel.WTA_125: baseScore = 90; break;
    case TournamentLevel.ITF_100: baseScore = 100; break;
    case TournamentLevel.ITF_75: baseScore = 110; break;
    case TournamentLevel.ITF_25: baseScore = 120; break;
    case TournamentLevel.ITF_15: baseScore = 130; break;
    case TournamentLevel.UTR_PRO: baseScore = 140; break;
    case TournamentLevel.FUTURES: baseScore = 150; break;
    default: baseScore = 160; break;
  }
  
  // Add penalties for sorting order
  let penalty = 0;
  
  // Gender penalty: ATP (men) comes before WTA (women)
  if (!isATP) penalty += 1;
  
  // Doubles penalty: Singles come before doubles
  if (isDoubles) penalty += 2;
  
  return baseScore + penalty;
}

export function getLevelDisplayName(level: TournamentLevel): string {
  switch (level) {
    case TournamentLevel.GRAND_SLAM: return 'Grand Slam';
    case TournamentLevel.MASTERS_1000: return 'Masters 1000';
    case TournamentLevel.WTA_1000: return 'WTA 1000';
    case TournamentLevel.ATP_500: return 'ATP 500';
    case TournamentLevel.WTA_500: return 'WTA 500';
    case TournamentLevel.ATP_250: return 'ATP 250';
    case TournamentLevel.WTA_250: return 'WTA 250';
    case TournamentLevel.CHALLENGER: return 'Challenger';
    case TournamentLevel.WTA_125: return 'WTA 125';
    case TournamentLevel.ITF_100: return 'ITF $100K+';
    case TournamentLevel.ITF_75: return 'ITF $75K';
    case TournamentLevel.ITF_25: return 'ITF $25K';
    case TournamentLevel.ITF_15: return 'ITF $15K';
    case TournamentLevel.UTR_PRO: return 'UTR Pro';
    case TournamentLevel.FUTURES: return 'Futures';
    default: return 'Other';
  }
}

// Group and sort matches by tournament importance
export function groupMatchesByTournament<T extends { tournament: { name: string; category?: string; url?: string } }>(
  matches: T[]
): Array<{ tournament: TournamentInfo; matches: T[] }> {
  const tournamentGroups = new Map<string, { tournament: TournamentInfo; matches: T[] }>();
  
  matches.forEach(match => {
    const name = match.tournament.name;
    const category = match.tournament.category || 'Unknown';
    const url = match.tournament.url || '';
    
    // Use URL as primary key since it uniquely identifies tournament type (singles vs doubles)
    const tournamentKey = url || `${name}_${category}`;
    
    if (!tournamentGroups.has(tournamentKey)) {
      const importance = getTournamentImportance(name, category, url);
      const level = getTournamentLevel(name, category);
      
      // Add doubles suffix to display name if it's a doubles tournament
      const isDoubles = url.includes('type=double');
      const displayName = isDoubles ? `${name} Doubles` : name;
      
      tournamentGroups.set(tournamentKey, {
        tournament: {
          name: displayName,
          category,
          matchCount: 0,
          importance,
          level,
          url
        },
        matches: []
      });
    }
    
    const group = tournamentGroups.get(tournamentKey)!;
    group.matches.push(match);
    group.tournament.matchCount = group.matches.length;
  });
  
  // Sort by importance (lower number = higher importance), then by match count
  return Array.from(tournamentGroups.values()).sort((a, b) => {
    if (a.tournament.importance !== b.tournament.importance) {
      return a.tournament.importance - b.tournament.importance;
    }
    return b.tournament.matchCount - a.tournament.matchCount;
  });
}