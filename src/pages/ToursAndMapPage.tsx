import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import BulusanMap from '../components/Map/BulusanMap';
import WeatherCanvas from '../components/Map/WeatherCanvas';
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
  Sun, CloudRain, CloudSnow, Zap, Umbrella, ChevronLeft, ChevronRight, ShieldAlert

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

// ─── Rain Effect ───────────────────────────────────────────────────────────────
const RainOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 35;
  pointer-events: none;
  overflow: hidden;
  /* Dark atmospheric tint so drops show against the light map */
  background: linear-gradient(
    to bottom,
    rgba(15, 25, 60, 0.18) 0%,
    rgba(10, 20, 50, 0.08) 100%
  );

  .drop {
    position: absolute;
    bottom: 100%;
    pointer-events: none;
    animation: drop linear infinite;
    border-radius: 9999px;
  }

  @keyframes drop {
    0%   { transform: translateY(0) skewX(-8deg);  opacity: 0.8; }
    80%  { opacity: 0.7; }
    100% { transform: translateY(125vh) skewX(-8deg); opacity: 0; }
  }
`;

function RainEffect() {
  const drops = useMemo(() => Array.from({ length: 140 }).map(() => {
    // Vary between thin fast streaks and slightly thicker slower drops
    const isFast = Math.random() > 0.4;
    const r = Math.round(80 + Math.random() * 40);
    const g = Math.round(110 + Math.random() * 50);
    const b = Math.round(200 + Math.random() * 55);
    const alpha = (0.35 + Math.random() * 0.45).toFixed(2);
    return {
      left: `${Math.random() * 105}%`,
      animationDelay: `${(Math.random() * 2).toFixed(2)}s`,
      animationDuration: `${(isFast ? 0.35 + Math.random() * 0.25 : 0.5 + Math.random() * 0.35).toFixed(2)}s`,
      width: `${isFast ? 1 : 1.5 + Math.random()}px`,
      height: `${isFast ? 18 + Math.random() * 28 : 12 + Math.random() * 18}px`,
      background: `linear-gradient(to bottom, rgba(${r},${g},${b},0), rgba(${r},${g},${b},${alpha}))`,
    };
  }), []);

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
  flex-shrink: 0;
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
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const CompactWeatherOverlay = styled.div<{ $drawerOpen: boolean }>`
  position: absolute;
  bottom: ${p => p.$drawerOpen ? 'calc(75vh + 58px)' : '64px'};
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  gap: 10px;
  pointer-events: none;
  transition: bottom 0.38s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
    width: 90%;
  }
`;

const CompactStatBox = styled.div`
  background: rgba(13,21,38,0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
  pointer-events: auto;
  min-width: 120px;

  .icon { color: #60a5fa; display: flex; }
  .val { color: white; font-weight: 900; font-size: 0.9rem; line-height: 1; margin-bottom: 2px; }
  .lbl { color: #475569; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
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

// ─── Clock Widget (top-left of map) ──────────────────────────────────────────
const ClockWidget = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 30;
  background: rgba(13,21,38,0.88);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  pointer-events: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.35);

  .clock-time {
    font-size: 1.15rem;
    font-weight: 900;
    color: white;
    letter-spacing: 1px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .clock-date {
    font-size: 0.6rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 3px;
  }
  .clock-loc {
    font-size: 0.58rem;
    font-weight: 600;
    color: #3b82f6;
    margin-top: 1px;
    display: flex;
    align-items: center;
    gap: 3px;
  }
`;

// ─── Compass Rose Widget (bottom-left of map) ────────────────────────────────
const CompassWidget = styled.div`
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 30;
  width: 72px; height: 72px;
  background: rgba(13,21,38,0.88);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  pointer-events: none;
  flex-direction: column;
`;

// ─── Tours Map Panel (bottom-right of map) ───────────────────────────────────
const ToursMapPanel = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 30;
  width: 220px;
  background: rgba(13,21,38,0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
`;

const ToursPanelHeader = styled.div`
  padding: 9px 12px 7px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;

  .title {
    font-size: 0.65rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 5px;
    svg { color: #f59e0b; }
  }
  .badge {
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(245,158,11,0.25);
    color: #fbbf24;
    font-size: 0.55rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const ToursMiniList = styled.div`
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const TourMiniCard = styled.div`
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  height: 58px;
  cursor: default;

  .bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: brightness(0.55);
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(10,15,30,0.8) 0%, rgba(10,15,30,0.2) 100%);
  }
  .info {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 10px;
    gap: 8px;
  }
  .name {
    color: white;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1.2;
    flex: 1;
  }
  .dur {
    background: rgba(255,255,255,0.15);
    color: #e2e8f0;
    font-size: 0.58rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 6px;
    white-space: nowrap;
  }
`;

const ToursViewAllBtn = styled.button`
  width: 100%;
  padding: 8px;
  background: rgba(59,130,246,0.1);
  border: none;
  border-top: 1px solid rgba(255,255,255,0.05);
  color: #60a5fa;
  font-size: 0.68rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: background 0.2s;
  letter-spacing: 0.3px;

  &:hover { background: rgba(59,130,246,0.2); }
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

// ─── BOTTOM PANEL (Weather Dashboard Drawer) ───────────────────────────────────
const BottomPanelWrapper = styled(motion.div)<{ $open: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  height: ${p => p.$open ? '75vh' : '0px'};
  background: #0d1526;
  border-top: ${p => p.$open ? '1px solid rgba(255,255,255,0.1)' : 'none'};
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: height 0.38s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.6);
`;

const WeatherDrawerHandle = styled.button<{ $open: boolean }>`
  position: absolute;
  bottom: ${p => p.$open ? 'calc(75vh + 12px)' : '16px'};
  left: 50%;
  transform: translateX(-50%);
  z-index: 55;
  background: rgba(13, 21, 38, 0.92);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 30px;
  padding: 8px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #60a5fa;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.45);
  transition: all 0.38s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(30, 41, 59, 0.98);
    color: white;
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateX(-50%) translateY(-2px);
  }

  svg {
    transition: transform 0.3s;
  }
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
  display: flex;
  flex-direction: column;
  opacity: 1;
  transition: opacity 0.2s;
`;

const WeatherPanelScroll = styled.div`
  padding: 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
`;

// ── Weather Panel Styled Components (SkyCard Design) ────────────────────────────────────────

const WPHeader = styled.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .left h4 { color: white; font-size: 0.78rem; font-weight: 800; margin: 0 0 2px; }
  .left .time { color: #3b82f6; font-size: 1.1rem; font-weight: 900; line-height: 1; }
  .left .loc { color: #475569; font-size: 0.62rem; font-weight: 600; margin-top: 2px; display: flex; align-items: center; gap: 4px; }
`;

const WPCurrentCard = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 120px; height: 120px;
    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
`;

const WPTempRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const WPTemp = styled.div`
  font-size: 3.2rem;
  font-weight: 900;
  color: white;
  line-height: 1;
  letter-spacing: -3px;

  sup { font-size: 1.2rem; letter-spacing: 0; font-weight: 600; color: #60a5fa; vertical-align: super; }
`;

const WPEmojiBox = styled.div`
  font-size: 3rem;
  line-height: 1;
  animation: ${float} 4s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
`;

const WPCondRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  .cond { color: #e2e8f0; font-size: 0.88rem; font-weight: 700; }
  .feels { color: #475569; font-size: 0.72rem; font-weight: 600; }
`;

const WPSummary = styled.div`
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 500;
  line-height: 1.5;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.05);
`;

const WPAdvisoryPanel = styled.div<{ $severity: 'good' | 'warn' | 'danger' }>`
  background: ${p => p.$severity === 'danger' ? 'rgba(239,68,68,0.1)' : p.$severity === 'warn' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'};
  border: 1px solid ${p => p.$severity === 'danger' ? 'rgba(239,68,68,0.2)' : p.$severity === 'warn' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const AdvisoryHeader = styled.div<{ $severity: 'good' | 'warn' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${p => p.$severity === 'danger' ? '#ef4444' : p.$severity === 'warn' ? '#fbbf24' : '#34d399'};
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const AdvisoryDetail = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  .icon { color: #94a3b8; margin-top: 2px; }
  .text {
    flex: 1;
    .title { color: white; font-size: 0.85rem; font-weight: 800; margin-bottom: 3px; }
    .desc { color: #94a3b8; font-size: 0.75rem; line-height: 1.4; }
  }
`;

const WPStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
`;

const WPStatCard = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 10px 10px 8px;

  .label { color: #475569; font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
  .label svg { opacity: 0.7; }
  .val { color: white; font-size: 0.88rem; font-weight: 900; line-height: 1; }
  .unit { color: #475569; font-size: 0.58rem; font-weight: 600; margin-top: 1px; }
`;

const WPSunCard = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 8px;

  h5 { color: #475569; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px; }
`;

const WPSunArc = styled.div`
  position: relative;
  height: 52px;
  margin-bottom: 8px;

  svg { width: 100%; height: 100%; }
`;

const WPSunTimes = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .sun-item {
    display: flex;
    align-items: center;
    gap: 6px;

    .icon { font-size: 1.2rem; }
    .info .lbl { color: #475569; font-size: 0.58rem; font-weight: 700; text-transform: uppercase; }
    .info .t { color: #fbbf24; font-size: 0.8rem; font-weight: 900; }
  }
`;

// Forecast tabs (Today / Tomorrow / 10 Days)
// ─── Weather Dashboard Modern Card Styles ──────────────────────────────────
const ModernWeatherContainer = styled.div`
  display: flex;
  gap: 24px;
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const ModernWeatherMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ModernWeatherSide = styled.div`
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

// Hero Banner styled like the Mecca card
const ModernHeroCard = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);

  &::before {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 45%;
    background: radial-gradient(circle at 70% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .loc-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    color: #60a5fa;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 4px;
  }

  .loc-city {
    color: white;
    font-size: 1.6rem;
    font-weight: 900;
    margin: 0 0 2px;
  }

  .loc-sub {
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .temp-display {
    display: flex;
    align-items: baseline;
    gap: 8px;

    .num {
      font-size: 3.6rem;
      font-weight: 900;
      color: white;
      line-height: 1;
      letter-spacing: -2px;
    }

    .cond {
      color: #38bdf8;
      font-size: 1rem;
      font-weight: 700;
      text-transform: capitalize;
    }
  }

  .hero-graphic {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;

    .icon-wrapper {
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
      animation: ${float} 4s ease-in-out infinite;
    }

    .feels-pill {
      margin-top: 8px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 3px 10px;
      color: #94a3b8;
      font-size: 0.68rem;
      font-weight: 700;
    }
  }
`;

// 7-day grid cards
const ModernWeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
`;

const ModernDayCard = styled.div<{ $isToday?: boolean }>`
  background: ${p => p.$isToday ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${p => p.$isToday ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)'};
  border-radius: 16px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-2px);
  }

  .day-name {
    color: ${p => p.$isToday ? '#60a5fa' : '#e2e8f0'};
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .day-date {
    color: #64748b;
    font-size: 0.62rem;
    font-weight: 600;
    margin-top: -4px;
  }

  .day-icon {
    font-size: 1.8rem;
    margin: 4px 0;
  }

  .day-temp {
    color: white;
    font-size: 1rem;
    font-weight: 800;
    span {
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 4px;
    }
  }

  .day-meta {
    display: flex;
    gap: 6px;
    color: #94a3b8;
    font-size: 0.62rem;
    font-weight: 700;
  }
`;

// Highlights Section Grid
const ModernHighlightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
`;

const ModernHighlightCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .hl-title {
    color: #64748b;
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
  }

  .hl-val {
    color: white;
    font-size: 1.5rem;
    font-weight: 900;
    line-height: 1;
    margin-bottom: 4px;
  }

  .hl-sub {
    color: #94a3b8;
    font-size: 0.72rem;
    font-weight: 600;
  }
`;

// Calendar card on the right side
const ModernCalendarCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 18px;

  .cal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    font-size: 0.85rem;
    font-weight: 800;
    margin-bottom: 14px;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    text-align: center;
  }

  .cal-day-label {
    color: #475569;
    font-size: 0.62rem;
    font-weight: 800;
    padding-bottom: 6px;
  }

  .cal-cell {
    color: #94a3b8;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 6px 0;
    border-radius: 8px;

    &.today {
      background: #3b82f6;
      color: white;
      font-weight: 900;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
    }
  }
`;

const SectionTitle = styled.div`
  color: white;
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .badge-tag {
    font-size: 0.65rem;
    font-weight: 700;
    color: #60a5fa;
    background: rgba(59, 130, 246, 0.15);
    padding: 2px 8px;
    border-radius: 12px;
  }
`;

// Destinations footer
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
interface DayForecast {
  day: string;
  date: string;
  code: number;
  high: number;
  low: number;
  windSpeed: number;
  humidity: number;
  precipProb: number;
}
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
  airQuality: { aqi: number; status: string };
  forecast: DayForecast[]; // 7 days
  isDay?: number;
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

function useWeather(overrideWeather?: string | null): WeatherData | null {
  const [data, setData] = useState<WeatherData | null>(null);

  // Debug query override (e.g. ?weather=thunderstorm or ?weather=rain or ?weather=fog)
  const queryParams = new URLSearchParams(window.location.search);
  const debugWeather = queryParams.get('weather');

  const fetchWeather = () => {
    const lat = 12.7533, lng = 124.1362;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,surface_pressure,visibility,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max` +
      `&wind_speed_unit=kmh&timezone=Asia%2FManila&forecast_days=7`
    )
      .then(r => r.json())
      .then(d => {
        const c = d.current || {};
        const daily = d.daily || {};
        let code = c.weather_code ?? 2;
        let isDay = c.is_day !== undefined ? c.is_day : 1;

        const activeOverride = overrideWeather !== undefined ? overrideWeather : debugWeather;
        if (activeOverride) {
          if (activeOverride === 'thunderstorm') code = 95;
          else if (activeOverride === 'rain') code = 65;
          else if (activeOverride === 'drizzle') code = 53;
          else if (activeOverride === 'fog') code = 45;
          else if (activeOverride === 'clear') code = 0;
          else if (activeOverride === 'night') { code = 0; isDay = 0; }
        }

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const forecastList: DayForecast[] = ((daily.time as string[]) || []).map((dateStr: string, i: number) => {
          const dateObj = new Date(dateStr);
          return {
            day: days[dateObj.getDay()],
            date: dateObj.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
            code: daily.weather_code?.[i] ?? 2,
            high: Math.round(daily.temperature_2m_max?.[i] ?? 30),
            low: Math.round(daily.temperature_2m_min?.[i] ?? 24),
            windSpeed: Math.round(daily.wind_speed_10m_max?.[i] ?? 14),
            humidity: Math.round(c.relative_humidity_2m ?? 80),
            precipProb: Math.round(daily.precipitation_probability_max?.[i] ?? 40),
          };
        });

        // Air quality proxy based on humidity, visibility, pressure
        const aqiVal = Math.round(35 + (100 - Math.min(c.visibility ? c.visibility / 100 : 100, 100)) * 0.4);
        const aqiStatus = aqiVal <= 50 ? 'Good' : aqiVal <= 100 ? 'Moderate' : 'Unhealthy';

        setData({
          temp: Math.round(c.temperature_2m ?? 28),
          feelsLike: Math.round(c.apparent_temperature ?? 31),
          desc: getDesc(code),
          humidity: c.relative_humidity_2m ?? 78,
          wind: Math.round(c.wind_speed_10m ?? 14),
          windGusts: Math.round(c.wind_gusts_10m ?? 20),
          windDir: c.wind_direction_10m ?? 65,
          visibility: Math.round((c.visibility ?? 10000) / 1000),
          pressure: Math.round(c.surface_pressure ?? 1012),
          code,
          isDay,
          uvIndex: Math.round(daily.uv_index_max?.[0] ?? (code <= 1 ? 8 : 4)),
          sunrise: formatTime(daily.sunrise?.[0] ?? ''),
          sunset: formatTime(daily.sunset?.[0] ?? ''),
          airQuality: { aqi: aqiVal, status: aqiStatus },
          forecast: forecastList,
        });
      })
      .catch(() => {
        let code = 2;
        let isDay = 1;
        const activeOverride = overrideWeather !== undefined ? overrideWeather : debugWeather;
        if (activeOverride) {
          if (activeOverride === 'thunderstorm') code = 95;
          else if (activeOverride === 'rain') code = 65;
          else if (activeOverride === 'drizzle') code = 53;
          else if (activeOverride === 'fog') code = 45;
          else if (activeOverride === 'clear') code = 0;
          else if (activeOverride === 'night') { code = 0; isDay = 0; }
        }

        setData({
          temp: 28, feelsLike: 31, desc: getDesc(code), humidity: 82,
          wind: 15, windGusts: 24, windDir: 70, visibility: 10, pressure: 1012, code, uvIndex: 6,
          isDay,
          sunrise: '5:42 AM', sunset: '5:35 PM',
          airQuality: { aqi: 42, status: 'Good' },
          forecast: [
            { day: 'Today', date: 'Nov 13', code, high: 30, low: 24, windSpeed: 15, humidity: 82, precipProb: 35 },
            { day: 'Sat',   date: 'Nov 14', code: 61, high: 28, low: 23, windSpeed: 18, humidity: 88, precipProb: 75 },
            { day: 'Sun',   date: 'Nov 15', code: 3,  high: 29, low: 24, windSpeed: 14, humidity: 80, precipProb: 40 },
            { day: 'Mon',   date: 'Nov 16', code: 1,  high: 31, low: 24, windSpeed: 12, humidity: 75, precipProb: 20 },
            { day: 'Tue',   date: 'Nov 17', code: 2,  high: 30, low: 24, windSpeed: 14, humidity: 78, precipProb: 30 },
            { day: 'Wed',   date: 'Nov 18', code: 80, high: 29, low: 23, windSpeed: 16, humidity: 84, precipProb: 60 },
            { day: 'Thu',   date: 'Nov 19', code: 95, high: 27, low: 23, windSpeed: 22, humidity: 90, precipProb: 85 },
          ],
        });
      });
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // 10 minutes refresh
    return () => clearInterval(interval);
  }, [overrideWeather]);

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
  const [weatherOverride, setWeatherOverride] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('weather');
  });

  const weather = useWeather(weatherOverride);
  const advisory = weather ? getTravelAdvisory(weather.code) : null;
  const initialRef = React.useRef(false);

  // ─── Live Clock ──────────────────────────────────────────────────────────────
  const [clockTime, setClockTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const clockStr = clockTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = clockTime.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });


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

      {/* ── CENTER AND BOTTOM (Map + Weather) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        {/* ── MAP AREA ── */}
        <MapCenter>
          {weather && (
            <WeatherCanvas
              weatherCode={weather.code}
              windSpeed={weather.wind}
              windDirection={weather.windDir}
              isDay={weather.isDay}
              currentOverride={weatherOverride}
              onSelectOverride={setWeatherOverride}
            />
          )}

        {/* Live Clock — top-left of map */}
        <ClockWidget>
          <div className="clock-time">{clockStr}</div>
          <div className="clock-date">{dateStr}</div>
          <div className="clock-loc"><MapPin size={8} /> Bulusan, Sorsogon</div>
        </ClockWidget>

        {activeTourId ? (
          <LiveTourTracker bookingId={activeTourId} onExit={() => {}} onFocusItem={id => { const i = filteredItems.find(x => x.id.toString() === id); if (i) setFocusedLocation(i); }} />
        ) : (
          <BulusanMap items={filteredItems} searchQuery={searchQuery} selectedCategories={selectedCategories} focusLat={focusedLocation?.coordinates?.lat} focusLng={focusedLocation?.coordinates?.lng} focusName={focusedLocation?.name} autoRoute={autoRoute} />
        )}

        {/* Compass Rose — bottom-left */}
        <CompassWidget>
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: 'absolute' }}>
            {/* Outer ring */}
            <circle cx="28" cy="28" r="27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {/* Cardinal tick marks */}
            {[0,90,180,270].map(deg => {
              const rad = (deg - 90) * Math.PI / 180;
              return <line key={deg} x1={28 + 22 * Math.cos(rad)} y1={28 + 22 * Math.sin(rad)} x2={28 + 26 * Math.cos(rad)} y2={28 + 26 * Math.sin(rad)} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />;
            })}
            {/* North needle (red) */}
            <polygon points="28,6 31,28 28,24 25,28" fill="#ef4444" />
            {/* South needle (slate) */}
            <polygon points="28,50 31,28 28,32 25,28" fill="#334155" />
            {/* Center dot */}
            <circle cx="28" cy="28" r="3" fill="rgba(255,255,255,0.6)" />
          </svg>
          {/* Cardinal labels */}
          <span style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', fontSize: '0.5rem', fontWeight: 900, color: '#ef4444', letterSpacing: 0 }}>N</span>
          <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', fontSize: '0.5rem', fontWeight: 700, color: '#475569' }}>S</span>
          <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: '0.5rem', fontWeight: 700, color: '#475569' }}>W</span>
          <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: '0.5rem', fontWeight: 700, color: '#475569' }}>E</span>
        </CompassWidget>

        {/* Tours Package Panel — bottom-right */}
        <ToursMapPanel>
          <ToursPanelHeader>
            <div className="title"><Ticket size={10} /> Tours & Packages</div>
            <div className="badge">Soon</div>
          </ToursPanelHeader>
          <ToursMiniList>
            {UPCOMING_TOURS.slice(0, 3).map(tour => (
              <TourMiniCard key={tour.name}>
                <div className="bg" style={{ backgroundImage: `url(${tour.img})` }} />
                <div className="overlay" />
                <div className="info">
                  <div className="name">{tour.name}</div>
                  <div className="dur">{tour.duration}</div>
                </div>
              </TourMiniCard>
            ))}
          </ToursMiniList>
          <ToursViewAllBtn onClick={() => setShowToursModal(true)}>
            <ArrowRight size={11} /> View All Tours
          </ToursViewAllBtn>
        </ToursMapPanel>

        {/* ── Four Individual Weather Boxes Overlay ── */}
        {weather && (
          <CompactWeatherOverlay $drawerOpen={weatherExpanded}>
            <CompactStatBox>
              <div className="icon"><Thermometer size={18} /></div>
              <div>
                <div className="val">{weather.temp}°C</div>
                <div className="lbl">Temperature</div>
              </div>
            </CompactStatBox>
            <CompactStatBox>
              <div className="icon"><Wind size={18} /></div>
              <div>
                <div className="val">{weather.wind} km/h</div>
                <div className="lbl">Wind</div>
              </div>
            </CompactStatBox>
            <CompactStatBox>
              <div className="icon"><Droplets size={18} /></div>
              <div>
                <div className="val">{weather.humidity}%</div>
                <div className="lbl">Humidity</div>
              </div>
            </CompactStatBox>
            <CompactStatBox>
              <div className="icon"><Sun size={18} /></div>
              <div>
                <div className="val">{weather.uvIndex}</div>
                <div className="lbl">UV Index</div>
              </div>
            </CompactStatBox>
          </CompactWeatherOverlay>
        )}

        {/* ── Toggle Button for Weather & Advisory Info Drawer ── */}
        <WeatherDrawerHandle
          $open={weatherExpanded}
          onClick={() => setWeatherExpanded(!weatherExpanded)}
        >
          {weatherExpanded ? (
            <>
              <ChevronDown size={15} /> Close Weather & Details
            </>
          ) : (
            <>
              <ChevronUp size={15} /> Weather & Travel Advisory
            </>
          )}
        </WeatherDrawerHandle>
      </MapCenter>

      {/* ── BOTTOM: Full Weather Dashboard (SkyCard Design Drawer) ── */}
      <BottomPanelWrapper $open={weatherExpanded}>
        <RightPanelContent>

          {/* Header: Current Weather + Time + Location + expand toggle */}
          <WPHeader>
            <div className="left">
              <h4>Current Weather</h4>
              <div className="time">{new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
              <div className="loc"><MapPin size={9} /> Bulusan, Sorsogon</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {weather && <WeatherEmoji code={weather.code} size="2rem" />}
              <ExpandToggle onClick={() => setWeatherExpanded(false)} title="Close Panel">
                <ChevronDown size={16} />
              </ExpandToggle>
            </div>
          </WPHeader>

          <WeatherPanelScroll>
            {weather ? (
              <ModernWeatherContainer>
                {/* ── LEFT MAIN: Hero, 7-Day Week, Today's Highlights ── */}
                <ModernWeatherMain>
                  {/* Hero banner with Bulusan landmark silhouette vibe */}
                  <ModernHeroCard>
                    <div>
                      <div className="loc-badge">
                        <MapPin size={12} /> Bulusan, Sorsogon
                      </div>
                      <div className="loc-city">Bulusan Volcano & Town</div>
                      <div className="loc-sub">Philippines &bull; Asia/Manila Timezone</div>
                      <div className="temp-display">
                        <div className="num">{weather.temp}°</div>
                        <div className="cond">{weather.desc}</div>
                      </div>
                    </div>
                    <div className="hero-graphic">
                      <div className="icon-wrapper">
                        <WeatherEmoji code={weather.code} size="4.2rem" />
                      </div>
                      <div className="feels-pill">
                        Feels like {weather.feelsLike}°C
                      </div>
                    </div>
                  </ModernHeroCard>

                  {/* ── 7-Day Forecast Row ── */}
                  <div>
                    <SectionTitle>
                      <span>7-Day Weather Forecast</span>
                      <span className="badge-tag">Daily Outlook</span>
                    </SectionTitle>
                    <ModernWeekGrid>
                      {weather.forecast.map((f, i) => {
                        const isToday = i === 0 || f.day === 'Today';
                        return (
                          <ModernDayCard key={i} $isToday={isToday}>
                            <div className="day-name">{isToday ? 'Today' : f.day}</div>
                            <div className="day-date">{f.date}</div>
                            <div className="day-icon">
                              <WeatherEmoji code={f.code} size="1.8rem" />
                            </div>
                            <div className="day-temp">
                              {f.high}°<span>{f.low}°</span>
                            </div>
                            <div className="day-meta">
                              <span>💨 {f.windSpeed}k</span>
                              <span>💧 {f.precipProb}%</span>
                            </div>
                          </ModernDayCard>
                        );
                      })}
                    </ModernWeekGrid>
                  </div>

                  {/* ── Today's Highlights ── */}
                  <div>
                    <SectionTitle>
                      <span>Today's Highlights</span>
                      <span className="badge-tag">Live Sensors</span>
                    </SectionTitle>
                    <ModernHighlightsGrid>
                      <ModernHighlightCard>
                        <div className="hl-title">
                          <Sunrise size={14} color="#f59e0b" /> Sunrise & Sunset
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div className="hl-val" style={{ fontSize: '1.15rem' }}>{weather.sunrise}</div>
                            <div className="hl-sub">🌅 Morning</div>
                          </div>
                          <div>
                            <div className="hl-val" style={{ fontSize: '1.15rem' }}>{weather.sunset}</div>
                            <div className="hl-sub">🌇 Evening</div>
                          </div>
                        </div>
                      </ModernHighlightCard>

                      <ModernHighlightCard>
                        <div className="hl-title">
                          <Wind size={14} color="#38bdf8" /> Wind Status
                        </div>
                        <div className="hl-val">{weather.wind} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>km/h</span></div>
                        <div className="hl-sub">{windDirLabel(weather.windDir)} &bull; Gusts up to {weather.windGusts} km/h</div>
                      </ModernHighlightCard>

                      <ModernHighlightCard>
                        <div className="hl-title">
                          <Sun size={14} color="#eab308" /> UV Index
                        </div>
                        <div className="hl-val" style={{ color: weather.uvIndex <= 2 ? '#10b981' : weather.uvIndex <= 5 ? '#f59e0b' : '#ef4444' }}>
                          {weather.uvIndex} <span style={{ fontSize: '0.75rem' }}>/ 12</span>
                        </div>
                        <div className="hl-sub">{weather.uvIndex <= 2 ? 'Low Risk' : weather.uvIndex <= 5 ? 'Moderate' : 'High UV Protection'}</div>
                      </ModernHighlightCard>

                      <ModernHighlightCard>
                        <div className="hl-title">
                          <Droplets size={14} color="#60a5fa" /> Humidity
                        </div>
                        <div className="hl-val">{weather.humidity}%</div>
                        <div className="hl-sub">{weather.humidity > 80 ? 'High tropical moisture' : 'Comfortable air'}</div>
                      </ModernHighlightCard>

                      <ModernHighlightCard>
                        <div className="hl-title">
                          <Eye size={14} color="#a855f7" /> Visibility
                        </div>
                        <div className="hl-val">{weather.visibility} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>km</span></div>
                        <div className="hl-sub">{weather.visibility >= 10 ? 'Clear distance view' : 'Haze or mist in hills'}</div>
                      </ModernHighlightCard>

                      <ModernHighlightCard>
                        <div className="hl-title">
                          <Gauge size={14} color="#10b981" /> Air Quality & Baro
                        </div>
                        <div className="hl-val">{weather.airQuality.aqi} <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{weather.airQuality.status}</span></div>
                        <div className="hl-sub">{weather.pressure} hPa (Atmospheric)</div>
                      </ModernHighlightCard>
                    </ModernHighlightsGrid>
                  </div>
                </ModernWeatherMain>

                {/* ── RIGHT SIDE: Calendar & Tourism Advisories ── */}
                <ModernWeatherSide>
                  {/* Calendar Widget */}
                  <ModernCalendarCard>
                    <div className="cal-header">
                      <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      <CalendarDays size={16} color="#60a5fa" />
                    </div>
                    <div className="cal-grid">
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                        <div key={d} className="cal-day-label">{d}</div>
                      ))}
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(dayNum => {
                        const isCurDay = dayNum === new Date().getDate();
                        return (
                          <div key={dayNum} className={`cal-cell ${isCurDay ? 'today' : ''}`}>
                            {dayNum}
                          </div>
                        );
                      })}
                    </div>
                  </ModernCalendarCard>

                  {/* Travel Advisory Panel */}
                  <WPAdvisoryPanel $severity={weather.code > 67 || weather.visibility < 3 || weather.wind > 40 ? 'danger' : weather.code > 3 || weather.temp > 33 || weather.visibility < 10 ? 'warn' : 'good'}>
                    <AdvisoryHeader $severity={weather.code > 67 || weather.visibility < 3 || weather.wind > 40 ? 'danger' : weather.code > 3 || weather.temp > 33 || weather.visibility < 10 ? 'warn' : 'good'}>
                      <ShieldAlert size={16} /> Travel Safety Alert
                    </AdvisoryHeader>
                    <AdvisoryDetail>
                      <div className="text">
                        <div className="title">Bulusan Area Advisory</div>
                        <div className="desc">
                          {weather.code <= 3
                            ? 'Optimal conditions for exploring Bulusan Lake, waterfalls, and outdoor hot springs.'
                            : weather.code <= 67
                            ? 'Rain showers present. Mountain trails may be slippery; exercise extra care at riverbanks.'
                            : 'Severe weather advisory. Avoid high volcanic slopes and coastal marine activities.'}
                        </div>
                      </div>
                    </AdvisoryDetail>
                  </WPAdvisoryPanel>
                </ModernWeatherSide>
              </ModernWeatherContainer>
            ) : (
              <Skel style={{ height: 350, borderRadius: 20 }} />
            )}
          </WeatherPanelScroll>

          <WeatherFooter>
            <FooterStat>
              <span className="val">{attractions.length}</span>
              <span className="lbl">Spots</span>
            </FooterStat>
            <FooterStat>
              <span className="val">{enterprises.length}</span>
              <span className="lbl">Biz</span>
            </FooterStat>
            <FooterStat>
              <span className="val">{heritage.length}</span>
              <span className="lbl">Heritage</span>
            </FooterStat>
          </WeatherFooter>

        </RightPanelContent>
      </BottomPanelWrapper>
      </div>

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
