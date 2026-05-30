import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, MapPin, Waves, TreePine, Save, X, Loader2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { CuratedRoute, TourTheme, CuratedRouteStop } from '../../data/types';
import { curatedRouteService } from '../../utils/bookingService';
import { useAttractions, useEnterprises, useHeritage } from '../../hooks/useData';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 { font-family: 'Outfit', sans-serif; font-size: 1.5rem; color: #e2ecf7; }

  button {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white; border: none; padding: 10px 20px; border-radius: 12px;
    font-size: 0.85rem; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    &:hover { box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
  }
`;

const RouteList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`;

const RouteCard = styled.div`
  background: rgba(11,31,69,0.5);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;

  .rc-bg {
    position: absolute; top: 0; left: 0; right: 0; height: 100px;
    background-size: cover; background-position: center; opacity: 0.2;
    z-index: 0;
  }

  > * { z-index: 1; position: relative; }

  .rc-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    .theme {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 20px;
      font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
      background: rgba(59,130,246,0.15); color: #60a5fa;
    }
    .actions {
      display: flex; gap: 8px;
      button { background: rgba(0,0,0,0.5); border-radius: 8px; border: none; color: #90aecb; cursor: pointer; padding: 6px; &:hover { color: white; background: rgba(0,0,0,0.8); } }
    }
  }

  h4 { font-family: 'Outfit', sans-serif; font-size: 1.2rem; color: #e2ecf7; margin-bottom: 4px; margin-top: 20px; }
  p { font-size: 0.8rem; color: #90aecb; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  
  .meta { display: flex; gap: 12px; font-size: 0.75rem; color: #5a7098; font-weight: 600; margin-top: auto; }
`;

const EditorOverlay = styled(motion.div)`
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
`;

const EditorPanel = styled(motion.div)`
  background: #0b1f45; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px; width: 100%; max-width: 900px; height: 85vh;
  display: flex; flex-direction: column; overflow: hidden;
`;

const EHeader = styled.div`
  padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; justify-content: space-between; align-items: center;
  h3 { font-family: 'Outfit', sans-serif; font-size: 1.3rem; color: #e2ecf7; }
  button { background: transparent; border: none; color: #5a7098; cursor: pointer; &:hover { color: white; } }
`;

const EBody = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  padding: 24px; flex: 1; overflow: hidden;
`;

const EColumn = styled.div`
  display: flex; flex-direction: column; gap: 20px;
  overflow-y: auto; padding-right: 8px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  h5 { font-family: 'Outfit', sans-serif; font-size: 1rem; color: #e2ecf7; margin: 0; }
  
  label { font-size: 0.7rem; font-weight: 700; color: #5a7098; text-transform: uppercase; margin-bottom: 6px; display: block; }
  input, select, textarea {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 10px 14px; color: white; font-size: 0.85rem; outline: none;
    &:focus { border-color: #3b82f6; }
  }
`;

const EFooter = styled.div`
  padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06);
  display: flex; justify-content: flex-end; gap: 12px;
  button {
    padding: 10px 20px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
    &.cancel { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #90aecb; }
    &.save { background: #3b82f6; border: none; color: white; }
  }
`;

const SearchBox = styled.div`
  position: relative;
  input { padding-left: 36px; }
  svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #5a7098; pointer-events: none; }
`;

const SearchResultList = styled.div`
  display: flex; flex-direction: column; gap: 8px;
  max-height: 200px; overflow-y: auto;
  border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 8px;
`;

const ResultItem = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px;
  .name { font-size: 0.8rem; color: #e2ecf7; font-weight: 600; }
  .type { font-size: 0.65rem; color: #5a7098; text-transform: uppercase; }
  button { background: rgba(59,130,246,0.15); color: #60a5fa; border: none; border-radius: 6px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; &:hover { background: #3b82f6; color: white; } }
`;

const StopsList = styled.div`
  display: flex; flex-direction: column; gap: 12px;
`;

const StopCard = styled.div`
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;
  .sc-head {
    display: flex; justify-content: space-between; align-items: center;
    .name { font-size: 0.85rem; color: white; font-weight: 700; }
    .actions { display: flex; gap: 4px; button { background: transparent; border: none; color: #5a7098; cursor: pointer; padding: 4px; &:hover { color: white; } } }
  }
  .sc-inputs {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    label { font-size: 0.6rem; margin-bottom: 4px; }
    input, select { padding: 6px 10px; font-size: 0.8rem; border-radius: 6px; }
  }
`;

const initialRoute: Partial<CuratedRoute> = {
  name: '', description: '', coverImage: '', theme: 'Seascape', estimatedDays: 1, difficulty: 'Moderate', isActive: true, stops: []
};

const CuratedRoutesManager: React.FC = () => {
  const [routes, setRoutes] = useState<CuratedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editing, setEditing] = useState<Partial<CuratedRoute> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: attractions } = useAttractions();
  const { data: enterprises } = useEnterprises();
  const { data: heritage } = useHeritage();

  const allItems = useMemo(() => {
    const a = attractions.map(x => ({ ...x, entityType: 'Attraction' as const }));
    const e = enterprises.map(x => ({ ...x, entityType: 'Enterprise' as const }));
    const h = heritage.map(x => ({ ...x, entityType: 'Heritage' as const }));
    return [...a, ...e, ...h];
  }, [attractions, enterprises, heritage]);

  useEffect(() => { loadRoutes(); }, []);

  const loadRoutes = () => {
    setLoading(true);
    curatedRouteService.getAll().then(res => { setRoutes(res); setLoading(false); });
  };

  const handleSave = async () => {
    if (!editing || !editing.name) return;
    
    const r: CuratedRoute = {
      ...editing,
      id: editing.id || `route-${Date.now()}`,
      createdAt: editing.createdAt || Date.now(),
      updatedAt: Date.now(),
      stops: editing.stops || []
    } as CuratedRoute;

    await curatedRouteService.save(r);
    setEditing(null);
    loadRoutes();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this curated route?")) {
      await curatedRouteService.delete(id);
      loadRoutes();
    }
  };

  const addStop = (item: any) => {
    if (!editing) return;
    const newStop: CuratedRouteStop = {
      itemId: item.id.toString(),
      entityType: item.entityType,
      itemName: item.name,
      dayIndex: 0,
      durationHours: 1
    };
    setEditing({ ...editing, stops: [...(editing.stops || []), newStop] });
  };

  const updateStop = (idx: number, updates: Partial<CuratedRouteStop>) => {
    if (!editing || !editing.stops) return;
    const newStops = [...editing.stops];
    newStops[idx] = { ...newStops[idx], ...updates };
    setEditing({ ...editing, stops: newStops });
  };

  const removeStop = (idx: number) => {
    if (!editing || !editing.stops) return;
    const newStops = [...editing.stops];
    newStops.splice(idx, 1);
    setEditing({ ...editing, stops: newStops });
  };

  const moveStop = (idx: number, dir: number) => {
    if (!editing || !editing.stops) return;
    if (idx + dir < 0 || idx + dir >= editing.stops.length) return;
    const newStops = [...editing.stops];
    const temp = newStops[idx];
    newStops[idx] = newStops[idx + dir];
    newStops[idx + dir] = temp;
    setEditing({ ...editing, stops: newStops });
  };

  const searchResults = allItems.filter(x => x.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);

  return (
    <Container>
      <HeaderRow>
        <h3>Curated Routes</h3>
        <button onClick={() => setEditing({ ...initialRoute })}><Plus size={16} /> New Route</button>
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
                <div className="theme">
                  {r.theme === 'Seascape' ? <Waves size={10} /> : <TreePine size={10} />} {r.theme}
                </div>
                <div className="actions">
                  <button onClick={() => setEditing(r)}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div>
                <h4>{r.name}</h4>
                <p>{r.description}</p>
              </div>
              <div className="meta">
                <span><MapPin size={10} /> {r.stops?.length || 0} Stops</span>
                <span>{r.estimatedDays} Days</span>
                <span>{r.difficulty}</span>
                <span style={{ color: r.isActive ? '#10b981' : '#ef4444', marginLeft: 'auto' }}>{r.isActive ? 'Active' : 'Draft'}</span>
              </div>
            </RouteCard>
          ))}
        </RouteList>
      )}

      <AnimatePresence>
        {editing && (
          <EditorOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EditorPanel initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <EHeader>
                <h3>{editing.id ? 'Edit Route' : 'New Route'}</h3>
                <button onClick={() => setEditing(null)}><X size={20} /></button>
              </EHeader>
              <EBody>
                {/* Left Column: Settings */}
                <EColumn>
                  <h5>Route Settings</h5>
                  <div>
                    <label>Route Name</label>
                    <input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div>
                    <label>Description</label>
                    <textarea rows={3} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                  </div>
                  <div>
                    <label>Cover Image URL</label>
                    <input placeholder="https://..." value={editing.coverImage || ''} onChange={e => setEditing({ ...editing, coverImage: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label>Theme</label>
                      <select value={editing.theme || 'Seascape'} onChange={e => setEditing({ ...editing, theme: e.target.value as TourTheme })}>
                        <option value="Seascape">Seascape</option>
                        <option value="Naturescape">Naturescape</option>
                      </select>
                    </div>
                    <div>
                      <label>Status</label>
                      <select value={editing.isActive ? 'active' : 'draft'} onChange={e => setEditing({ ...editing, isActive: e.target.value === 'active' })}>
                        <option value="active">Active (Visible)</option>
                        <option value="draft">Draft (Hidden)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label>Estimated Days</label>
                      <input type="number" min={1} value={editing.estimatedDays || 1} onChange={e => setEditing({ ...editing, estimatedDays: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div>
                      <label>Difficulty</label>
                      <select value={editing.difficulty || 'Moderate'} onChange={e => setEditing({ ...editing, difficulty: e.target.value as any })}>
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Challenging">Challenging</option>
                      </select>
                    </div>
                  </div>
                </EColumn>

                {/* Right Column: Stops Manager */}
                <EColumn style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 16 }}>
                  <h5>Manage Stops ({editing.stops?.length || 0})</h5>
                  
                  <SearchBox>
                    <Search size={16} />
                    <input placeholder="Search attractions to add..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </SearchBox>
                  
                  {searchQuery && (
                    <SearchResultList>
                      {searchResults.map(item => (
                        <ResultItem key={item.id}>
                          <div>
                            <div className="name">{item.name}</div>
                            <div className="type">{item.entityType}</div>
                          </div>
                          <button onClick={() => { addStop(item); setSearchQuery(''); }}><Plus size={14} /></button>
                        </ResultItem>
                      ))}
                      {searchResults.length === 0 && <div style={{ fontSize: '0.7rem', color: '#5a7098', textAlign: 'center', padding: '8px' }}>No results found</div>}
                    </SearchResultList>
                  )}

                  <StopsList>
                    {(editing.stops || []).map((stop, idx) => (
                      <StopCard key={`${stop.itemId}-${idx}`}>
                        <div className="sc-head">
                          <div className="name"><span style={{ color: '#3b82f6', marginRight: 6 }}>{idx + 1}.</span> {stop.itemName}</div>
                          <div className="actions">
                            <button onClick={() => moveStop(idx, -1)} disabled={idx === 0}><ArrowUp size={14} /></button>
                            <button onClick={() => moveStop(idx, 1)} disabled={idx === editing.stops!.length - 1}><ArrowDown size={14} /></button>
                            <button onClick={() => removeStop(idx)}><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </div>
                        <div className="sc-inputs">
                          <div>
                            <label>Day</label>
                            <select value={stop.dayIndex || 0} onChange={e => updateStop(idx, { dayIndex: parseInt(e.target.value) })}>
                              {Array.from({ length: editing.estimatedDays || 1 }).map((_, i) => (
                                <option key={i} value={i}>Day {i + 1}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label>Duration (Hrs)</label>
                            <input type="number" step="0.5" min="0.5" value={stop.durationHours || 1} onChange={e => updateStop(idx, { durationHours: parseFloat(e.target.value) || 1 })} />
                          </div>
                        </div>
                      </StopCard>
                    ))}
                  </StopsList>

                </EColumn>
              </EBody>
              <EFooter>
                <button className="cancel" onClick={() => setEditing(null)}>Cancel</button>
                <button className="save" onClick={handleSave}><Save size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}/> Save Route</button>
              </EFooter>
            </EditorPanel>
          </EditorOverlay>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default CuratedRoutesManager;
