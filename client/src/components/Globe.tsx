import { useCallback, useRef, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { _GlobeView as GlobeView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers';
import { MapPin } from 'lucide-react';
import type { SelectedLocation } from '../lib/types';

interface GlobeProps {
  onLocationSelect: (location: SelectedLocation) => void;
  selectedLocation: SelectedLocation | null;
}

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 0.5,
  minZoom: 0,
  maxZoom: 20,
  pitch: 0,
  bearing: 0,
};

export function Globe({ onLocationSelect, selectedLocation }: GlobeProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback((info: any, event: any) => {
    if (isDragging) return;

    const { coordinate } = info;
    if (coordinate) {
      const [lon, lat] = coordinate;
      onLocationSelect({
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100,
        name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      });
    }
  }, [onLocationSelect, isDragging]);

  const handleDragStart = useCallback((info: any, event: any) => {
    setIsDragging(false);
    dragStartRef.current = { x: event.center.x, y: event.center.y };
  }, []);

  const handleDrag = useCallback((info: any, event: any) => {
    if (dragStartRef.current) {
      const dx = Math.abs(event.center.x - dragStartRef.current.x);
      const dy = Math.abs(event.center.y - dragStartRef.current.y);
      if (dx > 5 || dy > 5) {
        setIsDragging(true);
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setTimeout(() => setIsDragging(false), 100);
    dragStartRef.current = null;
  }, []);

  // Earth imagery tile layer using OpenStreetMap
  const layers = [
    new TileLayer({
      id: 'earth-tiles',
      data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props: any) => {
        const {
          bbox: { west, south, east, north },
        } = props.tile;

        return new BitmapLayer(props, {
          data: undefined,
          image: props.data,
          bounds: [west, south, east, north],
        });
      },
    }),

    // Selected location marker
    ...(selectedLocation ? [new ScatterplotLayer({
      id: 'selected-marker',
      data: [selectedLocation],
      coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      getPosition: (d: SelectedLocation) => [d.lon, d.lat, 0],
      getFillColor: [239, 68, 68, 255],
      getLineColor: [255, 255, 255, 255],
      lineWidthMinPixels: 2,
      radiusMinPixels: 8,
      radiusMaxPixels: 12,
      stroked: true,
    })] : []),
  ];

  if (!mounted) {
    return <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading globe...</div>
    </div>;
  }

  return (
    <div className="relative w-full h-full bg-gray-900">
      <DeckGL
        views={new GlobeView({
          resolution: 10,
        })}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        layers={layers}
        onViewStateChange={({ viewState }: any) => setViewState(viewState)}
        style={{ background: '#0a0a14' }}
        parameters={{
          clearColor: [0, 0, 0, 0]
        }}
        getTooltip={({ object }: any) => {
          if (object) {
            return {
              html: `<div class="bg-gray-800 text-white px-2 py-1 rounded text-xs">
                ${object.name}
              </div>`,
              style: {
                backgroundColor: 'transparent',
                fontSize: '12px',
              },
            };
          }
          return undefined;
        }}
      >
        {/* Ambient effect around Earth */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            background: 'radial-gradient(circle at center, transparent 30%, rgba(10,10,20,0.8) 70%)',
          }}
        />
      </DeckGL>

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1 z-10">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3 h-3" />
          <span>Cliquez sur la Terre pour voir la qualité de l'air</span>
        </div>
        <div className="text-gray-400">
          Glissez pour tourner • Molette pour zoomer
        </div>
      </div>
    </div>
  );
}
