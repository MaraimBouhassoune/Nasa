import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { SelectedLocation } from '../lib/types';

interface GlobeProps {
  onLocationSelect: (location: SelectedLocation) => void;
  selectedLocation: SelectedLocation | null;
}

export function Globe({ onLocationSelect, selectedLocation }: GlobeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMapClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) return;
    
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
    const y = ((e.clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;

    // Convert SVG coordinates to lat/lon (simplified mercator projection)
    const lon = (x / viewBox.width) * 360 - 180;
    const latRad = (Math.PI / 2) - (2 * Math.atan(Math.exp((y / viewBox.height - 0.5) * 2 * Math.PI)));
    const lat = (latRad * 180) / Math.PI;

    onLocationSelect({
      lat: Math.max(-85, Math.min(85, lat)),
      lon: Math.max(-180, Math.min(180, lon)),
      name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    });
  }, [onLocationSelect, viewBox, isDragging]);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    
    setViewBox(prev => ({
      ...prev,
      width: Math.min(1600, Math.max(400, prev.width * zoomFactor)),
      height: Math.min(1200, Math.max(300, prev.height * zoomFactor))
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const dx = (dragStart.x - e.clientX) * (viewBox.width / 800);
    const dy = (dragStart.y - e.clientY) * (viewBox.height / 600);

    setViewBox(prev => ({
      ...prev,
      x: Math.max(-400, Math.min(800, prev.x + dx)),
      y: Math.max(-300, Math.min(600, prev.y + dy))
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, viewBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const latLonToSVG = useCallback((lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * viewBox.width;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (viewBox.height / 2) - (viewBox.height * mercN / (2 * Math.PI));
    return { x, y };
  }, [viewBox]);

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="w-full h-full cursor-pointer"
        onClick={handleMapClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* World map simplified - drawing major continents as paths */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(100,100,100,0.2)" strokeWidth="1"/>
          </pattern>
        </defs>
        
        {/* Background */}
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="#1a1a26" />
        <rect x="0" y="0" width="800" height="600" fill="url(#grid)" />
        
        {/* Simplified world map - continents as basic shapes */}
        <g fill="rgba(60, 60, 60, 0.8)" stroke="rgba(120, 120, 120, 1)" strokeWidth="1">
          {/* North America */}
          <path d="M 100,150 L 150,100 L 200,120 L 250,100 L 280,150 L 250,250 L 200,280 L 150,250 L 120,200 Z" />
          
          {/* South America */}
          <path d="M 200,300 L 220,280 L 240,320 L 250,400 L 230,450 L 210,440 L 200,380 Z" />
          
          {/* Europe */}
          <path d="M 400,150 L 450,120 L 480,150 L 460,180 L 420,170 Z" />
          
          {/* Africa */}
          <path d="M 400,200 L 450,220 L 480,280 L 470,350 L 440,380 L 410,360 L 400,280 Z" />
          
          {/* Asia */}
          <path d="M 500,100 L 600,80 L 700,120 L 720,180 L 680,220 L 600,200 L 520,180 Z" />
          
          {/* Australia */}
          <path d="M 650,380 L 700,370 L 720,400 L 700,420 L 660,410 Z" />
          
          {/* Antarctica */}
          <path d="M 200,520 L 600,520 L 580,560 L 220,560 Z" />
        </g>

        {/* Latitude/Longitude lines */}
        <g stroke="rgba(80, 80, 150, 0.3)" strokeWidth="0.5" fill="none">
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`lat-${i}`}
              x1="0"
              y1={600 * i / 8}
              x2="800"
              y2={600 * i / 8}
            />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`lon-${i}`}
              x1={800 * i / 12}
              y1="0"
              x2={800 * i / 12}
              y2="600"
            />
          ))}
        </g>

        {/* Selected location marker */}
        {selectedLocation && (() => {
          const { x, y } = latLonToSVG(selectedLocation.lat, selectedLocation.lon);
          return (
            <g>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill="#ef4444"
                stroke="#fff"
                strokeWidth="2"
                className="animate-pulse"
              />
              <circle
                cx={x}
                cy={y}
                r="15"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                opacity="0.5"
              />
            </g>
          );
        })()}
      </svg>

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3 h-3" />
          <span>Click anywhere to view air quality</span>
        </div>
        <div className="text-gray-400">
          Drag to pan • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
