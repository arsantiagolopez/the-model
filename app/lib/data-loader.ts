// Data loader for model routes - uses latest JSON test data
import type { Match, Player, Tournament, DailySchedule } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load the latest data - prioritizes production scrapes over batch tests
export async function loadLatestBatchTestData(): Promise<{
  matches: Match[];
  players: Player[];
  tournaments: Tournament[];
} | null> {
  try {
    const testDataDir = path.join(process.cwd(), 'test-data');
    const files = await fs.readdir(testDataDir);
    
    // Look for production scrapes first (highest priority)
    const productionFiles = files
      .filter(f => f.startsWith('production-scrape-') && f.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first
      
    // Look for cluster files (second priority)
    const clusterFiles = files
      .filter(f => f.startsWith('cluster-') && f.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first
      
    // Look for batch test files (fallback)
    const batchFiles = files
      .filter(f => f.startsWith('batch-') && f.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first
    
    // Prefer production scrapes, then cluster, then batch tests
    const preferredFiles = productionFiles.length > 0 ? productionFiles : 
                          clusterFiles.length > 0 ? clusterFiles : 
                          batchFiles;
    
    if (preferredFiles.length === 0) {
      return null;
    }
    
    const latestFile = path.join(testDataDir, preferredFiles[0]);
    const rawData = await fs.readFile(latestFile, 'utf-8');
    const data = JSON.parse(rawData);
    
    const dataType = preferredFiles === productionFiles ? 'production scrape' : 
                    preferredFiles === clusterFiles ? 'cluster scrape' : 'batch test';
    console.log(`📊 Loading ${dataType} data from: ${preferredFiles[0]}`);
    console.log(`   Found ${data.data?.matches?.length || 0} matches, ${data.data?.players?.length || 0} players, ${data.data?.tournaments?.length || 0} tournaments`);
    
    // Transform the data (same structure for both production and batch)
    const matches = data.data?.matches?.map((m: any) => transformMatch(m)) || [];
    const players = data.data?.players?.map((p: any, index: number) => transformPlayer(p, index.toString())) || [];
    const tournaments = data.data?.tournaments?.map((t: any) => transformTournament(t)) || [];
    
    return { matches, players, tournaments };
  } catch (error) {
    console.error('Failed to load data:', error);
    return null;
  }
}

// Load the latest scraper test results (fallback for single test data)
export async function loadLatestTestData(): Promise<{
  match: Match | null;
  player1: Player | null;
  player2: Player | null;
}> {
  try {
    // Find the most recent test data file
    const testDataDir = path.join(process.cwd(), 'test-data');
    const files = await fs.readdir(testDataDir);
    const testFiles = files
      .filter(f => f.startsWith('scraper-test-') && f.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first
    
    if (testFiles.length === 0) {
      return { match: null, player1: null, player2: null };
    }
    
    const latestFile = path.join(testDataDir, testFiles[0]);
    const rawData = await fs.readFile(latestFile, 'utf-8');
    const testData = JSON.parse(rawData);
    
    // Transform scraped data to our unified types
    const match: Match | null = testData.results?.match ? transformMatch(testData.results.match) : null;
    const player1: Player | null = testData.results?.player1 ? transformPlayer(testData.results.player1, '1') : null;
    const player2: Player | null = testData.results?.player2 ? transformPlayer(testData.results.player2, '2') : null;
    
    return { match, player1, player2 };
  } catch (error) {
    console.error('Failed to load test data:', error);
    return { match: null, player1: null, player2: null };
  }
}

// Helper function to enrich tournament with player images in matches
function enrichTournamentWithPlayerImages(tournament: Tournament, players: Player[]): Tournament {
  if (!tournament.matches) return tournament;
  
  return {
    ...tournament,
    matches: tournament.matches.map(match => enrichMatchWithPlayerImages(match, players)),
  };
}

// Helper function to enrich match with player images
function enrichMatchWithPlayerImages(match: Match, players: Player[]): Match {
  const findPlayerByName = (playerName: string) => {
    // Try to find player by exact name match
    let player = players.find(p => p.name === playerName);
    if (player) return player;
    
    // Handle abbreviated names - match surname and first letter
    // e.g., "Marakhtanova P." matches "Marakhtanova Polina"
    const shortNameParts = playerName.toLowerCase().split(' ');
    if (shortNameParts.length === 2 && shortNameParts[1].endsWith('.')) {
      const surname = shortNameParts[0];
      const firstInitial = shortNameParts[1].charAt(0);
      
      player = players.find(p => {
        const fullNameParts = p.name.toLowerCase().split(' ');
        if (fullNameParts.length >= 2) {
          const fullSurname = fullNameParts[0];
          const fullFirstName = fullNameParts[1];
          return fullSurname === surname && fullFirstName.startsWith(firstInitial);
        }
        return false;
      });
      if (player) return player;
    }
    
    // Try to find by similar name (handle other variations)
    player = players.find(p => {
      const fullName = p.name.toLowerCase();
      const shortName = playerName.toLowerCase();
      return fullName.includes(shortName.replace('.', '')) || shortName.includes(fullName.split(' ')[0]);
    });
    if (player) return player;
    
    // Try to find by URL matching
    if (match.player1.url || match.player2.url) {
      const playerUrl = playerName === match.player1.name ? match.player1.url : match.player2.url;
      if (playerUrl) {
        player = players.find(p => p.url === playerUrl);
        if (player) return player;
      }
    }
    
    return null;
  };

  const player1Data = findPlayerByName(match.player1.name);
  const player2Data = findPlayerByName(match.player2.name);

  return {
    ...match,
    player1: {
      ...match.player1,
      imageUrl: player1Data?.imageUrl || undefined,
      country: player1Data?.country || match.player1.country,
    },
    player2: {
      ...match.player2,
      imageUrl: player2Data?.imageUrl || undefined,
      country: player2Data?.country || match.player2.country,
    },
  };
}

// Transform scraped match data to unified Match type
function transformMatch(scrapedMatch: any): Match {
  // Extract match ID from matchDetailUrl if available
  let matchId = scrapedMatch.matchId;
  if (!matchId && scrapedMatch.matchDetailUrl) {
    const match = scrapedMatch.matchDetailUrl.match(/id=(\d+)/);
    matchId = match ? match[1] : null;
  }
  
  // Create a fallback ID if no match ID found
  if (!matchId) {
    const player1Name = scrapedMatch.player1?.name || 'player1';
    const player2Name = scrapedMatch.player2?.name || 'player2';
    const date = scrapedMatch.date || '2025-01-01';
    matchId = `${player1Name.replace(/\W/g, '')}-vs-${player2Name.replace(/\W/g, '')}-${date}`.toLowerCase();
  }
  
  return {
    id: matchId,
    matchId: matchId,
    matchDetailUrl: scrapedMatch.matchDetailUrl,
    time: scrapedMatch.time || '00:00',
    date: scrapedMatch.date || new Date().toISOString().split('T')[0],
    player1: {
      name: scrapedMatch.player1?.name || 'Unknown Player',
      url: scrapedMatch.player1?.url || '',
      country: scrapedMatch.player1?.country,
      seeding: scrapedMatch.player1?.seeding,
      ranking: scrapedMatch.player1?.ranking,
    },
    player2: {
      name: scrapedMatch.player2?.name || 'Unknown Player',
      url: scrapedMatch.player2?.url || '',
      country: scrapedMatch.player2?.country,
      seeding: scrapedMatch.player2?.seeding,
      ranking: scrapedMatch.player2?.ranking,
    },
    tournament: {
      name: scrapedMatch.tournament?.name || 'Unknown Tournament',
      url: scrapedMatch.tournament?.url || '',
      category: scrapedMatch.tournament?.category || 'Mixed',
      surface: scrapedMatch.tournament?.surface,
      prizeMoney: scrapedMatch.tournament?.prizeMoney,
    },
    round: scrapedMatch.round,
    status: scrapedMatch.status || 'scheduled',
    score: scrapedMatch.score,
    odds: scrapedMatch.odds,
    h2hUrl: scrapedMatch.h2hUrl,
    lastUpdated: new Date().toISOString(),
  };
}

// Transform scraped player data to unified Player type
function transformPlayer(scrapedPlayer: any, playerId: string): Player {
  return {
    id: playerId,
    tennisExplorerId: extractPlayerIdFromUrl(scrapedPlayer.url),
    name: scrapedPlayer.name || 'Unknown Player',
    url: scrapedPlayer.url || '',
    imageUrl: scrapedPlayer.imageUrl,
    country: scrapedPlayer.country || 'Unknown',
    birthDate: scrapedPlayer.birthDate,
    age: scrapedPlayer.age,
    sex: scrapedPlayer.sex,
    plays: scrapedPlayer.plays,
    singlesRecord: scrapedPlayer.singlesRecord || { wins: 0, losses: 0 },
    surfaceRecords: scrapedPlayer.surfaceRecords || {
      clay: { wins: 0, losses: 0 },
      hard: { wins: 0, losses: 0 },
      grass: { wins: 0, losses: 0 },
      indoor: { wins: 0, losses: 0 },
    },
    yearlyRecords: scrapedPlayer.yearlyRecords,
    titles: scrapedPlayer.titles || {
      singles: { main: 0, challenger: 0 },
      doubles: { main: 0, challenger: 0 },
    },
    yearMatches: scrapedPlayer.yearMatches,
    tournamentAchievements: scrapedPlayer.tournamentAchievements,
    injuries: scrapedPlayer.injuries,
    ranking: scrapedPlayer.ranking,
    lastUpdated: new Date().toISOString(),
  };
}

// Transform scraped tournament data to unified Tournament type
function transformTournament(scrapedTournament: any): Tournament {
  return {
    id: scrapedTournament.name.replace(/\s+/g, '-').toLowerCase(),
    name: scrapedTournament.name,
    url: scrapedTournament.url || '',
    category: scrapedTournament.category || 'Unknown',
    surface: scrapedTournament.surface || 'Unknown',
    location: scrapedTournament.location || 'Unknown',
    country: scrapedTournament.country || 'Unknown',
    matches: scrapedTournament.matches?.map((m: any) => transformMatch(m)) || [],
    lastUpdated: new Date().toISOString(),
  };
}

// Extract player ID from tennis explorer URL
function extractPlayerIdFromUrl(url: string): string {
  if (!url) return 'unknown';
  const match = url.match(/\/player\/([^\/]+)\//);
  return match ? match[1] : 'unknown';
}

// Create daily schedule for today/tomorrow using batch data if available
export async function getDailySchedule(date: string): Promise<DailySchedule> {
  // Try to load batch data first
  const batchData = await loadLatestBatchTestData();
  
  let matches: Match[] = [];
  
  if (batchData) {
    // Use batch data - all matches for better demo
    matches = batchData.matches.map(match => enrichMatchWithPlayerImages(match, batchData.players));
    console.log(`📊 Using batch data: ${matches.length} matches from ${batchData.tournaments.length} tournaments`);
  } else {
    // Fallback to single test data
    const { match } = await loadLatestTestData();
    matches = match ? [match] : [];
    console.log(`📊 Using single test data: ${matches.length} match`);
  }
  
  const schedule: DailySchedule = {
    date,
    matches,
    totalMatches: matches.length,
    completedMatches: matches.filter(m => m.status === 'completed').length,
    liveMatches: matches.filter(m => m.status === 'live').length,
    scheduledMatches: matches.filter(m => m.status === 'scheduled').length,
    tournaments: {},
  };
  
  // Group matches by tournament
  matches.forEach(match => {
    const tournamentKey = match.tournament.name.replace(/\s+/g, '-').toLowerCase();
    if (!schedule.tournaments[tournamentKey]) {
      schedule.tournaments[tournamentKey] = {
        name: match.tournament.name,
        matches: [],
      };
    }
    schedule.tournaments[tournamentKey].matches.push(match);
  });
  
  return schedule;
}

// Get player by ID using batch data if available
export async function getPlayerById(id: string): Promise<Player | null> {
  // Try batch data first
  const batchData = await loadLatestBatchTestData();
  
  if (batchData) {
    // Look for player by extracted ID from URL
    const player = batchData.players.find(p => extractPlayerIdFromUrl(p.url) === id);
    if (player) return player;
    
    // Look for player by name (converted to ID format)
    const playerByName = batchData.players.find(p => 
      p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === id
    );
    if (playerByName) return playerByName;
  }
  
  // Fallback to single test data
  const { player1, player2 } = await loadLatestTestData();
  
  if (id === '1' && player1) return player1;
  if (id === '2' && player2) return player2;
  
  // Extract from URL if it's a tennis explorer player URL
  if (player1 && extractPlayerIdFromUrl(player1.url) === id) return player1;
  if (player2 && extractPlayerIdFromUrl(player2.url) === id) return player2;
  
  return null;
}

// Get match by ID using batch data if available
export async function getMatchById(id: string): Promise<Match | null> {
  // Try batch data first
  const batchData = await loadLatestBatchTestData();
  
  if (batchData) {
    const match = batchData.matches.find(m => m.id === id || m.matchId === id);
    if (match) return enrichMatchWithPlayerImages(match, batchData.players);
  }
  
  // Fallback to single test data
  const { match } = await loadLatestTestData();
  
  if (match && (match.id === id || match.matchId === id)) {
    return match;
  }
  
  return null;
}

// Get tournament by ID using batch data if available
export async function getTournamentById(id: string): Promise<Tournament | null> {
  // Try batch data first
  const batchData = await loadLatestBatchTestData();
  
  if (batchData) {
    const tournament = batchData.tournaments.find(t => t.id === id);
    if (tournament) return enrichTournamentWithPlayerImages(tournament, batchData.players);
    
    // Also try by name converted to ID format
    const tournamentByName = batchData.tournaments.find(t => 
      t.name.replace(/\s+/g, '-').toLowerCase() === id
    );
    if (tournamentByName) return enrichTournamentWithPlayerImages(tournamentByName, batchData.players);
  }
  
  // Fallback to single test data
  const { match } = await loadLatestTestData();
  
  if (!match) return null;
  
  const tournamentId = match.tournament.name.replace(/\s+/g, '-').toLowerCase();
  
  if (tournamentId === id) {
    return {
      id: tournamentId,
      name: match.tournament.name,
      url: match.tournament.url,
      category: match.tournament.category,
      surface: match.tournament.surface,
      prizeMoney: match.tournament.prizeMoney,
      matches: [enrichMatchWithPlayerImages(match, [])],
      lastUpdated: new Date().toISOString(),
    };
  }
  
  return null;
}

// Utility function to get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Utility function to get tomorrow's date in YYYY-MM-DD format
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}