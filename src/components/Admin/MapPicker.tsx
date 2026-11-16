import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as ML from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from 'styled-components';

// Worker URL matching Tours & Map
if (typeof window !== 'undefined' && ML.setWorkerUrl) {
  ML.setWorkerUrl('/maplibre-gl-worker.js');
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const BULUSAN_CENTER: [number, number] = [124.1362, 12.7533]; // [lng, lat]
const BULUSAN_BOUNDS: [[number, number], [number, number]] = [
  [124.03, 12.70], // SouthWest [lng, lat]
  [124.20, 12.82]  // NorthEast [lng, lat]
];

function isInBulusan(lng: number, lat: number): boolean {
  return lat >= 12.70 && lat <= 12.82 && lng >= 124.03 && lng <= 124.20;
}

const MapWrapper = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.25);
  margin-top: 8px;
  position: relative;
  z-index: 10;

  .maplibregl-map {
    width: 100%;
    height: 100%;
  }

  .maplibregl-ctrl-group {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  }

  .maplibregl-ctrl-attrib {
    font-size: 0.6rem;
  }
`;

const CoordinatesDisplay = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const OutOfBoundsToast = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  background: rgba(220, 38, 38, 0.92);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
`;

const CenterCrosshair = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
  width: 20px;
  height: 20px;
  opacity: 0.35;

  &::before, &::after {
    content: '';
    position: absolute;
    background: #3b82f6;
  }
  &::before {
    top: 9px;
    left: 0;
    width: 20px;
    height: 2px;
  }
  &::after {
    top: 0;
    left: 9px;
    width: 2px;
    height: 20px;
  }
`;

interface MapPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ML.Map | null>(null);
  const markerRef = useRef<ML.Marker | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleOutOfBounds = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  // Create custom marker DOM element
  const createMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.style.width = '32px';
    el.style.height = '42px';
    el.style.cursor = 'grab';
    el.style.transform = 'translate(-50%, -100%)';
    el.innerHTML = `
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
        <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26c0-8.836-7.164-16-16-16z" fill="#ef4444"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `;
    return el;
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const initialLng = value?.lng ?? BULUSAN_CENTER[0];
    const initialLat = value?.lat ?? BULUSAN_CENTER[1];

    const map = new ML.Map({
      container,
      style: STYLE_URL,
      center: [initialLng, initialLat],
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: BULUSAN_BOUNDS,
      attributionControl: false,
    });

    map.addControl(new ML.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new ML.AttributionControl({
        compact: true,
        customAttribution: '© <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      }),
      'bottom-right'
    );

    map.on('load', () => {
      // Add Bulusan boundary dashed box
      map.addSource('bulusan-boundary', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [124.03, 12.70],
              [124.20, 12.70],
              [124.20, 12.82],
              [124.03, 12.82],
              [124.03, 12.70]
            ]]
          },
          properties: {}
        }
      });

      // Fill layer
      map.addLayer({
        id: 'bulusan-boundary-fill',
        type: 'fill',
        source: 'bulusan-boundary',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.04
        }
      });

      // Dashed border outline
      map.addLayer({
        id: 'bulusan-boundary-line',
        type: 'line',
        source: 'bulusan-boundary',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [3, 2]
        }
      });

      // Create marker if initial value exists
      if (value?.lat && value?.lng) {
        const markerEl = createMarkerElement();
        const marker = new ML.Marker({ element: markerEl, draggable: true })
          .setLngLat([value.lng, value.lat])
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          if (isInBulusan(lngLat.lng, lngLat.lat)) {
            onChange({ lat: lngLat.lat, lng: lngLat.lng });
          } else {
            marker.setLngLat([value.lng, value.lat]);
            handleOutOfBounds();
          }
        });

        markerRef.current = marker;
      }
    });

    // Map click handler to drop/move pin
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (isInBulusan(lng, lat)) {
        onChange({ lat, lng });

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          const markerEl = createMarkerElement();
          const marker = new ML.Marker({ element: markerEl, draggable: true })
            .setLngLat([lng, lat])
            .addTo(map);

          marker.on('dragend', () => {
            const pos = marker.getLngLat();
            if (isInBulusan(pos.lng, pos.lat)) {
              onChange({ lat: pos.lat, lng: pos.lng });
            } else {
              pos && marker.setLngLat([lng, lat]);
              handleOutOfBounds();
            }
          });

          markerRef.current = marker;
        }
      } else {
        handleOutOfBounds();
      }
    });

    mapRef.current = map;

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync external value changes to marker position
  useEffect(() => {
    if (!mapRef.current) return;
    if (value?.lat && value?.lng) {
      if (markerRef.current) {
        const currentLngLat = markerRef.current.getLngLat();
        if (
          Math.abs(currentLngLat.lat - value.lat) > 0.00001 ||
          Math.abs(currentLngLat.lng - value.lng) > 0.00001
        ) {
          markerRef.current.setLngLat([value.lng, value.lat]);
        }
      } else if (mapRef.current.loaded()) {
        const markerEl = createMarkerElement();
        const marker = new ML.Marker({ element: markerEl, draggable: true })
          .setLngLat([value.lng, value.lat])
          .addTo(mapRef.current);

        marker.on('dragend', () => {
          const pos = marker.getLngLat();
          if (isInBulusan(pos.lng, pos.lat)) {
            onChange({ lat: pos.lat, lng: pos.lng });
          } else {
            marker.setLngLat([value.lng, value.lat]);
            handleOutOfBounds();
          }
        });

        markerRef.current = marker;
      }
    }
  }, [value, createMarkerElement, handleOutOfBounds, onChange]);

  return (
    <MapWrapper>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <CenterCrosshair />
      {value?.lat && value?.lng && (
        <CoordinatesDisplay>
          📍 {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </CoordinatesDisplay>
      )}
      <OutOfBoundsToast $visible={showToast}>
        Click within the blue boundary to pinpoint location
      </OutOfBoundsToast>
    </MapWrapper>
  );
}
