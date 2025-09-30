import { useCallback, useRef, useEffect } from 'react';
import * as Cesium from 'cesium';
import { MapPin } from 'lucide-react';
import type { SelectedLocation } from '../lib/types';

interface GlobeCesiumProps {
  onLocationSelect: (location: SelectedLocation) => void;
  selectedLocation: SelectedLocation | null;
}

export function GlobeCesium({ onLocationSelect, selectedLocation }: GlobeCesiumProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      homeButton: false,
      navigationHelpButton: false,
      baseLayerPicker: false,
      geocoder: false,
      sceneModePicker: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      requestRenderMode: true,
      scene3DOnly: true,
      shouldAnimate: false,
      contextOptions: {
        failIfMajorPerformanceCaveat: false,
        requestWebgl1: true,
        webgl: {
          alpha: false,
          depth: true,
          stencil: false,
          antialias: true,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
          preferLowPowerToHighPerformance: false
        }
      }
    });

    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.atmospherePhase = true;

    const gibsProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_ShadedRelief_Bathymetry/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
      layer: 'BlueMarble_ShadedRelief_Bathymetry',
      style: 'default',
      format: 'image/jpeg',
      tileMatrixSetID: '250m',
      maximumLevel: 8,
      credit: new Cesium.Credit('NASA GIBS')
    });

    viewer.imageryLayers.addImageryProvider(gibsProvider);

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      const cartesian = viewer.camera.pickEllipsoid(
        movement.position,
        viewer.scene.globe.ellipsoid
      );

      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);

        onLocationSelect({
          lat: Math.round(lat * 100) / 100,
          lon: Math.round(lon * 100) / 100,
          name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [onLocationSelect]);

  useEffect(() => {
    if (!viewerRef.current || !selectedLocation) return;

    if (entityRef.current) {
      viewerRef.current.entities.remove(entityRef.current);
    }

    const entity = viewerRef.current.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        selectedLocation.lon,
        selectedLocation.lat
      ),
      point: {
        pixelSize: 15,
        color: Cesium.Color.fromCssColorString('#EF4444'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      },
      label: {
        text: selectedLocation.name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -25),
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#1F2937DD')
      }
    });

    entityRef.current = entity;

    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        selectedLocation.lon,
        selectedLocation.lat,
        15000000
      ),
      duration: 2,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });
  }, [selectedLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-1 z-10">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3 h-3" />
          <span>Cliquez sur la Terre pour voir la qualité de l'air</span>
        </div>
        <div className="text-gray-400">
          Glissez pour tourner • Molette pour zoomer
        </div>
      </div>

      <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs z-10">
        <span>Données: NASA GIBS • Blue Marble</span>
      </div>
    </div>
  );
}
