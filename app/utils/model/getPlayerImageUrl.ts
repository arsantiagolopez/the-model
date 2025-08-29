/**
 * Constructs the full player image URL from a player image path
 * @param imagePath - The image path from the database (e.g., "/players/player123.jpg")
 * @returns Full image URL or undefined if no image path provided
 */
export function getPlayerImageUrl(imagePath?: string | null): string | undefined {
  if (!imagePath) return undefined;
  
  const baseUrl = import.meta.env.VITE_SCRAPING_SCHEDULE_URL;
  if (!baseUrl) return undefined;
  
  // If imagePath already includes the base URL, return it as-is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Ensure the path starts with a slash
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${path}`;
}