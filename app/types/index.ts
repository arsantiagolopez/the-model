// Re-export all types from model.ts for backward compatibility
export * from './model';

export interface PlayerAndCountry {
  player: import('./model').PlayerEntity;
  country?: string;
  countryCode?: string;
}

export interface MatchResult {
  winner?: string;
  homeSets?: number;
  awaySets?: number;
  homeGames?: number[];
  awayGames?: number[];
}

export interface SelectedWagerData {
  type: 'moneyline' | 'spread' | 'total';
  selection: 'home' | 'away' | 'over' | 'under';
  odds: number;
  spread?: number;
  line?: number;
}

export interface MatchPlayerProfilesAndSurfaceRecords {
  match: any;
  homeProfile?: any;
  awayProfile?: any;
  homeCurrentSurfaceRecord?: { win: number; loss: number };
  awayCurrentSurfaceRecord?: { win: number; loss: number };
}

export interface MatchPlayerProfilesAndDates {
  match: any;
  homeProfile?: any;
  awayProfile?: any;
  homeLastPlayedDate?: Date;
  awayLastPlayedDate?: Date;
  homeDaysSinceLastMatch?: number;
  awayDaysSinceLastMatch?: number;
}

export interface PlayerRecord {
  playerId: string;
  records?: any;
}

export interface BetEntity {
  id?: string;
  home?: string;
  away?: string;
  odds?: any;
  returns?: number;
  stake?: number;
  sport?: string;
  startTime?: Date;
  status?: string;
  tournament?: string;
  tournamentName?: string;
  wager?: string;
  reasoning?: string;
  matchIds?: string[];
}