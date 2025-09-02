// Unified types for tennis betting prediction model
// Matches scraped data structure and database entities

// Base types for tennis scoring
export type MatchSets = {
  sets: Array<{
    player1: number;
    player2: number;
    tiebreak?: {
      player1: number;
      player2: number;
    };
  }>;
  totalSets: number;
  player1SetsWon: number;
  player2SetsWon: number;
  matchFormat: '3-set' | '5-set';
  completed: boolean;
};

// Player entity - matches scraped data structure
export type Player = {
  id: string; // Internal ID for routing
  tennisExplorerId?: string; // Original scraper ID
  name: string;
  url: string; // Original tennis explorer URL
  imageUrl?: string; // Optional - may not always be available
  country: string;
  birthDate?: string; // Optional - format: "5. 6. 1974"
  age?: number; // Optional - may not be available for all players
  sex?: 'Male' | 'Female'; // Optional - may not be available
  plays?: 'Left-handed' | 'Right-handed'; // Optional
  
  // Career statistics
  singlesRecord: {
    wins: number;
    losses: number;
  };
  
  // Surface records
  surfaceRecords: {
    clay: { wins: number; losses: number };
    hard: { wins: number; losses: number };
    grass: { wins: number; losses: number };
    indoor: { wins: number; losses: number };
  };

  // Yearly records - comprehensive breakdown
  yearlyRecords?: {
    [year: string]: {
      summary: { wins: number; losses: number };
      clay: { wins: number; losses: number };
      hard: { wins: number; losses: number };
      indoor: { wins: number; losses: number };
      grass: { wins: number; losses: number };
    };
  };

  // Titles
  titles: {
    singles: {
      main: number;
      challenger: number;
    };
    doubles: {
      main: number;
      challenger: number;
    };
  };

  // Match history by year and tournament
  yearMatches?: {
    [year: string]: {
      [tournament: string]: Array<{
        date: string;
        opponent: string;
        round: string;
        result: 'won' | 'lost';
        sets: MatchSets;
        odds: {
          player: number;
          opponent: number;
        };
      }>;
    };
  };

  // Tournament achievements
  tournamentAchievements?: {
    [tournamentName: string]: Array<{
      year: string;
      result: string; // "winner", "finalist", "semifinalist", etc.
    }>;
  };

  // Injury history
  injuries?: Array<{
    year: string;
    type: string;
    description: string;
    startDate?: string;
    endDate?: string;
    tournament?: string;
  }>;

  // Ranking information (optional)
  ranking?: {
    current: number;
    highest: number;
  };

  // Metadata
  lastUpdated?: string;
  createdAt?: string;
};

// Tournament entity
export type Tournament = {
  id: string; // Internal ID for routing
  name: string;
  url?: string; // Original tennis explorer URL
  category: 'ATP' | 'WTA' | 'ITF' | 'Challenger' | 'UTR Pro' | 'Mixed';
  surface?: 'Hard' | 'Clay' | 'Grass' | 'Indoor';
  location?: string;
  country?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
  prizeMoney?: string;
  
  // Tournament structure
  draw?: {
    size: number;
    rounds: string[];
    seededPlayers: number;
  };
  
  matches?: Match[]; // Matches in this tournament
  
  // Metadata
  lastUpdated?: string;
  createdAt?: string;
};

// Match entity - enhanced to match our scraped data
export type Match = {
  id: string; // Internal ID for routing
  matchId?: string; // From tennis explorer
  matchDetailUrl?: string; // Original match detail URL
  
  // Match timing
  time: string; // Format: "21:00"
  date: string; // Match date
  
  // Players
  player1: {
    id?: string; // Internal player ID if available
    name: string;
    url: string;
    imageUrl?: string; // Player image for avatar display
    country?: string;
    seeding?: string;
    ranking?: number;
  };
  player2: {
    id?: string;
    name: string;
    url: string;
    imageUrl?: string; // Player image for avatar display
    country?: string;
    seeding?: string;
    ranking?: number;
  };
  
  // Tournament info
  tournament: {
    id?: string; // Internal tournament ID if available
    name: string;
    url?: string;
    category: 'ATP' | 'WTA' | 'ITF' | 'Challenger' | 'UTR Pro' | 'Mixed';
    surface?: 'Hard' | 'Clay' | 'Grass' | 'Indoor';
    prizeMoney?: string;
  };
  
  round?: string; // "1st round", "2nd round", etc.
  
  // Match results
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'walkover' | 'retired';
  score?: string; // Raw score string like "6-3, 6-2, 6-4"
  sets?: MatchSets; // Parsed sets data
  winner?: 1 | 2; // Which player won
  duration?: number; // Match duration in minutes
  
  // Betting data
  odds?: {
    player1: number;
    player2: number;
  };
  
  // Additional URLs
  h2hUrl?: string;
  
  // Metadata
  scrapedFromEndpoint?: 'matches' | 'results';
  lastUpdated?: string;
  createdAt?: string;
};

// Daily schedule types for routes
export type DailySchedule = {
  date: string; // YYYY-MM-DD
  matches: Match[];
  totalMatches: number;
  completedMatches: number;
  liveMatches: number;
  scheduledMatches: number;
  tournaments: {
    [categoryKey: string]: {
      name: string;
      matches: Match[];
    };
  };
};

// Route parameter types
export type RouteParams = {
  id: string;
};

// API Response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};

// Component prop types
export type PlayerCardProps = {
  player: Player;
  compact?: boolean;
};

export type MatchCardProps = {
  match: Match;
  showTournament?: boolean;
  showDate?: boolean;
};

export type TournamentCardProps = {
  tournament: Tournament;
  showMatches?: boolean;
};

// Stats calculation types
export type PlayerStats = {
  winPercentage: number;
  recentForm: ('W' | 'L')[];
  surfaceWinPercentages: {
    clay: number;
    hard: number;
    grass: number;
    indoor: number;
  };
  h2hRecord?: {
    wins: number;
    losses: number;
    matches: Match[];
  };
};

// Filter types for data views
export type MatchFilters = {
  tournament?: string;
  surface?: 'Hard' | 'Clay' | 'Grass' | 'Indoor';
  category?: 'ATP' | 'WTA' | 'ITF' | 'Challenger' | 'UTR Pro' | 'Mixed';
  status?: 'scheduled' | 'live' | 'completed';
  date?: string;
};

export type PlayerFilters = {
  country?: string;
  sex?: 'Male' | 'Female';
  minRanking?: number;
  maxRanking?: number;
};