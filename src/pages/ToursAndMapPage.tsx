import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import BulusanMap from '../components/Map/BulusanMap';
import MapSidebar from '../components/Map/MapSidebar';
import TravelGuideFlow from '../components/Map/TravelGuideFlow';
import BookingModal from '../components/Map/BookingModal';
import LiveTourTracker from '../components/Map/LiveTourTracker';
import { useAttractions, useEnterprises, useHeritage } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

const PageContainer = styled(motion.div)`
  /* Mobile: full-screen fixed container — map fills all, drawer floats above */
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  height: calc(100dvh - 80px);
  overflow: hidden;
  position: relative;

  @media (min-width: 1024px) {
    flex-direction: row; /* Map LEFT, Sidebar RIGHT */
    position: relative;
  }
`;

/* Map fills the full container on mobile (drawer floats on top) */
const MapSection = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 10;

  @media (min-width: 1024px) {
    flex: 1;
    z-index: 20;
  }
`;

/**
 * Mobile: absolute bottom drawer.
 *   Collapsed  → 52px  (just the handle tab, chips above the footer)
 *   Open       → 58vh  (slides up, content scrolls inside)
 * Desktop: fixed 420px panel on the right, slides off right when closed.
 */
const SidebarSection = styled.div<{ $isOpen: boolean }>`
  /* ── MOBILE ── */
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--surface-bg);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* Slide between handle-only and full drawer */
  height: ${props => props.$isOpen ? '75vh' : '52px'};
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  @media (min-width: 1024px) {
    /* ── DESKTOP ── reset all mobile overrides */
    position: relative;
    bottom: auto;
    left: auto;
    right: auto;
    border-radius: 0;
    box-shadow: none;
    width: 420px;
    height: 100%;
    border-top: none;
    border-left: 1px solid #e2e8f0;
    flex-shrink: 0;
    /* Slide OFF to the RIGHT when collapsed */
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(100%)'};
    /* Collapse the flex space so the map expands */
    margin-left: ${props => props.$isOpen ? '0' : '-420px'};
    transition:
      transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

/**
 * Inner content that scrolls within the open drawer on mobile.
 * On desktop the sidebar itself handles clipping.
 */
const SidebarContent = styled.div<{ $isOpen: boolean }>`
  /* Mobile: take remaining height after the handle (52px) and scroll */
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  /* Hide when drawer is closed — avoids residual scroll flash */
  opacity: ${props => props.$isOpen ? 1 : 0};
  transition: opacity 0.2s;
  -webkit-overflow-scrolling: touch;

  @media (min-width: 1024px) {
    overflow-y: auto;
    overflow-x: hidden;
    opacity: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`;

/* The drag handle / collapse button that lives at the TOP of the mobile sidebar */
const MobileSidebarHandle = styled.button<{ $isOpen: boolean }>`
  width: 100%;
  padding: 10px 20px;
  background: var(--surface-bg);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
  border-bottom: 1px solid #f1f5f9;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  .pill {
    width: 36px;
    height: 4px;
    background: #cbd5e1;
    border-radius: 2px;
    transition: background 0.2s;
  }

  &:hover .pill { background: #94a3b8; }

  /* Hidden on desktop — the sidebar has its own toggle button instead */
  @media (min-width: 1024px) {
    display: none;
  }
`;

/**
 * Desktop-only vertical tab that sticks to the LEFT edge of the sidebar.
 * When open  → sits at right: 420px (hugging the sidebar's left border)
 * When closed → sits at right: 0   (pinned to the viewport right edge)
 * It slides smoothly with the sidebar open/close animation.
 */
const DesktopToggleBtn = styled.button<{ $isOpen: boolean }>`
  display: none;

  @media (min-width: 1024px) {
    display: flex;
    position: absolute;
    /* Track the sidebar's left edge */
    right: ${props => props.$isOpen ? '420px' : '0px'};
    top: 50%;
    transform: translateY(-50%);
    z-index: 200;

    /* Vertical pill / tab shape */
    width: 26px;
    height: 64px;
    border-radius: 10px 0 0 10px; /* Rounded on left, flush on right */
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-right: none; /* Seamlessly joins the sidebar edge */
    background: var(--surface-bg);
    color: var(--dark-blue);
    padding: 0;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s;

    &:hover {
      background: #f0f7ff;
      color: var(--cta-blue);
    }
  }
`;

const ToursAndMapPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const focusLat = queryParams.get('lat') ? parseFloat(queryParams.get('lat')!) : undefined;
  const focusLng = queryParams.get('lng') ? parseFloat(queryParams.get('lng')!) : undefined;
  const focusName = queryParams.get('name');
  const autoRoute = queryParams.get('route') === 'true';
  const urlSearch = queryParams.get('search');
  const activeTourId = queryParams.get('activeTourId');

  const { data: attractions, loading: loadingAttractions } = useAttractions();
  const { data: enterprises, loading: loadingEnterprises } = useEnterprises();
  const { data: heritage, loading: loadingHeritage } = useHeritage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Attraction' | 'Enterprise'>('All');
  const [focusedLocation, setFocusedLocation] = useState<any>(null);

  const [showTravelGuide, setShowTravelGuide] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  
  // New State for collapsing the sidebar!
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const initialSearchHandled = React.useRef(false);

  const allItems = useMemo(() => [
    ...attractions.map(a => ({ ...a, entityType: 'Attraction' })),
    ...enterprises.map(a => ({ ...a, entityType: 'Enterprise' })),
    ...heritage.map(h => ({ ...h, entityType: 'Heritage', categories: [h.period] }))
  ], [attractions, enterprises, heritage]);

  useEffect(() => {
    if (initialSearchHandled.current) return;
    
    if (focusName) {
      setSearchQuery(focusName);
      const target = allItems.find(i => i.name === focusName);
      if (target) {
        const itemCats = Array.isArray(target.categories) ? target.categories : [((target as any).category || (target as any).type || 'Others')];
        setSelectedCategories(itemCats.slice(0, 3));
        // Auto-select the item so the map focuses on it via focusedLocation
        setFocusedLocation(target);
      }
      initialSearchHandled.current = true;
    } else if (urlSearch) {
      setSearchQuery(urlSearch);
      initialSearchHandled.current = true;
    }
  }, [focusName, urlSearch, allItems]);

  const unifiedItems = useMemo(() => {
    return allItems.filter((item: any) => {
      const itemName = item.name.toLowerCase().trim();
      const itemText = (item.name + ' ' + (item.description || '')).toLowerCase().trim();
      const queryLower = searchQuery.toLowerCase().trim();
      
      const queryMatch = queryLower === '' || itemText.includes(queryLower);
      const nameMatch = queryLower !== '' && itemName.includes(queryLower);

      const itemCategories = (Array.isArray(item.categories) ? item.categories : [((item as any).category || item.type || 'Others')]).slice(0, 3);
      
      const categoryMatch = selectedCategories.length === 0 || 
                           selectedCategories.every(sc => itemCategories.some(ic => ic.toLowerCase().trim() === sc.toLowerCase().trim()));

      return nameMatch || (queryMatch && categoryMatch);
    });
  }, [allItems, searchQuery, selectedCategories]);

  const loading = loadingAttractions || loadingEnterprises || loadingHeritage;

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Desktop-only tab toggle — tracks the sidebar's left edge */}
      <DesktopToggleBtn $isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {/* Open = collapse rightward, Closed = pull open from right */}
        {isSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </DesktopToggleBtn>

      {/* Map comes first in DOM so it renders behind sidebar on mobile */}
      <MapSection>
        <BulusanMap
          items={allItems}
          searchQuery={searchQuery}
          selectedCategories={selectedCategories}
          focusLat={focusedLocation?.coordinates?.lat}
          focusLng={focusedLocation?.coordinates?.lng}
          focusName={focusedLocation?.name}
          autoRoute={autoRoute}
        />
      </MapSection>

      <SidebarSection $isOpen={isSidebarOpen}>
        {/* Mobile drag handle / collapse toggle */}
        <MobileSidebarHandle $isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <div className="pill" />
          {isSidebarOpen ? 'Collapse' : 'Show Locations'}
          {isSidebarOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </MobileSidebarHandle>
        {/* SidebarContent collapses/expands on mobile via max-height */}
        <SidebarContent $isOpen={isSidebarOpen}>
          {activeTourId ? (
             <LiveTourTracker
               bookingId={activeTourId}
               onExit={() => {}}
               onFocusItem={(itemId) => {
                 const item = unifiedItems.find(i => i.id.toString() === itemId.toString());
                 if (item) setFocusedLocation(item);
               }}
             />
          ) : (
            <MapSidebar 
              items={unifiedItems}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onItemClick={(item) => {
                const clickedId = (item.id || item.id).toString();
                const currentId = (focusedLocation?.id || focusedLocation?.id)?.toString();
                if (clickedId === currentId && item.entityType === focusedLocation?.entityType) {
                  setFocusedLocation(null);
                } else {
                  setFocusedLocation(item);
                }
              }}
              activeId={focusedLocation?.id}
              loading={loading}
              onOpenTravelGuide={() => setShowTravelGuide(true)}
            />
          )}
        </SidebarContent>
      </SidebarSection>

      <AnimatePresence>
        {showTravelGuide && (
           <TravelGuideFlow
              items={allItems}
              onClose={() => setShowTravelGuide(false)}
              onProceedToBooking={(route, dates, mode, answers) => {
                 setBookingDetails({ route, dates, mode, answers });
                 setShowTravelGuide(false);
                 setShowBookingModal(true);
              }}
           />
        )}
        
        {showBookingModal && bookingDetails && (
           <BookingModal
              route={bookingDetails.route}
              scheduledDates={bookingDetails.dates}
              autoScheduled={bookingDetails.mode === 'auto'}
              autoAnswers={bookingDetails.answers}
              onClose={() => setShowBookingModal(false)}
              onBack={() => {
                 setShowBookingModal(false);
                 setShowTravelGuide(true);
              }}
           />
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default ToursAndMapPage;
