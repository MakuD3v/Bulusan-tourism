import React, { useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, Circle } from 'lucide-react';
import { CustomUserTour, UserTourDestination } from '../../data/types';
import { calculateDistance, formatDistance } from '../../utils/geoUtils';
import { getMediaUrl } from '../../utils/mediaUtils';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-bg);
`;

const ClassicHeader = styled.div`
  padding: 24px 24px 20px;
  background: var(--surface-bg);
  border-bottom: 1px solid #f1f5f9;
  
  .back-btn {
    display: flex; align-items: center; gap: 4px; border: none; background: none; font-size: 0.75rem; font-weight: 800; color: var(--text-light); cursor: pointer; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; transition: color 0.2s;
    &:hover { color: var(--cta-blue); }
  }

  .label { text-transform: uppercase; font-size: 0.65rem; font-weight: 800; letter-spacing: 2px; color: var(--cta-blue); margin-bottom: 8px; }
  h2 { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 800; color: var(--dark-blue); line-height: 1.1; margin-bottom: 8px; }
  p { font-size: 0.75rem; color: var(--text-light); font-weight: 500; }
`;

const RouteList = styled.div`
  /* Mobile: natural height — SidebarContent scrolls the whole drawer */
  padding: 20px 24px 24px;
  background: #fcfdfe;

  /* Desktop: take remaining sidebar height, scroll internally */
  @media (min-width: 1024px) {
    flex: 1;
    overflow-y: auto;
  }

  .dist-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: -6px 0 6px 37px;
      position: relative;
      .line { width: 2px; height: 16px; background: #e2e8f0; }
      .km { 
          font-size: 0.6rem; 
          font-weight: 800; 
          color: var(--cta-blue); 
          background: #f0f7ff; 
          padding: 1px 8px; 
          border-radius: 10px; 
          border: 1px solid rgba(46,117,182,0.1);
          z-index: 2;
          margin: -2px 0;
      }
  }
`;

const DestinationCard = styled(motion.div)<{ $completed: boolean; $next: boolean }>`
  background: ${props => props.$completed ? '#f8fafc' : props.$next ? '#f0f7ff' : 'white'};
  border-radius: 50px;
  display: flex;
  position: relative;
  overflow: hidden;
  height: 80px;
  width: 100%;
  margin-bottom: 12px;
  border: ${props => props.$completed ? '1px solid #e2e8f0' : props.$next ? '2px solid var(--cta-blue)' : '1px solid rgba(0,0,0,0.06)'};
  box-shadow: ${props => props.$next ? '0 10px 25px rgba(11, 33, 71, 0.1)' : '0 4px 15px rgba(0,0,0,0.03)'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  opacity: ${props => props.$completed ? 0.7 : 1};

  &:hover {
    transform: ${props => props.$completed ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.$completed ? 'none' : '0 10px 30px rgba(0,0,0,0.08)'};
  }

  .bg-img {
    position: absolute;
    top: 0; left: 0;
    width: 100px;
    height: 100%;
    background-size: cover;
    background-position: center;
    z-index: 0;
    -webkit-mask-image: linear-gradient(to right, black 30%, transparent 100%);
    mask-image: linear-gradient(to right, black 30%, transparent 100%);
    filter: ${props => props.$completed ? 'grayscale(100%) opacity(0.5)' : 'none'};
  }

  .content-z {
    position: relative;
    z-index: 1;
    width: 100%;
    display: flex;
    align-items: center;
    padding: 8px 20px 8px 75px;
    gap: 12px;
  }

  .check-wrap {
    color: ${props => props.$completed ? '#10b981' : '#cbd5e1'};
    display: flex;
    transition: color 0.2s;
  }
  
  &:hover .check-wrap {
    color: ${props => props.$completed ? '#10b981' : 'var(--cta-blue)'};
  }

  .info { flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center; text-shadow: 0 1px 2px rgba(255,255,255,0.8); }
  h4 { font-size: 0.85rem; font-weight: 800; color: ${props => props.$completed ? '#64748b' : 'var(--dark-blue)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; text-decoration: ${props => props.$completed ? 'line-through' : 'none'}; }
  p { font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

  .step-num { font-size: 1.2rem; font-family: 'Playfair Display', serif; font-weight: 800; color: ${props => props.$next ? 'var(--cta-blue)' : '#94a3b8'}; width: 24px; text-align: center; }
`;

const CompleteBanner = styled(motion.div)`
  background: #10b981;
  color: white;
  padding: 20px;
  text-align: center;
  border-radius: 16px;
  margin-top: 20px;
  h3 { font-family: 'Playfair Display', serif; font-size: 1.2rem; }
  p { font-size: 0.8rem; opacity: 0.9; margin-top: 4px; }
`;

interface Props {
  tour: CustomUserTour;
  onExit: () => void;
  onUpdateTour: (tour: CustomUserTour) => void;
  allItems: any[]; // Merged catalog items
  onFocusItem: (item: any) => void;
}

export default function ActiveTourSidebar({ tour, onExit, onUpdateTour, allItems, onFocusItem }: Props) {
  
  // Toggles the 'completed' / ghost-mode state. Auto-advances to next stop.
  const handleComplete = (e: React.MouseEvent, destId: string) => {
    e.stopPropagation(); // Don't trigger the card's focus handler
    const updatedDestinations = tour.destinations.map(d =>
      d.itemId === destId ? { ...d, completed: !d.completed } : d
    );
    const updatedTour = { ...tour, destinations: updatedDestinations };
    onUpdateTour(updatedTour);

    // Auto-progression: only fires when marking as completed
    const isNowCompleted = updatedDestinations.find(d => d.itemId === destId)?.completed;
    if (isNowCompleted) {
      const nextIndex = updatedDestinations.findIndex(d => !d.completed);
      if (nextIndex !== -1) {
        const nextItem = allItems.find(x => (x.id || x.id).toString() === updatedDestinations[nextIndex].itemId);
        if (nextItem) onFocusItem(nextItem);
      }
    }
  };

  // Selects / deselects a pinpoint on the map (no completion change).
  const handleCardClick = (item: any) => {
    onFocusItem(item); // Parent handles toggle-off if already selected
  };

  const allCompleted = tour.destinations.length > 0 && tour.destinations.every(d => d.completed);
  
  // Find index of first uncompleted destination to highlight as "$next"
  const nextTargetIndex = tour.destinations.findIndex(d => !d.completed);

  return (
    <SidebarContainer>
      <ClassicHeader>
        <button className="back-btn" onClick={onExit}><ChevronLeft size={14}/> Exit Guide</button>
        <div className="label">Active Route</div>
        <h2>{tour.name}</h2>
        <p>{tour.destinations.filter(d => d.completed).length} / {tour.destinations.length} Completed</p>
      </ClassicHeader>

      <RouteList>
        <AnimatePresence>
          {tour.destinations.map((dest, i) => {
            const item = allItems.find(x => (x.id || x.id).toString() === dest.itemId);
            if (!item) return null;
            
            const nextDest = tour.destinations[i + 1];
            let distText = "";
            if (nextDest) {
                const nextItem = allItems.find(x => (x.id || x.id).toString() === nextDest.itemId);
                if (item.coordinates && nextItem?.coordinates) {
                    distText = formatDistance(calculateDistance(
                        item.coordinates.lat, item.coordinates.lng,
                        nextItem.coordinates.lat, nextItem.coordinates.lng
                    ));
                }
            }

            return (
              <React.Fragment key={dest.itemId}>
                <DestinationCard 
                  key={dest.itemId} 
                  $completed={dest.completed}
                  $next={nextTargetIndex === i}
                  onClick={() => handleCardClick(item)}
                  layout
                >
                  <div className="bg-img" style={{ backgroundImage: `url(${getMediaUrl(item.photos?.[0] || item.img || '')})` }} />
                  <div className="content-z">
                    <div
                      className="check-wrap"
                      onClick={(e) => handleComplete(e, dest.itemId)}
                      title={dest.completed ? 'Mark as incomplete' : 'Mark as visited'}
                      style={{ cursor: 'pointer' }}
                    >
                      {dest.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </div>
                    <div className="info">
                      <h4>{item.name}</h4>
                      <p>{item.entityType}</p>
                    </div>
                    <div className="step-num">{i + 1}</div>
                  </div>
                </DestinationCard>
                {distText && (
                    <div className="dist-step">
                        <div className="line" />
                        <div className="km">{distText}</div>
                        <div className="line" />
                    </div>
                )}
              </React.Fragment>
            );
          })}
        </AnimatePresence>

        {allCompleted && (
          <CompleteBanner initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <h3>Tour Complete!</h3>
            <p>You have visited all destinations.</p>
          </CompleteBanner>
        )}
      </RouteList>
    </SidebarContainer>
  );
}
