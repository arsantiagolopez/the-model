export interface MatchEntity {
  id: string;
  matchId: string;
  tournament: string;
  tournamentLink: string;
  tournamentId?: string;
  home: string;
  away: string;
  homeLink: string;
  awayLink: string;
  homeOdds: number;
  awayOdds: number;
  homeH2h?: number;
  awayH2h?: number;
  surface?: string;
  round?: string;
  date: string | Date;
  year?: number;
  type?: string;
  matchLink?: string;
  result?: {
    winner?: string;
    homeSets?: number;
    awaySets?: number;
  };
  odds?: {
    moneyline?: {
      home: number;
      away: number;
    };
    spreadGames?: Array<{
      spread: number;
      home: number;
      away: number;
    }>;
    spreadSets?: Array<{
      spread: number;
      home: number;
      away: number;
    }>;
    totalGames?: Array<{
      line: number;
      over: number;
      under: number;
    }>;
  };
  headToHeadMatches?: MatchEntity[];
  playersLastMatches?: {
    homeLastMatches?: MatchEntity[];
    awayLastMatches?: MatchEntity[];
  };
}

export interface TournamentDetails {
  tournamentId: string;
  points: number;
  countryCode: string;
  surface: string;
  type: "singles" | "doubles";
}

export interface DetailsHash {
  [tournamentLink: string]: {
    points: number;
    countryCode: string;
  };
}

export interface PlayerEntity {
  playerId: string;
  profile: {
    image?: string;
    name: string;
    country?: string;
    ranking?: number;
  };
  form?: number;
  streak?: number;
  lastMatches?: MatchEntity[];
  upcomingMatch?: {
    tournament?: string;
    tournamentLink?: string;
    date?: string;
    tournamentId?: string;
  };
}

export interface PlayerProfile {
  playerId: string;
  profile: {
    image?: string;
    name: string;
    country?: string;
    ranking?: number;
  };
  lastMatches?: Array<{
    home: string;
    away: string;
    result?: {
      winner: string;
    };
  }>;
}

export interface ParlayLeg {
  matchId: string;
  playerId?: string;
  playerName?: string;
  headline?: string;
  odds: number;
  isSelected?: boolean;
  wager?: string;
  date?: Date;
  imageSrc?: string;
}