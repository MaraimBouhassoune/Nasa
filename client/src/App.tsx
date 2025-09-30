import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Globe } from "./components/Globe";
import { AirQualityPanel } from "./components/AirQualityPanel";
import { CitySearch } from "./components/CitySearch";
import { Button } from "./components/ui/button";
import { Globe as GlobeIcon, Settings, Menu } from "lucide-react";
import { cn } from "./lib/utils";
import type { SelectedLocation } from "./lib/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [healthProfile, setHealthProfile] = useState<string>("general");

  const handleLocationSelect = useCallback((location: SelectedLocation) => {
    setSelectedLocation(location);
    setShowPanel(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setShowPanel(false);
    setSelectedLocation(null);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative w-full h-full bg-gray-900 overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <GlobeIcon className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">AirGlobe</h1>
                <p className="text-xs text-gray-300">NASA Space Apps 2025</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <CitySearch onLocationSelect={handleLocationSelect} />
              
              <select
                value={healthProfile}
                onChange={(e) => setHealthProfile(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-400 focus:outline-none"
              >
                <option value="general">General</option>
                <option value="children">Children</option>
                <option value="asthma">Asthma</option>
                <option value="elderly">Elderly</option>
                <option value="athletes">Athletes</option>
              </select>
              
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Globe */}
        <div className="w-full h-full">
          <Globe
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* Side Panel */}
        <div className={cn(
          "absolute top-0 right-0 h-full w-96 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 transform transition-transform duration-300 z-30",
          showPanel ? "translate-x-0" : "translate-x-full"
        )}>
          {selectedLocation && (
            <AirQualityPanel
              location={selectedLocation}
              healthProfile={healthProfile}
              onClose={handleClosePanel}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center justify-between p-3 text-xs text-gray-300">
            <div className="flex items-center space-x-4">
              <span>Data: NASA TEMPO • OpenAQ • IMERG • MERRA-2</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>NASA Space Apps Challenge 2025</span>
            </div>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
