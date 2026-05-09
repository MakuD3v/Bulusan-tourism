import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';

// Fix for default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapWrapper = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ddd;
  margin-top: 8px;
  position: relative;
  z-index: 10;
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
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: 1px solid #eee;
    color: var(--text-dark);
`;

interface MapPickerProps {
    value: { lat: number; lng: number } | null;
    onChange: (coords: { lat: number; lng: number }) => void;
}

const BULUSAN_CENTER: [number, number] = [12.7533, 124.1362];

function LocationSelector({ onSelect }: { onSelect: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng);
        },
    });
    return null;
}

import { useMap } from 'react-leaflet';
function RecenterComponent({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(position);
    }, [position, map]);
    return null;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
    const position = value ? ([value.lat, value.lng] as [number, number]) : BULUSAN_CENTER;

    const handleSelect = (latlng: L.LatLng) => {
        onChange({ lat: latlng.lat, lng: latlng.lng });
    };

    return (
        <MapWrapper>
            <MapContainer 
                center={position} 
                zoom={17} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <RecenterComponent position={position} />
                <LocationSelector onSelect={handleSelect} />
                {value && (
                    <Marker position={[value.lat, value.lng]} draggable={true} 
                        eventHandlers={{
                            dragend: (e) => {
                                const marker = e.target;
                                const pos = marker.getLatLng();
                                onChange({ lat: pos.lat, lng: pos.lng });
                            }
                        }}
                    />
                )}
            </MapContainer>
            {value && (
                <CoordinatesDisplay>
                    Lat: {value.lat.toFixed(6)} | Lng: {value.lng.toFixed(6)}
                </CoordinatesDisplay>
            )}
            {!value && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', pointerEvents: 'none' }}>
                    Click map to pinpoint location
                </div>
            )}
        </MapWrapper>
    );
}
