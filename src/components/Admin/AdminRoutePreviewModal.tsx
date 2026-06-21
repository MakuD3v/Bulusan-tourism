import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map as MapIcon, ChevronLeft, ChevronRight, CheckCircle, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TourBooking } from '../../data/types';
import { useAttractions, useEnterprises, useHeritage } from '../../hooks/useData';
import { getMapIconUrl } from './CategoryTagConfig';

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(5, 13, 30, 0.85); backdrop-filter: blur(8px);
  z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px;
`;

const Panel = styled(motion.div)`
  background: #0b1f45; border: 1px solid rgba(255,255,255,0.08); border-radius: 28px;
  width: 100%; max-width: 1400px; height: 90vh; max-height: 90vh;
  overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.6);
`;

const Header = styled.div`
  padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-shrink: 0;
  
  .title-area {
    h2 { font-family: 'Outfit', sans-serif; font-size: 1.6rem; color: #e2ecf7; margin: 0 0 6px; }
    .meta { color: #90aecb; font-size: 0.85rem; font-weight: 500; display: flex; gap: 12px; align-items: center; }
    .chip { background: rgba(59,130,246,0.15); color: #60a5fa; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
  }
`;

const CloseBtn = styled.button`
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
  color: #5a7098; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  &:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); }
`;

const Body = styled.div`
  display: flex; flex: 1; min-height: 0;
`;

const Sidebar = styled.div`
  width: 380px; background: rgba(0,0,0,0.15); border-right: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column; overflow: hidden;
`;

const DayTabs = styled.div`
  display: flex; overflow-x: auto; padding: 16px; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.06);
  &::-webkit-scrollbar { height: 0; }
`;

const DayTab = styled.button<{ $active: boolean }>`
  padding: 8px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap;
  background: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.05)'};
  color: ${p => p.$active ? 'white' : '#90aecb'};
  border: 1px solid ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
  transition: all 0.2s;
  &:hover { background: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; color: white; }
`;

const StopsList = styled.div`
  flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const StopCard = styled.div`
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; padding: 16px; display: flex; align-items: flex-start; gap: 12px;
  
  .badge {
    width: 28px; height: 28px; border-radius: 50%; background: #3b82f6; color: white;
    display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0;
  }
  .info {
    flex: 1; min-width: 0;
    h5 { font-family: 'Outfit', sans-serif; font-size: 1rem; color: #e2ecf7; margin: 0 0 4px; }
    .type { font-size: 0.7rem; color: #5a7098; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
    .details { display: flex; gap: 12px; font-size: 0.75rem; color: #90aecb; }
  }
`;

const MapWrap = styled.div`
  flex: 1; position: relative;
`;

// Helper component to auto-fit map bounds
const MapAutoFitter: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  React.useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [coordinates, map]);
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminRoutePreviewModalProps {
  booking: TourBooking;
  onClose: () => void;
}

const AdminRoutePreviewModal: React.FC<AdminRoutePreviewModalProps> = ({ booking, onClose }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const { data: attractions } = useAttractions();
  const { data: enterprises } = useEnterprises();
  const { data: heritage } = useHeritage();

  const allItems = useMemo(() => {
    return [...attractions, ...enterprises, ...heritage];
  }, [attractions, enterprises, heritage]);

  const stops = booking.customStops || [];
  const daysCount = booking.scheduledDates.length;

  const currentDayStops = stops.filter(s => (s.dayIndex || 0) === selectedDayIndex);

  const polylineCoords = useMemo(() => {
    return currentDayStops.map(stop => {
      const item = allItems.find(i => i.id.toString() === stop.itemId);
      if (!item) return null;
      const lat = (item as any).lat || (item as any).coordinates?.lat;
      const lng = (item as any).lng || (item as any).coordinates?.lng;
      return lat && lng ? [lat, lng] as [number, number] : null;
    }).filter(Boolean) as [number, number][];
  }, [currentDayStops, allItems]);

  return (
    <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Panel initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
        <Header>
          <div className="title-area">
            <h2>{booking.routeName}</h2>
            <div className="meta">
              <span className="chip">{booking.isCustom ? 'Custom Itinerary' : 'Curated Tour'}</span>
              <span>{booking.scheduledDates.join(', ')}</span>
              <span>•</span>
              <span>{booking.travelers.total} Travelers</span>
            </div>
          </div>
          <CloseBtn onClick={onClose}><X size={18} /></CloseBtn>
        </Header>

        <Body>
          <Sidebar>
            <DayTabs>
              {Array.from({ length: daysCount }).map((_, idx) => (
                <DayTab key={idx} $active={selectedDayIndex === idx} onClick={() => setSelectedDayIndex(idx)}>
                  Day {idx + 1}
                </DayTab>
              ))}
            </DayTabs>
            <StopsList>
              {currentDayStops.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#5a7098', fontSize: '0.85rem' }}>No stops scheduled for this day.</div>
              ) : (
                currentDayStops.map((stop, idx) => (
                  <StopCard key={`${stop.itemId}-${idx}`}>
                    <div className="badge">{idx + 1}</div>
                    <div className="info">
                      <h5>{stop.itemName}</h5>
                      <div className="type">{stop.entityType}</div>
                      <div className="details">
                        {stop.scheduledTime && <span>🕒 {stop.scheduledTime}</span>}
                        {stop.durationHours && <span>⌛ {stop.durationHours} hrs</span>}
                      </div>
                    </div>
                  </StopCard>
                ))
              )}
            </StopsList>
          </Sidebar>

          <MapWrap>
            <MapContainer center={[12.7533, 124.0933]} zoom={12} zoomControl={false} style={{ width: '100%', height: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              
              {polylineCoords.length > 0 && <Polyline positions={polylineCoords} color="#3b82f6" weight={4} dashArray="8, 8" />}
              
              {currentDayStops.map((stop, idx) => {
                const item = allItems.find(i => i.id.toString() === stop.itemId);
                if (!item) return null;
                
                const lat = (item as any).lat || (item as any).coordinates?.lat;
                const lng = (item as any).lng || (item as any).coordinates?.lng;
                if (!lat || !lng) return null;
                
                const itemCats = (Array.isArray((item as any).categories) ? (item as any).categories : [((item as any).category || (item as any).type || 'Others')]);
                const iconUrl = getMapIconUrl(itemCats[0] || 'Others');
                const html = `<div style="position:relative;">
                                <img loading="lazy" src="${iconUrl}" style="width:42px;height:42px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" />
                                <div style="position:absolute;top:-5px;right:-5px;background:#3b82f6;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);">${idx + 1}</div>
                              </div>`;
                const icon = L.divIcon({ html, className: '', iconSize: [42, 42], iconAnchor: [21, 42] });
                
                return <Marker key={`pin-${idx}`} position={[lat, lng]} icon={icon} />;
              })}
              
              <MapAutoFitter coordinates={polylineCoords} />
            </MapContainer>
          </MapWrap>
        </Body>
      </Panel>
    </Overlay>
  );
};

export default AdminRoutePreviewModal;
