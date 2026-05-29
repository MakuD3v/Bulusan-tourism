import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Calendar, User, MapPin, Users, Mail, Phone, Clock, FileText, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { TourBooking } from '../../data/types';
import { bookingService } from '../../utils/bookingService';

const Container = styled.div`
  display: flex;
  height: 100%;
  gap: 20px;
  @media (max-width: 1024px) { flex-direction: column; }
`;

const CalendarSide = styled.div`
  flex: 1;
  background: rgba(11,31,69,0.5);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 { font-family: 'Outfit', sans-serif; font-size: 1.5rem; color: #e2ecf7; }
  
  .controls {
    display: flex; gap: 8px; align-items: center;
    button {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      color: #90aecb; width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      &:hover { background: rgba(255,255,255,0.1); color: white; }
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  flex: 1;
`;

const DayCol = styled.div`
  text-align: center;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #5a7098;
  padding-bottom: 8px;
`;

const Cell = styled.div<{ $today: boolean; $muted: boolean }>`
  background: ${p => p.$today ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)'};
  border: 1px solid ${p => p.$today ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)'};
  border-radius: 12px;
  min-height: 100px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: ${p => p.$muted ? 0.4 : 1};

  .date-num {
    font-size: 0.8rem;
    font-weight: 800;
    color: ${p => p.$today ? '#60a5fa' : '#90aecb'};
    margin-bottom: 4px;
  }
`;

const BookingBar = styled.div<{ $color: string; $active: boolean; $isStart: boolean; $isEnd: boolean }>`
  background: ${p => p.$color}25;
  border-left: ${p => p.$isStart ? `3px solid ${p.$color}` : 'none'};
  border-radius: ${p => `${p.$isStart ? '4px' : '0'} ${p.$isEnd ? '4px' : '0'} ${p.$isEnd ? '4px' : '0'} ${p.$isStart ? '4px' : '0'}`};
  padding: 4px 6px;
  font-size: 0.65rem;
  font-weight: 700;
  color: ${p => p.$color};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow: ${p => p.$active ? `0 0 0 1px ${p.$color}` : 'none'};
  margin: 0 -8px; /* stretch to edges of cell */
  padding-left: ${p => p.$isStart ? '6px' : '12px'};
  
  &:hover { background: ${p => p.$color}35; }
`;

const DetailsSide = styled.div`
  width: 380px;
  background: rgba(11,31,69,0.5);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  @media (max-width: 1024px) { width: 100%; min-height: 400px; }
`;

const EmptyDetails = styled.div`
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #5a7098; padding: 40px; text-align: center;
  .icon { margin-bottom: 12px; opacity: 0.5; }
`;

const DetailHeader = styled.div<{ $color: string }>`
  padding: 24px;
  background: ${p => p.$color}15;
  border-bottom: 1px solid ${p => p.$color}30;
  
  .status {
    display: inline-flex;
    padding: 4px 10px; border-radius: 20px;
    font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
    background: ${p => p.$color}30; color: ${p => p.$color};
    margin-bottom: 12px;
  }

  h4 { font-family: 'Outfit', sans-serif; font-size: 1.4rem; color: #e2ecf7; margin-bottom: 4px; }
  .ref { font-size: 0.75rem; color: #90aecb; font-family: monospace; }
`;

const DetailBody = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .block {
    display: flex; flex-direction: column; gap: 8px;
    .label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: #5a7098; display: flex; align-items: center; gap: 6px; }
    .val { font-size: 0.85rem; color: #e2ecf7; font-weight: 500; }
  }

  .grid-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
`;

const ActionRow = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: flex; gap: 10px;

  button {
    flex: 1; padding: 10px; border-radius: 10px; font-size: 0.8rem; font-weight: 700;
    cursor: pointer; border: none; transition: all 0.2s;
    &.confirm { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
    &.confirm:hover { background: #10b981; color: white; }
    &.cancel { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    &.cancel:hover { background: #ef4444; color: white; }
  }
`;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function toISO(year: number, month: number, day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }

const BookingsCalendarPanel: React.FC = () => {
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedBooking, setSelectedBooking] = useState<TourBooking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = () => {
    setLoading(true);
    bookingService.getAll().then(all => {
      setBookings(all);
      setLoading(false);
    });
  };

  const updateStatus = async (id: string, status: TourBooking['status']) => {
    await bookingService.update(id, { status });
    setSelectedBooking(prev => prev ? { ...prev, status } : null);
    loadBookings();
  };

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  // Generate calendar grid cells (including prev/next month padding)
  const cells = [];
  const prevMonthDays = getDaysInMonth(calYear, calMonth === 0 ? 11 : calMonth - 1);
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevMonthDays - firstDay + i + 1, month: calMonth - 1, muted: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, month: calMonth, muted: false });
  }
  const remaining = 42 - cells.length; // 6 rows * 7 cols
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, month: calMonth + 1, muted: true });
  }

  return (
    <Container>
      <CalendarSide>
        <Header>
          <h3>{MONTHS[calMonth]} {calYear}</h3>
          <div className="controls">
            <button onClick={prevMonth}><ChevronLeft size={18} /></button>
            <button onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }} style={{ width: 'auto', padding: '0 12px', fontSize: '0.8rem', fontWeight: 700 }}>Today</button>
            <button onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>
        </Header>
        
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={32} color="#3b82f6" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <Grid>
            {DAYS.map(d => <DayCol key={d}>{d}</DayCol>)}
            {cells.map((cell, idx) => {
              // Handle year wrap for prev/next month cells
              let y = calYear;
              let m = cell.month;
              if (m < 0) { m = 11; y--; }
              if (m > 11) { m = 0; y++; }
              
              const dateStr = toISO(y, m, cell.day);
              const isToday = y === today.getFullYear() && m === today.getMonth() && cell.day === today.getDate();
              
              // Find bookings that occur on this date
              const dayBookings = bookings.filter(b => b.scheduledDates.includes(dateStr) && b.status !== 'Cancelled');

              return (
                <Cell key={idx} $today={isToday} $muted={cell.muted}>
                  <div className="date-num">{cell.day}</div>
                  {dayBookings.map(b => {
                    // Determine if this is the start or end of a multi-day booking sequence
                    const dIdx = b.scheduledDates.indexOf(dateStr);
                    const isStart = dIdx === 0;
                    const isEnd = dIdx === b.scheduledDates.length - 1;
                    
                    return (
                      <BookingBar 
                        key={b.id} 
                        $color={b.color || '#3b82f6'} 
                        $active={selectedBooking?.id === b.id}
                        $isStart={isStart}
                        $isEnd={isEnd}
                        onClick={() => setSelectedBooking(b)}
                      >
                        {isStart ? b.routeName : '\u00A0'}
                      </BookingBar>
                    );
                  })}
                </Cell>
              );
            })}
          </Grid>
        )}
      </CalendarSide>

      <DetailsSide>
        {selectedBooking ? (
          <>
            <DetailHeader $color={selectedBooking.color || '#3b82f6'}>
              <div className="status">{selectedBooking.status}</div>
              <h4>{selectedBooking.routeName}</h4>
              <div className="ref">REF: {selectedBooking.id.slice(-10).toUpperCase()}</div>
            </DetailHeader>
            <DetailBody>
              <div className="block">
                <div className="label"><Calendar size={12}/> Dates</div>
                <div className="val">{selectedBooking.scheduledDates.join(', ')}</div>
              </div>
              
              <div className="grid-block">
                <div className="block">
                  <div className="label"><User size={12}/> Contact Name</div>
                  <div className="val">{selectedBooking.contactName}</div>
                </div>
                <div className="block">
                  <div className="label"><Phone size={12}/> Phone</div>
                  <div className="val">{selectedBooking.contactPhone}</div>
                </div>
              </div>
              <div className="block">
                <div className="label"><Mail size={12}/> Email</div>
                <div className="val">{selectedBooking.contactEmail}</div>
              </div>

              <div className="block" style={{ marginTop: 8 }}>
                <div className="label"><Users size={12}/> Traveler Breakdown ({selectedBooking.travelers.total} Total)</div>
                <div className="val" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10 }}>
                  <div>Males: {selectedBooking.travelers.males}</div>
                  <div>Females: {selectedBooking.travelers.females}</div>
                  <div>Children: {selectedBooking.travelers.children}</div>
                  <div style={{ color: '#90aecb' }}>--</div>
                  <div>Local: {selectedBooking.travelers.local}</div>
                  <div>Foreign: {selectedBooking.travelers.foreign}</div>
                </div>
              </div>

              {selectedBooking.autoScheduled && (
                <div className="block" style={{ marginTop: 8 }}>
                  <div className="label"><FileText size={12}/> Auto-Schedule Prefs</div>
                  <div className="val" style={{ fontSize: '0.8rem', color: '#90aecb' }}>
                    Pace: {selectedBooking.pace} &bull; Transport: {selectedBooking.transport} &bull; Time: {selectedBooking.preferredTimeRange}
                  </div>
                </div>
              )}
            </DetailBody>
            {selectedBooking.status === 'Pending' && (
              <ActionRow>
                <button className="confirm" onClick={() => updateStatus(selectedBooking.id, 'Confirmed')}>Confirm</button>
                <button className="cancel" onClick={() => updateStatus(selectedBooking.id, 'Cancelled')}>Cancel</button>
              </ActionRow>
            )}
            {selectedBooking.status === 'Confirmed' && (
              <ActionRow>
                <button className="confirm" onClick={() => updateStatus(selectedBooking.id, 'Completed')}>Mark Completed</button>
                <button className="cancel" onClick={() => updateStatus(selectedBooking.id, 'Cancelled')}>Cancel</button>
              </ActionRow>
            )}
          </>
        ) : (
          <EmptyDetails>
            <CalIcon size={48} className="icon" />
            <h3>No Booking Selected</h3>
            <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Click on a colored booking bar in the calendar to view its full details and manage its status.</p>
          </EmptyDetails>
        )}
      </DetailsSide>
    </Container>
  );
};

export default BookingsCalendarPanel;
