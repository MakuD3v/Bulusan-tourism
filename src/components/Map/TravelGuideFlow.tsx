import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Zap, Loader2, ChevronRight, ChevronLeft, MapPin, Star, Plus, Minus, Check, Map as MapIcon, Edit2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CuratedRoute, TourTheme, CuratedRouteStop } from '../../data/types';
import { curatedRouteService, bookingService } from '../../utils/bookingService';
import { useAttractions, useEnterprises } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import SharedCategoryScroller from '../Common/SharedCategoryScroller';
import { getMediaUrl } from '../../utils/mediaUtils';
import { ATTRACTION_CATEGORIES, ENTERPRISE_CATEGORIES, getMapIconUrl } from '../Admin/CategoryTagConfig';
import SmartSchedulerStep from './SmartSchedulerStep';
import { useAlert } from '../Common/AlertProvider';

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(5, 13, 30, 0.85); backdrop-filter: blur(8px);
  z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;
`;

const Panel = styled(motion.div)<{ $wide?: boolean }>`
  background: #0b1f45; border: 1px solid rgba(255,255,255,0.08); border-radius: 28px;
  width: 100%; max-width: ${p => p.$wide ? '1400px' : '760px'}; height: ${p => p.$wide ? '90vh' : 'auto'}; max-height: 90vh;
  overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.6);
  transition: max-width 0.3s ease, height 0.3s ease;
`;

const PanelHeader = styled.div`
  padding: 24px 32px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0;
  .eyebrow { font-size: 0.65rem; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #60a5fa; margin-bottom: 6px; }
  h2 { font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 900; color: #e2ecf7; margin: 0; }
  p { font-size: 0.82rem; color: #5a7098; margin-top: 4px; font-weight: 500; }
`;

const CloseBtn = styled.button`
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
  color: #5a7098; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  &:hover { background: rgba(255,255,255,0.1); color: #e2ecf7; }
`;

const Body = styled.div<{ $noPadding?: boolean }>`
  flex: 1; overflow-y: auto; padding: ${p => p.$noPadding ? '0' : '24px 32px 32px'};
  display: flex; flex-direction: column;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const Footer = styled.div`
  padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; gap: 12px;
`;

const NavBtn = styled.button<{ $primary?: boolean }>`
  padding: 11px 26px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 7px;
  ${p => p.$primary ? `
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border: none; color: white;
    box-shadow: 0 8px 24px rgba(59,130,246,0.35);
    &:hover { box-shadow: 0 12px 32px rgba(59,130,246,0.5); transform: translateY(-1px); }
    &:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
  ` : `
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #5a7098;
    &:hover { background: rgba(255,255,255,0.08); color: #e2ecf7; }
  `}
`;

// ── Step 1: Logistics & Calendar ──
const QASection = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const QBlock = styled.div`
  .q-label { font-size: 0.78rem; font-weight: 700; color: #90aecb; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .options { display: flex; gap: 8px; flex-wrap: wrap; }
`;

const OptionChip = styled.button<{ $active: boolean }>`
  padding: 7px 16px; border-radius: 30px; border: 1px solid ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
  background: ${p => p.$active ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)'};
  color: ${p => p.$active ? '#60a5fa' : '#5a7098'}; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: rgba(59,130,246,0.5); color: #90cdf4; }
`;

const CalendarWrapper = styled.div`
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px;
`;

const CalHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  .month-label { font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 800; color: #e2ecf7; }
  button {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
    color: #90aecb; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;
    &:hover { background: rgba(255,255,255,0.1); color: white; }
  }
`;

const CalGrid = styled.div`
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
`;
const DayLabel = styled.div`text-align: center; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: #3d5a8a; padding-bottom: 6px;`;
const DayCell = styled.button<{ $selected: boolean; $today: boolean; $past: boolean; $booked: boolean }>`
  aspect-ratio: 1; border-radius: 8px; border: 1px solid ${p => p.$selected ? '#3b82f6' : 'transparent'};
  background: ${p => p.$selected ? 'rgba(59,130,246,0.3)' : p.$today ? 'rgba(255,255,255,0.06)' : 'transparent'};
  color: ${p => p.$past ? '#1e3a5f' : p.$booked ? '#ef4444' : p.$selected ? '#93c5fd' : p.$today ? '#e2ecf7' : '#6b8ab0'};
  font-size: 0.75rem; font-weight: ${p => p.$selected || p.$today ? '800' : '600'};
  cursor: ${p => (p.$past || p.$booked) ? 'not-allowed' : 'pointer'}; transition: all 0.15s;
  &:hover:not(:disabled) { background: rgba(59,130,246,0.15); color: #93c5fd; }
`;

// ── Step 2: Hub ──
const HubLayout = styled.div`
  display: flex; flex-direction: column; gap: 32px;
`;

const SectionTitle = styled.div`
  font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 800; color: #e2ecf7; margin-bottom: 12px;
  display: flex; align-items: center; justify-content: space-between;
`;

const CustomTourBanner = styled.button`
  width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; border-radius: 16px;
  padding: 24px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; text-align: left;
  box-shadow: 0 12px 32px rgba(16,185,129,0.25); transition: all 0.3s;
  &:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(16,185,129,0.35); }
  .info {
    h3 { font-family: 'Outfit', sans-serif; font-size: 1.4rem; color: white; margin: 0 0 4px; }
    p { font-size: 0.85rem; color: rgba(255,255,255,0.85); margin: 0; }
  }
  .icon-wrap {
    width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center; color: white;
  }
`;

const RouteGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
`;
const RouteCard = styled.button`
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
  padding: 16px; text-align: left; cursor: pointer; transition: all 0.2s;
  display: flex; flex-direction: column; gap: 8px;
  &:hover { background: rgba(255,255,255,0.06); border-color: rgba(59,130,246,0.4); }
  .theme { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #60a5fa; }
  h4 { font-family: 'Outfit', sans-serif; font-size: 1.1rem; color: #e2ecf7; margin: 0; }
  .desc { font-size: 0.75rem; color: #5a7098; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { display: flex; gap: 12px; margin-top: auto; font-size: 0.7rem; color: #4d88c4; font-weight: 600; }
`;

// ── Step 3: Custom Builder ──
const BuilderLayout = styled.div`
  display: flex; height: 100%; border-top: 1px solid rgba(255,255,255,0.06);
`;
const BuilderSidebar = styled.div`
  width: 340px; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column;
  background: rgba(0,0,0,0.15);
`;
const ItemList = styled.div`
  flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const DayTabs = styled.div`
  display: flex; overflow-x: auto; gap: 8px; padding: 12px 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.06);
  &::-webkit-scrollbar { display: none; }
`;
const DayTab = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.05)'}; color: ${p => p.$active ? 'white' : '#90aecb'}; border: 1px solid ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
  padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; white-space: nowrap; cursor: pointer; transition: all 0.2s;
  &:hover { background: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; color: white; }
`;

const CardImage = styled.div<{ $src: string }>`
  position: absolute; top: 0; left: 0; width: 85px; height: 100%;
  background-image: url(${props => getMediaUrl(props.$src)}); background-size: cover; background-position: center; z-index: 0;
  -webkit-mask-image: linear-gradient(to right, black 20%, transparent 100%); mask-image: linear-gradient(to right, black 20%, transparent 100%);
`;
const ItemCard = styled.div<{ $added: boolean }>`
  background: ${p => p.$added ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${p => p.$added ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'};
  border-radius: 24px; display: flex; align-items: center; justify-content: space-between;
  position: relative; overflow: hidden; height: 75px; flex-shrink: 0;
  
  .content { position: relative; z-index: 1; padding: 8px 12px 8px 90px; flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  h5 { font-family: 'Outfit', sans-serif; font-size: 0.85rem; color: #e2ecf7; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .type { font-size: 0.6rem; color: ${p => p.$added ? '#10b981' : '#5a7098'}; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
  
  .action {
    position: relative; z-index: 1; padding-right: 12px;
    button { width: 32px; height: 32px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      background: ${p => p.$added ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.15)'}; color: ${p => p.$added ? '#10b981' : '#60a5fa'};
      &:hover { background: ${p => p.$added ? '#10b981' : '#3b82f6'}; color: white; }
    }
  }
`;
const BuilderMap = styled.div`
  flex: 1; background: #050d1e; position: relative;
`;
const AddedStopsBar = styled.div`
  padding: 16px; background: rgba(11,31,69,0.8); backdrop-filter: blur(8px); border-top: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; gap: 12px; overflow-x: auto;
  .stop-chip {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px;
    padding: 6px 12px; font-size: 0.7rem; font-weight: 700; color: #e2ecf7; display: flex; align-items: center; gap: 6px; white-space: nowrap;
    .num { background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; color: white; }
    button { background: none; border: none; color: #90aecb; cursor: pointer; padding: 0; display: flex; &:hover { color: #ef4444; } }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function toISO(year: number, month: number, day: number): string { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
function isToday(year: number, month: number, day: number): boolean { const t = new Date(); return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day; }
function isPast(year: number, month: number, day: number): boolean { const today = new Date(); today.setHours(0,0,0,0); const d = new Date(year, month, day); return d < today; }

const MapAutoFitter = ({ coordinates }: { coordinates: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [coordinates, map]);
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface TravelGuideFlowProps {
  onClose: () => void;
  onProceedToBooking: (route: CuratedRoute, dates: string[], mode: 'auto'|'manual', answers: any) => void;
  items?: any[];
}

const TravelGuideFlow: React.FC<TravelGuideFlowProps> = ({ onClose, onProceedToBooking, items }) => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  
  // 0 = Dates/Logistics, 1 = Hub, 2 = Custom Builder, 3 = Route Selection, 4 = Smart Scheduler
  const [step, setStep] = useState(0); 

  // Logistics & Dates
  const [pace, setPace] = useState<'Relaxed' | 'Moderate' | 'Fast'>('Moderate');
  const [transport, setTransport] = useState<'Walking' | 'Vehicle' | 'Both'>('Vehicle');
  const [timeRange, setTimeRange] = useState<'Morning' | 'Afternoon' | 'Full Day'>('Full Day');
  
  const [pendingBooking, setPendingBooking] = useState<CuratedRoute | null>(null);
  
  // Custom Tour Builder States
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  // Hub Data
  const [routes, setRoutes] = useState<CuratedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const { data: attractions } = useAttractions();
  const { data: enterprises } = useEnterprises();
  const allItems = useMemo(() => {
    if (items) return items;
    return [
      ...attractions.map(a => ({ ...a, entityType: 'Attraction' })),
      ...enterprises.map(e => ({ ...e, entityType: 'Enterprise' }))
    ];
  }, [attractions, enterprises, items]);

  // Custom Builder State
  const [customStops, setCustomStops] = useState<CuratedRouteStop[]>([]);
  const [customTheme, setCustomTheme] = useState<TourTheme>('Custom');
  const [customName, setCustomName] = useState('');

  // Derived Info
  const recommendedStops = useMemo(() => {
    const days = selectedDates.length || 1;
    let multiplier = pace === 'Relaxed' ? 2 : pace === 'Fast' ? 4 : 3;
    return days * multiplier;
  }, [selectedDates, pace]);

  useEffect(() => {
    setLoadingRoutes(true);
    curatedRouteService.getAll().then(all => { setRoutes(all.filter(r => r.isActive)); setLoadingRoutes(false); });
    bookingService.getAll().then((bookings: any[]) => {
      const dates = bookings.filter((b: any) => b.status !== 'Cancelled').flatMap((b: any) => b.scheduledDates);
      setBookedDates(dates);
    }).catch(() => {});
  }, []);

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort());
  };

  const handleSelectCurated = (r: CuratedRoute) => {
    if (!user) { showAlert('Authentication Required', "Please log in to book a tour.", 'error'); return; }
    setPendingBooking(r);
    // If the tour has named routes, go to Route Selection (Step 3)
    // If it only has legacy stops and no named routes, skip to Scheduler (Step 4)
    if (r.tourRoutes && r.tourRoutes.length > 0) {
      setStep(3);
    } else {
      setStep(4);
    }
  };

  const handleFinishCustom = () => {
    if (!user) { showAlert('Authentication Required', "Please log in to create and book a custom tour.", 'error'); return; }
    if (customStops.length === 0) return;
    
    const customRoute: CuratedRoute = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || `${user.name || 'User'}'s Custom Tour`,
      theme: customTheme,
      description: `A custom itinerary spanning ${selectedDates.length} days with ${customStops.length} stops.`,
      stops: customStops,
      estimatedDays: selectedDates.length,
      difficulty: 'Moderate',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      availableAttractions: pendingBooking?.availableAttractions
    };

    setPendingBooking(customRoute);
    setStep(4);
  };

  const handleBack = () => {
    if (step === 4) {
      if (pendingBooking?.id.startsWith('custom')) {
        setStep(2);
      } else if (pendingBooking?.tourRoutes && pendingBooking.tourRoutes.length > 0) {
        setStep(3);
      } else {
        setStep(1);
      }
    } else if (step === 2 && pendingBooking && pendingBooking.availableAttractions) {
      // If we were customizing a specific tour pool, go back to route selection
      setStep(3);
    } else {
      setStep(s => s - 1);
    }
  };

  // Maps / Pins logic
  const toggleStop = (item: any) => {
    setCustomStops(prev => {
      if (prev.length >= recommendedStops + 4) { showAlert('Limit Reached', "You've reached the recommended maximum stops for this duration.", 'error'); return prev; }
      const exists = prev.find(s => s.itemId.toString() === item.id.toString() && s.dayIndex === selectedDayIndex);
      if (exists) return prev.filter(s => !(s.itemId.toString() === item.id.toString() && s.dayIndex === selectedDayIndex));
      return [...prev, {
        itemId: item.id.toString(),
        entityType: item.entityType as any,
        itemName: item.name,
        suggestedTime: 'Anytime',
        dayIndex: selectedDayIndex
      }];
    });
  };

  const customPolyline = useMemo(() => {
    return customStops
      .filter(s => s.dayIndex === selectedDayIndex)
      .map(stop => {
        const item = allItems.find(i => i.id.toString() === stop.itemId.toString());
        if (!item) return null;
        const lat = item.lat || item.coordinates?.lat;
        const lng = item.lng || item.coordinates?.lng;
        return lat && lng ? [lat, lng] as [number, number] : null;
      }).filter(Boolean) as [number, number][];
  }, [customStops, allItems, selectedDayIndex]);

  return (
    <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <Panel $wide={step === 2} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
        
        <PanelHeader>
          <div className="title-area">
            <div className="eyebrow">Smart Itinerary</div>
            <h2>
              {step === 0 && 'When are you travelling?'}
              {step === 1 && 'Choose Your Experience'}
              {step === 2 && 'Build Your Custom Tour'}
            </h2>
            <p>
              {step === 0 && 'Pick your dates and let us know your style to calculate the perfect itinerary length.'}
              {step === 1 && `Based on your ${selectedDates.length} day trip, we recommend exploring ${recommendedStops} destinations.`}
              {step === 2 && 'Select destinations from the list. We will map out your route automatically.'}
              {step === 3 && 'Review your hour-by-hour smart itinerary. Adjust times as you see fit.'}
            </p>
          </div>
          <CloseBtn onClick={onClose}><X size={16} /></CloseBtn>
        </PanelHeader>

        <Body $noPadding={step === 2}>
          <AnimatePresence mode="wait">
            {/* ── STEP 0: Logistics & Dates ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <QASection>
                  <QBlock>
                    <div className="q-label">🚶 Transport Mode</div>
                    <div className="options">
                      {(['Walking', 'Vehicle', 'Both'] as const).map(o => <OptionChip key={o} $active={transport === o} onClick={() => setTransport(o)}>{o}</OptionChip>)}
                    </div>
                  </QBlock>
                  <QBlock>
                    <div className="q-label">⏱ Pace</div>
                    <div className="options">
                      {(['Relaxed', 'Moderate', 'Fast'] as const).map(o => <OptionChip key={o} $active={pace === o} onClick={() => setPace(o)}>{o}</OptionChip>)}
                    </div>
                  </QBlock>
                </QASection>

                <CalendarWrapper>
                  <CalHeader>
                    <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}><ChevronLeft size={14} /></button>
                    <span className="month-label">{MONTHS[calMonth]} {calYear}</span>
                    <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}><ChevronRight size={14} /></button>
                  </CalHeader>
                  <CalGrid>
                    {DAYS.map(d => <DayLabel key={d}>{d}</DayLabel>)}
                    {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                      const day = i + 1; const dateStr = toISO(calYear, calMonth, day);
                      const past = isPast(calYear, calMonth, day); const booked = bookedDates.includes(dateStr);
                      return (
                        <DayCell key={day} $selected={selectedDates.includes(dateStr)} $today={isToday(calYear, calMonth, day)} $past={past} $booked={booked} disabled={past || booked} onClick={() => !past && !booked && toggleDate(dateStr)}>
                          {day}
                        </DayCell>
                      );
                    })}
                  </CalGrid>
                </CalendarWrapper>
              </motion.div>
            )}

            {/* ── STEP 1: Hub (Curated vs Custom) ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <HubLayout>
                  <CustomTourBanner onClick={() => { setPendingBooking(null); setStep(2); }}>
                    <div className="info">
                      <h3>Create Your Own Tour</h3>
                      <p>Hand-pick up to {recommendedStops + 4} attractions and enterprises to build your perfect {selectedDates.length}-day journey.</p>
                    </div>
                    <div className="icon-wrap"><MapIcon size={24} /></div>
                  </CustomTourBanner>

                  <div>
                    <SectionTitle>Top Curated Tours</SectionTitle>
                    {loadingRoutes ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" color="#3b82f6" /></div> : (
                      <RouteGrid>
                        {routes.map(r => (
                          <RouteCard key={r.id} onClick={() => handleSelectCurated(r)}>
                            <div className="theme">{r.theme}</div>
                            <h4>{r.name}</h4>
                            <div className="desc">{r.description}</div>
                            <div className="meta">
                              <span><MapPin size={10} /> {r.stops.length} stops</span>
                              <span><Star size={10} /> {r.difficulty}</span>
                            </div>
                          </RouteCard>
                        ))}
                      </RouteGrid>
                    )}
                  </div>
                </HubLayout>
              </motion.div>
            )}

            {/* ── STEP 2: Custom Builder ── */}
            {step === 2 && (
              <motion.div key="step2" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ padding: '16px 24px', display: 'flex', gap: 16, background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <input placeholder="Name your tour..." value={customName} onChange={e => setCustomName(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 10, color: 'white', fontSize: '0.9rem', outline: 'none' }} />
                  <select value={customTheme} onChange={e => setCustomTheme(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: 10, color: 'white', fontSize: '0.9rem', outline: 'none' }}>
                    <option value="Custom">Custom / Mixed</option>
                    <option value="Seascape">Seascape</option>
                    <option value="Naturescape">Naturescape</option>
                    <option value="Mountaineering">Mountaineering</option>
                    <option value="Camping">Camping</option>
                  </select>
                </div>
                
                <BuilderLayout>
                  <BuilderSidebar>
                    <DayTabs>
                      {selectedDates.map((date, idx) => (
                        <DayTab key={date} $active={selectedDayIndex === idx} onClick={() => setSelectedDayIndex(idx)}>
                          Day {idx + 1}
                        </DayTab>
                      ))}
                    </DayTabs>
                    <div style={{ padding: '12px 16px 0' }}>
                      <SharedCategoryScroller
                        categories={[...ATTRACTION_CATEGORIES, ...ENTERPRISE_CATEGORIES]}
                        activeCategories={selectedCategories}
                        onSelect={setSelectedCategories}
                      />
                    </div>
                    <ItemList>
                      {allItems
                        .filter(item => {
                           // If we are customizing a specific tour, restrict to its available pool
                           if (pendingBooking && pendingBooking.availableAttractions?.length) {
                             if (!pendingBooking.availableAttractions.includes(item.id.toString())) return false;
                           }
                           if (selectedCategories.length > 0) {
                             const itemCats = item.categories || [];
                             return itemCats.some(c => selectedCategories.includes(c));
                           }
                           return true;
                        })
                        .map(item => {
                        const added = customStops.some(s => s.itemId.toString() === item.id.toString() && s.dayIndex === selectedDayIndex);
                        return (
                          <ItemCard key={item.id} $added={added}>
                            {item.img && <CardImage $src={item.img} />}
                            <div className="content">
                              <h5>{item.name}</h5>
                              <div className="type">{item.entityType}</div>
                            </div>
                            <div className="action">
                              <button onClick={() => toggleStop(item)}>
                                {added ? <Check size={14} /> : <Plus size={14} />}
                              </button>
                            </div>
                          </ItemCard>
                        );
                      })}
                    </ItemList>
                  </BuilderSidebar>
                  
                  <BuilderMap>
                    <MapContainer center={[12.7533, 124.0933]} zoom={12} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      
                      {/* Unselected Items */}
                      {allItems.map(item => {
                        const lat = item.lat || item.coordinates?.lat;
                        const lng = item.lng || item.coordinates?.lng;
                        if (!lat || !lng) return null;
                        
                        const isSelectedInCurrentDay = customStops.some(s => s.itemId.toString() === item.id.toString() && s.dayIndex === selectedDayIndex);
                        if (isSelectedInCurrentDay) return null;
                        
                        const itemCats = (Array.isArray(item.categories) ? item.categories : [((item as any).category || (item as any).type || 'Others')]);
                        const iconUrl = getMapIconUrl(itemCats[0] || 'Others');
                        const html = `<img src="${iconUrl}" style="width:32px;height:32px; opacity: 0.6; filter: grayscale(0.4);" />`;
                        const icon = L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 32] });
                        
                        return <Marker key={`base-${item.id}`} position={[lat, lng]} icon={icon} />;
                      })}

                      {customPolyline.length > 0 && <Polyline positions={customPolyline} color="#3b82f6" weight={4} dashArray="8, 8" />}
                      
                      {/* Selected Items */}
                      {customStops.filter(s => s.dayIndex === selectedDayIndex).map((stop, idx) => {
                        const item = allItems.find(i => i.id.toString() === stop.itemId.toString());
                        if (!item) return null;
                        
                        const lat = item.lat || item.coordinates?.lat;
                        const lng = item.lng || item.coordinates?.lng;
                        if (!lat || !lng) return null;
                        
                        const itemCats = (Array.isArray(item.categories) ? item.categories : [((item as any).category || (item as any).type || 'Others')]);
                        const iconUrl = getMapIconUrl(itemCats[0] || 'Others');
                        const html = `<div style="position:relative;">
                                        <img src="${iconUrl}" style="width:42px;height:42px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" />
                                        <div style="position:absolute;top:-5px;right:-5px;background:#3b82f6;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);">${idx + 1}</div>
                                      </div>`;
                        const icon = L.divIcon({ html, className: '', iconSize: [42, 42], iconAnchor: [21, 42] });
                        
                        return <Marker key={`selected-${stop.itemId}`} position={[lat, lng]} icon={icon} />;
                      })}
                      <MapAutoFitter coordinates={customPolyline} />
                    </MapContainer>
                  </BuilderMap>
                </BuilderLayout>

                {customStops.length > 0 && (
                  <AddedStopsBar>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#90aecb', marginRight: 8 }}>{customStops.length} Stops Added:</span>
                    {customStops.map((s, idx) => (
                      <div key={s.itemId} className="stop-chip">
                        <span className="num">{idx + 1}</span>
                        {s.itemName}
                        <button onClick={() => setCustomStops(prev => prev.filter(x => x.itemId !== s.itemId))}><X size={12} /></button>
                      </div>
                    ))}
                  </AddedStopsBar>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: Route Selection ── */}
            {step === 3 && pendingBooking && (
              <motion.div key="step3" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', color: '#e2ecf7', margin: '0 0 8px' }}>Choose your Route</h3>
                  <p style={{ fontSize: '0.85rem', color: '#90aecb', margin: 0 }}>The <strong>{pendingBooking.name}</strong> offers {pendingBooking.tourRoutes?.length || 0} carefully planned routes. Select one to continue, or customize your own path from its approved attractions.</p>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', flex: 1 }}>
                    {(pendingBooking.tourRoutes || []).map((route, i) => (
                      <div 
                        key={route.id}
                        onClick={() => { setPendingBooking({ ...pendingBooking, stops: route.stops }); setStep(4); }}
                        style={{ background: 'rgba(11,31,69,0.5)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                      >
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: 'radial-gradient(circle at top right, rgba(59,130,246,0.2) 0%, transparent 70%)' }} />
                        <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', color: '#e2ecf7', margin: '0 0 12px' }}>{route.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: '#90aecb', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                          <MapPin size={12} color="#60a5fa" /> {route.stops.length} Stops planned
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {route.stops.slice(0, 3).map((stop, idx) => (
                            <div key={idx} style={{ fontSize: '0.75rem', color: '#e2ecf7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>{idx + 1}</span>
                              {stop.itemName}
                            </div>
                          ))}
                          {route.stops.length > 3 && (
                            <div style={{ fontSize: '0.7rem', color: '#5a7098', paddingLeft: '24px', fontStyle: 'italic' }}>+ {route.stops.length - 3} more stops</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {pendingBooking.availableAttractions && pendingBooking.availableAttractions.length > 0 && (
                    <div style={{ width: '280px', flexShrink: 0, background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Edit2 size={20} color="#90aecb" />
                      </div>
                      <h4 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', color: '#e2ecf7', margin: '0 0 8px' }}>Customize Route</h4>
                      <p style={{ fontSize: '0.8rem', color: '#90aecb', margin: '0 0 20px', lineHeight: 1.5 }}>Prefer to build your own path? Choose from {pendingBooking.availableAttractions.length} approved attractions for this tour.</p>
                      <button 
                        onClick={() => { setCustomName(`${pendingBooking.name} (Custom)`); setCustomTheme(pendingBooking.theme); setStep(2); }}
                        style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px 20px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        Build Custom Route
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Smart Scheduler ── */}
            {step === 4 && pendingBooking && (
              <motion.div key="step4" style={{ height: '100%', overflow: 'hidden' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <BuilderLayout>
                  <BuilderSidebar style={{ width: '400px' }}>
                    <SmartSchedulerStep
                      stops={pendingBooking.stops}
                      pace={pace}
                      transport={transport}
                      dates={selectedDates.map(d => new Date(d))}
                      isCustom={pendingBooking.id.startsWith('custom')}
                      onScheduleReady={(finalStops) => {
                        setPendingBooking({ ...pendingBooking, stops: finalStops });
                      }}
                    />
                  </BuilderSidebar>
                  
                  <BuilderMap>
                    <MapContainer center={[12.7533, 124.0933]} zoom={12} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      
                      {/* Active Stops on Map */}
                      {pendingBooking.stops.length > 1 && (
                        <Polyline 
                          positions={pendingBooking.stops.map(stop => {
                            const item = allItems.find(i => i.id.toString() === stop.itemId.toString());
                            if (!item) return null;
                            const lat = item.lat || item.coordinates?.lat;
                            const lng = item.lng || item.coordinates?.lng;
                            return lat && lng ? [lat, lng] as [number, number] : null;
                          }).filter(Boolean) as [number, number][]} 
                          color="#3b82f6" weight={4} dashArray="8, 8" 
                        />
                      )}
                      
                      {pendingBooking.stops.map((stop, idx) => {
                        const item = allItems.find(i => i.id.toString() === stop.itemId.toString());
                        if (!item) return null;
                        
                        const lat = item.lat || item.coordinates?.lat;
                        const lng = item.lng || item.coordinates?.lng;
                        if (!lat || !lng) return null;
                        
                        const itemCats = (Array.isArray(item.categories) ? item.categories : [((item as any).category || (item as any).type || 'Others')]);
                        const iconUrl = getMapIconUrl(itemCats[0] || 'Others');
                        const html = `<div style="position:relative;">
                                        <img src="${iconUrl}" style="width:42px;height:42px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" />
                                        <div style="position:absolute;top:-5px;right:-5px;background:#3b82f6;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);">${idx + 1}</div>
                                      </div>`;
                        const icon = L.divIcon({ html, className: '', iconSize: [42, 42], iconAnchor: [21, 42] });
                        
                        return <Marker key={`sched-${stop.itemId}-${idx}`} position={[lat, lng]} icon={icon} />;
                      })}
                      
                      <MapAutoFitter coordinates={pendingBooking.stops.map(stop => {
                        const item = allItems.find(i => i.id.toString() === stop.itemId.toString());
                        if (!item) return null;
                        const lat = item.lat || item.coordinates?.lat;
                        const lng = item.lng || item.coordinates?.lng;
                        return lat && lng ? [lat, lng] as [number, number] : null;
                      }).filter(Boolean) as [number, number][]} />
                    </MapContainer>
                  </BuilderMap>
                </BuilderLayout>
              </motion.div>
            )}
          </AnimatePresence>
        </Body>

        <Footer>
          {step === 0 ? (
            <NavBtn onClick={onClose}>Cancel</NavBtn>
          ) : (
            <NavBtn onClick={handleBack}><ChevronLeft size={14} /> Back</NavBtn>
          )}

          {step === 0 && (
            <NavBtn $primary disabled={selectedDates.length === 0} onClick={() => {
              if (!user) { showAlert('Authentication Required', "Please log in to continue planning your trip.", 'error'); return; }
              setStep(1);
            }}>
              Browse Tours <ChevronRight size={14} />
            </NavBtn>
          )}

          {step === 2 && (
            <NavBtn $primary disabled={customStops.length === 0} onClick={handleFinishCustom}>
              Generate Itinerary <ChevronRight size={14} />
            </NavBtn>
          )}

          {step === 3 && pendingBooking && (
            <NavBtn $primary onClick={() => {
              onProceedToBooking(pendingBooking, selectedDates, 'auto', { pace, transport, timeRange });
            }}>
              Confirm & Book <ChevronRight size={14} />
            </NavBtn>
          )}
        </Footer>
      </Panel>
    </Overlay>
  );
};

export default TravelGuideFlow;
