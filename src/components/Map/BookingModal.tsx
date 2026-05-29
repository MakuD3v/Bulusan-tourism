import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Users, Globe, MapPin, Check, Loader2, ChevronLeft, Baby } from 'lucide-react';
import { CuratedRoute, TourBooking, TravelerBreakdown } from '../../data/types';
import { bookingService } from '../../utils/bookingService';
import { useAuth } from '../../hooks/useAuth';

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(5, 13, 30, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1001;
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
  max-width: 600px;
  max-height: 92vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 40px 80px rgba(0,0,0,0.6);
`;

const PanelHeader = styled.div`
  padding: 26px 30px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;

  .title-area {
    .eyebrow {
      font-size: 0.6rem;
      font-weight: 800;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #10b981;
      margin-bottom: 5px;
    }
    h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.4rem;
      font-weight: 900;
      color: #e2ecf7;
      margin: 0 0 3px;
    }
    p {
      font-size: 0.78rem;
      color: #4d6899;
      font-weight: 500;
    }
  }
`;

const CloseBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  color: #5a7098;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  &:hover { background: rgba(255,255,255,0.1); color: #e2ecf7; }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 22px 30px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
`;

// ── Route Summary Banner ──
const RouteBanner = styled.div`
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;

  .rb-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: rgba(16,185,129,0.15);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: #10b981;
  }

  .rb-info {
    flex: 1;
    min-width: 0;
    .rb-name {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 0.95rem;
      color: #e2ecf7;
    }
    .rb-meta {
      font-size: 0.72rem;
      color: #4d88a4;
      margin-top: 2px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
`;

const DatePills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
  .pill {
    background: rgba(59,130,246,0.15);
    border: 1px solid rgba(59,130,246,0.3);
    color: #60a5fa;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
  }
`;

// ── Section ──
const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .section-title {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #3d5a8a;
    display: flex;
    align-items: center;
    gap: 7px;
  }
`;

// ── Form Field ──
const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;

  label {
    font-size: 0.68rem;
    font-weight: 700;
    color: #5a7098;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .input-wrap {
    display: flex;
    align-items: center;
    gap: 9px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 9px 14px;
    transition: all 0.2s;

    svg { color: #3d5a8a; flex-shrink: 0; }

    input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #c8d9f0;
      font-size: 0.85rem;
      font-weight: 500;
      &::placeholder { color: #2d4a6a; }
    }

    &:focus-within {
      border-color: rgba(59,130,246,0.5);
      background: rgba(59,130,246,0.05);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
    }
  }

  &.full { grid-column: 1 / -1; }
`;

// ── Traveler Counters ──
const CounterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const CounterRow = styled.div<{ $highlight?: boolean }>`
  background: ${p => p.$highlight ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${p => p.$highlight ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'};
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  .counter-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    color: ${p => p.$highlight ? '#93c5fd' : '#5a7098'};

    .icon-wrap {
      width: 28px; height: 28px;
      border-radius: 8px;
      background: ${p => p.$highlight ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)'};
      display: flex; align-items: center; justify-content: center;
      color: ${p => p.$highlight ? '#60a5fa' : '#3d5a8a'};
    }
  }

  .counter-controls {
    display: flex;
    align-items: center;
    gap: 8px;

    button {
      width: 26px; height: 26px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      color: #90aecb;
      font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s;
      line-height: 1;

      &:hover:not(:disabled) { background: rgba(59,130,246,0.2); color: white; border-color: rgba(59,130,246,0.4); }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
    }

    .count {
      font-family: 'Outfit', sans-serif;
      font-size: 1rem;
      font-weight: 800;
      color: #e2ecf7;
      min-width: 24px;
      text-align: center;
    }
  }
`;

const TotalNote = styled.div<{ $ok: boolean }>`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${p => p.$ok ? '#10b981' : '#ef4444'};
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${p => p.$ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)'};
  border: 1px solid ${p => p.$ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};
  border-radius: 8px;
`;

// ── Footer ──
const Footer = styled.div`
  padding: 18px 30px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
`;

const SubmitBtn = styled.button`
  flex: 1;
  padding: 13px 24px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 8px 24px rgba(16,185,129,0.35);
  transition: all 0.2s;
  &:hover:not(:disabled) { box-shadow: 0 12px 32px rgba(16,185,129,0.5); transform: translateY(-1px); }
  &:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
`;

const BackBtn = styled.button`
  padding: 13px 20px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #5a7098;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; gap: 7px;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.08); color: #e2ecf7; }
`;

// ── Success Screen ──
const SuccessScreen = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  text-align: center;
  gap: 16px;

  .success-icon {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 16px 40px rgba(16,185,129,0.4);
  }

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.5rem;
    font-weight: 900;
    color: #e2ecf7;
    margin: 0;
  }

  p {
    font-size: 0.85rem;
    color: #5a7098;
    line-height: 1.6;
    max-width: 380px;
    font-weight: 500;
  }

  .ref-chip {
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.25);
    color: #10b981;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 1px;
  }
`;

const CloseSuccessBtn = styled.button`
  padding: 12px 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  color: white;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s;
  &:hover { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(59,130,246,0.4); }
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface BookingModalProps {
  route: CuratedRoute;
  scheduledDates: string[];
  autoScheduled: boolean;
  autoAnswers?: { pace: 'Relaxed' | 'Moderate' | 'Fast'; transport: 'Walking' | 'Vehicle' | 'Both'; timeRange: 'Morning' | 'Afternoon' | 'Full Day' };
  onClose: () => void;
  onBack: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  route, scheduledDates, autoScheduled, autoAnswers, onClose, onBack
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  const [travelers, setTravelers] = useState<TravelerBreakdown>({
    total: 1, males: 1, females: 0, local: 1, foreign: 0, children: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [error, setError] = useState('');

  // Derived total check
  const breakdownSum = travelers.males + travelers.females + travelers.children;
  const totalOk = breakdownSum === travelers.total;

  const updateT = (field: keyof TravelerBreakdown, delta: number) => {
    setTravelers(prev => {
      const val = Math.max(0, (prev[field] as number) + delta);
      const updated = { ...prev, [field]: val };
      // keep total in sync if adjusting breakdown
      if (field !== 'total') {
        updated.total = Math.max(updated.total, updated.males + updated.females + updated.children);
      }
      return updated;
    });
  };

  const isValid =
    name.trim().length > 0 &&
    email.trim().includes('@') &&
    phone.trim().length >= 7 &&
    travelers.total >= 1 &&
    totalOk &&
    scheduledDates.length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError('');
    try {
      const isCustom = route.id.startsWith('custom-');
      const newBooking = await bookingService.create({
        routeId: route.id,
        routeName: route.name,
        theme: route.theme,
        contactName: name.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim(),
        travelers,
        scheduledDates,
        autoScheduled,
        pace: autoAnswers?.pace,
        transport: autoAnswers?.transport,
        preferredTimeRange: autoAnswers?.timeRange,
        isCustom,
        userId: user?.id,
        customStops: route.stops,
      });
      setBookingId(newBooking.id);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget && !submitting) onClose(); }}
    >
      <Panel
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {!submitted ? (
          <>
            <PanelHeader>
              <div className="title-area">
                <div className="eyebrow">Step 4 of 4 — Almost There!</div>
                <h2>Complete Your Booking</h2>
                <p>Tell us who's coming so we can prepare your experience.</p>
              </div>
              <CloseBtn onClick={onClose} disabled={submitting}><X size={16} /></CloseBtn>
            </PanelHeader>

            <Body>
              {/* Route Summary */}
              <RouteBanner>
                <div className="rb-icon"><MapPin size={18} /></div>
                <div className="rb-info">
                  <div className="rb-name">{route.name}</div>
                  <div className="rb-meta">
                    <span>{route.theme}</span>
                    <span>{route.stops.length} stops</span>
                    <span>{autoScheduled ? 'Auto-Scheduled' : 'Manual Schedule'}</span>
                  </div>
                  <DatePills>
                    {scheduledDates.slice(0, 6).map(d => <span key={d} className="pill">{d}</span>)}
                    {scheduledDates.length > 6 && <span className="pill">+{scheduledDates.length - 6} more</span>}
                  </DatePills>
                </div>
              </RouteBanner>

              {/* Contact Info */}
              <Section>
                <div className="section-title"><User size={12} /> Contact Information</div>
                <Field className="full">
                  <label>Full Name</label>
                  <div className="input-wrap">
                    <User size={14} />
                    <input placeholder="e.g. Juan dela Cruz" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </Field>
                <FieldRow>
                  <Field>
                    <label>Email Address</label>
                    <div className="input-wrap">
                      <Mail size={14} />
                      <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                  </Field>
                  <Field>
                    <label>Phone Number</label>
                    <div className="input-wrap">
                      <Phone size={14} />
                      <input type="tel" placeholder="+63 9XX XXX XXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </Field>
                </FieldRow>
              </Section>

              {/* Traveler Breakdown */}
              <Section>
                <div className="section-title"><Users size={12} /> Traveler Breakdown</div>
                <CounterGrid>
                  <CounterRow $highlight>
                    <div className="counter-label">
                      <div className="icon-wrap"><Users size={14} /></div>
                      Total Travelers
                    </div>
                    <div className="counter-controls">
                      <button onClick={() => updateT('total', -1)} disabled={travelers.total <= 1}>−</button>
                      <span className="count">{travelers.total}</span>
                      <button onClick={() => updateT('total', 1)}>+</button>
                    </div>
                  </CounterRow>

                  {[
                    { key: 'males' as const, label: 'Male', Icon: User },
                    { key: 'females' as const, label: 'Female', Icon: User },
                    { key: 'children' as const, label: 'Children', Icon: Baby },
                  ].map(({ key, label, Icon }) => (
                    <CounterRow key={key}>
                      <div className="counter-label">
                        <div className="icon-wrap"><Icon size={13} /></div>
                        {label}
                      </div>
                      <div className="counter-controls">
                        <button onClick={() => updateT(key, -1)} disabled={travelers[key] <= 0}>−</button>
                        <span className="count">{travelers[key]}</span>
                        <button onClick={() => updateT(key, 1)}>+</button>
                      </div>
                    </CounterRow>
                  ))}
                </CounterGrid>

                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Local / Foreign */}
                  <CounterGrid>
                    {[
                      { key: 'local' as const, label: 'Local', Icon: MapPin },
                      { key: 'foreign' as const, label: 'Foreign', Icon: Globe },
                    ].map(({ key, label, Icon }) => (
                      <CounterRow key={key}>
                        <div className="counter-label">
                          <div className="icon-wrap"><Icon size={13} /></div>
                          {label}
                        </div>
                        <div className="counter-controls">
                          <button onClick={() => updateT(key, -1)} disabled={travelers[key] <= 0}>−</button>
                          <span className="count">{travelers[key]}</span>
                          <button onClick={() => updateT(key, 1)}>+</button>
                        </div>
                      </CounterRow>
                    ))}
                  </CounterGrid>

                  <TotalNote $ok={totalOk}>
                    {totalOk
                      ? <><Check size={12} /> Traveler counts add up correctly ({travelers.total} total)</>
                      : `⚠ Males (${travelers.males}) + Females (${travelers.females}) + Children (${travelers.children}) = ${breakdownSum} — must equal Total (${travelers.total})`}
                  </TotalNote>
                </div>
              </Section>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: '0.78rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}
            </Body>

            <Footer>
              <BackBtn onClick={onBack} disabled={submitting}>
                <ChevronLeft size={14} /> Back
              </BackBtn>
              <SubmitBtn onClick={handleSubmit} disabled={!isValid || submitting}>
                {submitting
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                  : <><Check size={16} /> Confirm Booking</>}
              </SubmitBtn>
            </Footer>
          </>
        ) : (
          <>
            <PanelHeader>
              <div className="title-area">
                <div className="eyebrow">Booking Confirmed</div>
                <h2>You're All Set!</h2>
              </div>
              <CloseBtn onClick={onClose}><X size={16} /></CloseBtn>
            </PanelHeader>

            <SuccessScreen
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 180 }}
            >
              <div className="success-icon">
                <Check size={32} color="white" strokeWidth={3} />
              </div>
              <h3>Booking Received!</h3>
              <div className="ref-chip">REF: {bookingId.slice(-10).toUpperCase()}</div>
              <p>
                Your itinerary request for <strong style={{ color: '#e2ecf7' }}>{route.name}</strong> has been submitted.
                The Bulusan Tourism Office will review your booking and contact you at <strong style={{ color: '#e2ecf7' }}>{email}</strong> or <strong style={{ color: '#e2ecf7' }}>{phone}</strong> to confirm the details.
              </p>
              <p style={{ fontSize: '0.75rem', color: '#3d5a8a' }}>
                Scheduled dates: {scheduledDates.slice(0, 3).join(', ')}{scheduledDates.length > 3 ? ` +${scheduledDates.length - 3} more` : ''}
              </p>
              <CloseSuccessBtn onClick={onClose}>Back to Map</CloseSuccessBtn>
            </SuccessScreen>
          </>
        )}
      </Panel>
    </Overlay>
  );
};

export default BookingModal;
