import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, MapPin, Waves, TreePine, Save, X,
  Loader2, ArrowUp, ArrowDown, ChevronLeft, Filter, Check, Map as MapIcon
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CuratedRoute, TourTheme, CuratedRouteStop } from '../../data/types';
import { curatedRouteService } from '../../utils/bookingService';
import { useAttractions, useEnterprises, useHeritage } from '../../hooks/useData';
import { getMediaUrl } from '../../utils/mediaUtils';
import { ATTRACTION_CATEGORIES, ENTERPRISE_CATEGORIES, getMapIconUrl } from './CategoryTagConfig';

// ─── Styled: Route List ───────────────────────────────────────────────────────

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

const RouteCard = styled.div`
  background: rgba(11,31,69,0.5); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 12px;
  position: relative; overflow: hidden;
  .rc-bg { position: absolute; top: 0; left: 0; right: 0; height: 120px; background-size: cover; background-position: center; opacity: 0.2; z-index: 0; }
  > * { z-index: 1; position: relative; }
  .rc-header { display: flex; justify-content: space-between; align-items: flex-start;
    .theme { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; background: rgba(59,130,246,0.15); color: #60a5fa; }
    .actions { display: flex; gap: 8px; button { background: rgba(0,0,0,0.5); border-radius: 8px; border: none; color: #90aecb; cursor: pointer; padding: 6px; &:hover { color: white; background: rgba(0,0,0,0.8); } } }
  }
  h4 { font-family: 'Outfit', sans-serif; font-size: 1.2rem; color: #e2ecf7; margin-bottom: 4px; margin-top: 20px; }
  p { font-size: 0.8rem; color: #90aecb; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { display: flex; gap: 12px; font-size: 0.75rem; color: #5a7098; font-weight: 600; margin-top: auto; align-items: center; }
`;

// ─── Styled: Full-Screen Builder ──────────────────────────────────────────────

const BuilderScreen = styled(motion.div)`
  position: fixed; inset: 0; z-index: 2000;
  background: #050d1e; display: flex; flex-direction: column;
`;

const TopBar = styled.div`
  height: 64px; flex-shrink: 0;
  background: rgba(11,31,69,0.95); border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: space-between; padding: 0 24px; gap: 16px;
  backdrop-filter: blur(12px);
`;

const TopBarLeft = styled.div`
  display: flex; align-items: center; gap: 16px;
  .back-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #90aecb; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; &:hover { background: rgba(255,255,255,0.1); color: white; } }
  .route-name { font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 800; color: #e2ecf7; }
  .tab-pills { display: flex; gap: 4px; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 12px; }
`;

const TabPill = styled.button<{ $active: boolean }>`
  padding: 6px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s;
  background: ${p => p.$active ? '#3b82f6' : 'transparent'}; color: ${p => p.$active ? 'white' : '#5a7098'};
  &:hover { color: white; }
`;

const SaveBtn = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border: none; color: white;
  padding: 10px 24px; border-radius: 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  &:hover { box-shadow: 0 8px 24px rgba(59,130,246,0.4); transform: translateY(-1px); }
`;

const BuilderBody = styled.div`
  flex: 1; display: flex; min-height: 0;
`;

// ─── Settings Panel ───────────────────────────────────────────────────────────

const SettingsPanel = styled.div`
  width: 320px; flex-shrink: 0; background: rgba(11,31,69,0.8);
  border-right: 1px solid rgba(255,255,255,0.06);
  overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  h5 { font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 800; color: #e2ecf7; margin: 0; }
  label { font-size: 0.7rem; font-weight: 700; color: #5a7098; text-transform: uppercase; margin-bottom: 6px; display: block; }
  input, select, textarea {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 10px 14px; color: white; font-size: 0.85rem; outline: none; box-sizing: border-box;
    &:focus { border-color: #3b82f6; }
  }
`;

const CoverPreview = styled.div<{ $src: string }>`
  width: 100%; height: 100px; border-radius: 10px; background: rgba(255,255,255,0.05);
  background-image: url(${p => p.$src}); background-size: cover; background-position: center;
  border: 1px solid rgba(255,255,255,0.1); overflow: hidden;
`;

// ─── Stop Builder Panel ───────────────────────────────────────────────────────

const StopBuilderPanel = styled.div`
  flex: 1; display: flex; flex-direction: column; min-width: 0;
`;

const DayRow = styled.div`
  padding: 12px 16px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; gap: 8px; flex-shrink: 0; overflow-x: auto;
  &::-webkit-scrollbar { height: 0; }
`;

const DayTab = styled.button<{ $active: boolean }>`
  padding: 6px 16px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; cursor: pointer; white-space: nowrap; transition: all 0.2s; border: 1px solid;
  background: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.05)'};
  color: ${p => p.$active ? 'white' : '#90aecb'};
  border-color: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
  &:hover { color: white; background: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; }
`;

const CategoryRow = styled.div`
  padding: 10px 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid rgba(255,255,255,0.04);
  display: flex; align-items: center; gap: 8px; flex-shrink: 0; overflow-x: auto;
  &::-webkit-scrollbar { height: 0; }
`;

const CatChip = styled.button<{ $active: boolean }>`
  padding: 5px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; cursor: pointer; border: 1px solid;
  background: ${p => p.$active ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.03)'};
  color: ${p => p.$active ? '#60a5fa' : '#5a7098'};
  border-color: ${p => p.$active ? '#3b82f6' : 'rgba(255,255,255,0.08)'};
  transition: all 0.15s;
  &:hover { color: white; border-color: rgba(59,130,246,0.5); }
`;

const BuilderMain = styled.div`
  flex: 1; display: flex; min-height: 0;
`;

const ItemSidebar = styled.div`
  width: 360px; flex-shrink: 0; background: rgba(0,0,0,0.15); border-right: 1px solid rgba(255,255,255,0.06);
  overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 12px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const CardImage = styled.div<{ $src: string }>`
  position: absolute; top: 0; left: 0; width: 85px; height: 100%;
  background-image: url(${p => getMediaUrl(p.$src)}); background-size: cover; background-position: center; z-index: 0;
  -webkit-mask-image: linear-gradient(to right, black 20%, transparent 100%);
  mask-image: linear-gradient(to right, black 20%, transparent 100%);
`;

const ItemCard = styled.div<{ $added: boolean }>`
  background: ${p => p.$added ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${p => p.$added ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'};
  border-radius: 20px; display: flex; align-items: center; justify-content: space-between;
  position: relative; overflow: hidden; height: 72px; flex-shrink: 0; cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: ${p => p.$added ? 'rgba(16,185,129,0.6)' : 'rgba(59,130,246,0.4)'}; background: ${p => p.$added ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.06)'}; }

  .content { position: relative; z-index: 1; padding: 8px 10px 8px 90px; flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  h5 { font-family: 'Outfit', sans-serif; font-size: 0.82rem; color: #e2ecf7; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .type { font-size: 0.58rem; color: ${p => p.$added ? '#10b981' : '#5a7098'}; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
  .action { position: relative; z-index: 1; padding-right: 12px;
    button { width: 32px; height: 32px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      background: ${p => p.$added ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.15)'}; color: ${p => p.$added ? '#10b981' : '#60a5fa'};
      &:hover { background: ${p => p.$added ? '#10b981' : '#3b82f6'}; color: white; }
    }
  }
`;

const MapWrap = styled.div`flex: 1; background: #050d1e;`;

const AddedBar = styled.div`
  padding: 12px 16px; background: rgba(11,31,69,0.95); backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 10px;
  overflow-x: auto; flex-shrink: 0; min-height: 56px;
  &::-webkit-scrollbar { height: 0; }
  .label { font-size: 0.72rem; font-weight: 800; color: #5a7098; white-space: nowrap; }
`;

const StopChip = styled.div`
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px;
  padding: 5px 12px; font-size: 0.7rem; font-weight: 700; color: #e2ecf7;
  display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0;
  .num { background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; color: white; }
  button { background: none; border: none; color: #5a7098; cursor: pointer; padding: 0; display: flex; &:hover { color: #ef4444; } }
`;

// ─── Map Auto-Fitter ──────────────────────────────────────────────────────────

const MapAutoFitter: React.FC<{ coordinates: [number, number][] }> = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [50, 50], maxZoom: 14 });
    }
  }, [coordinates, map]);
  return null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  { label: 'All', icon: '' },
  ...ATTRACTION_CATEGORIES.map(c => ({ label: c.label, icon: c.icon })),
  ...ENTERPRISE_CATEGORIES.map(c => ({ label: c.label, icon: c.icon })),
].filter((c, i, arr) => arr.findIndex(x => x.label === c.label) === i);

const initialRoute = (): Partial<CuratedRoute> => ({
  name: '', description: '', coverImage: '', theme: 'Seascape', estimatedDays: 1, difficulty: 'Moderate', isActive: true, stops: []
});

// ─── Main Component ───────────────────────────────────────────────────────────

const CuratedRoutesManager: React.FC = () => {
  const [routes, setRoutes] = useState<CuratedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<CuratedRoute> | null>(null);
  const [saving, setSaving] = useState(false);

  // Builder state
  const [activeTab, setActiveTab] = useState<'settings' | 'builder'>('settings');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: attractions } = useAttractions();
  const { data: enterprises } = useEnterprises();
  const { data: heritage } = useHeritage();

  const allItems = useMemo(() => [
    ...attractions.map(x => ({ ...x, entityType: 'Attraction' as const })),
    ...enterprises.map(x => ({ ...x, entityType: 'Enterprise' as const })),
    ...heritage.map(x => ({ ...x, entityType: 'Heritage' as const })),
  ], [attractions, enterprises, heritage]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return allItems;
    return allItems.filter(item => {
      const cats = Array.isArray((item as any).categories)
        ? (item as any).categories
        : [(item as any).category || (item as any).type || ''];
      return cats.some((c: string) => c?.toLowerCase() === selectedCategory.toLowerCase());
    });
  }, [allItems, selectedCategory]);

  useEffect(() => { loadRoutes(); }, []);

  const loadRoutes = () => {
    setLoading(true);
    curatedRouteService.getAll().then(res => { setRoutes(res); setLoading(false); });
  };

  const openNew = () => { setEditing(initialRoute()); setActiveTab('settings'); setSelectedDayIndex(0); };
  const openEdit = (r: CuratedRoute) => { setEditing({ ...r }); setActiveTab('settings'); setSelectedDayIndex(0); };
  const closeEditor = () => setEditing(null);

  const handleSave = async () => {
    if (!editing || !editing.name) return;
    setSaving(true);
    const r: CuratedRoute = {
      ...editing,
      id: editing.id || `route-${Date.now()}`,
      createdAt: editing.createdAt || Date.now(),
      updatedAt: Date.now(),
      stops: editing.stops || []
    } as CuratedRoute;
    await curatedRouteService.save(r);
    setSaving(false);
    setEditing(null);
    loadRoutes();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this route?")) { await curatedRouteService.delete(id); loadRoutes(); }
  };

  const toggleStop = useCallback((item: any) => {
    setEditing(prev => {
      if (!prev) return prev;
      const stops = prev.stops || [];
      const exists = stops.find(s => s.itemId === item.id.toString() && s.dayIndex === selectedDayIndex);
      if (exists) return { ...prev, stops: stops.filter(s => !(s.itemId === item.id.toString() && s.dayIndex === selectedDayIndex)) };
      const newStop: CuratedRouteStop = {
        itemId: item.id.toString(), entityType: item.entityType, itemName: item.name, dayIndex: selectedDayIndex, durationHours: 1
      };
      return { ...prev, stops: [...stops, newStop] };
    });
  }, [selectedDayIndex]);

  const removeStop = (idx: number) => {
    setEditing(prev => { if (!prev) return prev; const s = [...(prev.stops || [])]; s.splice(idx, 1); return { ...prev, stops: s }; });
  };
  const moveStop = (idx: number, dir: number) => {
    setEditing(prev => {
      if (!prev) return prev;
      const s = [...(prev.stops || [])];
      if (idx + dir < 0 || idx + dir >= s.length) return prev;
      [s[idx], s[idx + dir]] = [s[idx + dir], s[idx]];
      return { ...prev, stops: s };
    });
  };

  const currentDayStops = useMemo(() => (editing?.stops || []).filter(s => s.dayIndex === selectedDayIndex), [editing?.stops, selectedDayIndex]);

  const polylineCoords = useMemo<[number, number][]>(() => {
    return currentDayStops.map(stop => {
      const item = allItems.find(i => i.id.toString() === stop.itemId);
      if (!item) return null;
      const lat = (item as any).lat || (item as any).coordinates?.lat;
      const lng = (item as any).lng || (item as any).coordinates?.lng;
      return lat && lng ? [lat, lng] as [number, number] : null;
    }).filter(Boolean) as [number, number][];
  }, [currentDayStops, allItems]);

  return (
    <Container>
      <HeaderRow>
        <h3>Curated Routes</h3>
        <button onClick={openNew}><Plus size={16} /> New Route</button>
      </HeaderRow>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} className="animate-spin" color="#3b82f6" /></div>
      ) : routes.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#5a7098' }}>No curated routes yet. Create one above!</div>
      ) : (
        <RouteList>
          {routes.map(r => (
            <RouteCard key={r.id}>
              {r.coverImage && <div className="rc-bg" style={{ backgroundImage: `url(${r.coverImage})` }} />}
              <div className="rc-header">
                <div className="theme">{r.theme === 'Seascape' ? <Waves size={10} /> : <TreePine size={10} />} {r.theme}</div>
                <div className="actions">
                  <button onClick={() => openEdit(r)}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <h4>{r.name}</h4>
              <p>{r.description}</p>
              <div className="meta">
                <MapPin size={10} /> {r.stops?.length || 0} Stops &nbsp;·&nbsp; {r.estimatedDays} Days &nbsp;·&nbsp; {r.difficulty}
                <span style={{ color: r.isActive ? '#10b981' : '#ef4444', marginLeft: 'auto' }}>{r.isActive ? 'Active' : 'Draft'}</span>
              </div>
            </RouteCard>
          ))}
        </RouteList>
      )}

      {/* ─── Full-Screen Builder ─── */}
      <AnimatePresence>
        {editing && (
          <BuilderScreen initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }}>
            {/* Top bar */}
            <TopBar>
              <TopBarLeft>
                <button className="back-btn" onClick={closeEditor}><ChevronLeft size={18} /></button>
                <span className="route-name">{editing.name || 'New Curated Route'}</span>
                <div className="tab-pills">
                  <TabPill $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>⚙ Settings</TabPill>
                  <TabPill $active={activeTab === 'builder'} onClick={() => setActiveTab('builder')}><MapIcon size={12} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />Stop Builder</TabPill>
                </div>
              </TopBarLeft>
              <SaveBtn onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving…' : 'Save Route'}
              </SaveBtn>
            </TopBar>

            <BuilderBody>
              {/* Settings Panel (always visible on left) */}
              {activeTab === 'settings' && (
                <SettingsPanel>
                  <h5>Route Details</h5>
                  <div><label>Route Name</label><input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Seascape Adventure" /></div>
                  <div><label>Description</label><textarea rows={4} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
                  <div>
                    <label>Cover Image URL</label>
                    <input placeholder="https://..." value={editing.coverImage || ''} onChange={e => setEditing({ ...editing, coverImage: e.target.value })} />
                    {editing.coverImage && <CoverPreview $src={editing.coverImage} style={{ marginTop: 8 }} />}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label>Estimated Days</label>
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

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <h5 style={{ marginBottom: 12 }}>Stops Summary ({editing.stops?.length || 0})</h5>
                    {(editing.stops || []).map((stop, idx) => (
                      <div key={`${stop.itemId}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ background: '#3b82f6', color: 'white', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>{idx + 1}</span>
                        <span style={{ flex: 1, fontSize: '0.8rem', color: '#e2ecf7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.itemName}</span>
                        <span style={{ fontSize: '0.65rem', color: '#5a7098', flexShrink: 0 }}>Day {(stop.dayIndex || 0) + 1}</span>
                        <button onClick={() => moveStop(idx, -1)} style={{ background: 'transparent', border: 'none', color: '#5a7098', cursor: 'pointer', padding: 2 }}><ArrowUp size={12} /></button>
                        <button onClick={() => moveStop(idx, 1)} style={{ background: 'transparent', border: 'none', color: '#5a7098', cursor: 'pointer', padding: 2 }}><ArrowDown size={12} /></button>
                        <button onClick={() => removeStop(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
                      </div>
                    ))}
                    {(editing.stops || []).length === 0 && (
                      <div style={{ color: '#5a7098', fontSize: '0.8rem', padding: '12px 0', textAlign: 'center' }}>
                        No stops yet. <button onClick={() => setActiveTab('builder')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Open Builder →</button>
                      </div>
                    )}
                  </div>
                </SettingsPanel>
              )}

              {/* Builder Panel */}
              {activeTab === 'builder' && (
                <StopBuilderPanel>
                  {/* Day tabs */}
                  <DayRow>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#5a7098', flexShrink: 0 }}>DAY:</span>
                    {Array.from({ length: editing.estimatedDays || 1 }).map((_, i) => (
                      <DayTab key={i} $active={selectedDayIndex === i} onClick={() => setSelectedDayIndex(i)}>
                        Day {i + 1} <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>({(editing.stops || []).filter(s => s.dayIndex === i).length})</span>
                      </DayTab>
                    ))}
                  </DayRow>

                  {/* Category filters */}
                  <CategoryRow>
                    <Filter size={12} color="#5a7098" style={{ flexShrink: 0 }} />
                    {ALL_CATEGORIES.map(cat => (
                      <CatChip key={cat.label} $active={selectedCategory === cat.label} onClick={() => setSelectedCategory(cat.label)}>
                        {cat.label}
                      </CatChip>
                    ))}
                  </CategoryRow>

                  {/* Main: sidebar + map */}
                  <BuilderMain>
                    <ItemSidebar>
                      {filteredItems.map(item => {
                        const added = (editing.stops || []).some(s => s.itemId === item.id.toString() && s.dayIndex === selectedDayIndex);
                        const img = (item as any).images?.[0] || (item as any).coverImage || '';
                        return (
                          <ItemCard key={item.id} $added={added} onClick={() => toggleStop(item)}>
                            {img && <CardImage $src={img} />}
                            <div className="content">
                              <h5>{item.name}</h5>
                              <div className="type">{item.entityType} {added && '· Added'}</div>
                            </div>
                            <div className="action">
                              <button onClick={e => { e.stopPropagation(); toggleStop(item); }}>
                                {added ? <Check size={14} /> : <Plus size={14} />}
                              </button>
                            </div>
                          </ItemCard>
                        );
                      })}
                      {filteredItems.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: '#5a7098', fontSize: '0.85rem' }}>No items found for this category.</div>
                      )}
                    </ItemSidebar>

                    {/* Map */}
                    <MapWrap>
                      <MapContainer center={[12.7533, 124.0933]} zoom={12} zoomControl={false} style={{ width: '100%', height: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        {polylineCoords.length > 1 && <Polyline positions={polylineCoords} color="#3b82f6" weight={4} dashArray="8, 8" />}
                        {currentDayStops.map((stop, idx) => {
                          const item = allItems.find(i => i.id.toString() === stop.itemId);
                          if (!item) return null;
                          const lat = (item as any).lat || (item as any).coordinates?.lat;
                          const lng = (item as any).lng || (item as any).coordinates?.lng;
                          if (!lat || !lng) return null;
                          const cats = Array.isArray((item as any).categories) ? (item as any).categories : [(item as any).category || (item as any).type || 'Others'];
                          const iconUrl = getMapIconUrl(cats[0] || 'Others');
                          const html = `<div style="position:relative;"><img src="${iconUrl}" style="width:40px;height:40px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));"/><div style="position:absolute;top:-6px;right:-6px;background:#3b82f6;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;border:2px solid white;">${idx + 1}</div></div>`;
                          const icon = L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 40] });
                          return <Marker key={`m-${stop.itemId}`} position={[lat, lng]} icon={icon} />;
                        })}
                        {/* Unselected faded pins */}
                        {filteredItems.map(item => {
                          const isAdded = currentDayStops.some(s => s.itemId === item.id.toString());
                          if (isAdded) return null;
                          const lat = (item as any).lat || (item as any).coordinates?.lat;
                          const lng = (item as any).lng || (item as any).coordinates?.lng;
                          if (!lat || !lng) return null;
                          const cats = Array.isArray((item as any).categories) ? (item as any).categories : [(item as any).category || (item as any).type || 'Others'];
                          const iconUrl = getMapIconUrl(cats[0] || 'Others');
                          const html = `<img src="${iconUrl}" style="width:28px;height:28px;opacity:0.45;filter:grayscale(0.3);"/>`;
                          const icon = L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 28] });
                          return <Marker key={`f-${item.id}`} position={[lat, lng]} icon={icon} />;
                        })}
                        {polylineCoords.length > 0 && <MapAutoFitter coordinates={polylineCoords} />}
                      </MapContainer>
                    </MapWrap>
                  </BuilderMain>

                  {/* Bottom added-stops bar */}
                  <AddedBar>
                    <span className="label">{currentDayStops.length} Stop{currentDayStops.length !== 1 ? 's' : ''} — Day {selectedDayIndex + 1}:</span>
                    {currentDayStops.map((s, idx) => (
                      <StopChip key={s.itemId}>
                        <span className="num">{idx + 1}</span>
                        {s.itemName}
                        <button onClick={() => removeStop((editing.stops || []).findIndex(x => x.itemId === s.itemId && x.dayIndex === selectedDayIndex))}><X size={10} /></button>
                      </StopChip>
                    ))}
                    {currentDayStops.length === 0 && <span style={{ fontSize: '0.75rem', color: '#5a7098' }}>Click items on the left or pins on the map to add stops.</span>}
                  </AddedBar>
                </StopBuilderPanel>
              )}
            </BuilderBody>
          </BuilderScreen>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default CuratedRoutesManager;
