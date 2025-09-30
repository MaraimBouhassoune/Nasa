import { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useCitySearch } from '../hooks/useCitySearch';
import type { SelectedLocation, CitySearchResult } from '../lib/types';
import { cn } from '../lib/utils';

interface CitySearchProps {
  onLocationSelect: (location: SelectedLocation) => void;
}

export function CitySearch({ onLocationSelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: cities = [], isLoading } = useCitySearch(query);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: CitySearchResult) => {
    onLocationSelect({
      lat: city.lat,
      lon: city.lon,
      name: `${city.name}, ${city.country}`,
    });
    setQuery(city.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(e.target.value.length >= 2);
  };

  const handleFocus = () => {
    if (query.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search cities..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="pl-10 pr-4 py-2 w-64 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {isLoading && (
            <div className="p-3 text-center text-gray-400 text-sm">
              Searching...
            </div>
          )}

          {!isLoading && cities.length === 0 && query.length >= 2 && (
            <div className="p-3 text-center text-gray-400 text-sm">
              No cities found
            </div>
          )}

          {cities.map((city, index) => (
            <button
              key={index}
              onClick={() => handleCitySelect(city)}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {city.name}
                  </div>
                  <div className="text-gray-400 text-sm truncate">
                    {city.country}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
