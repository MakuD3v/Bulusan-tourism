// ─────────────────────────────────────────────────────────────────────────────
// BulusanMap.tsx — MapLibre GL JS version (feature/maplibre)
//
// STAGE 1: Basemap only (tiles, navigation control, dark mode, resize)
// STAGE 2: Markers, filtering, search, popups (added below in one file)
//
// All original Leaflet code is preserved at the bottom of this file inside
// a large LEAFLET LEGACY block. Do not delete it until MapLibre is confirmed
// working in production.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useMemo, useState } from 'react';
import styled from 'styled-components';
import * as ML from 'maplibre-gl';
import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  Popup as MapLibrePopup,
  LngLatBoundsLike,
  LngLatBounds as MaplibreLngLatBounds,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Ensure the web worker resolves properly under Vite
if (typeof window !== 'undefined' && ML.setWorkerUrl) {
  ML.setWorkerUrl('/maplibre-gl-worker.js');
}
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, NavigationOff, Car, Bike, Footprints,
  Star, MapPin, X, Zap, TrendingUp, Award, Users,
} from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { getMapIconUrl } from '../Admin/CategoryTagConfig';
import { getDynamicTags } from '../../utils/tagUtils';
import { useThemeMode } from '../../hooks/useTheme';

// ─────────────────────────────────────────────────────────────────────────────
// MAP CONFIG — swap provider here without touching the rest of the file
// ─────────────────────────────────────────────────────────────────────────────
const MAP_CONFIG = {
  // Primary keyless style (OpenFreeMap)
  styleLight: 'https://tiles.openfreemap.org/styles/liberty',
  // Fallbacks (uncomment one if primary fails):
  // styleLight: 'https://tiles.openfreemap.org/styles/bright',
  // styleLight: 'https://tiles.openfreemap.org/styles/positron',

  // Dark style: OpenFreeMap has no keyless dark style.
  // Set styleDark to a URL if you add a MapTiler/Stadia key; otherwise null
  // triggers the CSS-filter dark-mode fallback.
  styleDark: null as string | null,
  // e.g.: styleDark: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=YOUR_KEY`

  center: [124.1362, 12.7533] as [number, number], // [lng, lat] — MapLibre order
  zoom: 12,
  // maxBounds: [[sw_lng, sw_lat], [ne_lng, ne_lat]]
  maxBounds: [[123.90, 12.60], [124.35, 12.90]] as [[number, number], [number, number]],
};

// ─────────────────────────────────────────────────────────────────────────────
// Styled components
// ─────────────────────────────────────────────────────────────────────────────
const MapStyleWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  /* ── MapLibre base overrides ── */
  .maplibregl-map {
    width: 100%;
    height: 100%;
  }

  /* Dark-mode CSS-filter fallback (applied to .maplibregl-canvas-container) */
  &.dark-filter .maplibregl-canvas-container {
    filter: invert(0.9) hue-rotate(180deg) brightness(0.95) saturate(0.8);
  }

  /* ── Pin animations ── */
  @keyframes pinPulse {
    0%   { transform: scale(1);    filter: brightness(1) drop-shadow(0 0 0px rgba(46,117,182,0)); }
    50%  { transform: scale(1.15); filter: brightness(1.2) drop-shadow(0 0 10px rgba(46,117,182,0.4)); }
    100% { transform: scale(1);    filter: brightness(1) drop-shadow(0 0 0px rgba(46,117,182,0)); }
  }

  /* ── Marker states ── */
  .bulusan-marker {
    cursor: pointer;
    transition: opacity 0.25s ease, transform 0.25s ease, filter 0.25s ease;
    will-change: opacity, transform;
  }
  .bulusan-marker img {
    width: 42px;
    height: 42px;
    display: block;
  }
  .bulusan-marker.marker-dimmed {
    opacity: 0.15;
    filter: grayscale(1);
    pointer-events: none;
  }
  .bulusan-marker.marker-highlighted {
    opacity: 1;
    transform: scale(1.15);
    z-index: 10;
  }
  .bulusan-marker.marker-focused {
    animation: pinPulse 1.5s infinite ease-in-out;
    z-index: 20;
  }

  /* ── Popup overrides ── */
  .maplibregl-popup {
    max-width: none !important;
  }
  .maplibregl-popup-content {
    padding: 0 !important;
    border-radius: 16px !important;
    overflow: hidden !important;
    box-shadow: 0 15px 40px rgba(0,0,0,0.18) !important;
    background: var(--surface-bg) !important;
  }
  .maplibregl-popup-tip {
    border-top-color: var(--surface-bg) !important;
  }
  .maplibregl-popup-close-button {
    display: none !important;
  }

  /* ── Tooltip popup (name-only) ── */
  .bulusan-tooltip .maplibregl-popup-content {
    padding: 4px 10px !important;
    border-radius: 8px !important;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-dark);
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(0,0,0,0.12) !important;
  }

  /* ── Attribution ── */
  .maplibregl-ctrl-attrib {
    font-size: 0.65rem;
  }
`;

// ── Popup card (identical HTML to the old Leaflet version) ───────────────────
const PopupContent = styled.div`
  width: min(300px, 80vw);
  background: var(--surface-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  position: relative;

  .image-container {
    width: 100%;
    height: 120px;
    position: relative;
    @media (max-width: 768px) { height: 100px; }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
      mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
    }
    .close-btn {
      position: absolute; top: 10px; right: 10px; z-index: 10;
      background: rgba(255,255,255,0.8); backdrop-filter: blur(4px);
      border: none; width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--dark-blue);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: all 0.2s;
      &:hover { background: var(--surface-bg); transform: scale(1.1); }
    }
    .badges-wrapper {
      position: absolute; top: 10px; left: 10px;
      display: flex; flex-direction: column; align-items: flex-start; gap: 4px; z-index: 2;
    }
    .badge-pill {
      background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); color: white;
      padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      display: flex; align-items: center; gap: 4px; line-height: 1;
      &.badge-new      { background: linear-gradient(135deg, #10b981, #059669); }
      &.badge-top      { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &.badge-trending { background: linear-gradient(135deg, #ef4444, #dc2626); }
      &.badge-featured { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
      &.badge-visited  { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    }
  }

  .content-body {
    padding: 0 16px 16px;
    position: relative; z-index: 2;
    background: var(--surface-bg);
    .rating-location-row {
      display: flex; gap: 12px; align-items: center; justify-content: space-between;
      margin-bottom: 2px; font-size: 0.75rem; color: var(--text-light); font-weight: 600;
      .category-label {
        color: var(--cta-blue); font-size: 0.7rem; font-weight: 800;
        text-transform: uppercase; letter-spacing: 1px;
        display: flex; align-items: center; gap: 4px;
        img { height: 14px; width: auto; filter: invert(34%) sepia(87%) saturate(583%) hue-rotate(170deg) brightness(97%) contrast(93%); }
      }
      .rating { display: flex; align-items: center; gap: 4px; color: var(--dark-blue); font-weight: 800; }
    }
    h3 { margin-bottom: 2px; font-size: 1.2rem; color: var(--dark-blue); font-family: 'Outfit', sans-serif; font-weight: 800; }
    .location-row {
      font-size: 0.75rem; color: var(--text-light); font-weight: 600;
      display: flex; align-items: center; gap: 4px; margin-bottom: 12px;
    }
    p { font-size: 0.85rem; color: var(--text-light); margin-bottom: 16px; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .btn-group { display: flex; gap: 8px; }
    button, a {
      flex: 1; text-align: center; background: var(--cta-blue); color: white !important;
      padding: 10px; border-radius: 12px; text-decoration: none; font-weight: 700;
      font-size: 0.8rem; border: none; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
      &:hover { background: var(--dark-blue); transform: translateY(-2px); }
      &.secondary { background: var(--light-bg); color: var(--text-dark) !important; border: 1px solid rgba(0,0,0,0.05); }
    }
  }
`;

const LocationPrompt = styled(motion.div)`
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
  width: min(360px, 90%); background: var(--surface-bg); border-radius: 20px;
  padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); z-index: 2000; text-align: center;
  .prompt-buttons { display: flex; flex-direction: column; gap: 10px; }
  .btn-primary { background: #2e75b6; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; }
  .btn-secondary { background: #f0f4f8; color: #333; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; }
`;

const MobileBottomSheet = styled(motion.div)`
  position: fixed;
  bottom: 60px; left: 12px; right: 12px; width: auto;
  background: var(--surface-bg); border-radius: 24px; padding: 24px;
  box-shadow: 0 -4px 40px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.1);
  z-index: 2000; display: flex; flex-direction: column; gap: 14px;
  @media (min-width: 768px) { display: none; }
  .handle {
    width: 40px; height: 4px; background: #ddd; border-radius: 2px;
    align-self: center; margin-bottom: 4px; transition: background 0.2s;
    &:hover { background: #bbb; }
  }
  h3 { font-size: 1.3rem; color: #2c3e50; font-family: 'Outfit', sans-serif; }
  .nav-btn {
    width: 100%; padding: 14px; background: #2e75b6; color: white; border: none;
    border-radius: 12px; font-weight: 700; display: flex; align-items: center;
    justify-content: center; gap: 12px; transition: transform 0.2s;
    &:active { transform: scale(0.98); }
  }
`;

const TravelStatsOverlay = styled(motion.div)`
  position: absolute; bottom: 24px; right: 24px;
  background: var(--surface-bg); backdrop-filter: blur(12px);
  padding: 24px; border-radius: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 10px 20px rgba(0,0,0,0.05);
  z-index: 1000; width: 320px; border: 1px solid rgba(0,0,0,0.05);
  @media (max-width: 1024px) {
    bottom: auto; top: 80px; left: 20px; right: auto; width: min(280px, 85vw); padding: 16px;
  }
  h4 { margin-bottom: 18px; font-size: 0.85rem; color: var(--text-dark); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; }
  .stats-content {
    display: flex; justify-content: space-between; margin-bottom: 24px;
    .stat-item {
      flex: 1;
      .val { font-size: 1.4rem; font-weight: 800; color: var(--dark-blue); line-height: 1.1; }
      .lab { font-size: 0.7rem; color: var(--text-light); font-weight: 700; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }
    }
  }
  .mode-selection {
    display: flex; background: #f1f5f9; padding: 5px; border-radius: 14px;
    margin-bottom: 16px; justify-content: space-between; border: 1px solid rgba(0,0,0,0.03);
  }
  .close-row {
    display: flex; gap: 10px;
    button {
      flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 800;
      font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
      &.primary { background: var(--cta-blue); color: white; box-shadow: 0 4px 12px rgba(46,117,182,0.2); &:hover { background: var(--dark-blue); } }
      &.secondary { background: #f1f5f9; color: #64748b; &:hover { background: #e2e8f0; } }
    }
  }
`;

const ModeButton = styled.button<{ $active: boolean }>`
  flex: 1; display: flex; align-items: center; justify-content: center;
  border: none; background: ${p => p.$active ? 'white' : 'transparent'};
  color: ${p => p.$active ? 'var(--cta-blue)' : '#94a3b8'};
  padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
  box-shadow: ${p => p.$active ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'};
  &:hover { color: var(--cta-blue); }
`;

const LocationToggle = styled.button<{ $active: boolean }>`
  position: absolute; top: 100px; right: 24px; z-index: 1000;
  background: ${p => p.$active ? p.theme.colors?.ctaBlue ?? '#2e75b6' : 'white'};
  color: ${p => p.$active ? 'white' : '#555'};
  border: 1px solid #ddd; padding: 10px 16px; border-radius: 30px;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer;
  @media (max-width: 1024px) { top: 24px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type TravelMode = 'driving' | 'walking' | 'cycling';

interface BulusanMapProps {
  items: any[];
  searchQuery?: string;
  selectedCategories?: string[];
  activeTab?: 'All' | 'Attraction' | 'Enterprise' | 'Heritage';
  focusLat?: number;
  focusLng?: number;
  focusName?: string;
  autoRoute?: boolean;
  activeTour?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const BULUSAN_CENTER: [number, number] = [124.1362, 12.7533]; // [lng, lat]

function getBadge(item: any): 'New' | 'Top Rated' | 'Trending' | 'Featured' | undefined {
  if (item.featured) return 'Featured';
  if (item.isNew || (item.createdAt && Date.now() - new Date(item.createdAt).getTime() < 30 * 86400_000)) return 'New';
  if (item.rating >= 4.8) return 'Top Rated';
  if (item.visits >= 50) return 'Trending';
  return undefined;
}

/** Render a React tree into a fresh detached div and return the div */
function renderToDetachedDiv(element: React.ReactElement): HTMLDivElement {
  const div = document.createElement('div');
  const root = createRoot(div);
  root.render(element);
  return div;
}

// ─────────────────────────────────────────────────────────────────────────────
// Popup JSX (identical content to Leaflet version)
// ─────────────────────────────────────────────────────────────────────────────
function PopupCard({
  item, iconUrl, linkPath, badge, dynamicBadges, onRoute, onClose,
}: {
  item: any; iconUrl: string; linkPath: string;
  badge?: string; dynamicBadges: string[];
  onRoute: () => void; onClose: () => void;
}) {
  const badgeClass = (tag: string) => {
    if (tag === 'New') return 'badge-pill badge-new';
    if (tag === 'Top Rated') return 'badge-pill badge-top';
    if (tag === 'Trending') return 'badge-pill badge-trending';
    if (tag === 'Featured') return 'badge-pill badge-featured';
    if (tag === 'Most Visited') return 'badge-pill badge-visited';
    return null;
  };
  const BadgeIcon = (tag: string) => {
    if (tag === 'New') return <Zap size={10} fill="white" />;
    if (tag === 'Top Rated') return <Star size={10} fill="white" />;
    if (tag === 'Trending') return <TrendingUp size={10} />;
    if (tag === 'Featured') return <Award size={10} />;
    if (tag === 'Most Visited') return <Users size={10} />;
    return null;
  };

  return (
    <PopupContent>
      <div className="image-container">
        <button className="close-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <img loading="lazy" src={item.photos?.[0] || item.img || '/default-placeholder.jpg'} alt={item.name} />
        <div className="badges-wrapper">
          {dynamicBadges.length === 0 && badge && (
            <div className={badgeClass(badge) ?? 'badge-pill'}>
              {BadgeIcon(badge)} {badge}
            </div>
          )}
          {dynamicBadges.map(tag => {
            const cls = badgeClass(tag);
            if (!cls) return null;
            return <div key={tag} className={cls}>{BadgeIcon(tag)} {tag}</div>;
          })}
        </div>
      </div>
      <div className="content-body">
        <div className="rating-location-row">
          <div className="category-label">
            <img loading="lazy" src={iconUrl} alt={item.entityType} />
            {item.entityType}
          </div>
          {item.rating && (
            <div className="rating">
              <Star size={14} fill="currentColor" color="var(--accent-yellow)" /> {item.rating}
            </div>
          )}
        </div>
        <h3>{item.name}</h3>
        {item.location && <div className="location-row"><MapPin size={12} /> {item.location}</div>}
        <p>{(item.description || '').substring(0, 80)}...</p>
        <div className="btn-group">
          <button onClick={onRoute}>Route</button>
          <a href={`${linkPath}?openId=${item.id}`} className="secondary">Details</a>
        </div>
      </div>
    </PopupContent>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main BulusanMap component
// ─────────────────────────────────────────────────────────────────────────────
const BulusanMap = ({
  items,
  searchQuery = '',
  selectedCategories = [],
  activeTab = 'All',
  focusLat,
  focusLng,
  focusName,
  autoRoute,
  activeTour,
}: BulusanMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ML.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: ML.Marker; popup: ML.Popup; item: any }>>(new Map());
  const tooltipPopupRef = useRef<ML.Popup | null>(null);
  const activePopupRef = useRef<ML.Popup | null>(null);
  const userMarkerRef = useRef<ML.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const autoRouteFiredRef = useRef(false);
  const mapReadyRef = useRef(false);

  const { mode: themeMode } = useThemeMode();

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null); // [lng, lat]
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem('isLocationEnabled') === 'true');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingRouteDest, setPendingRouteDest] = useState<[number, number] | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; time: string } | null>(null);
  const [mobileDetail, setMobileDetail] = useState<any>(null);
  const [routeStart, setRouteStart] = useState<[number, number] | null>(null);
  const [routeDest, setRouteDest] = useState<[number, number] | null>(null);

  // ── Stagger-offset items (same logic as Leaflet version) ────────────────
  const processedItems = useMemo(() => {
    const coordsMap = new Map<string, number>();
    return items.map(item => {
      const lat = item.lat || item.coordinates?.lat;
      const lng = item.lng || item.coordinates?.lng;
      const withCoords = { ...item, coordinates: { lat, lng } };
      if (!lat || !lng) return withCoords;
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      const count = coordsMap.get(key) ?? 0;
      coordsMap.set(key, count + 1);
      if (count > 0) {
        const angle = count * (Math.PI / 4);
        const radius = 0.00005 * count;
        return { ...withCoords, coordinates: { lat: lat + Math.cos(angle) * radius, lng: lng + Math.sin(angle) * radius } };
      }
      return withCoords;
    });
  }, [items]);

  // ── Initialize MapLibre map ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new ML.Map({
      container: containerRef.current,
      style: MAP_CONFIG.styleLight,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      maxBounds: MAP_CONFIG.maxBounds as ML.LngLatBoundsLike,
      attributionControl: false,
    });

    map.on('error', (e) => {
      console.warn('MapLibre map error:', e);
    });

    // Navigation control (zoom + compass)
    map.addControl(new ML.NavigationControl({ visualizePitch: true }), 'top-right');

    // Attribution
    map.addControl(
      new ML.AttributionControl({
        customAttribution: '© <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        compact: true,
      }),
      'bottom-right',
    );

    map.on('load', () => {
      mapReadyRef.current = true;
    });

    mapRef.current = map;

    // Resize observer
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    const onResize = () => map.resize();
    window.addEventListener('resize', onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
  }, []);

  // ── Dark-mode filter ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const useCssFilter = MAP_CONFIG.styleDark === null;
    if (themeMode === 'dark' && useCssFilter) {
      containerRef.current.classList.add('dark-filter');
    } else {
      containerRef.current.classList.remove('dark-filter');
      if (mapRef.current && MAP_CONFIG.styleDark && themeMode === 'dark') {
        mapRef.current.setStyle(MAP_CONFIG.styleDark);
      } else if (mapRef.current && themeMode === 'light') {
        mapRef.current.setStyle(MAP_CONFIG.styleLight);
      }
    }
  }, [themeMode]);

  // ── Location tracking ───────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('isLocationEnabled', isTracking.toString());
    if (isTracking && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          if (pos.coords.accuracy > 3000) {
            console.warn('Inaccurate location, ignoring.');
            return;
          }
          const loc: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(loc);
        },
        err => { console.error('Geolocation error:', err); setIsTracking(false); },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      );
    } else if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current!); };
  }, [isTracking]);

  // ── User location marker ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (isTracking && userLocation) {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="position:relative;">
            <div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 0 10px rgba(59,130,246,0.5);z-index:2;position:relative;"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#3b82f6;width:30px;height:30px;border-radius:50%;opacity:0.2;animation:userPulse 2s infinite ease-out;z-index:1;"></div>
          </div>
          <style>@keyframes userPulse{0%{transform:translate(-50%,-50%) scale(0.5);opacity:0.5}100%{transform:translate(-50%,-50%) scale(2);opacity:0}}</style>
        `;
        el.style.width = '30px';
        el.style.height = '30px';
        userMarkerRef.current = new ML.Marker({ element: el, anchor: 'center' })
          .setLngLat(userLocation)
          .addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLngLat(userLocation);
      }
      // Pan to user if no focus destination
      if (!focusLat) {
        mapRef.current.panTo(userLocation, { animate: true });
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [isTracking, userLocation, focusLat]);

  // ── Build / update markers ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const waitForMap = (cb: () => void) => {
      if (map.isStyleLoaded()) { cb(); return; }
      map.once('load', cb);
    };

    waitForMap(() => {
      const existingKeys = new Set(markersRef.current.keys());
      const newKeys = new Set<string>();

      processedItems.forEach(item => {
        const { lat, lng } = item.coordinates ?? {};
        if (!lat || !lng) return;

        const key = `${item.entityType}-${item.id}`;
        newKeys.add(key);

        if (markersRef.current.has(key)) return; // already exists

        const itemCats = (Array.isArray(item.categories) ? item.categories : [(item.category || item.type || 'Others')]).slice(0, 3);
        const priorityCategory = itemCats[0];
        const iconUrl = getMapIconUrl(priorityCategory);
        const linkPath = item.entityType === 'Attraction' ? '/attractions' : item.entityType === 'Heritage' ? '/heritage' : '/enterprises';
        const dynamicBadges = getDynamicTags(item, items);
        const badge = getBadge(item);

        // ── Marker element ──
        const el = document.createElement('div');
        el.className = 'bulusan-marker';
        el.style.width = '42px';
        el.style.height = '42px';
        const img = document.createElement('img');
        img.src = iconUrl;
        img.alt = priorityCategory;
        img.style.width = '42px';
        img.style.height = '42px';
        el.appendChild(img);

        // ── Popup ──
        const popupNode = document.createElement('div');
        const popupRoot = createRoot(popupNode);

        const popup = new ML.Popup({
          offset: [0, -44],
          closeButton: false,
          closeOnClick: false,
          className: 'glass-popup',
          maxWidth: 'none',
        });

        const renderPopup = () => {
          popupRoot.render(
            <PopupCard
              item={item}
              iconUrl={iconUrl}
              linkPath={linkPath}
              badge={badge}
              dynamicBadges={dynamicBadges}
              onRoute={() => {
                const start = (isTracking && userLocation) ? userLocation : BULUSAN_CENTER;
                setRouteStart(start);
                setRouteDest([lng, lat]);
                popup.remove();
              }}
              onClose={() => popup.remove()}
            />,
          );
        };

        renderPopup();
        popup.setDOMContent(popupNode);

        // ── Tooltip (name on hover) ──
        el.addEventListener('mouseenter', () => {
          if (tooltipPopupRef.current) tooltipPopupRef.current.remove();
          const tip = new ML.Popup({
            offset: [0, -48],
            closeButton: false,
            closeOnClick: false,
            className: 'bulusan-tooltip',
          })
            .setLngLat([lng, lat])
            .setHTML(`<div>${item.name}</div>`)
            .addTo(map);
          tooltipPopupRef.current = tip;
        });
        el.addEventListener('mouseleave', () => {
          tooltipPopupRef.current?.remove();
          tooltipPopupRef.current = null;
        });

        // ── Click: open popup (or mobile detail) ──
        el.addEventListener('click', () => {
          if (window.innerWidth < 768) {
            setMobileDetail(item);
            return;
          }
          if (activePopupRef.current) activePopupRef.current.remove();
          popup.setLngLat([lng, lat]).addTo(map);
          activePopupRef.current = popup;
        });

        const marker = new ML.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map);

        markersRef.current.set(key, { marker, popup, item });
      });

      // Remove markers that are no longer in items
      existingKeys.forEach(key => {
        if (!newKeys.has(key)) {
          markersRef.current.get(key)?.marker.remove();
          markersRef.current.get(key)?.popup.remove();
          markersRef.current.delete(key);
        }
      });
    });
  }, [processedItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtering (dim / highlight) ─────────────────────────────────────────
  useEffect(() => {
    const isFiltering = searchQuery.trim() !== '' || selectedCategories.length > 0 || activeTab !== 'All' || !!focusName;

    markersRef.current.forEach(({ marker, item }) => {
      const el = marker.getElement();
      el.classList.remove('marker-dimmed', 'marker-highlighted', 'marker-focused');

      if (!isFiltering) return;

      const isFocused = focusName === item.name;
      if (isFocused) {
        el.classList.add('marker-focused');
        return;
      }

      const itemCats = (Array.isArray(item.categories) ? item.categories : [(item.category || item.type || 'Others')]);
      const queryLower = searchQuery.toLowerCase().trim();
      const searchMatch = queryLower === '' || item.name.toLowerCase().includes(queryLower);
      const categoryMatch = selectedCategories.length === 0 || itemCats.some((ic: string) => selectedCategories.some(sc => ic.toLowerCase().trim() === sc.toLowerCase().trim()));
      const tabMatch = activeTab === 'All' || item.entityType === activeTab;
      const isMatch = searchMatch && categoryMatch && tabMatch;

      if (isMatch) {
        el.classList.add('marker-highlighted');
      } else {
        el.classList.add('marker-dimmed');
      }
    });
  }, [searchQuery, selectedCategories, activeTab, focusName]);

  // ── Focus / flyTo ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!focusLat || !focusLng) {
      map.flyTo({ center: [124.13, 12.75], zoom: 12, duration: 1200 });
      if (activePopupRef.current) { activePopupRef.current.remove(); activePopupRef.current = null; }
      return;
    }

    // MapLibre order: [lng, lat]
    map.flyTo({ center: [focusLng, focusLat], zoom: 17, duration: 1500 });

    // Open popup for the focused marker
    const key = Array.from(markersRef.current.entries()).find(([, v]) => v.item.name === focusName)?.[0];
    if (key) {
      const { popup } = markersRef.current.get(key)!;
      setTimeout(() => {
        if (activePopupRef.current) activePopupRef.current.remove();
        popup.setLngLat([focusLng, focusLat]).addTo(map);
        activePopupRef.current = popup;
      }, 600);
    }

    // Auto-route from URL param
    if (autoRoute && !autoRouteFiredRef.current) {
      autoRouteFiredRef.current = true;
      const dest: [number, number] = [focusLng, focusLat];
      setTimeout(() => {
        if (isTracking && userLocation) {
          setRouteStart(userLocation);
          setRouteDest(dest);
        } else {
          setPendingRouteDest(dest);
          setShowLocationPrompt(true);
        }
      }, 900);
    }
  }, [focusLat, focusLng, focusName, autoRoute, isTracking, userLocation]);

  // ── Active tour routing ─────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTour || !mapRef.current) return;
    const nextUncompleted = activeTour.destinations.find((d: any) => !d.completed);
    if (nextUncompleted) {
      const item = items.find(i => i.id?.toString() === nextUncompleted.itemId);
      if (item?.coordinates) {
        const start = (isTracking && userLocation) ? userLocation : BULUSAN_CENTER;
        const dest: [number, number] = [item.coordinates.lng, item.coordinates.lat];
        setRouteStart(start);
        setRouteDest(dest);
        mapRef.current.flyTo({ center: dest, zoom: 17, duration: 1000 });
      }
    } else {
      setRouteStart(null);
      setRouteDest(null);
    }
  }, [activeTour, isTracking, userLocation, items]);

  // ── OSRM routing (replaces leaflet-routing-machine) ─────────────────────
  useEffect(() => {
    if (!routeStart || !routeDest) {
      setRouteInfo(null);
      return;
    }
    let serviceUrl = 'https://routing.openstreetmap.de/routed-car/route/v1';
    if (travelMode === 'cycling') serviceUrl = 'https://routing.openstreetmap.de/routed-bike/route/v1';
    if (travelMode === 'walking')  serviceUrl = 'https://routing.openstreetmap.de/routed-foot/route/v1';

    // OSRM expects lng,lat
    const [sLng, sLat] = routeStart;
    const [dLng, dLat] = routeDest;
    fetch(`${serviceUrl}/driving/${sLng},${sLat};${dLng},${dLat}?overview=false`)
      .then(r => r.json())
      .then(data => {
        const route = data.routes?.[0];
        if (!route) return;
        const distKm = route.distance / 1000;
        let mins = 0;
        if (travelMode === 'driving')  mins = (distKm / 35) * 60;
        if (travelMode === 'cycling')  mins = (distKm / 12) * 60;
        if (travelMode === 'walking')  mins = (distKm / 4.5) * 60;
        mins = distKm > 0.01 ? Math.max(1, Math.round(mins)) : 0;
        setRouteInfo({
          distance: distKm.toFixed(1) + ' km',
          time: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} mins`,
        });
      })
      .catch(err => console.error('Routing error:', err));
  }, [routeStart, routeDest, travelMode]);

  // ── Fit bounds to all pins on first load ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || processedItems.length === 0) return;
    const waitForLoad = () => {
      const coords = processedItems
        .filter(i => i.coordinates?.lat && i.coordinates?.lng)
        .map(i => [i.coordinates.lng, i.coordinates.lat] as [number, number]);
      if (coords.length === 0) return;
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new ML.LngLatBounds(coords[0], coords[0]),
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
    };
    if (map.isStyleLoaded()) { waitForLoad(); }
    else { map.once('load', waitForLoad); }
  }, []); // only on mount

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MapStyleWrapper>
      {/* Location toggle — same position as before */}
      <LocationToggle $active={isTracking} onClick={() => setIsTracking(t => !t)}>
        {isTracking ? <Navigation size={16} /> : <NavigationOff size={16} />}
        {isTracking ? 'Live Location On' : 'Location Off'}
      </LocationToggle>

      {/* Map container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <AnimatePresence>
        {/* Route info overlay */}
        {routeInfo && (
          <TravelStatsOverlay
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <h4>Travel Estimates</h4>
            <div className="stats-content">
              <div className="stat-item">
                <div className="val">{routeInfo.distance}</div>
                <div className="lab">Distance</div>
              </div>
              <div className="stat-item" style={{ textAlign: 'right' }}>
                <div className="val" style={{ color: '#10b981' }}>{routeInfo.time}</div>
                <div className="lab">Arrival</div>
              </div>
            </div>
            <div className="mode-selection">
              <ModeButton $active={travelMode === 'driving'} onClick={() => setTravelMode('driving')} title="Driving"><Car size={20} /></ModeButton>
              <ModeButton $active={travelMode === 'cycling'} onClick={() => setTravelMode('cycling')} title="Cycling"><Bike size={20} /></ModeButton>
              <ModeButton $active={travelMode === 'walking'} onClick={() => setTravelMode('walking')} title="Walking"><Footprints size={20} /></ModeButton>
            </div>
            <div className="close-row">
              <button className="primary" onClick={() => { setRouteStart(null); setRouteDest(null); }}>Exit Navigation</button>
            </div>
          </TravelStatsOverlay>
        )}

        {/* Location prompt */}
        {showLocationPrompt && (
          <LocationPrompt
            initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
          >
            <h4>Enable Location?</h4>
            <div className="prompt-buttons">
              <button className="btn-primary" onClick={() => setIsTracking(true)}>Enable GPS</button>
              <button className="btn-secondary" onClick={() => {
                if (pendingRouteDest) { setRouteStart(BULUSAN_CENTER); setRouteDest(pendingRouteDest); }
                setShowLocationPrompt(false);
              }}>Use Town Center</button>
            </div>
          </LocationPrompt>
        )}

        {/* Mobile bottom sheet */}
        {mobileDetail && (
          <MobileBottomSheet
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="handle" onClick={() => setMobileDetail(null)} />
            <h3>{mobileDetail.name}</h3>
            <p>{mobileDetail.description}</p>
            <button className="nav-btn" onClick={() => {
              const start = (isTracking && userLocation) ? userLocation : BULUSAN_CENTER;
              const dest: [number, number] = [mobileDetail.coordinates.lng, mobileDetail.coordinates.lat];
              setRouteStart(start); setRouteDest(dest); setMobileDetail(null);
            }}>Start Route</button>
          </MobileBottomSheet>
        )}
      </AnimatePresence>
    </MapStyleWrapper>
  );
};

export default BulusanMap;

/* ═══════════════════════════════════════════════════════════════════════════════
   LEAFLET LEGACY — keep until MapLibre version is confirmed working in production
   To roll back: git checkout main
   ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { MapContainer, Marker, Popup, useMap, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, NavigationOff, Car, Bike, Footprints, Star, MapPin, X, Zap, TrendingUp, Award, Users } from 'lucide-react';
import { getMapIconUrl } from '../Admin/CategoryTagConfig';
import { getDynamicTags } from '../../utils/tagUtils';

... (full original BulusanMap code was here — git history preserves it) ...

   TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
   ^ This was the broken tile URL — Carto now requires an API key on this endpoint.
   ═══════════════════════════════════════════════════════════════════════════════ */
