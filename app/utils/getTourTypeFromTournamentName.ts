export function getTourTypeFromTournamentName(tournamentName: string): string {
  const lowerName = tournamentName.toLowerCase();
  
  if (lowerName.includes('wta')) return 'wta';
  if (lowerName.includes('atp')) return 'atp';
  if (lowerName.includes('itf')) return 'itf';
  
  // Default to ATP if no clear tour type
  return 'atp';
}