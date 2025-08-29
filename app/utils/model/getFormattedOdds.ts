export const getFormattedOdds = (odds: number, format: 'american' | 'decimal' = 'american'): string => {
  if (!odds || odds === 0) return '--';

  if (format === 'decimal') {
    // Convert American odds to decimal
    if (odds > 0) {
      return (odds / 100 + 1).toFixed(2);
    } else {
      return (100 / Math.abs(odds) + 1).toFixed(2);
    }
  } else {
    // American format
    if (odds > 0) {
      return `+${odds}`;
    } else {
      return odds.toString();
    }
  }
};