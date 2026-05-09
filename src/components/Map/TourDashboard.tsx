import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, Check, Trash2, Play, Navigation } from 'lucide-react';
import { useUserTours } from '../../hooks/useUserTours';
import { CustomUserTour, UserTourDestination } from '../../data/types';
import { useAttractions, useEnterprises, useHeritage } from '../../hooks/useFirestore';
import { ATTRACTION_CATEGORIES, ENTERPRISE_CATEGORIES } from '../Admin/CategoryTagConfig';
import SharedCategoryScroller from '../Common/SharedCategoryScroller';
import { calculateDistance, formatDistance } from '../../utils/geoUtils';
import { getMediaUrl } from '../../utils/mediaUtils';

const ALL_CATEGORIES = [...ATTRACTION_CATEGORIES, ...ENTERPRISE_CATEGORIES];

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: var(--surface-bg);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px 32px;
  background: var(--surface-bg);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .titles {
    h1 { font-family: 'Playfair Display', serif; font-size: 2rem; color: var(--dark-blue); margin-bottom: 4px; }
    p { color: var(--text-light); font-size: 0.9rem; font-weight: 500; }
  }

  button.close {
    background: var(--light-bg);
    border: none;
    width: 48px; height: 48px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text-light);
    transition: all 0.2s;
    &:hover { background: var(--soft-blue); color: var(--text-dark); }
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    overflow-y: auto;
  }
`;

// Sidebar lists user tours
const TourListSidebar = styled.div`
  width: 350px;
  background: var(--light-bg);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-bottom: 2px solid rgba(148, 163, 184, 0.1);
  }
`;

const SelectTourCard = styled.div<{ $active: boolean }>`
  background: ${props => props.$active ? 'var(--surface-bg)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'var(--cta-blue)' : 'transparent'};
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${props => props.$active ? '0 10px 25px rgba(46, 117, 182, 0.1)' : 'none'};

  &:hover { background: var(--surface-bg); border-color: ${props => props.$active ? 'var(--cta-blue)' : 'rgba(148, 163, 184, 0.2)'}; }

  h3 { font-size: 1.1rem; color: var(--dark-blue); font-weight: 800; margin-bottom: 4px; }
  p { font-size: 0.8rem; color: var(--text-light); font-weight: 500; }
`;

const CreateBtn = styled.button`
  width: 100%;
  padding: 16px;
  background: var(--cta-blue);
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 24px;
  transition: background 0.2s;
  &:hover { background: var(--dark-blue); }
`;

// Builder View
const BuilderView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--surface-bg);
  overflow: hidden;
`;

const DetailHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;

  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
      .actions { flex-wrap: wrap; }
    }

    input.tour-name {
      font-size: 1.8rem;
      font-family: 'Playfair Display', serif;
      font-weight: 800;
      color: var(--dark-blue);
      border: none;
      outline: none;
      background: transparent;
      border-bottom: 2px dashed rgba(148, 163, 184, 0.3);
      padding-bottom: 4px;
      width: 100%;
      max-width: 400px;
      transition: border-color 0.2s;
      &:focus { border-color: var(--cta-blue); }
      
      @media (max-width: 768px) {
        font-size: 1.5rem;
        max-width: 100%;
      }
    }

    .actions { display: flex; gap: 12px; }
    
    button.action-btn {
      padding: 10px 20px;
      border-radius: 30px;
      font-weight: 800;
      font-size: 0.85rem;
      border: none;
      cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.2s;

      @media (max-width: 768px) {
        flex: 1;
        justify-content: center;
      }

      &.primary { background: var(--cta-blue); color: white; &:hover { background: var(--dark-blue); transform: translateY(-2px); }}
      &.play { background: #10b981; color: white; &:hover { background: #059669; transform: translateY(-2px); }}
      &.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; &:hover { background: rgba(239, 68, 68, 0.2); }}
    }
  }
`;

const BuilderContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  
  @media (max-width: 768px) {
    flex-direction: column-reverse;
    overflow-y: auto;
  }
`;

const SelectedList = styled.div`
  width: 300px;
  background: var(--light-bg);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  padding: 24px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-top: 2px solid rgba(148, 163, 184, 0.1);
    min-height: 250px;
  }
  
  h4 { font-size: 0.9rem; color: var(--dark-blue); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }

  .dest-card {
    background: var(--surface-bg);
    padding: 12px;
    border-radius: 12px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    border: 1px solid rgba(148, 163, 184, 0.1);
    
    .num { font-weight: 800; color: var(--cta-blue); margin-right: 12px; font-size: 1.2rem; }
    .info { flex: 1; overflow: hidden; }
    .info h5 { font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--dark-blue); }
    .info p { font-size: 0.65rem; color: var(--text-light); text-transform: uppercase; font-weight: 800; }
    button { background: none; border: none; color: #94a3b8; cursor: pointer; &:hover { color: #ef4444; } }
  }

  .distance-divider {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: -8px 0 2px 28px;
    padding: 0;
    position: relative;
    
    .line { width: 2px; height: 18px; background: rgba(148, 163, 184, 0.1); }
    .val { 
        font-size: 0.65rem; 
        font-weight: 800; 
        color: var(--cta-blue); 
        background: #f0f7ff; 
        padding: 2px 8px; 
        border-radius: 10px; 
        margin: -4px 0;
        z-index: 1;
        border: 1px solid rgba(46,117,182,0.1);
    }
  }
`;

const CatalogArea = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  .search-bar {
    display: flex;
    align-items: center;
    background: var(--light-bg);
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 24px;
    input { flex: 1; background: transparent; border: none; outline: none; margin-left: 12px; font-weight: 500; }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
`;

const CatalogCard = styled.div<{ $selected: boolean }>`
  background: var(--surface-bg);
  border: 2px solid ${props => props.$selected ? 'var(--cta-blue)' : 'rgba(148, 163, 184, 0.1)'};
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  &:hover { border-color: var(--cta-blue); transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }

  .img { 
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-size: cover; background-position: center; 
    z-index: 0;
    -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
  }
  
  .info { padding: 12px; position: relative; z-index: 1; text-shadow: none; }
  h5 { font-size: 0.9rem; margin-bottom: 2px; color: var(--dark-blue); font-weight: 800; }
  p { font-size: 0.7rem; color: var(--text-light); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

  .check {
    position: absolute; top: 12px; right: 12px;
    background: var(--cta-blue); color: white;
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    opacity: ${props => props.$selected ? 1 : 0};
    transform: ${props => props.$selected ? 'scale(1)' : 'scale(0.8)'};
    transition: all 0.2s;
    z-index: 2;
  }
`;

interface Props {
  userId: string;
  onClose: () => void;
  onPlayTour: (tour: CustomUserTour) => void;
}

export default function TourDashboard({ userId, onClose, onPlayTour }: Props) {
  const { tours, saveTour, deleteTour } = useUserTours();
  
  const { data: att } = useAttractions();
  const { data: acc } = useEnterprises();
  const { data: her } = useHeritage();

  const [activeTour, setActiveTour] = useState<CustomUserTour | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const allItems = useMemo(() => [
    ...att.map(a => ({ ...a, entityType: 'Attraction' })),
    ...acc.map(a => ({ ...a, entityType: 'Enterprise' })),
    ...her.map(a => ({ ...a, entityType: 'Heritage' }))
  ], [att, acc, her]);

  const filteredItems = useMemo(() => {
    let filtered = allItems;
    if (search) {
      filtered = filtered.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(i => {
        const itemAny = i as any;
        const cats = Array.isArray(itemAny.categories) ? itemAny.categories : [itemAny.category || itemAny.type || itemAny.entityType];
        return selectedCategories.some(sc => cats.some((c: string) => c?.toLowerCase() === sc.toLowerCase()));
      });
    }
    return filtered;
  }, [allItems, search, selectedCategories]);

  const handleCreateNew = () => {
    setActiveTour({
      id: Date.now().toString(),
      userId,
      name: 'My New Tour Guide',
      destinations: [],
      createdAt: Date.now()
    });
  };

  const toggleDestination = (item: any) => {
    if (!activeTour) return;
    const exists = activeTour.destinations.some(d => d.itemId === (item.firebaseId || item.id).toString());
    if (exists) {
      setActiveTour({
        ...activeTour,
        destinations: activeTour.destinations.filter(d => d.itemId !== (item.firebaseId || item.id).toString())
      });
    } else {
      setActiveTour({
        ...activeTour,
        destinations: [...activeTour.destinations, { itemId: (item.firebaseId || item.id).toString(), entityType: item.entityType, completed: false }]
      });
    }
  };

  const handleSave = async () => {
    if (activeTour) {
        await saveTour(activeTour);
        // Do not unselect, let user keep editing or choose to play
    }
  };

  const activeTourDestItems = activeTour?.destinations.map(d => {
    return allItems.find(i => (i.firebaseId || i.id).toString() === d.itemId);
  }).filter(Boolean);

  return (
    <Overlay initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
      <Header>
        <div className="titles">
          <h1>Travel Guide Dashboard</h1>
          <p>Create and sync personal travel itineraries.</p>
        </div>
        <button className="close" onClick={onClose}><X size={24} /></button>
      </Header>

      <ContentArea>
        <TourListSidebar>
          <CreateBtn onClick={handleCreateNew}><Plus size={18} /> Create New Guide</CreateBtn>
          {(tours || []).map(t => (
            <SelectTourCard key={t.id} $active={activeTour?.id === t.id} onClick={() => setActiveTour(t)}>
              <h3>{t.name}</h3>
              <p>{t.destinations.length} Destinations</p>
            </SelectTourCard>
          ))}
        </TourListSidebar>

        <BuilderView>
          {activeTour ? (
            <>
              <DetailHeader>
                <div className="top-row">
                  <input 
                    className="tour-name"
                    value={activeTour.name}
                    onChange={(e) => setActiveTour({ ...activeTour, name: e.target.value })}
                  />
                  <div className="actions">
                    <button className="action-btn danger" onClick={() => { deleteTour(activeTour.id); setActiveTour(null); }}><Trash2 size={16}/> Delete</button>
                    <button className="action-btn primary" onClick={handleSave}><Check size={16}/> Save Guide</button>
                    <button className="action-btn play" onClick={() => { saveTour(activeTour); onPlayTour(activeTour); }}><Play size={16} fill="white" /> Play Tour</button>
                  </div>
                </div>
              </DetailHeader>

              <BuilderContent>
                <SelectedList>
                  <h4>Tour Route</h4>
                  {activeTourDestItems?.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No destinations added yet. Select from the catalog.</p>
                  ) : (
                    activeTourDestItems?.map((item: any, i) => {
                      const nextItem = activeTourDestItems[i + 1];
                      let distanceText = "";
                      if (nextItem && item.coordinates && nextItem.coordinates) {
                        const d = calculateDistance(
                          item.coordinates.lat, item.coordinates.lng,
                          nextItem.coordinates.lat, nextItem.coordinates.lng
                        );
                        distanceText = formatDistance(d);
                      }

                      return (
                        <React.Fragment key={`${item.firebaseId || item.id}-${i}`}>
                          <div className="dest-card">
                            <div className="num">{i + 1}</div>
                            <div className="info">
                              <h5>{item.name}</h5>
                              <p>{item.entityType}</p>
                            </div>
                            <button onClick={() => toggleDestination(item)}><X size={16}/></button>
                          </div>
                          {distanceText && (
                            <div className="distance-divider">
                              <div className="line" />
                              <div className="val">{distanceText} to next stop</div>
                              <div className="line" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </SelectedList>

                <CatalogArea>
                  <div className="search-bar">
                    <Search size={18} color="#94a3b8" />
                    <input type="text" placeholder="Search places to add..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <SharedCategoryScroller
                      categories={ALL_CATEGORIES}
                      activeCategories={selectedCategories}
                      onSelect={setSelectedCategories}
                    />
                  </div>

                  <div className="grid">
                    {filteredItems.map((item: any) => {
                      const isSelected = activeTour?.destinations.some(d => d.itemId === (item.firebaseId || item.id).toString());
                      return (
                        <CatalogCard key={`${item.entityType}-${item.id}`} $selected={!!isSelected} onClick={() => toggleDestination(item)}>
                          <div className="img" style={{ backgroundImage: `url(${getMediaUrl(item.photos?.[0] || item.img || '')})` }} />
                          <div className="check"><Check size={14} /></div>
                          <div className="info">
                            <h5>{item.name}</h5>
                            <p>{item.entityType}</p>
                          </div>
                        </CatalogCard>
                      );
                    })}
                  </div>
                </CatalogArea>
              </BuilderContent>
            </>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8' }}>
              <Navigation size={64} style={{ marginBottom: 16, opacity: 0.2 }} />
              <h3>Select or Create a Tour Guide</h3>
            </div>
          )}
        </BuilderView>
      </ContentArea>
    </Overlay>
  );
}
