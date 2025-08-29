import { useFetcher } from "react-router";
import { useEffect } from "react";

export function useMatchData(matchId: string | null, withLastMatches = true) {
  const fetcher = useFetcher<any>();
  
  // Only load data on client side using useEffect to avoid SSR issues
  useEffect(() => {
    if (matchId && fetcher.state === "idle" && !fetcher.data && typeof window !== 'undefined') {
      const url = `/api/model/matches/${matchId}${withLastMatches ? '?withLastMatches=true' : ''}`;
      fetcher.load(url);
    }
  }, [matchId, withLastMatches, fetcher]);

  return {
    data: fetcher.data,
    loading: fetcher.state === "loading",
    error: fetcher.data && "error" in fetcher.data ? fetcher.data.error : null
  };
}