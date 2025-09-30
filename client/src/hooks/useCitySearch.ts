import { useQuery } from "@tanstack/react-query";
import type { CitySearchResult } from "../lib/types";

export function useCitySearch(query: string) {
  return useQuery<CitySearchResult[]>({
    queryKey: ['cities', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const response = await fetch(`/api/cities/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Search Error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
