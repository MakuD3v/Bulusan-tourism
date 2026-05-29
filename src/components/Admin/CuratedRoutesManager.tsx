import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, MapPin, Waves, TreePine, Save, X, Loader2 } from 'lucide-react';
import { CuratedRoute, TourTheme } from '../../data/types';
import { curatedRouteService } from '../../utils/bookingService';
import { useAttractions, useEnterprises } from '../../hooks/useData';

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
      button { background: transparent; border: none; color: #5a7098; cursor: pointer; padding: 4px; &:hover { color: #e2ecf7; } }
    }
  }

  h4 { font-family: 'Outfit', sans-serif; font-size: 1.2rem; color: #e2ecf7; margin-bottom: 4px; }
  p { font-size: 0.8rem; color: #90aecb; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  
  .meta { display: flex; gap: 16px; font-size: 0.75rem; color: #5a7098; font-weight: 600; margin-top: auto; }
`;

const EditorOverlay = styled(motion.div)`
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
`;

const EditorPanel = styled(motion.div)`
  background: #0b1f45; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px; width: 100%; max-width: 600px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
`;

const EHeader = styled.div`
  padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; justify-content: space-between; align-items: center;
  h3 { font-family: 'Outfit', sans-serif; font-size: 1.3rem; color: #e2ecf7; }
  button { background: transparent; border: none; color: #5a7098; cursor: pointer; &:hover { color: white; } }
`;

const EBody = styled.div`
  padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;
  
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

const initialRoute: Partial<CuratedRoute> = {
  name: '', description: '', theme: 'Seascape', estimatedDays: 1, difficulty: 'Moderate', isActive: true, stops: []
};

const CuratedRoutesManager: React.FC = () => {
  const [routes, setRoutes] = useState<CuratedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editing, setEditing] = useState<Partial<CuratedRoute> | null>(null);

  const { data: attractions } = useAttractions();
  const { data: enterprises } = useEnterprises();

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
                <span>{r.estimatedDays} Days</span>
                <span>&bull;</span>
                <span>{r.difficulty}</span>
                <span>&bull;</span>
                <span style={{ color: r.isActive ? '#10b981' : '#ef4444' }}>{r.isActive ? 'Active' : 'Draft'}</span>
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
                <div>
                  <label>Route Name</label>
                  <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label>Description</label>
                  <textarea rows={3} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label>Theme</label>
                    <select value={editing.theme} onChange={e => setEditing({ ...editing, theme: e.target.value as TourTheme })}>
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
                    <input type="number" min={1} value={editing.estimatedDays} onChange={e => setEditing({ ...editing, estimatedDays: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label>Difficulty</label>
                    <select value={editing.difficulty} onChange={e => setEditing({ ...editing, difficulty: e.target.value as any })}>
                      <option value="Easy">Easy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Challenging">Challenging</option>
                    </select>
                  </div>
                </div>
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
