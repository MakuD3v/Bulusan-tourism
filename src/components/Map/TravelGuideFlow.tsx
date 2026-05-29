import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Waves, TreePine, Clock, MapPin, ChevronRight, ChevronLeft, Star, Calendar, Zap, Loader2 } from 'lucide-react';
import { CuratedRoute, TourTheme } from '../../data/types';
import { curatedRouteService, bookingService, autoScheduleDates } from '../../utils/bookingService';

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(5, 13, 30, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const Panel = styled(motion.div)`
  background: #0b1f45;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px;
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 40px 80px rgba(0,0,0,0.6);
`;

const PanelHeader = styled.div`
  padding: 28px 32px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;

  .title-area {
    .eyebrow {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #60a5fa;
      margin-bottom: 6px;
    }
    h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.6rem;
      font-weight: 900;
      color: #e2ecf7;
      margin: 0;
    }
    p {
      font-size: 0.82rem;
      color: #5a7098;
      margin-top: 4px;
      font-weight: 500;
    }
  }
`;

const CloseBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  color: #5a7098;
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover { background: rgba(255,255,255,0.1); color: #e2ecf7; }
`;

const StepBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 32px;
  margin-top: 16px;
`;

const StepDot = styled.div<{ $active: boolean; $done: boolean }>`
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 800;
  flex-shrink: 0;
  transition: all 0.3s;
  background: ${p => p.$done ? '#10b981' : p.$active ? '#3b82f6' : 'rgba(255,255,255,0.07)'};
  color: ${p => (p.$done || p.$active) ? 'white' : '#3d5a8a'};
  border: 2px solid ${p => p.$done ? '#10b981' : p.$active ? '#3b82f6' : 'rgba(255,255,255,0.06)'};
`;

const StepLine = styled.div<{ $done: boolean }>`
  flex: 1;
  height: 2px;
  background: ${p => p.$done ? '#10b981' : 'rgba(255,255,255,0.06)'};
  transition: background 0.4s;
`;

const StepLabel = styled.span<{ $active: boolean }>`
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${p => p.$active ? '#60a5fa' : '#3d5a8a'};
  margin-top: 6px;
  text-align: center;
  display: block;
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 32px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

// ── Step 1: Theme Cards ──
const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const ThemeCard = styled(motion.button)<{ $theme: TourTheme }>`
  position: relative;
  border-radius: 20px;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 3/2;
  background: ${p => p.$theme === 'Seascape'
    ? 'linear-gradient(145deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)'
    : 'linear-gradient(145deg, #14532d 0%, #166534 50%, #15803d 100%)'};
  transition: border-color 0.25s, box-shadow 0.25s;

  .bg-pattern {
    position: absolute; inset: 0; opacity: 0.15;
    background-image: ${p => p.$theme === 'Seascape'
      ? "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 Q15 15 30 30 Q45 45 60 30' fill='none' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E\")"
      : "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='30,5 55,50 5,50' fill='none' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E\")"};
    background-size: 60px 60px;
  }

  .content {
    position: relative; z-index: 1;
    padding: 24px;
    display: flex; flex-direction: column;
    height: 100%;
    text-align: left;
  }

  .icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: auto;
  }

  .name {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
    font-weight: 900;
    color: white;
    text-transform: uppercase;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .subtitle {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.65);
    font-weight: 500;
    margin-top: 4px;
  }

  &:hover {
    border-color: rgba(255,255,255,0.4);
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  }
`;

// ── Step 2: Route List ──
const RouteList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RouteCard = styled(motion.div)<{ $selected: boolean }>`
  background: ${p => p.$selected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)'};
  border: 2px solid ${p => p.$selected ? '#3b82f6' : 'rgba(255,255,255,0.06)'};
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 16px;

  &:hover {
    border-color: rgba(59,130,246,0.5);
    background: rgba(59,130,246,0.07);
  }

  .route-info { flex: 1; min-width: 0; }

  .route-name {
    font-family: 'Outfit', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: #e2ecf7;
    margin-bottom: 4px;
  }

  .route-desc {
    font-size: 0.78rem;
    color: #5a7098;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .route-meta {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .meta-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #3d88c4;
  }

  .check {
    width: 22px; height: 22px;
    border-radius: 50%;
    border: 2px solid ${p => p.$selected ? '#3b82f6' : 'rgba(255,255,255,0.15)'};
    background: ${p => p.$selected ? '#3b82f6' : 'transparent'};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #3d5a8a;
  .icon { margin-bottom: 12px; opacity: 0.4; }
  p { font-size: 0.85rem; font-weight: 500; }
`;

// ── Step 3: Schedule ──
const ScheduleOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 28px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const ScheduleOptionCard = styled(motion.button)<{ $active: boolean }>`
  background: ${p => p.$active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)'};
  border: 2px solid ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.06)'};
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;

  .s-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: ${p => p.$active ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)'};
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 12px;
    color: ${p => p.$active ? '#60a5fa' : '#3d5a8a'};
    transition: all 0.2s;
  }

  .s-name {
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    color: ${p => p.$active ? '#e2ecf7' : '#5a7098'};
    margin-bottom: 4px;
  }

  .s-desc {
    font-size: 0.72rem;
    color: #3d5a8a;
    font-weight: 500;
    line-height: 1.4;
  }

  &:hover { border-color: rgba(59,130,246,0.4); }
`;

const AutoQA = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const QBlock = styled.div`
  .q-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #90aecb;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const OptionChip = styled.button<{ $active: boolean }>`
  padding: 7px 16px;
  border-radius: 30px;
  border: 1px solid ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
  background: ${p => p.$active ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)'};
  color: ${p => p.$active ? '#60a5fa' : '#5a7098'};
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: rgba(59,130,246,0.5); color: #90cdf4; }
`;

// ── Calendar ──
const CalendarWrapper = styled.div`
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 20px;
`;

const CalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .month-label {
    font-family: 'Outfit', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: #e2ecf7;
  }

  button {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    color: #90aecb;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba(255,255,255,0.1); color: white; }
  }
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const DayLabel = styled.div`
  text-align: center;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #3d5a8a;
  padding-bottom: 6px;
`;

const DayCell = styled.button<{ $selected: boolean; $today: boolean; $past: boolean; $booked: boolean }>`
  aspect-ratio: 1;
  border-radius: 8px;
  border: 1px solid ${p => p.$selected ? '#3b82f6' : 'transparent'};
  background: ${p =>
    p.$selected ? 'rgba(59,130,246,0.3)' :
    p.$today ? 'rgba(255,255,255,0.06)' :
    'transparent'};
  color: ${p =>
    p.$past ? '#1e3a5f' :
    p.$booked ? '#ef4444' :
    p.$selected ? '#93c5fd' :
    p.$today ? '#e2ecf7' : '#6b8ab0'};
  font-size: 0.75rem;
  font-weight: ${p => p.$selected || p.$today ? '800' : '600'};
  cursor: ${p => (p.$past || p.$booked) ? 'not-allowed' : 'pointer'};
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: rgba(59,130,246,0.15);
    color: #93c5fd;
  }
`;

const SelectedDatesDisplay = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  min-height: 28px;

  .date-chip {
    background: rgba(59,130,246,0.2);
    border: 1px solid rgba(59,130,246,0.4);
    color: #60a5fa;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
  }

  .empty-hint {
    color: #2d4a6a;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 3px 0;
  }
`;

// ── Footer ──
const Footer = styled.div`
  padding: 20px 32px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
`;

const NavBtn = styled.button<{ $primary?: boolean }>`
  padding: 11px 26px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 7px;

  ${p => p.$primary ? `
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;
    color: white;
    box-shadow: 0 8px 24px rgba(59,130,246,0.35);
    &:hover { box-shadow: 0 12px 32px rgba(59,130,246,0.5); transform: translateY(-1px); }
    &:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
  ` : `
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #5a7098;
    &:hover { background: rgba(255,255,255,0.08); color: #e2ecf7; }
  `}
`;

const BookingCapacityNote = styled.div<{ $full: boolean }>`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${p => p.$full ? '#ef4444' : '#4d88c4'};
  display: flex;
  align-items: center;
  gap: 5px;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

function isPast(year: number, month: number, day: number): boolean {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(year, month, day);
  return d < today;
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface TravelGuideFlowProps {
  onClose: () => void;
  onProceedToBooking: (route: CuratedRoute, dates: string[], scheduleMode: 'manual' | 'auto', autoAnswers?: any) => void;
}

const STEPS = ['Theme', 'Route', 'Schedule'];

const TravelGuideFlow: React.FC<TravelGuideFlowProps> = ({ onClose, onProceedToBooking }) => {
  const [step, setStep] = useState(0); // 0=theme, 1=route, 2=schedule
  const [theme, setTheme] = useState<TourTheme | null>(null);
  const [routes, setRoutes] = useState<CuratedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<CuratedRoute | null>(null);
  const [scheduleMode, setScheduleMode] = useState<'manual' | 'auto'>('auto');

  // Auto-schedule answers
  const [pace, setPace] = useState<'Relaxed' | 'Moderate' | 'Fast'>('Moderate');
  const [transport, setTransport] = useState<'Walking' | 'Vehicle' | 'Both'>('Vehicle');
  const [timeRange, setTimeRange] = useState<'Morning' | 'Afternoon' | 'Full Day'>('Full Day');

  // Manual calendar
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  // Load routes when theme changes
  useEffect(() => {
    if (!theme) return;
    setLoadingRoutes(true);
    curatedRouteService.getAll().then(all => {
      setRoutes(all.filter(r => r.theme === theme && r.isActive));
      setLoadingRoutes(false);
    });
  }, [theme]);

  // Simulate known booked dates (loaded from service)
  useEffect(() => {
    // Simulate known booked dates (loaded from service)
    bookingService.getAll().then((bookings: any[]) => {
      const dates = bookings
        .filter((b: any) => b.status !== 'Cancelled')
        .flatMap((b: any) => b.scheduledDates);
      setBookedDates(dates);
    }).catch(() => {});
  }, []);

  const yearMonth = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthBookingCount = useMemo(() => {
    return bookedDates.filter(d => d.startsWith(yearMonth)).length;
  }, [bookedDates, yearMonth]);
  const isMonthFull = monthBookingCount >= 20;

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort()
    );
  };

  const canProceed = () => {
    if (step === 0) return theme !== null;
    if (step === 1) return selectedRoute !== null;
    if (step === 2) {
      if (scheduleMode === 'manual') return selectedDates.length > 0;
      return true; // auto always ok
    }
    return false;
  };

  const handleNext = () => {
    if (step < 2) { setStep(s => s + 1); return; }
    // Final step — calculate dates and proceed
    let finalDates = selectedDates;
    if (scheduleMode === 'auto') {
      finalDates = autoScheduleDates(selectedRoute!.estimatedDays, pace);
    }
    onProceedToBooking(selectedRoute!, finalDates.sort(), scheduleMode, { pace, transport, timeRange });
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Panel
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <PanelHeader>
          <div className="title-area">
            <div className="eyebrow">Smart Itinerary</div>
            <h2>
              {step === 0 && 'Choose Your Landscape'}
              {step === 1 && `${theme} Routes`}
              {step === 2 && 'Set Your Schedule'}
            </h2>
            <p>
              {step === 0 && 'Pick the type of experience you are looking for.'}
              {step === 1 && `${routes.length} curated routes available — pick one.`}
              {step === 2 && 'Let us plan the dates for you or choose manually.'}
            </p>
          </div>
          <CloseBtn onClick={onClose}><X size={16} /></CloseBtn>
        </PanelHeader>

        {/* Step progress bar */}
        <div style={{ padding: '16px 32px 0' }}>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            {STEPS.map((label, idx) => (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <StepDot $active={step === idx} $done={step > idx}>
                    {step > idx ? '✓' : idx + 1}
                  </StepDot>
                  <StepLabel $active={step === idx}>{label}</StepLabel>
                </div>
                {idx < STEPS.length - 1 && <StepLine $done={step > idx} style={{ marginBottom: 16 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Body>
          <AnimatePresence mode="wait">
            {/* ── STEP 0: Theme Picker ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ThemeGrid>
                  {(['Seascape', 'Naturescape'] as TourTheme[]).map(t => (
                    <ThemeCard
                      key={t}
                      $theme={t}
                      onClick={() => { setTheme(t); }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ outline: theme === t ? '2px solid rgba(255,255,255,0.6)' : 'none', outlineOffset: 3 }}
                    >
                      <div className="bg-pattern" />
                      <div className="content">
                        <div className="icon">
                          {t === 'Seascape' ? <Waves size={22} color="white" /> : <TreePine size={22} color="white" />}
                        </div>
                        <div>
                          <div className="name">{t}</div>
                          <div className="subtitle">
                            {t === 'Seascape' ? 'Coastal bays, beaches & marine wonders' : 'Forests, volcanoes, waterfalls & wildlife'}
                          </div>
                        </div>
                      </div>
                    </ThemeCard>
                  ))}
                </ThemeGrid>
              </motion.div>
            )}

            {/* ── STEP 1: Route List ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {loadingRoutes ? (
                  <EmptyState>
                    <Loader2 size={32} className="icon animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Loading routes…</p>
                  </EmptyState>
                ) : routes.length === 0 ? (
                  <EmptyState>
                    <MapPin size={32} className="icon" />
                    <p>No {theme} routes have been published yet by the admin.<br />Check back soon!</p>
                  </EmptyState>
                ) : (
                  <RouteList>
                    {routes.map(route => (
                      <RouteCard
                        key={route.id}
                        $selected={selectedRoute?.id === route.id}
                        onClick={() => setSelectedRoute(route)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        layout
                      >
                        <div className="route-info">
                          <div className="route-name">{route.name}</div>
                          <div className="route-desc">{route.description}</div>
                          <div className="route-meta">
                            <span className="meta-chip"><Clock size={10} /> {route.estimatedDays} day{route.estimatedDays !== 1 ? 's' : ''}</span>
                            <span className="meta-chip"><MapPin size={10} /> {route.stops.length} stop{route.stops.length !== 1 ? 's' : ''}</span>
                            {route.difficulty && <span className="meta-chip"><Star size={10} /> {route.difficulty}</span>}
                          </div>
                        </div>
                        <div className="check">
                          {selectedRoute?.id === route.id && <span style={{ fontSize: '0.7rem', color: 'white' }}>✓</span>}
                        </div>
                      </RouteCard>
                    ))}
                  </RouteList>
                )}
              </motion.div>
            )}

            {/* ── STEP 2: Schedule ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ScheduleOptions>
                  <ScheduleOptionCard $active={scheduleMode === 'auto'} onClick={() => setScheduleMode('auto')}>
                    <div className="s-icon"><Zap size={18} /></div>
                    <div className="s-name">Auto-Schedule</div>
                    <div className="s-desc">Answer a few quick questions and we'll plan the best dates for you.</div>
                  </ScheduleOptionCard>
                  <ScheduleOptionCard $active={scheduleMode === 'manual'} onClick={() => setScheduleMode('manual')}>
                    <div className="s-icon"><Calendar size={18} /></div>
                    <div className="s-name">Pick My Dates</div>
                    <div className="s-desc">Select your preferred travel dates manually from the calendar.</div>
                  </ScheduleOptionCard>
                </ScheduleOptions>

                <AnimatePresence mode="wait">
                  {scheduleMode === 'auto' && (
                    <motion.div key="auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <AutoQA>
                        <QBlock>
                          <div className="q-label">🚶 How will you be getting around?</div>
                          <div className="options">
                            {(['Walking', 'Vehicle', 'Both'] as const).map(o => (
                              <OptionChip key={o} $active={transport === o} onClick={() => setTransport(o)}>{o}</OptionChip>
                            ))}
                          </div>
                        </QBlock>
                        <QBlock>
                          <div className="q-label">⏱ What pace do you prefer?</div>
                          <div className="options">
                            {(['Relaxed', 'Moderate', 'Fast'] as const).map(o => (
                              <OptionChip key={o} $active={pace === o} onClick={() => setPace(o)}>{o}</OptionChip>
                            ))}
                          </div>
                        </QBlock>
                        <QBlock>
                          <div className="q-label">🌅 Preferred time of day?</div>
                          <div className="options">
                            {(['Morning', 'Afternoon', 'Full Day'] as const).map(o => (
                              <OptionChip key={o} $active={timeRange === o} onClick={() => setTimeRange(o)}>{o}</OptionChip>
                            ))}
                          </div>
                        </QBlock>
                        <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '12px 16px', fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600, lineHeight: 1.5 }}>
                          Based on a <strong>{pace.toLowerCase()}</strong> pace, your <strong>{selectedRoute?.estimatedDays}-day</strong> trip will be automatically distributed starting from tomorrow.
                          {pace === 'Relaxed' && ' (Estimated days may be extended for a more comfortable experience)'}
                          {pace === 'Fast' && ' (Estimated days may be reduced to keep things efficient)'}
                        </div>
                      </AutoQA>
                    </motion.div>
                  )}

                  {scheduleMode === 'manual' && (
                    <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <BookingCapacityNote $full={isMonthFull} style={{ marginBottom: 12 }}>
                        {isMonthFull
                          ? '⚠ This month has reached its 20-tour limit. Please select a different month.'
                          : `📅 ${20 - monthBookingCount} tour slot${20 - monthBookingCount !== 1 ? 's' : ''} remaining this month.`}
                      </BookingCapacityNote>
                      <CalendarWrapper>
                        <CalHeader>
                          <button onClick={prevMonth}><ChevronLeft size={14} /></button>
                          <span className="month-label">{MONTHS[calMonth]} {calYear}</span>
                          <button onClick={nextMonth}><ChevronRight size={14} /></button>
                        </CalHeader>
                        <CalGrid>
                          {DAYS.map(d => <DayLabel key={d}>{d}</DayLabel>)}
                          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = toISO(calYear, calMonth, day);
                            const past = isPast(calYear, calMonth, day);
                            const booked = bookedDates.includes(dateStr);
                            const selected = selectedDates.includes(dateStr);
                            return (
                              <DayCell
                                key={day}
                                $selected={selected}
                                $today={isToday(calYear, calMonth, day)}
                                $past={past}
                                $booked={booked}
                                disabled={past || booked}
                                onClick={() => !past && !booked && toggleDate(dateStr)}
                              >
                                {day}
                              </DayCell>
                            );
                          })}
                        </CalGrid>
                        <SelectedDatesDisplay>
                          {selectedDates.length === 0
                            ? <span className="empty-hint">Click dates above to select your travel days</span>
                            : selectedDates.map(d => <span key={d} className="date-chip">{d}</span>)
                          }
                        </SelectedDatesDisplay>
                      </CalendarWrapper>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </Body>

        <Footer>
          <NavBtn onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
            <ChevronLeft size={14} />
            {step === 0 ? 'Cancel' : 'Back'}
          </NavBtn>
          <NavBtn $primary disabled={!canProceed()} onClick={handleNext}>
            {step === 2 ? 'Continue to Booking' : 'Next'}
            <ChevronRight size={14} />
          </NavBtn>
        </Footer>
      </Panel>
    </Overlay>
  );
};

export default TravelGuideFlow;
