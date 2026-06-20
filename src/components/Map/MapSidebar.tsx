import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Search, MapPin, Loader2, X, ChevronRight, Star, Zap, TrendingUp, Award, Users } from 'lucide-react';
import { ATTRACTION_CATEGORIES, ENTERPRISE_CATEGORIES } from '../Admin/CategoryTagConfig';
import SharedCategoryScroller from '../Common/SharedCategoryScroller';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../../utils/mediaUtils';
import { getDynamicTags } from '../../utils/tagUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--surface-bg);

  /* Desktop: must fill the sidebar's fixed height */
  @media (min-width: 1024px) {
    height: 100%;
  }
`;

const ClassicHeader = styled.div`
  padding: 16px 24px 8px;
  background: var(--surface-bg);
  
  .label {
    text-transform: uppercase;
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 2px;
    color: var(--cta-blue);
    margin-bottom: 6px;
  }
  
  h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--dark-blue);
    line-height: 1.1;
    margin-bottom: 4px;

    @media (min-width: 1024px) {
      font-size: 1.6rem;
      margin-bottom: 8px;
    }
  }
  
  p {
    font-size: 0.75rem;
    color: var(--text-light);
    font-weight: 500;
    margin-bottom: 8px;

    /* Hide sub-description on mobile to save space */
    @media (max-width: 1023px) {
      display: none;
    }
  }
`;

const TourButton = styled.button`
  width: 100%;
  max-width: 320px;
  padding: 10px;
  background: var(--surface-bg);
  border: 1px dashed var(--cta-blue);
  color: var(--cta-blue);
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover { background: rgba(46, 117, 182, 0.05); }
`;


const DrawerHandle = styled.div`
  display: none; /* Handle is now rendered by ToursAndMapPage's MobileSidebarHandle */
`;

const SearchSection = styled.div`
  padding: 0 18px 16px;
  background: var(--surface-bg);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px; /* Reverted to Tighter Gap */
  
  & > * {
    width: 100%;
    max-width: 320px;
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: stretch;
  width: 100%;
  max-width: 320px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  gap: 10px; /* Added gap to prevent overlap */
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  background: none;
  border: none;
  padding: 8px 4px; /* Added horizontal padding */
  font-size: 0.68rem; /* Slightly smaller to fit better */
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px; /* Reduced letter-spacing to prevent overflow */
  color: ${props => props.$active ? 'var(--dark-blue)' : '#94a3b8'};
  border-bottom: 2px solid ${props => props.$active ? 'var(--dark-blue)' : 'transparent'};
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  transition: all 0.2s;
  &:hover { color: var(--dark-blue); }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: var(--surface-bg);
  padding: 8px 14px;
  border-radius: 30px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  margin-bottom: 0px;
  transition: all 0.3s;
  width: 100%;
  max-width: 320px;
  position: relative;

  &:focus-within {
    background: var(--surface-bg);
    border-color: var(--cta-blue);
    box-shadow: 0 0 0 3px rgba(46, 117, 182, 0.08);
  }

  input {
    border: none; outline: none; background: transparent;
    font-size: 0.8rem; margin-left: 8px; width: 100%;
    padding-right: 25px; /* Space for clear button */
    color: var(--text-dark); font-weight: 500;
    &::placeholder { color: #94a3b8; }
  }

  .clear-btn {
    position: absolute;
    right: 12px;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    &:hover { color: var(--cta-blue); }
  }
`;

const ResultsContainer = styled(motion.div)`
  padding: 16px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--light-bg);
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
`;

const ResultCard = styled(motion.div)<{ $active: boolean }>`
  background: ${props => props.$active ? 'var(--soft-blue)' : 'var(--surface-bg)'};
  border-radius: 50px;
  display: flex;
  position: relative;
  overflow: hidden;
  min-height: 90px;
  height: auto;
  flex-shrink: 0;
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
  border: none;
  box-shadow: ${props => props.$active ? '0 10px 30px rgba(11, 33, 71, 0.1)' : '0 4px 15px rgba(0,0,0,0.02)'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  z-index: ${props => props.$active ? '2' : '1'};

  &:hover {
    transform: ${props => props.$active ? 'none' : 'translateY(-2px)'};
    box-shadow: 0 15px 35px rgba(0,0,0,0.06);
    background: ${props => props.$active ? 'var(--soft-blue)' : 'var(--surface-bg)'};
  }
`;

const CardImage = styled.div<{ $src: string }>`
  position: absolute;
  top: 0; left: 0;
  width: 140px;
  height: 100%;
  background-image: url(${props => getMediaUrl(props.$src)});
  background-size: cover;
  background-position: center;
  z-index: 0;
  -webkit-mask-image: linear-gradient(to right, black 50%, transparent 100%);
  mask-image: linear-gradient(to right, black 50%, transparent 100%);
`;

const CardContent = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 24px 10px 110px;
  text-shadow: none;

  .meta {
    font-size: 0.45rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--cta-blue);
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h4 {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--dark-blue);
    line-height: 1.3;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .loc {
    font-size: 0.65rem;
    color: var(--text-light);
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  
  .tags-row {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
    flex-wrap: wrap;
    
    .sm-tag {
      font-size: 0.45rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 1.5px 5px;
      border-radius: 4px;
      color: white;
      text-shadow: none;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
  }
`;

const DetailsBtn = styled.div<{ $active: boolean }>`
  align-self: flex-start;
  margin-top: auto;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${props => props.$active ? 'var(--cta-blue)' : '#94a3b8'};
  background: ${props => props.$active ? 'rgba(46, 117, 182, 0.1)' : 'rgba(0,0,0,0.05)'};
  padding: 4px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
  ${ResultCard}:hover & {
    color: var(--cta-blue);
    background: rgba(46, 117, 182, 0.1);
  }
`;

const LoadingState = styled.div` display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #94a3b8; gap: 12px; `;

interface MapSidebarProps {
  items: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  activeTab: 'All' | 'Attraction' | 'Enterprise';
  onTabChange: (tab: 'All' | 'Attraction' | 'Enterprise') => void;
  loading: boolean;
  onItemClick?: (item: any) => void;
  activeId?: string | null;
  onOpenDashboard?: () => void;
  onOpenTravelGuide?: () => void;
}

const MapSidebar: React.FC<MapSidebarProps> = ({
  items, searchQuery, setSearchQuery, selectedCategories, setSelectedCategories, activeTab, onTabChange, loading, onItemClick, activeId, onOpenDashboard, onOpenTravelGuide
}) => {
  const { role } = useAuth();

  const displayItems = useMemo(() => {
    if (activeTab === 'All') return items;
    return items.filter(i => i.entityType === activeTab);
  }, [items, activeTab]);

  const uniqueTabCategories = useMemo(() => {
    const source = activeTab === 'All' 
      ? [...ATTRACTION_CATEGORIES, ...ENTERPRISE_CATEGORIES]
      : activeTab === 'Attraction' ? ATTRACTION_CATEGORIES 
      : ENTERPRISE_CATEGORIES;
    
    const seen = new Set();
    return source.filter(c => {
      if (seen.has(c.label)) return false;
      seen.add(c.label);
      return true;
    });
  }, [activeTab]);

  return (
    <SidebarContainer>
      <DrawerHandle />
      <ClassicHeader>
        <div className="label">Interactive Discovery</div>
        <h2>Pinpoint Your Next Move</h2>
        <p>Explore Bulusan's finest in real-time.</p>
      </ClassicHeader>

      <SearchSection>
        {role === 'ADMIN' && (
          <TourButton onClick={onOpenTravelGuide} style={{ marginBottom: '8px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(29,78,216,0.1))', borderColor: 'rgba(59,130,246,0.3)', color: '#3b82f6' }}>
             <MapPin size={16} /> Travel Guide &amp; Planner
          </TourButton>
        )}
        
        <TabContainer>
          {(['All', 'Attraction', 'Enterprise'] as const).map(t => (
            <Tab key={t} $active={activeTab === t} onClick={() => onTabChange(t)}>
              {t === 'All' ? 'ALL' : `${t}s`}
            </Tab>
          ))}
        </TabContainer>

        <SearchBar>
          <Search size={14} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search lake, hotel, falls..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="clear-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </div>
          )}
        </SearchBar>

        <SharedCategoryScroller 
          categories={uniqueTabCategories}
          activeCategories={selectedCategories}
          onSelect={setSelectedCategories}
        />
      </SearchSection>

      <ResultsContainer
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } },
          hidden: {}
        }}
      >
        {loading ? (
          <LoadingState><Loader2 className="animate-spin" size={24} /><p style={{ fontSize: '0.75rem' }}>Gathering sites...</p></LoadingState>
        ) : displayItems.length === 0 ? (
          <LoadingState><p style={{ fontSize: '0.75rem' }}>No matching discoveries.</p></LoadingState>
        ) : (
          <AnimatePresence>
            {displayItems.map((item, index) => {
              const itemId = `${item.entityType}-${item.id || item.id}`;
              const isActive = activeId === itemId;
              const categoryLabel = (Array.isArray(item.categories) ? item.categories : [((item as any).category || item.type || 'Others')])[0];
              
              return (
                <ResultCard 
                  key={itemId} 
                  $active={isActive} 
                  onClick={() => onItemClick?.(item)}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <CardImage $src={item.photos?.[0] || item.img || ''} />
                  <CardContent>
                    <div className="meta">{categoryLabel} • {item.entityType}</div>
                    {getDynamicTags(item, items).length > 0 && (
                      <div className="tags-row">
                         {getDynamicTags(item, items).slice(0, 3).map(tag => {
                            let Icon = Star;
                            let bgGradient = 'rgba(255, 215, 0, 0.3)';
                            
                            if (tag === 'New') { Icon = Zap; bgGradient = 'linear-gradient(135deg, #10b981, #059669)'; }
                            else if (tag === 'Top Rated') { Icon = Star; bgGradient = 'linear-gradient(135deg, #f59e0b, #d97706)'; }
                            else if (tag === 'Trending') { Icon = TrendingUp; bgGradient = 'linear-gradient(135deg, #ef4444, #dc2626)'; }
                            else if (tag === 'Featured') { Icon = Award; bgGradient = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; }
                            else if (tag === 'Most Visited') { Icon = Users; bgGradient = 'linear-gradient(135deg, #8b5cf6, #6d28d9)'; }

                            return (
                               <span key={tag} className="sm-tag" style={{ background: bgGradient }}>
                                  <Icon size={8} fill={tag === 'Top Rated' || tag === 'New' ? 'white' : 'currentColor'} strokeWidth={3} /> {tag}
                               </span>
                            );
                         })}
                      </div>
                    )}
                    <h4>{item.name}</h4>
                    <div className="loc">{item.location}</div>
                    <DetailsBtn $active={isActive}>
                      Explore <ChevronRight size={10} strokeWidth={3} />
                    </DetailsBtn>
                  </CardContent>
                </ResultCard>
              );
            })}
          </AnimatePresence>
        )}
      </ResultsContainer>
    </SidebarContainer>
  );
};

export default MapSidebar;
