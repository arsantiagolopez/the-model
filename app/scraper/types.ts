// Based on actual tennisexplorer.com data structure

// Unified sets type for ALL match formats across the entire app
export type MatchSets = {
  sets: Array<{
    player1: number;
    player2: number;
    tiebreak?: {
      player1: number;
      player2: number;
    };
  }>;
  // Computed properties for easy access
  totalSets: number;
  player1SetsWon: number;
  player2SetsWon: number;
  matchFormat: '3-set' | '5-set'; // Best of 3 or best of 5
  completed: boolean;
};

export type MatchData = {
  matchId?: string; // From match-detail URL ID
  time: string; // Format: "21:00"
  player1: {
    name: string;
    url: string; // Format: "/player/lastname-code/"
    seeding?: string; // "[1]", "[WC]", "[Q]", etc.
    ranking?: number;
  };
  player2: {
    name: string;
    url: string;
    seeding?: string;
    ranking?: number;
  };
  tournament: {
    name: string;
    url: string;
    category: 'ATP' | 'WTA' | 'ITF' | 'Challenger' | 'UTR Pro' | 'Mixed';
    surface?: 'Hard' | 'Clay' | 'Grass' | 'Indoor';
    prizeMoney?: string; // Format: "$31,620,000"
  };
  round?: string; // "1st round", "2nd round", "Round of 16", etc.
  score?: string; // Set-by-set: "6-3, 6-2, 6-4" or "7-6(3), 6-4"
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'walkover' | 'retired';
  odds?: {
    player1: number; // e.g., 1.25
    player2: number; // e.g., 3.28
  };
  matchDetailUrl?: string; // "/match-detail/?id=3004613"
  h2hUrl?: string;
  date: string; // Match date
};

export type PlayerProfile = {
  name: string;
  url: string;
  imageUrl?: string; // Format: "/res/img/player/2yxhH1ya-KKWyfaNo.jpeg" or full URL
  country: string;
  birthDate: string; // Format: "5. 6. 1974"
  age: number;
  sex: 'Male' | 'Female';
  plays: 'Left-handed' | 'Right-handed';
  
  // Current Rankings
  singlesRank?: {
    current?: number;
    highest: number;
  };
  doublesRank?: {
    current?: number;
    highest: number;
  };
  
  // Comprehensive ranking info
  ranking?: {
    current: number;
    highest: number;
  };

  // Career Statistics
  singlesRecord: {
    wins: number;
    losses: number;
  };
  
  // Surface Records (career totals)
  surfaceRecords: {
    clay: { wins: number; losses: number };
    hard: { wins: number; losses: number };
    grass: { wins: number; losses: number };
    indoor: { wins: number; losses: number };
  };

  // Yearly Records - comprehensive breakdown by year
  yearlyRecords?: {
    [year: string]: {
      summary: { wins: number; losses: number };
      clay: { wins: number; losses: number };
      hard: { wins: number; losses: number };
      indoor: { wins: number; losses: number };
      grass: { wins: number; losses: number };
    };
  };

  // Titles with detailed tournament information
  titles: {
    singles: {
      main: number;
      challenger: number;
      tournaments: {
        [year: string]: {
          main: Array<{
            name: string;
            url?: string;
            prizeMoney?: string;
            surface?: string;
            date?: string;
          }>;
          challenger: Array<{
            name: string;
            url?: string;
            prizeMoney?: string;
            surface?: string;
            date?: string;
          }>;
        };
      };
    };
    doubles: {
      main: number;
      challenger: number;
      tournaments: {
        [year: string]: {
          main: Array<{
            name: string;
            url?: string;
            prizeMoney?: string;
            surface?: string;
            date?: string;
          }>;
          challenger: Array<{
            name: string;
            url?: string;
            prizeMoney?: string;
            surface?: string;
            date?: string;
          }>;
        };
      };
    };
    mixedDoubles?: {
      count: number;
      tournaments: {
        [year: string]: Array<{
          name: string;
          url?: string;
          prizeMoney?: string;
          surface?: string;
          date?: string;
        }>;
      };
    };
  };

  // Yearly Match History organized by tournament
  yearMatches?: {
    [year: string]: {
      [tournament: string]: Array<{
        date: string; // "30.08." format
        opponent: string;
        round: string; // "3R", "SF", "QF", "R16", "1R", "2R"
        result: 'won' | 'lost';
        sets: MatchSets;
        odds: {
          player: number; // H (home/player odds)
          opponent: number; // A (away/opponent odds)
        };
      }>;
    };
  };

  // Tournament-specific achievements by year
  tournamentAchievements?: {
    [tournamentName: string]: Array<{
      year: string;
      result: string; // "winner", "finalist", "semifinalist", "3rd round", etc.
    }>;
  };

  // Injury history
  injuries?: Array<{
    year: string;
    type: string; // 'retired', 'walkover', 'injury', 'withdrew'
    description: string;
    startDate?: string;
    endDate?: string;
    tournament?: string;
  }>;

  // Recent matches/form
  recentMatches?: MatchData[];
};

export type TournamentInfo = {
  name: string;
  url: string;
  year: number;
  category: 'ATP' | 'WTA' | 'ITF' | 'Challenger' | 'UTR Pro' | 'Mixed';
  surface: 'Hard' | 'Clay' | 'Grass' | 'Indoor';
  location: string;
  country: string;
  prizeMoney?: string;
  
  // Tournament structure
  draw: {
    size: number; // 128, 64, 32, etc.
    rounds: string[]; // ["1st round", "2nd round", ...]
    seededPlayers: number;
  };
  
  matches: MatchData[];
};

// Scraping configuration
export type ScrapingConfig = {
  concurrency: number;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  requestDelay: number; // milliseconds between requests
  timeout: number; // request timeout
  
  // Enterprise features
  userAgents: string[];
  proxyList?: string[];
  enableIPRotation: boolean;
  
  // Caching
  enableCaching: boolean;
  cacheDirectory: string;
  cacheTTL: number; // cache time-to-live in seconds
  
  // Logging
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  logDirectory: string;
};

export type ScrapingResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  url: string;
  timestamp: number;
  retryCount: number;
  duration: number; // request duration in ms
};

export type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
  url: string;
};

// URL patterns based on actual site structure
export type URLPatterns = {
  dailyMatches: (year: number, month: number, day: number) => string;
  dailyResults: (year: number, month: number, day: number) => string;
  playerProfile: (playerSlug: string) => string;
  matchDetail: (matchId: string) => string;
  tournament: (tournamentSlug: string, year: number, category: string) => string;
  ranking: (tourType: 'atp-men' | 'wta-women') => string;
};

export type DailyScrapeTarget = {
  date: string; // YYYY-MM-DD
  purpose: 'results' | 'predictions';
  shouldScrapeDetails: boolean; // true for tomorrow (predictions), false for today (results)
};