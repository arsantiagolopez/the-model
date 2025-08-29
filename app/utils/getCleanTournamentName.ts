export function getCleanTournamentName(tournamentName: string): string {
  // Remove common tournament prefixes/suffixes
  return tournamentName
    .replace(/ATP\s+/gi, '')
    .replace(/WTA\s+/gi, '')
    .replace(/\s+\d{4}$/gi, '') // Remove year at end
    .trim();
}