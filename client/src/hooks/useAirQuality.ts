import { useQuery } from "@tanstack/react-query";
import type { AirQualityResponse, SelectedLocation } from "../lib/types";

export function useAirQuality(location: SelectedLocation | null) {
  return useQuery<AirQualityResponse>({
    queryKey: ['airquality', location?.lat, location?.lon],
    queryFn: async () => {
      if (!location) throw new Error('No location provided');
      
      const response = await fetch(
        `/api/airquality?lat=${location.lat}&lon=${location.lon}&hours=24`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!location,
    staleTime: 15 * 60 * 1000, // 15 minutes to match backend cache
    refetchInterval: 15 * 60 * 1000, // Auto-refresh every 15 minutes
  });
}
