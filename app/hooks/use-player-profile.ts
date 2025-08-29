import { useFetcher } from "react-router";
import { useEffect } from "react";

export function usePlayerProfile(playerId: string | null | undefined) {
  const fetcher = useFetcher<any>();
  
  // Only load data on client side using useEffect to avoid SSR issues
  useEffect(() => {
    if (playerId && fetcher.state === "idle" && !fetcher.data && typeof window !== 'undefined') {
      // Clean the playerId format for the API call
      const cleanPlayerId = playerId.replace("/player/", "").replace(/\/$/, "");
      const url = `/api/model/players/profile/${cleanPlayerId}`;
      fetcher.load(url);
    }
  }, [playerId, fetcher]);

  return {
    data: fetcher.data,
    loading: fetcher.state === "loading", 
    error: fetcher.data && "error" in fetcher.data ? fetcher.data.error : null
  };
}