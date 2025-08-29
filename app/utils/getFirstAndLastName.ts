export function getFirstAndLastName(name: string): { first: string; last: string } {
  const parts = name.trim().split(' ');
  return {
    first: parts[0] || '',
    last: parts.slice(1).join(' ') || ''
  };
}