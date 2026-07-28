import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Rectangle } from 'react-leaflet';
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

const OutOfBoundsToast = styled.div<{ visible: boolean }>`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background: rgba(220, 38, 38, 0.92);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 700;
    pointer-events: none;
    opacity: ${({ visible }) => (visible ? 1 : 0)};
    transition: opacity 0.3s;
    text-align: center;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
`;

interface MapPickerProps {
    value: { lat: number; lng: number } | null;
    onChange: (coords: { lat: number; lng: number }) => void;
}

const BULUSAN_CENTER: [number, number] = [12.7533, 124.1362];

// Strict bounds for Bulusan municipality
const BULUSAN_BOUNDS: L.LatLngBoundsExpression = [
    [12.70, 124.03], // SouthWest
    [12.82, 124.20]  // NorthEast
];

function isInBulusan(latlng: L.LatLng): boolean {
    return latlng.lat >= 12.70 && latlng.lat <= 12.82 &&
           latlng.lng >= 124.03 && latlng.lng <= 124.20;
}

function LocationSelector({ onSelect, onOutOfBounds }: { onSelect: (latlng: L.LatLng) => void; onOutOfBounds: () => void }) {
    useMapEvents({
        click(e) {
            if (isInBulusan(e.latlng)) {
                onSelect(e.latlng);
            } else {
                onOutOfBounds();
            }
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
    const [showToast, setShowToast] = useState(false);

    const handleSelect = (latlng: L.LatLng) => {
        onChange({ lat: latlng.lat, lng: latlng.lng });
    };

    const handleOutOfBounds = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
        <MapWrapper>
            <MapContainer
                center={position}
                zoom={13}
                minZoom={12}
                maxBounds={BULUSAN_BOUNDS}
                maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                {/* Visual boundary box showing Bulusan borders */}
                <Rectangle
                    bounds={BULUSAN_BOUNDS}
                    pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.04, dashArray: '6 4' }}
                />
                <RecenterComponent position={position} />
                <LocationSelector onSelect={handleSelect} onOutOfBounds={handleOutOfBounds} />
                {value && (
                    <Marker position={[value.lat, value.lng]} draggable={true}
                        eventHandlers={{
                            dragend: (e) => {
                                const marker = e.target;
                                const pos = marker.getLatLng();
                                if (isInBulusan(pos)) {
                                    onChange({ lat: pos.lat, lng: pos.lng });
                                } else {
                                    marker.setLatLng([value.lat, value.lng]);
                                    handleOutOfBounds();
                                }
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
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', pointerEvents: 'none', textAlign: 'center' }}>
                    Click within the blue boundary to pinpoint location
                </div>
            )}
            <OutOfBoundsToast visible={showToast}>
                ⚠️ Outside Bulusan borders — pick a location inside the blue boundary
            </OutOfBoundsToast>
        </MapWrapper>
    );
}
