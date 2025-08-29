import { getPlayerImageUrl } from "./getPlayerImageUrl";

/**
 * Gets player info from players array by player ID/link
 * @param players - Array of players from database
 * @param playerId - The player ID or link to search for
 * @returns Player info with constructed image URL
 */
export function getPlayerFromId(players: any[], playerId?: string) {
  if (!playerId || !players?.length) return null;
  
  const player = players.find(p => 
    p.playerId === playerId || 
    p.playerId === playerId.replace('/', '') || // Handle leading slash differences
    `/players/${p.playerId}` === playerId
  );
  
  if (!player) return null;
  
  return {
    ...player,
    imageUrl: getPlayerImageUrl(player.image)
  };
}