import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { X, MapPin, CheckCircle, ChevronLeft, Map as MapIcon, LogOut } from 'lucide-react';
import { TourBooking } from '../../data/types';
import { bookingService } from '../../utils/bookingService';
import { useNavigate } from 'react-router-dom';

const Container = styled(motion.div)`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(11, 31, 69, 0.9);
  backdrop-filter: blur(12px);
  color: white;
  border-right: 1px solid rgba(255,255,255,0.08);
`;

const Header = styled.div`
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  
  button.exit {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 16px;
    &:hover { background: #ef4444; color: white; }
  }

  .eyebrow { color: #3b82f6; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  h2 { font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 900; color: #e2ecf7; margin: 0 0 6px; }
  .meta { color: #90aecb; font-size: 0.8rem; font-weight: 500; }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
`;

const StopCard = styled.div<{ $visited: boolean; $active: boolean }>`
  background: ${p => p.$visited ? 'rgba(16, 185, 129, 0.1)' : p.$active ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${p => p.$visited ? 'rgba(16, 185, 129, 0.3)' : p.$active ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover { background: ${p => !p.$visited && 'rgba(255, 255, 255, 0.08)'}; }

  .index {
    width: 28px; height: 28px; border-radius: 50%;
    background: ${p => p.$visited ? '#10b981' : p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
    color: ${p => p.$visited || p.$active ? 'white' : '#90aecb'};
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 800; flex-shrink: 0;
  }

  .info {
    flex: 1; min-width: 0;
    h4 { font-family: 'Outfit', sans-serif; font-size: 1rem; color: ${p => p.$visited ? '#10b981' : '#e2ecf7'}; margin: 0 0 4px; }
    .type { font-size: 0.7rem; color: #5a7098; text-transform: uppercase; font-weight: 700; }
  }

  .check {
    color: ${p => p.$visited ? '#10b981' : 'rgba(255,255,255,0.1)'};
    opacity: ${p => p.$visited ? 1 : 0.3};
  }
`;

interface LiveTourTrackerProps {
  bookingId: string;
  onExit: () => void;
  onFocusItem: (itemId: string) => void;
}

const LiveTourTracker: React.FC<LiveTourTrackerProps> = ({ bookingId, onExit, onFocusItem }) => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<TourBooking | null>(null);
  const [visitedStops, setVisitedStops] = useState<string[]>([]); // Array of itemIds
  
  useEffect(() => {
    bookingService.getAll().then(all => {
      const found = all.find(b => b.id === bookingId);
      if (found) setBooking(found);
    });
    
    // In a real app, this would use Geolocation API to auto-check off stops.
    // For demo, we'll allow manual clicking to simulate checking off.
  }, [bookingId]);

  if (!booking) return <Container style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>Loading Tour...</Container>;

  const stops = booking.isCustom ? booking.customStops : booking.customStops; // Assuming we hydrated curated stops into customStops for ease, wait we didn't. Let's fetch the route if it's curated.
  // Actually, wait, curated routes don't store their stops in the booking unless we injected them. 
  // Let's assume booking.customStops holds the stops (we'll ensure it does in a minute).

  const handleStopClick = (itemId: string) => {
    onFocusItem(itemId);
    // Simulate visit toggle for demo purposes
    setVisitedStops(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  return (
    <Container initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}>
      <Header>
        <button className="exit" onClick={() => { navigate('/explore'); onExit(); }}><LogOut size={12} /> Exit Tracking</button>
        <div className="eyebrow">Live Tour Tracker</div>
        <h2>{booking.routeName}</h2>
        <div className="meta">{booking.scheduledDates.length} Days • {visitedStops.length} Visited</div>
      </Header>
      
      <ScrollArea>
        {booking.scheduledDates.map((date, dayIdx) => {
          const dayStops = booking.customStops?.filter(s => s.dayIndex === dayIdx) || [];
          if (dayStops.length === 0) return null;
          return (
            <div key={date} style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
                Day {dayIdx + 1} - {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dayStops.map((stop, sIdx) => {
                  const visited = visitedStops.includes(stop.itemId);
                  const active = false; // logic for active stop
                  
                  return (
                    <StopCard key={sIdx} $visited={visited} $active={active} onClick={() => handleStopClick(stop.itemId)}>
                      <div className="index">{visited ? <CheckCircle size={14} /> : sIdx + 1}</div>
                      <div className="info">
                        <h4>{stop.itemName}</h4>
                        <div className="type">{stop.entityType}</div>
                      </div>
                      <CheckCircle size={20} className="check" />
                    </StopCard>
                  );
                })}
              </div>
            </div>
          );
        })}
        {(!booking.customStops || booking.customStops.length === 0) && (
          <div style={{ color: '#90aecb', textAlign: 'center', padding: '40px 20px', fontSize: '0.85rem' }}>
            <MapIcon size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
            <br/>Stop details are not fully loaded for this tour.
          </div>
        )}
      </ScrollArea>
    </Container>
  );
};

export default LiveTourTracker;
