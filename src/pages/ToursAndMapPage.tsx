import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import BulusanMap from '../components/Map/BulusanMap';
import TravelGuideFlow from '../components/Map/TravelGuideFlow';
import BookingModal from '../components/Map/BookingModal';
import LiveTourTracker from '../components/Map/LiveTourTracker';
import { useAttractions, useEnterprises, useHeritage } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { getMediaUrl } from '../utils/mediaUtils';
import {
  Search, MapPin, Thermometer, Wind, Droplets,
  Eye, Gauge, Sunrise, Sunset, Cloud, Lock,
  Compass, ArrowRight, SlidersHorizontal, Navigation,
  Users, ChevronDown, ChevronUp, X, Ticket, CalendarDays,
  Sun, CloudRain, CloudSnow, Zap, Umbrella, ChevronLeft, ChevronRight

} from 'lucide-react';

// ─── Animations ──────────────────────────────────────────────────────────────
const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;
const pulse = keyframes`
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
  50% { opacity: 0.85; box-shadow: 0 0 0 6px rgba(245,158,11,0); }
`;

// ─── Rain Effect ──────────────────────────────────────────────────────────────
const RainOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 35;
  pointer-events: none;
  overflow: hidden;

  .drop {
    position: absolute;
    bottom: 100%;
    width: 1.5px;
    pointer-events: none;
    animation: drop linear infinite;
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.6));
    border-radius: 2px;
  }

  @keyframes drop {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(120vh); opacity: 0; }
  }
`;

function RainEffect() {
  const drops = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 1.5}s`,
    animationDuration: `${0.4 + Math.random() * 0.4}s`,
    opacity: Math.random() * 0.4 + 0.2,
    height: `${15 + Math.random() * 25}px`
  })), []);
  
  return (
    <RainOverlay>
      {drops.map((style, i) => <div key={i} className="drop" style={style} />)}
    </RainOverlay>
  );
}

// ─── Layout Shell ─────────────────────────────────────────────────────────────
const PageWrapper = styled(motion.div)`
  display: flex;
  height: calc(100dvh - 80px);
  background: #0f172a;
  overflow: hidden;
  position: relative;
  font-family: 'Outfit', 'Inter', sans-serif;
`;

// ─── LEFT SIDEBAR ─────────────────────────────────────────────────────────────
const LeftSidebar = styled.div`
  width: 300px;
  flex-shrink: 0;
  background: #0d1526;
  border-right: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 10;

  @media (max-width: 1023px) { display: none; }
`;

const SidebarHeader = styled.div`
  padding: 14px 16px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
`;

const SidebarTitle = styled.div`
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #3b82f6;
  margin-bottom: 4px;
`;

const SidebarScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 20px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
`;

// Search
const SearchBox = styled.div`
  padding: 8px 12px;
  position: relative;
  border-bottom: 1px solid rgba(255,255,255,0.04);

  input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 9px 12px 9px 34px;
    color: #e2e8f0;
    font-size: 0.82rem;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;

    &::placeholder { color: #334155; }
    &:focus {
      border-color: rgba(59,130,246,0.4);
      background: rgba(255,255,255,0.07);
      box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
    }
  }
  svg { position: absolute; left: 22px; top: 50%; transform: translateY(-50%); color: #334155; }
`;

// Filter tabs
const FilterRow = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  overflow-x: auto;
  &::-webkit-scrollbar { display: none; }
`;

const FilterPill = styled.button<{ $active: boolean }>`
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid ${p => p.$active ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)'};
  background: ${p => p.$active ? 'rgba(59,130,246,0.18)' : 'transparent'};
  color: ${p => p.$active ? '#60a5fa' : '#475569'};
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover { color: #94a3b8; border-color: rgba(255,255,255,0.12); }
`;

const TagsContainer = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const TagBadge = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)'};
  color: ${p => p.$active ? 'white' : '#94a3b8'};
  border: 1px solid ${p => p.$active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'};
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
`;

const CountLabel = styled.div`
  padding: 8px 12px 4px;
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #1e3a5f;
`;

// Destination card
const DestCard = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: ${p => p.$active ? 'rgba(59,130,246,0.1)' : 'transparent'};
  border: none;
  border-left: 3px solid ${p => p.$active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;

  &:hover { background: rgba(255,255,255,0.03); border-left-color: rgba(59,130,246,0.3); }
`;

const DestThumb = styled.div`
  width: 42px; height: 42px;
  border-radius: 9px;
  overflow: hidden;
  flex-shrink: 0;
  background: #1e293b;
  display: flex; align-items: center; justify-content: center;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const DestMeta = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    color: #e2e8f0;
    font-size: 0.82rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }
  .loc {
    color: #334155;
    font-size: 0.68rem;
    display: flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const TypePill = styled.span<{ $t: string }>`
  font-size: 0.58rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 8px;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${p => p.$t === 'Attraction' ? 'rgba(59,130,246,0.14)' : p.$t === 'Enterprise' ? 'rgba(245,158,11,0.14)' : 'rgba(139,92,246,0.14)'};
  color: ${p => p.$t === 'Attraction' ? '#60a5fa' : p.$t === 'Enterprise' ? '#fbbf24' : '#a78bfa'};
`;

// ─── MAP CENTER ───────────────────────────────────────────────────────────────
const MapCenter = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const MapTopBar = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
`;

const MapChip = styled.div`
  background: rgba(13,21,38,0.88);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 20px;
  padding: 5px 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  white-space: nowrap;

  svg { color: #60a5fa; flex-shrink: 0; }
`;

const CompassWidget = styled.div`
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 30;
  width: 44px; height: 44px;
  background: rgba(13,21,38,0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444; /* North needle indicator color */
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  pointer-events: none;
`;

// Floating "Tours" button on map
const ToursFloatBtn = styled.button`
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  background: linear-gradient(135deg, #d97706, #b45309);
  border: none;
  color: white;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 12px 20px;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
  box-shadow: 0 4px 20px rgba(180,83,9,0.4);
  animation: ${pulse} 2.5s ease-in-out infinite;
  transition: transform 0.2s;
  letter-spacing: 0.3px;

  &:hover { transform: scale(1.04); }
`;

// Mobile bottom drawer
const MobileDrawer = styled.div<{ $open: boolean }>`
  display: none;
  @media (max-width: 1023px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: #0d1526;
    border-top: 1px solid rgba(255,255,255,0.07);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    z-index: 60;
    height: ${p => p.$open ? '65vh' : '56px'};
    transition: height 0.38s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
  }
`;

const DrawerHandle = styled.button`
  width: 100%;
  padding: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 700;

  .pill { width: 36px; height: 4px; background: #1e293b; border-radius: 2px; }
`;

// ─── RIGHT PANEL (Weather Dashboard) ─────────────────────────────────────────
const RightPanelWrapper = styled(motion.div)<{ $expanded: boolean }>`
  width: ${p => p.$expanded ? '420px' : '290px'};
  background: #0d1526;
  border-left: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: ${p => p.$expanded ? '-10px 0 30px rgba(0,0,0,0.2)' : 'none'};
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  flex-shrink: 0;

  @media (max-width: 1279px) { display: none; }
`;

const ExpandToggle = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  border-radius: 8px;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255,255,255,0.1); color: white; }
`;

const RightPanelContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: 1;
  transition: opacity 0.2s;
`;

const WeatherPanelScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
`;

const WeatherHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;

  h3 { color: white; font-size: 0.88rem; font-weight: 800; margin: 0; }
  .loc { color: #3b82f6; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
`;

const WeatherHero = styled.div`
  background: linear-gradient(135deg, rgba(37,99,235,0.22) 0%, rgba(16,185,129,0.1) 100%);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: -20px; right: -20px;
    width: 90px; height: 90px;
    background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
`;

const TempRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const BigTemp = styled.div`
  font-size: 3rem;
  font-weight: 900;
  color: white;
  line-height: 1;
  letter-spacing: -3px;

  sup {
    font-size: 1.1rem;
    letter-spacing: 0;
    font-weight: 600;
    color: #64748b;
    vertical-align: super;
  }
`;

const WeatherIconBig = styled.div`
  font-size: 2.8rem;
  animation: ${float} 4s ease-in-out infinite;
  line-height: 1;
`;

const WeatherCondition = styled.div`
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 10px;
`;

const FeelsLike = styled.div`
  color: #475569;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 14px;
`;

const WeatherGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

const WeatherCell = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 9px 10px;
  display: flex;
  align-items: center;
  gap: 7px;

  .icon { color: #60a5fa; flex-shrink: 0; }
  .info { min-width: 0; }
  .val { color: #e2e8f0; font-size: 0.82rem; font-weight: 800; display: block; }
  .lbl { color: #334155; font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
`;

// Travel advisory
const AdvisoryCard = styled.div<{ $level: 'safe' | 'caution' | 'warning' }>`
  background: ${p => p.$level === 'safe'
    ? 'rgba(16,185,129,0.08)'
    : p.$level === 'caution'
    ? 'rgba(245,158,11,0.08)'
    : 'rgba(239,68,68,0.08)'};
  border: 1px solid ${p => p.$level === 'safe'
    ? 'rgba(16,185,129,0.2)'
    : p.$level === 'caution'
    ? 'rgba(245,158,11,0.2)'
    : 'rgba(239,68,68,0.2)'};
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;

  .header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 5px;

    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: ${p => p.$level === 'safe' ? '#10b981' : p.$level === 'caution' ? '#f59e0b' : '#ef4444'};
    }
    .label {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${p => p.$level === 'safe' ? '#10b981' : p.$level === 'caution' ? '#f59e0b' : '#ef4444'};
    }
  }
  .desc {
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 500;
    line-height: 1.5;
  }
`;

// Forecast row
const ForecastStrip = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
  overflow-x: auto;
  &::-webkit-scrollbar { display: none; }
`;

const ForecastItem = styled.div`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: center;
  flex-shrink: 0;
  min-width: 52px;

  .day { color: #334155; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
  .ico { font-size: 1.1rem; margin-bottom: 4px; }
  .tmp { color: #e2e8f0; font-size: 0.75rem; font-weight: 800; }
`;

const SectionLabel2 = styled.div`
  font-size: 0.63rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #1e3a5f;
  margin-bottom: 8px;
  margin-top: 2px;
`;

// Tour stats footer
const WeatherFooter = styled.div`
  padding: 10px 14px;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  flex-shrink: 0;
`;

const FooterStat = styled.div`
  text-align: center;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  padding: 7px 4px;

  .val { color: white; font-size: 0.88rem; font-weight: 900; display: block; }
  .lbl { color: #1e3a5f; font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
`;

// ─── TOURS COMING SOON MODAL ─────────────────────────────────────────────────
const ToursOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;

  @media (min-width: 640px) { align-items: center; }
`;

const ToursModal = styled(motion.div)`
  background: #0d1526;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ModalTitle = styled.div`
  h2 { color: white; font-size: 1.2rem; font-weight: 900; margin: 0 0 4px; }
  p { color: #475569; font-size: 0.78rem; margin: 0; }
`;

const ComingSoonBadge = styled.span`
  background: linear-gradient(135deg, #d97706, #92400e);
  color: #fef3c7;
  font-size: 0.6rem;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const CloseBtn = styled.button`
  background: rgba(255,255,255,0.06);
  border: none;
  color: #64748b;
  border-radius: 50%;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover { background: rgba(255,255,255,0.1); color: white; }
`;

const TourCard = styled.div`
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  height: 90px;
  margin-bottom: 8px;
`;

const TourBg = styled.div<{ $img: string }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.4) 100%),
              url(${p => p.$img}) center/cover;
`;

const TourContent = styled.div`
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding: 10px 12px;
  gap: 8px;
`;

const TourLockOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  background: rgba(13,21,38,0.5);
  backdrop-filter: blur(1.5px);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px;
`;

const TourName = styled.div`
  color: white;
  font-size: 0.85rem;
  font-weight: 800;
  line-height: 1.2;
`;

const TourTags = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
`;

const TourTag = styled.span`
  background: rgba(255,255,255,0.14);
  color: #cbd5e1;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
`;

const LockChip = styled.div`
  background: rgba(245,158,11,0.2);
  border: 1px solid rgba(245,158,11,0.3);
  color: #fbbf24;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 4px 9px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NotifyBtn = styled.button`
  width: 100%;
  padding: 13px;
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(59,130,246,0.25);
  border-radius: 14px;
  color: #60a5fa;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;

  &:hover { background: rgba(59,130,246,0.2); box-shadow: 0 0 20px rgba(59,130,246,0.15); }
`;

// Simple elegant toast notification inside modal
const ToastMessage = styled(motion.div)`
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  background: #1e293b;
  border: 1px solid rgba(59,130,246,0.4);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
  z-index: 10;
`;

// Skeleton
const Skel = styled.div`
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%);
  background-size: 200% auto;
  animation: ${shimmer} 1.5s linear infinite;
  border-radius: 8px;
`;

// ─── WEATHER HOOK ─────────────────────────────────────────────────────────────
interface DayForecast { day: string; date: string; code: number; high: number; low: number; }
interface WeatherData {
  temp: number;
  feelsLike: number;
  desc: string;
  humidity: number;
  wind: number;
  windGusts: number;
  windDir: number;
  visibility: number;
  pressure: number;
  code: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  forecast: DayForecast[]; // index 0 = yesterday, 1 = today, 2 = tomorrow, 3 = day after, ...
}

function formatTime(iso: string): string {
  if (!iso) return '--';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return '--'; }
}

function windDirLabel(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function useWeather(): WeatherData | null {
  const [data, setData] = useState<WeatherData | null>(null);
  useEffect(() => {
    const lat = 12.7533, lng = 124.1362;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,surface_pressure,visibility` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&wind_speed_unit=kmh&timezone=Asia%2FManila&forecast_days=4&past_days=1`
    )
      .then(r => r.json())
      .then(d => {
        const c = d.current;
        const daily = d.daily;
        const code = c.weather_code ?? 0;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const forecastList: DayForecast[] = (daily.time as string[]).map((dateStr: string, i: number) => {
          const dateObj = new Date(dateStr);
          return {
            day: days[dateObj.getDay()],
            date: dateObj.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
            code: daily.weather_code[i],
            high: Math.round(daily.temperature_2m_max[i]),
            low: Math.round(daily.temperature_2m_min[i]),
          };
        });

        setData({
          temp: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          desc: getDesc(code),
          humidity: c.relative_humidity_2m,
          wind: Math.round(c.wind_speed_10m),
          windGusts: Math.round(c.wind_gusts_10m ?? 0),
          windDir: c.wind_direction_10m ?? 0,
          visibility: Math.round((c.visibility ?? 10000) / 1000),
          pressure: Math.round(c.surface_pressure ?? 1013),
          code,
          uvIndex: code <= 1 ? 8 : code <= 3 ? 5 : 2,
          sunrise: formatTime(daily.sunrise?.[1] ?? ''),
          sunset: formatTime(daily.sunset?.[1] ?? ''),
          forecast: forecastList,
        });
      })
      .catch(() => {
        setData({
          temp: 28, feelsLike: 30, desc: 'Partly Cloudy', humidity: 78,
          wind: 12, windGusts: 22, windDir: 135, visibility: 10, pressure: 1012, code: 2, uvIndex: 6,
          sunrise: '5:42 AM', sunset: '6:08 PM',
          forecast: [
            { day: 'Sun', date: 'Jul 27', code: 3, high: 29, low: 23 },
            { day: 'Mon', date: 'Jul 28', code: 2, high: 28, low: 22 },
            { day: 'Tue', date: 'Jul 29', code: 61, high: 27, low: 23 },
            { day: 'Wed', date: 'Jul 30', code: 1, high: 30, low: 24 },
            { day: 'Thu', date: 'Jul 31', code: 1, high: 31, low: 25 },
          ],
        });
      });
  }, []);
  return data;
}

function getDesc(code: number) {
  if (code === 0) return 'Clear Sky';
  if (code <= 1) return 'Mainly Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rain Showers';
  if (code <= 77) return 'Snow Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function WeatherEmoji({ code, size = '2rem' }: { code: number; size?: string }) {
  const style = { fontSize: size };
  if (code === 0) return <span style={style}>☀️</span>;
  if (code <= 1) return <span style={style}>🌤️</span>;
  if (code <= 3) return <span style={style}>⛅</span>;
  if (code <= 48) return <span style={style}>🌫️</span>;
  if (code <= 67) return <span style={style}>🌧️</span>;
  if (code <= 77) return <span style={style}>❄️</span>;
  return <span style={style}>⛈️</span>;
}

function getTravelAdvisory(code: number): { level: 'safe' | 'caution' | 'warning'; text: string } {
  if (code <= 3) return { level: 'safe', text: 'Great day to explore! Weather is ideal for outdoor activities and sightseeing in Bulusan.' };
  if (code <= 48) return { level: 'caution', text: 'Light fog expected. Visibility may be reduced on mountain trails. Bring a jacket.' };
  if (code <= 67) return { level: 'caution', text: 'Rain expected. Bring rain gear. Some outdoor trails may be slippery.' };
  return { level: 'warning', text: 'Severe weather. Avoid exposed trails and volcanic areas. Stay safe indoors.' };
}

const UPCOMING_TOURS = [
  { name: 'Bulusan Volcano Trek', duration: '1 Day', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80', tags: ['Nature', 'Adventure'] },
  { name: 'Heritage Village Walk', duration: '3 hrs', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&q=80', tags: ['Culture', 'History'] },
  { name: 'Hot Springs Day Tour', duration: '½ Day', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80', tags: ['Relaxation'] },
  { name: 'Lake Bulusan Kayak', duration: '2 hrs', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&q=80', tags: ['Water Sport'] },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ToursAndMapPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const focusName = queryParams.get('name');
  const autoRoute = queryParams.get('route') === 'true';
  const urlSearch = queryParams.get('search');
  const activeTourId = queryParams.get('activeTourId');

  const { data: attractions, loading: la } = useAttractions();
  const { data: enterprises, loading: le } = useEnterprises();
  const { data: heritage, loading: lh } = useHeritage();
  const loading = la || le || lh;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Attraction' | 'Enterprise' | 'Heritage'>('All');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [focusedLocation, setFocusedLocation] = useState<any>(null);
  
  const [showToursModal, setShowToursModal] = useState(false);
  const [showComingSoonMsg, setShowComingSoonMsg] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);

  const weather = useWeather();
  const advisory = weather ? getTravelAdvisory(weather.code) : null;
  const initialRef = React.useRef(false);

  const allItems = useMemo(() => [
    ...attractions.map(a => ({ ...a, entityType: 'Attraction' })),
    ...enterprises.map(e => ({ ...e, entityType: 'Enterprise' })),
    ...heritage.map(h => ({ ...h, entityType: 'Heritage', categories: [h.period] })),
  ], [attractions, enterprises, heritage]);

  // Extract available tags for the current tab
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allItems
      .filter(i => activeTab === 'All' || i.entityType === activeTab)
      .forEach(item => {
        (item.categories || item.tags || []).forEach((t: string) => tags.add(t));
      });
    return Array.from(tags).sort().slice(0, 15);
  }, [allItems, activeTab]);

  useEffect(() => {
    if (initialRef.current) return;
    if (focusName) {
      setSearchQuery(focusName);
      const t = allItems.find(i => i.name === focusName);
      if (t) setFocusedLocation(t);
      initialRef.current = true;
    } else if (urlSearch) {
      setSearchQuery(urlSearch);
      initialRef.current = true;
    }
  }, [focusName, urlSearch, allItems]);

  const filteredItems = useMemo(() => allItems.filter(item => {
    const textMatch = searchQuery === '' || (item.name + ' ' + ((item as any).description || '')).toLowerCase().includes(searchQuery.toLowerCase());
    const tabMatch = activeTab === 'All' || (item as any).entityType === activeTab;
    const catMatch = selectedCategories.length === 0 || selectedCategories.some(sc => (item.categories || item.tags || []).includes(sc));
    return textMatch && tabMatch && catMatch;
  }), [allItems, searchQuery, activeTab, selectedCategories]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const TABS: ('All' | 'Attraction' | 'Enterprise' | 'Heritage')[] = ['All', 'Attraction', 'Enterprise', 'Heritage'];

  const DestList = (
    <>
      <FilterRow>
        {TABS.map(t => (
          <FilterPill key={t} $active={activeTab === t} onClick={() => { setActiveTab(t); setSelectedCategories([]); }}>{t}</FilterPill>
        ))}
      </FilterRow>
      
      {availableTags.length > 0 && (
        <TagsContainer>
          {availableTags.map(tag => (
            <TagBadge key={tag} $active={selectedCategories.includes(tag)} onClick={() => toggleCategory(tag)}>
              {tag}
            </TagBadge>
          ))}
        </TagsContainer>
      )}

      <CountLabel>{filteredItems.length} Destinations</CountLabel>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ padding: '8px 12px', display: 'flex', gap: 10 }}>
            <Skel style={{ width: 42, height: 42, borderRadius: 9, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Skel style={{ height: 11, width: '65%', marginBottom: 6 }} />
              <Skel style={{ height: 9, width: '40%' }} />
            </div>
          </div>
        ))
      ) : filteredItems.length === 0 ? (
        <div style={{ padding: '32px 12px', textAlign: 'center', color: '#1e3a5f' }}>
          <MapPin size={22} style={{ display: 'block', margin: '0 auto 8px' }} />
          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>No destinations found</div>
        </div>
      ) : (
        filteredItems.map(item => {
          const img = (item as any).img || (item as any).photos?.[0];
          const type = (item as any).entityType as string;
          const isActive = focusedLocation?.id === item.id && focusedLocation?.entityType === type;
          return (
            <DestCard key={`${type}-${item.id}`} $active={isActive} onClick={() => { setFocusedLocation(isActive ? null : item); setMobileDrawerOpen(false); }}>
              <DestThumb>
                {img ? <img src={getMediaUrl(img)} alt={item.name} /> : <MapPin size={16} color="#1e3a5f" />}
              </DestThumb>
              <DestMeta>
                <div className="name">{item.name}</div>
                <div className="loc"><MapPin size={9} />{(item as any).location || 'Bulusan, Sorsogon'}</div>
              </DestMeta>
              <TypePill $t={type}>{type === 'Attraction' ? 'Spot' : type === 'Enterprise' ? 'Biz' : 'Heritage'}</TypePill>
            </DestCard>
          );
        })
      )}
    </>
  );

  const isRaining = weather && weather.code >= 51 && weather.code <= 67;

  return (
    <PageWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

      {/* ── LEFT: Destinations ── */}
      <LeftSidebar>
        <SidebarHeader>
          <SidebarTitle>🗺 Explore Bulusan</SidebarTitle>
          <div style={{ color: '#1e3a5f', fontSize: '0.7rem', fontWeight: 600 }}>
            {allItems.length} destinations available
          </div>
        </SidebarHeader>
        <SearchBox>
          <Search size={13} />
          <input placeholder="Search destinations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </SearchBox>
        <SidebarScroll>{DestList}</SidebarScroll>
      </LeftSidebar>

      {/* ── CENTER: Map ── */}
      <MapCenter>
        {isRaining && <RainEffect />}
        
        <MapTopBar>
          <MapChip><MapPin size={10} />{allItems.length} Spots</MapChip>
        </MapTopBar>

        {activeTourId ? (
          <LiveTourTracker bookingId={activeTourId} onExit={() => {}} onFocusItem={id => { const i = filteredItems.find(x => x.id.toString() === id); if (i) setFocusedLocation(i); }} />
        ) : (
          <BulusanMap items={filteredItems} searchQuery={searchQuery} selectedCategories={selectedCategories} focusLat={focusedLocation?.coordinates?.lat} focusLng={focusedLocation?.coordinates?.lng} focusName={focusedLocation?.name} autoRoute={autoRoute} />
        )}

        {/* Compass Widget */}
        <CompassWidget>
          <Compass size={24} />
        </CompassWidget>

        {/* Tours floating button */}
        <ToursFloatBtn onClick={() => setShowToursModal(true)}>
          <Ticket size={14} /> Tours & Packages
        </ToursFloatBtn>
      </MapCenter>

      {/* ── RIGHT: Full Weather Dashboard (Expandable) ── */}
      <RightPanelWrapper $expanded={weatherExpanded}>
        <RightPanelContent>
          <WeatherPanelScroll>
            <WeatherHeader>
              <div>
                <h3>Weather</h3>
                <div className="loc">Bulusan, Sorsogon</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                {weather && <WeatherEmoji code={weather.code} size="1.8rem" />}
                <ExpandToggle onClick={() => setWeatherExpanded(!weatherExpanded)} title={weatherExpanded ? "Collapse" : "Expand"}>
                  {weatherExpanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </ExpandToggle>
              </div>
            </WeatherHeader>

            {/* Hero temp card */}
            {weather ? (
              <WeatherHero>
                <TempRow>
                  <div>
                    <BigTemp>{weather.temp}<sup>°C</sup></BigTemp>
                    <WeatherCondition>{weather.desc}</WeatherCondition>
                    <FeelsLike>Feels like {weather.feelsLike}°C</FeelsLike>
                  </div>
                  <WeatherIconBig><WeatherEmoji code={weather.code} size="3rem" /></WeatherIconBig>
                </TempRow>
                <WeatherGrid>
                  <WeatherCell>
                    <Droplets className="icon" size={14} />
                    <div className="info">
                      <span className="val">{weather.humidity}%</span>
                      <span className="lbl">Humidity</span>
                    </div>
                  </WeatherCell>
                  <WeatherCell>
                    <Wind className="icon" size={14} />
                    <div className="info">
                      <span className="val">{weather.wind} km/h</span>
                      <span className="lbl">Wind {windDirLabel(weather.windDir)}</span>
                    </div>
                  </WeatherCell>
                  <WeatherCell>
                    <Eye className="icon" size={14} />
                    <div className="info">
                      <span className="val">{weather.visibility} km</span>
                      <span className="lbl">Visibility</span>
                    </div>
                  </WeatherCell>
                  <WeatherCell>
                    <Gauge className="icon" size={14} />
                    <div className="info">
                      <span className="val">{weather.pressure} hPa</span>
                      <span className="lbl">Pressure</span>
                    </div>
                  </WeatherCell>
                </WeatherGrid>
              </WeatherHero>
            ) : (
              <WeatherHero>
                <Skel style={{ height: 60, marginBottom: 10 }} />
                <Skel style={{ height: 70 }} />
              </WeatherHero>
            )}

            {/* ── EXPANDED ONLY: Sunrise/Sunset + Wind detail + Daily breakdown ── */}
            {weather && weatherExpanded && (
              <>
                {/* Sunrise / Sunset */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sunrise size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '0.88rem' }}>{weather.sunrise}</div>
                      <div style={{ color: '#475569', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sunrise</div>
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.05))', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sunset size={18} color="#f97316" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#f97316', fontWeight: 900, fontSize: '0.88rem' }}>{weather.sunset}</div>
                      <div style={{ color: '#475569', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sunset</div>
                    </div>
                  </div>
                </div>

                {/* Wind detail */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <SectionLabel2>Wind Detail</SectionLabel2>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Direction arrow */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Navigation size={18} color="#60a5fa" style={{ transform: `rotate(${weather.windDir}deg)`, transition: 'transform 0.5s' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', flex: 1 }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>{weather.wind} km/h</div>
                        <div style={{ color: '#334155', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Speed</div>
                      </div>
                      <div>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>{weather.windGusts} km/h</div>
                        <div style={{ color: '#334155', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Gusts</div>
                      </div>
                      <div>
                        <div style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>{weather.windDir}°</div>
                        <div style={{ color: '#334155', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Direction</div>
                      </div>
                      <div>
                        <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: '0.85rem' }}>{windDirLabel(weather.windDir)}</div>
                        <div style={{ color: '#334155', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Bearing</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day-by-day breakdown (Yesterday, Today, Tomorrow, Day After) */}
                <SectionLabel2>Daily Breakdown</SectionLabel2>
                {weather.forecast.map((f, i) => {
                  const label = i === 0 ? 'Yesterday' : i === 1 ? 'Today' : i === 2 ? 'Tomorrow' : f.day;
                  const isToday = i === 1;
                  return (
                    <div key={i} style={{
                      background: isToday ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isToday ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 10, padding: '10px 12px', marginBottom: 6,
                      display: 'flex', alignItems: 'center', gap: 10
                    }}>
                      <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                        <WeatherEmoji code={f.code} size="1.4rem" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: isToday ? '#60a5fa' : '#94a3b8', fontWeight: 800, fontSize: '0.8rem' }}>{label}</span>
                          <span style={{ color: '#475569', fontSize: '0.65rem', fontWeight: 600 }}>{f.date}</span>
                        </div>
                        <div style={{ color: '#334155', fontSize: '0.68rem', fontWeight: 600, marginTop: 2 }}>{getDesc(f.code)}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: 'white', fontWeight: 900, fontSize: '0.9rem' }}>{f.high}°</div>
                        <div style={{ color: '#334155', fontSize: '0.7rem', fontWeight: 600 }}>{f.low}°</div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* UV Index */}
            {weather && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <SectionLabel2>UV Index</SectionLabel2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: `${Math.min(weather.uvIndex / 12 * 100, 100)}%`, top: -3, width: 12, height: 12, borderRadius: '50%', background: 'white', border: '2px solid #0d1526', transform: 'translateX(-50%)' }} />
                  </div>
                  <div style={{ color: weather.uvIndex <= 2 ? '#10b981' : weather.uvIndex <= 5 ? '#f59e0b' : '#ef4444', fontWeight: 900, fontSize: '0.9rem', minWidth: 24 }}>{weather.uvIndex}</div>
                  <div style={{ color: '#334155', fontSize: '0.68rem', fontWeight: 700 }}>
                    {weather.uvIndex <= 2 ? 'Low' : weather.uvIndex <= 5 ? 'Moderate' : weather.uvIndex <= 7 ? 'High' : 'Very High'}
                  </div>
                </div>
              </div>
            )}

            {/* 4-day forecast */}
            {weather && weather.forecast.length > 0 && (
              <>
                <SectionLabel2>4-Day Forecast</SectionLabel2>
                <ForecastStrip>
                  {weather.forecast.map((f, i) => (
                    <ForecastItem key={i}>
                      <div className="day">{f.day}</div>
                      <div className="ico"><WeatherEmoji code={f.code} size="1rem" /></div>
                      <div className="tmp">{f.high}°</div>
                      <div style={{ color: '#334155', fontSize: '0.6rem', fontWeight: 600 }}>{f.low}°</div>
                    </ForecastItem>
                  ))}
                </ForecastStrip>
              </>
            )}

            {/* Travel advisory */}
            {advisory && (
              <>
                <SectionLabel2>Travel Advisory</SectionLabel2>
                <AdvisoryCard $level={advisory.level}>
                  <div className="header">
                    <div className="dot" />
                    <div className="label">
                      {advisory.level === 'safe' ? '✓ Safe to Explore' : advisory.level === 'caution' ? '⚠ Caution' : '✖ Advisory'}
                    </div>
                  </div>
                  <div className="desc">{advisory.text}</div>
                </AdvisoryCard>
              </>
            )}

            {/* Best time to visit indicator */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <SectionLabel2>Best Activities Now</SectionLabel2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { name: 'Hiking Trails', ok: weather ? weather.code <= 3 : true },
                  { name: 'Lake Tours', ok: weather ? weather.code <= 48 : true },
                  { name: 'Heritage Sites', ok: true },
                  { name: 'Hot Springs', ok: true },
                ].map(act => (
                  <div key={act.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>{act.name}</span>
                    <span style={{ color: act.ok ? '#10b981' : '#f59e0b', fontSize: '0.65rem', fontWeight: 800, background: act.ok ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 20, border: `1px solid ${act.ok ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                      {act.ok ? '✓ Great' : '⚠ Fair'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </WeatherPanelScroll>

          <WeatherFooter>
            <FooterStat>
              <span className="val">{attractions.length}</span>
              <span className="lbl">Attractions</span>
            </FooterStat>
            <FooterStat>
              <span className="val">{enterprises.length}</span>
              <span className="lbl">Enterprises</span>
            </FooterStat>
            <FooterStat>
              <span className="val">{heritage.length}</span>
              <span className="lbl">Heritage</span>
            </FooterStat>
          </WeatherFooter>
        </RightPanelContent>
      </RightPanelWrapper>

      {/* ── MOBILE DRAWER ── */}
      <MobileDrawer $open={mobileDrawerOpen}>
        <DrawerHandle onClick={() => setMobileDrawerOpen(o => !o)}>
          <div className="pill" />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>{mobileDrawerOpen ? 'Collapse' : 'Destinations'}</span>
        </DrawerHandle>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
          <SearchBox style={{ margin: '0 0 0' }}>
            <Search size={13} />
            <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </SearchBox>
          {DestList}
        </div>
      </MobileDrawer>

      {/* ── TOURS COMING SOON MODAL ── */}
      <AnimatePresence>
        {showToursModal && (
          <ToursOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowToursModal(false)}>
            <ToursModal initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2>Tours & Packages</h2>
                    <ComingSoonBadge>Coming Soon</ComingSoonBadge>
                  </div>
                  <p>We're crafting amazing tour experiences for you. Stay tuned!</p>
                </ModalTitle>
                <CloseBtn onClick={() => setShowToursModal(false)}><X size={14} /></CloseBtn>
              </ModalHeader>

              <div style={{ padding: '14px 16px' }}>
                {UPCOMING_TOURS.map(tour => (
                  <TourCard key={tour.name}>
                    <TourBg $img={tour.img} />
                    <TourLockOverlay>
                      <LockChip><Lock size={9} /> Soon</LockChip>
                    </TourLockOverlay>
                    <TourContent>
                      <div>
                        <TourName>{tour.name}</TourName>
                        <TourTags>
                          <TourTag>{tour.duration}</TourTag>
                          {tour.tags.map(t => <TourTag key={t}>{t}</TourTag>)}
                        </TourTags>
                      </div>
                    </TourContent>
                  </TourCard>
                ))}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '14px 0' }} />

                <p style={{ color: '#475569', fontSize: '0.78rem', textAlign: 'center', marginBottom: 12, lineHeight: 1.5 }}>
                  Want to explore Bulusan now? Our local guides are ready!
                </p>
                <NotifyBtn onClick={() => {
                  setShowComingSoonMsg(true);
                  setTimeout(() => setShowComingSoonMsg(false), 3000);
                }}>
                  <Navigation size={14} /> Plan My Trip Now
                </NotifyBtn>
              </div>
              
              {/* Coming Soon Toast within Modal */}
              <AnimatePresence>
                {showComingSoonMsg && (
                  <ToastMessage
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  >
                    <CalendarDays size={16} color="#60a5fa" />
                    <div>The custom itinerary planner is coming soon!</div>
                  </ToastMessage>
                )}
              </AnimatePresence>
            </ToursModal>
          </ToursOverlay>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default ToursAndMapPage;
