import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Clock, MapPin, Navigation, Calendar, Settings2 } from 'lucide-react';
import { CuratedRouteStop } from '../../data/types';

const Container = styled(motion.div)`
  display: flex; flex-direction: column; gap: 24px; padding: 24px;
  height: 100%; overflow-y: auto;
  
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 6px; }
`;

const HeaderBox = styled.div`
  background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(29,78,216,0.15) 100%);
  border: 1px solid rgba(59,130,246,0.3);
  border-radius: 16px; padding: 20px;
  display: flex; gap: 16px; align-items: center;
  
  .icon-box { width: 48px; height: 48px; border-radius: 12px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; }
  .text {
    h3 { font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin: 0 0 4px; color: white; }
    p { margin: 0; font-size: 0.85rem; color: #90aecb; }
  }
`;

const DaySection = styled.div`
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 16px;
  
  .day-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px;
    h4 { font-family: 'Outfit', sans-serif; font-size: 1.1rem; color: #e2ecf7; margin: 0; display: flex; align-items: center; gap: 8px; }
    .date { font-size: 0.8rem; color: #5a7098; font-weight: 700; }
  }
`;

const Timeline = styled.div`
  display: flex; flex-direction: column; gap: 12px;
`;

const StopRow = styled.div`
  display: flex; align-items: flex-start; gap: 16px;
  
  .time-col {
    display: flex; flex-direction: column; align-items: flex-end; width: 100px; flex-shrink: 0;
    input {
      background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
      color: #60a5fa; font-family: monospace; font-size: 0.9rem; font-weight: 700;
      padding: 6px 8px; outline: none; width: 100%; text-align: center;
      &:focus { border-color: #3b82f6; }
      &::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
    }
    .duration { font-size: 0.65rem; color: #5a7098; margin-top: 4px; font-weight: 600; text-transform: uppercase; }
  }
  
  .line-col {
    display: flex; flex-direction: column; align-items: center; position: relative;
    width: 24px; padding-top: 8px;
    .dot { width: 12px; height: 12px; border-radius: 50%; border: 3px solid #3b82f6; background: #0b1f45; z-index: 1; }
    .line { position: absolute; top: 20px; bottom: -20px; width: 2px; background: rgba(59,130,246,0.3); z-index: 0; }
  }
  
  .card-col {
    flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;
    .name { font-weight: 700; color: #e2ecf7; font-size: 0.95rem; margin-bottom: 4px; }
    .type { font-size: 0.7rem; color: #5a7098; text-transform: uppercase; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  }
  
  &:last-child .line { display: none; }
`;

interface SmartSchedulerStepProps {
  stops: CuratedRouteStop[];
  pace: string;
  transport: string;
  dates: Date[];
  isCustom: boolean;
  onScheduleReady: (scheduledStops: CuratedRouteStop[]) => void;
}

const SmartSchedulerStep: React.FC<SmartSchedulerStepProps> = ({ stops, pace, transport, dates, isCustom, onScheduleReady }) => {
  const [scheduledStops, setScheduledStops] = useState<CuratedRouteStop[]>([]);

  useEffect(() => {
    if (stops.length === 0) return;
    
    // Auto-schedule algorithm
    let currentDayIdx = 0;
    
    // Convert 08:00 AM to minutes
    const startMin = 8 * 60; 
    let currentMin = startMin;
    
    // Determine pace and transport gaps
    const durationOverride = pace === 'Relaxed' ? 2.5 : pace === 'Fast' ? 1.0 : 1.5;
    const travelGapMin = transport === 'Walking' ? 30 : transport === 'Both' ? 20 : 15;

    const newStops: CuratedRouteStop[] = [];
    
    // If it's a custom tour and stops don't have dayIndex, distribute them evenly
    const stopsPerDay = Math.ceil(stops.length / Math.max(1, dates.length));

    stops.forEach((stop, i) => {
      let dayIndex = stop.dayIndex || 0;
      
      if (isCustom && (stop.dayIndex === undefined || stop.dayIndex === null)) {
         dayIndex = Math.min(Math.floor(i / stopsPerDay), dates.length - 1);
      }

      // Reset time if moving to a new day
      if (dayIndex !== currentDayIdx) {
        currentDayIdx = dayIndex;
        currentMin = startMin;
      }

      // Format time
      const hrs = Math.floor(currentMin / 60).toString().padStart(2, '0');
      const mins = (currentMin % 60).toString().padStart(2, '0');
      const scheduledTime = `${hrs}:${mins}`;

      // Advance time
      const dur = stop.durationHours || durationOverride;
      currentMin += (dur * 60) + travelGapMin;

      newStops.push({
        ...stop,
        dayIndex,
        scheduledTime,
        durationHours: dur
      });
    });

    setScheduledStops(newStops);
  }, [stops, pace, transport, dates, isCustom]);

  // Update schedule when user manually types a new time
  const handleTimeChange = (idx: number, newTime: string) => {
    const updated = [...scheduledStops];
    updated[idx].scheduledTime = newTime;
    setScheduledStops(updated);
  };

  // Whenever internal state changes, notify parent
  useEffect(() => {
    onScheduleReady(scheduledStops);
  }, [scheduledStops, onScheduleReady]);

  const daysCount = Math.max(1, dates.length);

  return (
    <Container initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <HeaderBox>
        <div className="icon-box"><Settings2 size={24} /></div>
        <div className="text">
          <h3>Smart Itinerary Scheduler</h3>
          <p>We've automatically timed your stops based on your <strong>{pace}</strong> pace and <strong>{transport}</strong> transport preference. Feel free to adjust the times below.</p>
        </div>
      </HeaderBox>

      {Array.from({ length: daysCount }).map((_, dIdx) => {
        const dayStops = scheduledStops.filter(s => s.dayIndex === dIdx);
        if (dayStops.length === 0) return null;
        
        const dateObj = dates[dIdx];
        const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : `Day ${dIdx + 1}`;

        return (
          <DaySection key={dIdx}>
            <div className="day-header">
              <h4><Calendar size={16} color="#3b82f6" /> Day {dIdx + 1}</h4>
              <div className="date">{dateStr}</div>
            </div>
            <Timeline>
              {dayStops.map((stop, sIdx) => {
                // Find global index
                const globalIdx = scheduledStops.findIndex(s => s.itemId === stop.itemId && s.dayIndex === dIdx);
                
                return (
                  <StopRow key={sIdx}>
                    <div className="time-col">
                      <input type="time" value={stop.scheduledTime || ''} onChange={e => handleTimeChange(globalIdx, e.target.value)} />
                      <div className="duration">{stop.durationHours} hrs</div>
                    </div>
                    <div className="line-col">
                      <div className="dot" />
                      <div className="line" />
                    </div>
                    <div className="card-col">
                      <div className="name">{stop.itemName}</div>
                      <div className="type"><MapPin size={10} /> {stop.entityType}</div>
                    </div>
                  </StopRow>
                );
              })}
            </Timeline>
          </DaySection>
        );
      })}
    </Container>
  );
};

export default SmartSchedulerStep;
