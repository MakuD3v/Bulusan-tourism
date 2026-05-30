import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, MapPin, Waves, TreePine, Save, X,
  Loader2, ChevronLeft, Check, Map as MapIcon, ArrowUp, ArrowDown, Pencil
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CuratedRoute, TourTheme, CuratedRouteStop, TourRoute } from '../../data/types';
import { curatedRouteService } from '../../utils/bookingService';
import { useAttractions, useEnterprises, useHeritage } from '../../hooks/useData';
import { getMediaUrl } from '../../utils/mediaUtils';
import { ATTRACTION_CATEGORIES, ENTERPRISE_CATEGORIES, getMapIconUrl } from './CategoryTagConfig';
import { useAlert } from '../Common/AlertProvider';

// ─── Route List Styles ────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex; flex-direction: column; gap: 20px; height: 100%;
`;

const HeaderRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  h3 { font-family: 'Outfit', sans-serif; font-size: 1.5rem; color: #e2ecf7; }
  button {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white; border: none; padding: 10px 20px; border-radius: 12px;
    font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;
    &:hover { box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
  }
`;

const RouteList = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;
`;

const TourCard = styled.div`
  background: rgba(11,31,69,0.5); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 20px; padding: 0; display: flex; flex-direction: column;
  position: relative; overflow: hidden;
  .card-img { width: 100%; height: 120px; background-size: cover; background-position: center; position: relative;
    &::after { content:''; position:absolute; inset:0; background: linear-gradient(to bottom, transparent 40%, rgba(5,13,30,0.95)); }
  }
  .card-body { padding: 0 16px 16px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; background: rgba(59,130,246,0.15); color: #60a5fa; margin: 10px 0 6px; }
  h4 { font-family: 'Outfit', sans-serif; font-size: 1.1rem; color: #e2ecf7; margin: 0 0 4px; }
  p { font-size: 0.78rem; color: #90aecb; line-height: 1.4; margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { display: flex; gap: 10px; font-size: 0.72rem; color: #5a7098; font-weight: 600; align-items: center; }
  .actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; z-index: 2;
    button { background: rgba(0,0,0,0.6); border-radius: 8px; border: none; color: #90aecb; cursor: pointer; padding: 6px; backdrop-filter: blur(4px); &:hover { color: white; } }
  }
`;

// ─── Full-Screen Editor Styles ────────────────────────────────────────────────

const BuilderScreen = styled(motion.div)`
  position: fixed; inset: 0; z-index: 2000; background: #050d1e; display: flex; flex-direction: column;
`;

const TopBar = styled.div`
  height: 60px; flex-shrink: 0; background: rgba(11,31,69,0.95); border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: space-between; padding: 0 20px; gap: 16px;
  backdrop-filter: blur(12px);
`;

const TopBarLeft = styled.div`
  display: flex; align-items: center; gap: 12px; min-width: 0;
  .back-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #90aecb; width: 34px; height: 34px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; &:hover { background: rgba(255,255,255,0.1); color: white; } }
  .tour-name { font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 800; color: #e2ecf7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
  .tab-pills { display: flex; gap: 3px; padding: 3px; background: rgba(0,0,0,0.3); border-radius: 10px; flex-shrink: 0; }
`;

const TabPill = styled.button<{ $active: boolean }>`
  padding: 6px 16px; border-radius: 7px; font-size: 0.8rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; white-space: nowrap;
  background: ${p => p.$active ? '#3b82f6' : 'transparent'}; color: ${p => p.$active ? 'white' : '#5a7098'};
  &:hover { color: white; }
`;

const SaveBtn = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border: none; color: white;
  padding: 9px 22px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; gap: 8px;
  &:hover { box-shadow: 0 8px 24px rgba(59,130,246,0.4); transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const EditorBody = styled.div`
  flex: 1; display: flex; min-height: 0;
`;

// ─── Tours Tab Styles ─────────────────────────────────────────────────────────

const SettingsPanel = styled.div`
  width: 300px; flex-shrink: 0; background: rgba(11,31,69,0.8); border-right: 1px solid rgba(255,255,255,0.06);
  overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  label { font-size: 0.68rem; font-weight: 700; color: #5a7098; text-transform: uppercase; margin-bottom: 5px; display: block; }
  input, select, textarea {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 9px 12px; color: white; font-size: 0.82rem; outline: none; box-sizing: border-box;
    &:focus { border-color: #3b82f6; }
  }
`;

const SectionTitle = styled.div`
  font-family: 'Outfit', sans-serif; font-size: 0.85rem; font-weight: 800; color: #e2ecf7;
  border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin-bottom: 0;
`;

const CoverPreview = styled.div<{ $src: string }>`
  width: 100%; height: 90px; border-radius: 8px;
  background-image: url(${p => p.$src}); background-size: cover; background-position: center;
  border: 1px solid rgba(255,255,255,0.1);
`;

// ─── Attraction Pool Styles (right side of Tours tab) ─────────────────────────

const PoolPanel = styled.div`
  flex: 1; display: flex; flex-direction: column; min-width: 0;
`;

const PoolHeader = styled.div`
  padding: 12px 16px; background: rgba(0,0,0,0.25); border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  .title { font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 800; color: #e2ecf7; }
  .sub { font-size: 0.72rem; color: #5a7098; }
`;

const CategorySection = styled.div`
  background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.04); flex-shrink: 0;
`;
const CategoryGrid = styled.div<{ $expanded: boolean }>`
  display: flex; flex-wrap: wrap; gap: 5px; padding: 8px 14px;
  max-height: ${p => p.$expanded ? '180px' : '42px'};
  overflow: hidden; transition: max-height 0.3s ease;
`;
const CatChip = styled.button<{ $active: boolean }>`
  padding: 4px 10px 4px 5px; border-radius: 30px; font-size: 0.7rem; font-weight: 700;
  white-space: nowrap; cursor: pointer; border: 1px solid; flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 4px;
  background: ${p => p.$active ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)'};
  color: ${p => p.$active ? '#60a5fa' : '#5a7098'};
  border-color: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.08)'};
  transition: all 0.15s;
  &:hover { color: white; border-color: rgba(59,130,246,0.4); }
  img { width: 16px; height: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
`;
const ExpandCatBtn = styled.button`
  display: block; width: 100%; padding: 5px; font-size: 0.7rem; font-weight: 700; cursor: pointer;
  background: rgba(255,255,255,0.02); border: none; border-top: 1px solid rgba(255,255,255,0.04);
  color: #3b82f6; transition: background 0.2s;
  &:hover { background: rgba(59,130,246,0.08); }
`;

const PoolMain = styled.div`
  flex: 1; display: flex; min-height: 0;
`;

const ItemSidebar = styled.div`
  width: 340px; flex-shrink: 0; background: rgba(0,0,0,0.15); border-right: 1px solid rgba(255,255,255,0.06);
  overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 10px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const CardImage = styled.div<{ $src: string }>`
  position: absolute; top: 0; left: 0; width: 80px; height: 100%;
  background-image: url(${p => getMediaUrl(p.$src)}); background-size: cover; background-position: center; z-index: 0;
  -webkit-mask-image: linear-gradient(to right, black 20%, transparent 100%);
  mask-image: linear-gradient(to right, black 20%, transparent 100%);
`;

const ItemCard = styled.div<{ $added: boolean }>`
  background: ${p => p.$added ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${p => p.$added ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'};
  border-radius: 16px; display: flex; align-items: center; justify-content: space-between;
  position: relative; overflow: hidden; height: 68px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: ${p => p.$added ? 'rgba(16,185,129,0.6)' : 'rgba(59,130,246,0.4)'}; }
  .content { position: relative; z-index: 1; padding: 6px 8px 6px 86px; flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  h5 { font-family: 'Outfit', sans-serif; font-size: 0.8rem; color: #e2ecf7; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .type { font-size: 0.58rem; color: ${p => p.$added ? '#10b981' : '#5a7098'}; text-transform: uppercase; font-weight: 800; }
  .action { position: relative; z-index: 1; padding-right: 10px;
    button { width: 28px; height: 28px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      background: ${p => p.$added ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.15)'};
      color: ${p => p.$added ? '#10b981' : '#60a5fa'};
      &:hover { background: ${p => p.$added ? '#10b981' : '#3b82f6'}; color: white; }
    }
  }
`;

const MapWrap = styled.div`flex: 1; background: #050d1e;`;

// ─── Routes Tab Styles ────────────────────────────────────────────────────────

const RoutesPanel = styled.div`
  flex: 1; display: flex; flex-direction: column; min-width: 0;
`;

const RouteTabsBar = styled.div`
  height: 50px; flex-shrink: 0; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; gap: 4px; padding: 0 16px; overflow-x: auto;
  &::-webkit-scrollbar { height: 0; }
`;

const RouteTab = styled.button<{ $active: boolean }>`
  padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap;
  border: 1px solid ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
  background: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.04)'};
  color: ${p => p.$active ? 'white' : '#90aecb'};
  display: flex; align-items: center; gap: 6px; transition: all 0.15s;
  &:hover { color: white; background: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; }
  .del { opacity: 0; transition: opacity 0.15s; width: 14px; height: 14px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
  &:hover .del { opacity: 1; }
`;

const AddRouteBtn = styled.button`
  padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  border: 1px dashed rgba(59,130,246,0.4); background: transparent; color: #3b82f6;
  display: flex; align-items: center; gap: 5px; transition: all 0.15s;
  &:hover { background: rgba(59,130,246,0.1); border-color: #3b82f6; }
`;

const RouteContent = styled.div`
  flex: 1; display: flex; min-height: 0;
`;

const RouteStopsSidebar = styled.div`
  width: 320px; flex-shrink: 0; background: rgba(0,0,0,0.15); border-right: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column; overflow: hidden;
`;

const StopsSidebarHeader = styled.div`
  padding: 12px 14px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  .title { font-size: 0.8rem; font-weight: 800; color: #e2ecf7; }
  .hint { font-size: 0.68rem; color: #5a7098; }
`;

const StopsScrollArea = styled.div`
  flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const RouteStopCard = styled.div`
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;
  .num { width: 22px; height: 22px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 800; flex-shrink: 0; }
  .info { flex: 1; min-width: 0;
    .name { font-size: 0.82rem; color: #e2ecf7; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .type { font-size: 0.6rem; color: #5a7098; text-transform: uppercase; font-weight: 700; }
  }
  .time-wrap {
    display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;
    .time-range { display: flex; align-items: center; gap: 5px;
      input[type="time"] { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
        color: #60a5fa; font-family: monospace; font-size: 0.76rem; font-weight: 700; padding: 4px 6px; outline: none; width: 80px;
        &:focus { border-color: #3b82f6; }
        &::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); cursor: pointer; }
      }
      .sep { font-size: 0.72rem; color: #5a7098; font-weight: 700; }
    }
    .dur-label { font-size: 0.62rem; color: #5a7098; font-weight: 600; }
  }
  .sort-btns { display: flex; flex-direction: column; gap: 2px;
    button { background: transparent; border: none; color: #5a7098; cursor: pointer; padding: 1px; &:hover { color: #e2ecf7; } &:disabled { opacity: 0.2; cursor: default; } }
  }
  .del-btn { background: transparent; border: none; color: #5a7098; cursor: pointer; padding: 2px; &:hover { color: #ef4444; } flex-shrink: 0; }
`;

const PoolPickerRow = styled.div`
  padding: 10px 14px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
  .label { font-size: 0.68rem; font-weight: 800; color: #5a7098; text-transform: uppercase; margin-bottom: 6px; }
`;

const PoolChipGrid = styled.div`
  display: flex; flex-wrap: wrap; gap: 5px; max-height: 90px; overflow-y: auto;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
`;

const PoolItemChip = styled.button<{ $added: boolean }>`
  padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; cursor: pointer;
  border: 1px solid ${p => p.$added ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'};
  background: ${p => p.$added ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)'};
  color: ${p => p.$added ? '#10b981' : '#90aecb'};
  transition: all 0.15s; white-space: nowrap;
  &:hover { border-color: ${p => p.$added ? 'rgba(16,185,129,0.7)' : 'rgba(59,130,246,0.4)'}; color: white; }
`;

const EmptyRoutesMsg = styled.div`
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  color: #5a7098; text-align: center; padding: 40px;
  h4 { font-family: 'Outfit', sans-serif; color: #90aecb; font-size: 1rem; margin: 0; }
  p { font-size: 0.82rem; margin: 0; }
`;

// ─── Shared Map Helper ────────────────────────────────────────────────────────

const MapAutoFitter: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [50, 50], maxZoom: 14 });
    }
  }, [coordinates, map]);
  return null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  { label: 'All' },
  ...ATTRACTION_CATEGORIES.map(c => ({ label: c.label })),
  ...ENTERPRISE_CATEGORIES.map(c => ({ label: c.label })),
].filter((c, i, arr) => arr.findIndex(x => x.label === c.label) === i);

const mkRoute = (n: number): TourRoute => ({
  id: `r-${Date.now()}-${n}`,
  name: `Route ${String.fromCharCode(64 + n)}`,
  stops: []
});

const initialTour = (): Partial<CuratedRoute> => ({
  name: '', description: '', coverImage: '', theme: 'Seascape', estimatedDays: 1,
  difficulty: 'Moderate', isActive: true, stops: [],
  availableAttractions: [], tourRoutes: [mkRoute(1)]
});

// ─── Main Component ───────────────────────────────────────────────────────────

const CuratedRoutesManager: React.FC = () => {
  const [routes, setRoutes] = useState<CuratedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm } = useAlert();
  const [editing, setEditing] = useState<Partial<CuratedRoute> | null>(null);
  const [saving, setSaving] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'tours' | 'routes'>('tours');

  // Tours tab
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [catExpanded, setCatExpanded] = useState(false);

  // Routes tab
  const [activeRouteId, setActiveRouteId] = useState<string>('');
  const [editingRouteName, setEditingRouteName] = useState<string | null>(null);
  const [routeNameDraft, setRouteNameDraft] = useState('');

  const { data: attractions } = useAttractions();
  const { data: enterprises } = useEnterprises();
  const { data: heritage } = useHeritage();

  const allItems = useMemo(() => [
    ...attractions.map(x => ({ ...x, entityType: 'Attraction' as const })),
    ...enterprises.map(x => ({ ...x, entityType: 'Enterprise' as const })),
    ...heritage.map(x => ({ ...x, entityType: 'Heritage' as const })),
  ], [attractions, enterprises, heritage]);

  // Items filtered by category (for pool picker)
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return allItems;
    return allItems.filter(item => {
      const cats = Array.isArray((item as any).categories) ? (item as any).categories : [(item as any).category || ''];
      return cats.some((c: string) => c?.toLowerCase() === selectedCategory.toLowerCase());
    });
  }, [allItems, selectedCategory]);

  // Items in pool (for routes tab)
  const poolItems = useMemo(() => {
    const poolIds = new Set(editing?.availableAttractions || []);
    return allItems.filter(i => poolIds.has(i.id.toString()));
  }, [allItems, editing?.availableAttractions]);

  // Active route object
  const activeRoute = useMemo(() => {
    return (editing?.tourRoutes || []).find(r => r.id === activeRouteId) || null;
  }, [editing?.tourRoutes, activeRouteId]);

  useEffect(() => { loadTours(); }, []);

  const loadTours = () => {
    setLoading(true);
    curatedRouteService.getAll().then(res => { setRoutes(res); setLoading(false); });
  };

  const openNew = () => {
    const t = initialTour();
    setEditing(t);
    setActiveTab('tours');
    setActiveRouteId((t.tourRoutes || [])[0]?.id || '');
    setSelectedCategory('All');
  };

  const openEdit = (r: CuratedRoute) => {
    const withRoutes = { ...r, tourRoutes: r.tourRoutes?.length ? r.tourRoutes : [mkRoute(1)], availableAttractions: r.availableAttractions || [] };
    setEditing(withRoutes);
    setActiveTab('tours');
    setActiveRouteId((withRoutes.tourRoutes || [])[0]?.id || '');
    setSelectedCategory('All');
  };

  const handleSave = async () => {
    if (!editing || !editing.name) return;
    setSaving(true);
    const r: CuratedRoute = {
      ...editing,
      id: editing.id || `tour-${Date.now()}`,
      createdAt: editing.createdAt || Date.now(),
      updatedAt: Date.now(),
      stops: (editing.tourRoutes || []).flatMap(tr => tr.stops), // union of all route stops
      tourRoutes: editing.tourRoutes || [],
      availableAttractions: editing.availableAttractions || [],
    } as CuratedRoute;
    await curatedRouteService.save(r);
    setSaving(false);
    setEditing(null);
    loadTours();
  };

  const handleDelete = async (id: string) => {
    showConfirm('Delete Tour', "Delete this tour?", async () => { await curatedRouteService.delete(id); loadTours(); });
  };

  // ── Pool toggle ──
  const togglePool = useCallback((item: any) => {
    setEditing(prev => {
      if (!prev) return prev;
      const pool = [...(prev.availableAttractions || [])];
      const id = item.id.toString();
      const idx = pool.indexOf(id);
      if (idx >= 0) pool.splice(idx, 1); else pool.push(id);
      return { ...prev, availableAttractions: pool };
    });
  }, []);

  // Pool map polyline (all pool items)
  const poolCoords = useMemo<[number, number][]>(() => {
    return (editing?.availableAttractions || []).map(id => {
      const item = allItems.find(i => i.id.toString() === id);
      if (!item) return null;
      const lat = (item as any).lat || (item as any).coordinates?.lat;
      const lng = (item as any).lng || (item as any).coordinates?.lng;
      return lat && lng ? [lat, lng] as [number, number] : null;
    }).filter(Boolean) as [number, number][];
  }, [editing?.availableAttractions, allItems]);

  // ── Route management ──
  const addRoute = () => {
    setEditing(prev => {
      if (!prev) return prev;
      const n = (prev.tourRoutes || []).length + 1;
      const newR = mkRoute(n);
      const updated = [...(prev.tourRoutes || []), newR];
      setActiveRouteId(newR.id);
      return { ...prev, tourRoutes: updated };
    });
  };

  const deleteRoute = (id: string) => {
    setEditing(prev => {
      if (!prev) return prev;
      const updated = (prev.tourRoutes || []).filter(r => r.id !== id);
      if (activeRouteId === id) setActiveRouteId(updated[0]?.id || '');
      return { ...prev, tourRoutes: updated };
    });
  };

  const renameRoute = (id: string, newName: string) => {
    setEditing(prev => {
      if (!prev) return prev;
      return { ...prev, tourRoutes: (prev.tourRoutes || []).map(r => r.id === id ? { ...r, name: newName } : r) };
    });
    setEditingRouteName(null);
  };

  // ── Stop management within active route ──
  const updateRoute = (updatedRoute: TourRoute) => {
    setEditing(prev => {
      if (!prev) return prev;
      return { ...prev, tourRoutes: (prev.tourRoutes || []).map(r => r.id === updatedRoute.id ? updatedRoute : r) };
    });
  };

  const toggleStop = (item: any) => {
    if (!activeRoute) return;
    const stops = [...activeRoute.stops];
    const idx = stops.findIndex(s => s.itemId === item.id.toString());
    if (idx >= 0) { stops.splice(idx, 1); }
    else {
      stops.push({ itemId: item.id.toString(), entityType: item.entityType, itemName: item.name, durationHours: 1, scheduledTime: '' });
    }
    updateRoute({ ...activeRoute, stops });
  };

  // Helper: parse "HH:MM" into minutes
  const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const toHours = (mins: number) => Math.round((mins / 60) * 10) / 10;

  const updateStopRange = (stopIdx: number, field: 'scheduledTime' | 'endTime', value: string) => {
    if (!activeRoute) return;
    const stops = activeRoute.stops.map((s, i) => {
      if (i !== stopIdx) return s;
      const updated = { ...s, [field]: value };
      const start = field === 'scheduledTime' ? value : (s.scheduledTime || '');
      const end   = field === 'endTime'       ? value : (s.endTime || '');
      if (start && end) {
        const diff = toMinutes(end) - toMinutes(start);
        updated.durationHours = diff > 0 ? toHours(diff) : 0;
      }
      return updated;
    });
    updateRoute({ ...activeRoute, stops });
  };

  const moveStop = (idx: number, dir: number) => {
    if (!activeRoute) return;
    const stops = [...activeRoute.stops];
    if (idx + dir < 0 || idx + dir >= stops.length) return;
    [stops[idx], stops[idx + dir]] = [stops[idx + dir], stops[idx]];
    updateRoute({ ...activeRoute, stops });
  };

  const removeStop = (idx: number) => {
    if (!activeRoute) return;
    const stops = activeRoute.stops.filter((_, i) => i !== idx);
    updateRoute({ ...activeRoute, stops });
  };

  // Route map polyline
  const routeCoords = useMemo<[number, number][]>(() => {
    if (!activeRoute) return [];
    return activeRoute.stops.map(stop => {
      const item = allItems.find(i => i.id.toString() === stop.itemId);
      if (!item) return null;
      const lat = (item as any).lat || (item as any).coordinates?.lat;
      const lng = (item as any).lng || (item as any).coordinates?.lng;
      return lat && lng ? [lat, lng] as [number, number] : null;
    }).filter(Boolean) as [number, number][];
  }, [activeRoute, allItems]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Container>
      <HeaderRow>
        <h3>Tours</h3>
        <button onClick={openNew}><Plus size={16} /> New Tour</button>
      </HeaderRow>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} className="animate-spin" color="#3b82f6" /></div>
      ) : routes.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#5a7098' }}>No tours yet. Create one above!</div>
      ) : (
        <RouteList>
          {routes.map(r => (
            <TourCard key={r.id}>
              {r.coverImage && <div className="card-img" style={{ backgroundImage: `url(${r.coverImage})` }} />}
              <div className="actions">
                <button onClick={() => openEdit(r)}><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(r.id)}><Trash2 size={13} /></button>
              </div>
              <div className="card-body">
                <div className="badge">{r.theme === 'Seascape' ? <Waves size={9} /> : <TreePine size={9} />} {r.theme}</div>
                <h4>{r.name}</h4>
                <p>{r.description}</p>
                <div className="meta">
                  <MapPin size={10} /> {r.availableAttractions?.length || 0} Attractions &nbsp;·&nbsp;
                  <span style={{ color: '#60a5fa' }}>{r.tourRoutes?.length || 0} Routes</span> &nbsp;·&nbsp;
                  {r.estimatedDays} Days &nbsp;·&nbsp;
                  <span style={{ color: r.isActive ? '#10b981' : '#ef4444', marginLeft: 'auto' }}>{r.isActive ? 'Active' : 'Draft'}</span>
                </div>
              </div>
            </TourCard>
          ))}
        </RouteList>
      )}

      {/* ─── Full-Screen Editor ─── */}
      <AnimatePresence>
        {editing && (
          <BuilderScreen initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.18 }}>
            <TopBar>
              <TopBarLeft>
                <button className="back-btn" onClick={() => setEditing(null)}><ChevronLeft size={18} /></button>
                <span className="tour-name">{editing.name || 'New Tour'}</span>
                <div className="tab-pills">
                  <TabPill $active={activeTab === 'tours'} onClick={() => setActiveTab('tours')}>🏷 Tours</TabPill>
                  <TabPill $active={activeTab === 'routes'} onClick={() => setActiveTab('routes')}><MapIcon size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />Routes</TabPill>
                </div>
              </TopBarLeft>
              <SaveBtn onClick={handleSave} disabled={saving || !editing.name}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving…' : 'Save Tour'}
              </SaveBtn>
            </TopBar>

            <EditorBody>
              {/* ══ TOURS TAB ══ */}
              {activeTab === 'tours' && (
                <>
                  {/* Left: Settings */}
                  <SettingsPanel>
                    <SectionTitle>Tour Details</SectionTitle>
                    <div><label>Tour Name</label><input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Bulusan Seascape" /></div>
                    <div><label>Description</label><textarea rows={3} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
                    <div>
                      <label>Cover Image URL</label>
                      <input placeholder="https://..." value={editing.coverImage || ''} onChange={e => setEditing({ ...editing, coverImage: e.target.value })} />
                      {editing.coverImage && <CoverPreview $src={editing.coverImage} style={{ marginTop: 8 }} />}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label>Theme</label>
                        <select value={editing.theme || 'Seascape'} onChange={e => setEditing({ ...editing, theme: e.target.value as TourTheme })}>
                          <option value="Seascape">Seascape</option>
                          <option value="Naturescape">Naturescape</option>
                          <option value="Mountaineering">Mountaineering</option>
                          <option value="Camping">Camping</option>
                        </select>
                      </div>
                      <div><label>Status</label>
                        <select value={editing.isActive ? 'active' : 'draft'} onChange={e => setEditing({ ...editing, isActive: e.target.value === 'active' })}>
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label>Days</label>
                        <input type="number" min={1} max={14} value={editing.estimatedDays || 1} onChange={e => setEditing({ ...editing, estimatedDays: parseInt(e.target.value) || 1 })} />
                      </div>
                      <div><label>Difficulty</label>
                        <select value={editing.difficulty || 'Moderate'} onChange={e => setEditing({ ...editing, difficulty: e.target.value as any })}>
                          <option value="Easy">Easy</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Challenging">Challenging</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                      <SectionTitle>Approved Attractions ({editing.availableAttractions?.length || 0})</SectionTitle>
                      <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#5a7098', lineHeight: 1.5 }}>
                        Select attractions on the right. These will be the <em>only</em> options users can pick from when booking this tour.
                      </div>
                    </div>
                  </SettingsPanel>

                  {/* Right: Attraction Pool Picker */}
                  <PoolPanel>
                    <PoolHeader>
                      <span className="title">Attraction Library</span>
                      <span className="sub">{editing.availableAttractions?.length || 0} selected for this tour</span>
                    </PoolHeader>
                    <CategorySection>
                      <CategoryGrid $expanded={catExpanded}>
                        {ALL_CATEGORIES.map(cat => (
                          <CatChip key={cat.label} $active={selectedCategory === cat.label} onClick={() => setSelectedCategory(cat.label)}>
                            <img src={cat.label === 'All' ? '/map-icons/general.svg' : getMapIconUrl(cat.label)} alt={cat.label} />
                            {cat.label}
                          </CatChip>
                        ))}
                      </CategoryGrid>
                      <ExpandCatBtn onClick={() => setCatExpanded(e => !e)}>{catExpanded ? '▲ Show Less' : '▼ Show All Categories'}</ExpandCatBtn>
                    </CategorySection>
                    <PoolMain>
                      <ItemSidebar>
                        {filteredItems.map(item => {
                          const inPool = (editing.availableAttractions || []).includes(item.id.toString());
                          const img = (item as any).img || '';
                          return (
                            <ItemCard key={item.id} $added={inPool} onClick={() => togglePool(item)}>
                              {img && <CardImage $src={img} />}
                              <div className="content">
                                <h5>{item.name}</h5>
                                <div className="type">{item.entityType}{inPool ? ' · ✓ In Tour' : ''}</div>
                              </div>
                              <div className="action">
                                <button onClick={e => { e.stopPropagation(); togglePool(item); }}>
                                  {inPool ? <Check size={13} /> : <Plus size={13} />}
                                </button>
                              </div>
                            </ItemCard>
                          );
                        })}
                        {filteredItems.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#5a7098', fontSize: '0.82rem' }}>No items in this category.</div>}
                      </ItemSidebar>
                      <MapWrap>
                        <MapContainer center={[12.7533, 124.0933]} zoom={11} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                          {filteredItems.map(item => {
                            const inPool = (editing.availableAttractions || []).includes(item.id.toString());
                            const lat = (item as any).lat || (item as any).coordinates?.lat;
                            const lng = (item as any).lng || (item as any).coordinates?.lng;
                            if (!lat || !lng) return null;
                            const cats = Array.isArray((item as any).categories) ? (item as any).categories : [(item as any).category || 'Others'];
                            const iconUrl = getMapIconUrl(cats[0] || 'Others');
                            const size = inPool ? 40 : 26;
                            const opacity = inPool ? 1 : 0.4;
                            const html = inPool
                              ? `<div style="position:relative;"><img src="${iconUrl}" style="width:${size}px;height:${size}px;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));"/><div style="position:absolute;top:-5px;right:-5px;background:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white;"></div></div>`
                              : `<img src="${iconUrl}" style="width:${size}px;height:${size}px;opacity:${opacity};filter:grayscale(0.3);"/>`;
                            const icon = L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size] });
                            return <Marker key={`pool-${item.id}`} position={[lat, lng]} icon={icon} />;
                          })}
                          {poolCoords.length > 0 && <MapAutoFitter coordinates={poolCoords} />}
                        </MapContainer>
                      </MapWrap>
                    </PoolMain>
                  </PoolPanel>
                </>
              )}

              {/* ══ ROUTES TAB ══ */}
              {activeTab === 'routes' && (
                <RoutesPanel>
                  {/* Route tabs */}
                  <RouteTabsBar>
                    {(editing.tourRoutes || []).map(r => (
                      <RouteTab key={r.id} $active={r.id === activeRouteId} onClick={() => setActiveRouteId(r.id)}>
                        {editingRouteName === r.id ? (
                          <input
                            autoFocus
                            value={routeNameDraft}
                            onChange={e => setRouteNameDraft(e.target.value)}
                            onBlur={() => renameRoute(r.id, routeNameDraft || r.name)}
                            onKeyDown={e => { if (e.key === 'Enter') renameRoute(r.id, routeNameDraft || r.name); }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.8rem', outline: 'none', width: '80px' }}
                          />
                        ) : (
                          <>
                            {r.name}
                            <span title="Rename" style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }} onClick={e => { e.stopPropagation(); setEditingRouteName(r.id); setRouteNameDraft(r.name); }}>
                              <Pencil size={10} />
                            </span>
                          </>
                        )}
                        {(editing.tourRoutes || []).length > 1 && (
                          <span className="del" onClick={e => { e.stopPropagation(); deleteRoute(r.id); }}>
                            <X size={9} />
                          </span>
                        )}
                        <span style={{ fontSize: '0.62rem', opacity: 0.6 }}>({r.stops.length})</span>
                      </RouteTab>
                    ))}
                    <AddRouteBtn onClick={addRoute}><Plus size={12} /> New Route</AddRouteBtn>
                  </RouteTabsBar>

                  {poolItems.length === 0 ? (
                    <EmptyRoutesMsg>
                      <MapIcon size={40} color="#3b82f6" />
                      <h4>No attractions in this tour yet</h4>
                      <p>Go to the <strong>Tours</strong> tab and add attractions to the pool first. Then come back to build routes from those attractions.</p>
                    </EmptyRoutesMsg>
                  ) : (
                    <RouteContent>
                      {/* Left: stops list for this route */}
                      <RouteStopsSidebar>
                        <StopsSidebarHeader>
                          <span className="title">{activeRoute?.name} — Stops</span>
                          <span className="hint">{activeRoute?.stops.length || 0} stops</span>
                        </StopsSidebarHeader>
                        <StopsScrollArea>
                          {(activeRoute?.stops || []).map((stop, idx) => (
                            <RouteStopCard key={`${stop.itemId}-${idx}`}>
                              <span className="num">{idx + 1}</span>
                              <div className="info">
                                <div className="name">{stop.itemName}</div>
                                <div className="type">{stop.entityType}</div>
                              </div>
                              <div className="time-wrap">
                                <div className="time-range">
                                  <input type="time" value={stop.scheduledTime || ''} onChange={e => updateStopRange(idx, 'scheduledTime', e.target.value)} />
                                  <span className="sep">→</span>
                                  <input type="time" value={stop.endTime || ''} onChange={e => updateStopRange(idx, 'endTime', e.target.value)} />
                                </div>
                                <div className="dur-label">
                                  {stop.scheduledTime && stop.endTime && (stop.durationHours || 0) > 0
                                    ? `${stop.durationHours} hr${stop.durationHours === 1 ? '' : 's'}`
                                    : 'Set start & end time'}
                                </div>
                              </div>
                              <div className="sort-btns">
                                <button disabled={idx === 0} onClick={() => moveStop(idx, -1)}><ArrowUp size={10} /></button>
                                <button disabled={idx === (activeRoute?.stops.length || 0) - 1} onClick={() => moveStop(idx, 1)}><ArrowDown size={10} /></button>
                              </div>
                              <button className="del-btn" onClick={() => removeStop(idx)}><X size={12} /></button>
                            </RouteStopCard>
                          ))}
                          {(activeRoute?.stops.length || 0) === 0 && (
                            <div style={{ padding: 20, textAlign: 'center', color: '#5a7098', fontSize: '0.8rem' }}>
                              Pick attractions from the pool below to build this route.
                            </div>
                          )}
                        </StopsScrollArea>

                        {/* Pool picker chips */}
                        <PoolPickerRow>
                          <div className="label">Add from tour attractions</div>
                          <PoolChipGrid>
                            {poolItems.map(item => {
                              const inRoute = activeRoute?.stops.some(s => s.itemId === item.id.toString()) || false;
                              return (
                                <PoolItemChip key={item.id} $added={inRoute} onClick={() => toggleStop(item)}>
                                  {inRoute ? '✓ ' : '+ '}{item.name}
                                </PoolItemChip>
                              );
                            })}
                          </PoolChipGrid>
                        </PoolPickerRow>
                      </RouteStopsSidebar>

                      {/* Map for this route */}
                      <MapWrap>
                        <MapContainer center={[12.7533, 124.0933]} zoom={12} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                          {/* Faded pool items not in route */}
                          {poolItems.map(item => {
                            const inRoute = activeRoute?.stops.some(s => s.itemId === item.id.toString());
                            if (inRoute) return null;
                            const lat = (item as any).lat || (item as any).coordinates?.lat;
                            const lng = (item as any).lng || (item as any).coordinates?.lng;
                            if (!lat || !lng) return null;
                            const cats = Array.isArray((item as any).categories) ? (item as any).categories : [(item as any).category || 'Others'];
                            const iconUrl = getMapIconUrl(cats[0] || 'Others');
                            const html = `<img src="${iconUrl}" style="width:26px;height:26px;opacity:0.4;filter:grayscale(0.4);"/>`;
                            const icon = L.divIcon({ html, className: '', iconSize: [26, 26], iconAnchor: [13, 26] });
                            return <Marker key={`f-${item.id}`} position={[lat, lng]} icon={icon} />;
                          })}

                          {/* Active route stops with numbered pins */}
                          {routeCoords.length > 1 && <Polyline positions={routeCoords} color="#3b82f6" weight={4} dashArray="8,8" />}
                          {(activeRoute?.stops || []).map((stop, idx) => {
                            const item = allItems.find(i => i.id.toString() === stop.itemId);
                            if (!item) return null;
                            const lat = (item as any).lat || (item as any).coordinates?.lat;
                            const lng = (item as any).lng || (item as any).coordinates?.lng;
                            if (!lat || !lng) return null;
                            const cats = Array.isArray((item as any).categories) ? (item as any).categories : [(item as any).category || 'Others'];
                            const iconUrl = getMapIconUrl(cats[0] || 'Others');
                            const html = `<div style="position:relative;"><img src="${iconUrl}" style="width:40px;height:40px;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));"/><div style="position:absolute;top:-6px;right:-6px;background:#3b82f6;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;border:2px solid white;">${idx + 1}</div>${stop.scheduledTime ? `<div style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);background:rgba(11,31,69,0.9);color:#60a5fa;font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;white-space:nowrap;">${stop.scheduledTime}</div>` : ''}</div>`;
                            const icon = L.divIcon({ html, className: '', iconSize: [40, 58], iconAnchor: [20, 40] });
                            return <Marker key={`r-${stop.itemId}-${idx}`} position={[lat, lng]} icon={icon} />;
                          })}
                          {routeCoords.length > 0 && <MapAutoFitter coordinates={routeCoords} />}
                        </MapContainer>
                      </MapWrap>
                    </RouteContent>
                  )}
                </RoutesPanel>
              )}
            </EditorBody>
          </BuilderScreen>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default CuratedRoutesManager;
