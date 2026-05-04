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

const MapStyleWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  @keyframes pinPulse {
    0% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px rgba(46, 117, 182, 0)); }
    50% { transform: scale(1.15); filter: brightness(1.2) drop-shadow(0 0 10px rgba(46, 117, 182, 0.4)); }
    100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px rgba(46, 117, 182, 0)); }
  }

  .animated-marker {
    animation: pinPulse 1.5s infinite ease-in-out;
  }

  /* Stabilizing high-density marker rendering */
  .leaflet-marker-icon {
    transition: opacity 0.3s ease;
  }

  /* Flush UI for Map Popups */
  .glass-popup .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  .glass-popup .leaflet-popup-content {
    margin: 0;
    width: min(300px, 80vw) !important; /* Dynamic width to avoid taking whole screen but not cut off */
  }
  .glass-popup .leaflet-popup-tip {
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
  }
  .glass-popup .leaflet-popup-close-button {
    display: none;
  }
`;

// Fix for default Leaflet icon paths in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const iconCache: { [key: string]: L.Icon } = {};
const getStableCategoryIcon = (category: string) => {
  if (iconCache[category]) return iconCache[category];
  const iconUrl = getMapIconUrl(category);
  const icon = new L.Icon({
    iconUrl,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -45], 
    tooltipAnchor: [0, -42],
    className: 'bulusan-map-pin',
  });
  iconCache[category] = icon;
  return icon;
};

const PopupContent = styled.div`
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  position: relative;

  .image-container {
    width: 100%;
    height: 120px; /* Reduced to fit better on mobile screens */
    position: relative;

    @media (max-width: 768px) {
      height: 100px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .gradient-overlay {
      position: absolute;
      bottom: -2px; /* Overlap browser rounding lines */
      left: 0;
      right: 0;
      height: 70px;
      /* Seamlessly fade the image straight into the white bottom base! */
      background: linear-gradient(to top, white 0%, rgba(255,255,255,0) 100%);
    }

    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 10;
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(4px);
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--dark-blue);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: all 0.2s;
      
      &:hover {
        background: white;
        transform: scale(1.1);
      }
    }
  }

  .content-body {
    padding: 0 16px 16px;
    position: relative;
    z-index: 2;
    background: white;
    
    .badges-wrapper {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      z-index: 2;
    }

    .badge-pill {
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(4px);
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 4px;
      line-height: 1;

      &.badge-new { background: linear-gradient(135deg, #10b981, #059669); }
      &.badge-top { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &.badge-trending { background: linear-gradient(135deg, #ef4444, #dc2626); }
      &.badge-featured { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
      &.badge-visited { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    }
    
    .rating-location-row {
       display: flex; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 2px;
       font-size: 0.75rem; color: #64748b; font-weight: 600;
       
       .category-label {
         color: var(--cta-blue);
         font-size: 0.7rem;
         font-weight: 800;
         text-transform: uppercase;
         letter-spacing: 1px;
         display: flex;
         align-items: center;
         gap: 4px;

         img {
           height: 14px;
           width: auto;
           /* Adjust icon color to CTA Blue since it is on white background now */
           filter: invert(34%) sepia(87%) saturate(583%) hue-rotate(170deg) brightness(97%) contrast(93%);
         }
       }
       
       .rating { display: flex; align-items: center; gap: 4px; color: var(--dark-blue); font-weight: 800; }
    }
    
    h3 { margin-bottom: 2px; font-size: 1.2rem; color: var(--dark-blue); font-family: 'Playfair Display', serif; font-weight: 800; }
    
    .location-row {
       font-size: 0.75rem; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-bottom: 12px;
    }
    
    p { font-size: 0.85rem; color: #475569; margin-bottom: 16px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    .btn-group { display: flex; gap: 8px; }
    button, a {
      flex: 1; text-align: center; background: var(--cta-blue); color: white !important; padding: 10px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 0.8rem; border: none; cursor: pointer; transition: all 0.2s;
      &:hover { background: var(--dark-blue); transform: translateY(-2px); }
      &.secondary { background: #f1f5f9; color: #475569 !important; }
    }
  }
`;

const LocationPrompt = styled(motion.div)`
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: min(360px, 90%); background: white; border-radius: 20px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); z-index: 2000; text-align: center;
  .prompt-buttons { display: flex; flex-direction: column; gap: 10px; }
  .btn-primary { background: #2e75b6; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; }
  .btn-secondary { background: #f0f4f8; color: #333; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; }
`;

const MobileBottomSheet = styled(motion.div)`
  position: fixed;
  /* Sit above the 52px sidebar handle bar */
  bottom: 60px;
  left: 12px;
  right: 12px;
  width: auto;
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 -4px 40px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.1);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (min-width: 768px) { display: none; }

  .handle { 
    width: 40px; height: 4px; background: #ddd; border-radius: 2px; align-self: center; margin-bottom: 4px; 
    transition: background 0.2s;
    &:hover { background: #bbb; }
  }
  h3 { font-size: 1.3rem; color: #2c3e50; font-family: 'Playfair Display', serif; }
  .nav-btn {
    width: 100%; padding: 14px; background: #2e75b6; color: white; border: none;
    border-radius: 12px; font-weight: 700; display: flex; align-items: center;
    justify-content: center; gap: 12px; transition: transform 0.2s;
    &:active { transform: scale(0.98); }
  }
`;

const TravelStatsOverlay = styled(motion.div)`
  position: absolute; 
  bottom: 24px; 
  right: 24px; 
  background: rgba(255, 255, 255, 0.95); 
  backdrop-filter: blur(12px); 
  padding: 20px; 
  border-radius: 24px; 
  box-shadow: 0 20px 50px rgba(0,0,0,0.15); 
  z-index: 1000; 
  width: 300px; 
  border: 1px solid rgba(255,255,255,0.4);

  @media (max-width: 1024px) {
    bottom: auto;
    top: 70px; 
    left: 20px; /* Nudge slightly more to center if necessary, but keep left as per vision */
    right: auto;
    width: min(240px, 80vw); /* Cap width more strictly on mobile */
    padding: 10px;
    transform: scale(0.85);
    transform-origin: top left;

    h4 { display: none; } /* Hide header to save space on mobile */
    .stats-content { margin-bottom: 6px; gap: 12px; }
    .mode-selection { margin-bottom: 6px; padding: 2px; }
    .stat-item .val { font-size: 0.9rem !important; }
    .stat-item .lab { font-size: 0.5rem !important; }
  }

  h4 { margin-bottom: 15px; font-size: 0.9rem; color: var(--dark-blue); font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
  .stats-content { display: flex; justify-content: space-between; margin-bottom: 20px; .stat-item { flex: 1; .val { font-size: 1.2rem; font-weight: 800; color: var(--dark-blue); } .lab { font-size: 0.65rem; color: #64748b; font-weight: 600; text-transform: uppercase; } } }
  .mode-selection { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; margin-bottom: 12px; justify-content: space-between; }
  .close-row { display: flex; gap: 8px; button { flex: 1; padding: 10px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; &.primary { background: var(--dark-blue); color: white; } &.secondary { background: #e2e8f0; color: #475569; } } }
`;

const ModeButton = styled.button<{ $active: boolean }>`
  flex: 1; display: flex; align-items: center; justify-content: center; border: none; background: ${props => props.$active ? 'white' : 'transparent'}; color: ${props => props.$active ? 'var(--cta-blue)' : '#94a3b8'}; padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: ${props => props.$active ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'};
  &:hover { color: var(--cta-blue); }
`;

const LocationToggle = styled.button<{ $active: boolean }>`
  position: absolute; top: 100px; right: 24px; z-index: 1000; background: ${props => props.$active ? props.theme.colors.ctaBlue : 'white'}; color: ${props => props.$active ? 'white' : '#555'}; border: 1px solid #ddd; padding: 10px 16px; border-radius: 30px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer;

  @media (max-width: 1024px) {
    top: 24px; /* Move higher on mobile */
  }
`;

function MapBounds() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([[12.65, 123.95], [12.85, 124.25]]);
    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 1.0;
  }, [map]);
  return null;
}

type TravelMode = 'driving' | 'walking' | 'cycling';

function RoutingEngine({ waypoints, mode, onUpdate }: { waypoints: L.LatLng[], mode: TravelMode, onUpdate: (data: any) => void }) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);
  
  useEffect(() => {
    if (!map) return;
    if (waypoints.length < 2) {
      if (routingControlRef.current) { map.removeControl(routingControlRef.current); routingControlRef.current = null; }
      return;
    }
    if (routingControlRef.current) map.removeControl(routingControlRef.current);
    
    routingControlRef.current = (L.Routing as any).control({
      waypoints,
      router: (L.Routing as any).osrmv1({
        serviceUrl: `https://router.project-osrm.org/route/v1`,
        profile: mode // Explicit profile selection
      }),
      lineOptions: { styles: [{ color: '#2e75b6', opacity: 0.8, weight: 6 }] } as any,
      addWaypoints: false,
      fitSelectedRoutes: false, // Don't snap to bounds every time we move
      show: false,
      createMarker: () => null
    }).addTo(map);

    // ERROR HANDLING
    routingControlRef.current.on('routingerror', (e: any) => {
      console.error('Routing error:', e);
    });
    
    routingControlRef.current.on('routesfound', (e: any) => {
      const summary = e.routes[0].summary;
      const distanceKm = summary.totalDistance / 1000;
      
      // Manual time estimation based on mode since demo-server defaults to driving
      // Speeds in km/h: Driving (35), Cycling (12), Walking (4.5)
      let estimatedMinutes = 0;
      if (mode === 'driving') estimatedMinutes = (distanceKm / 35) * 60;
      else if (mode === 'cycling') estimatedMinutes = (distanceKm / 12) * 60;
      else if (mode === 'walking') estimatedMinutes = (distanceKm / 4.5) * 60;

      // Ensure at least 1 minute if distance is > 0
      if (distanceKm > 0.01) estimatedMinutes = Math.max(1, Math.round(estimatedMinutes));
      else estimatedMinutes = 0;

      onUpdate({ 
        distance: distanceKm.toFixed(1) + ' km', 
        time: estimatedMinutes >= 60 
          ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m` 
          : `${estimatedMinutes} mins` 
      });
    });
    
    return () => { if (routingControlRef.current) map.removeControl(routingControlRef.current); };
  }, [map, waypoints, mode]);
  return null;
}

const PopupCloseButton = () => {
  const map = useMap();
  return (
    <button className="close-btn" onClick={() => map.closePopup()} aria-label="Close popup">
      <X size={18} />
    </button>
  );
};

const BulusanMarker = ({ item, priorityCategory, onHandleSelect, isMobile, setMobileDetail, isMatch, isFocused, isGhosted, badges = [] }: any) => {
  if (!item.coordinates?.lat || !item.coordinates?.lng) return null;
  const linkPath = item.entityType === 'Attraction' ? '/attractions' : item.entityType === 'Heritage' ? '/heritage' : '/enterprises';
  const stableIcon = getStableCategoryIcon(priorityCategory);
  const markerRef = useRef<L.Marker>(null);
  useEffect(() => { if (isFocused && markerRef.current) { markerRef.current.openPopup(); } }, [isFocused]);

  let badge: 'New' | 'Top Rated' | 'Trending' | 'Featured' | undefined = undefined;
  if (item.featured) badge = 'Featured';
  else if (item.isNew || (item.createdAt && new Date().getTime() - new Date(item.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000)) badge = 'New';
  else if (item.rating >= 4.8) badge = 'Top Rated';
  else if (item.visits >= 50) badge = 'Trending';

  return (
    <Marker
      ref={markerRef}
      position={[item.coordinates.lat, item.coordinates.lng]}
      icon={stableIcon}
      opacity={isFocused ? 1 : isGhosted ? 0.3 : isMatch ? 1 : 0.4}
      interactive={true} // Always allow interaction
      zIndexOffset={isFocused ? 2000 : isMatch ? 1000 : 0} 
      eventHandlers={{ 
        mouseover: (e) => e.target.openTooltip(),
        mouseout: (e) => e.target.closeTooltip(),
        click: () => { if (isMobile) setMobileDetail(item); } 
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1}>
        <div style={{ padding: '4px', fontWeight: 600 }}>{item.name}</div>
      </Tooltip>
      <Popup className="glass-popup" closeOnClick={false} autoPan={true}>
        <PopupContent>
          <div className="image-container">
            <PopupCloseButton />
            <img src={item.photos?.[0] || item.img || '/default-placeholder.jpg'} alt={item.name} />
            <div className="gradient-overlay" />
            <div className="badges-wrapper">
              {(!badges || badges.length === 0) && badge && (
                <div className={`badge-pill ${badge === 'New' ? 'badge-new' : badge === 'Top Rated' ? 'badge-top' : badge === 'Trending' ? 'badge-trending' : badge === 'Featured' ? 'badge-featured' : ''}`}>
                  {badge === 'New' ? <Zap size={10} fill="white" /> : badge === 'Top Rated' ? <Star size={10} fill="white" /> : <TrendingUp size={10} />} {badge}
                </div>
              )}
              {badges?.map((tag: string) => {
                let Icon = Star;
                let badgeClass = 'badge-pill badge-top';
                if (tag === 'New') { Icon = Zap; badgeClass = 'badge-pill badge-new'; }
                else if (tag === 'Top Rated') { Icon = Star; badgeClass = 'badge-pill badge-top'; }
                else if (tag === 'Trending') { Icon = TrendingUp; badgeClass = 'badge-pill badge-trending'; }
                else if (tag === 'Featured') { Icon = Award; badgeClass = 'badge-pill badge-featured'; }
                else if (tag === 'Most Visited') { Icon = Users; badgeClass = 'badge-pill badge-visited'; }
                else return null;
                return (
                  <div key={tag} className={badgeClass}>
                     <Icon size={10} fill={tag === 'Top Rated' || tag === 'New' ? 'white' : 'currentColor'} /> {tag}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="content-body">
            <div className="rating-location-row">
              <div className="category-label">
                 <img src={stableIcon.options.iconUrl} alt={priorityCategory} />
                 {priorityCategory}
              </div>
              {item.rating && (
                <div className="rating">
                  <Star size={14} fill="currentColor" color="var(--accent-yellow)" /> {item.rating}
                </div>
              )}
            </div>
            
            <h3>{item.name}</h3>
            
            {item.location && (
              <div className="location-row">
                <MapPin size={12} /> {item.location}
              </div>
            )}
            
            <p>{(item.description || '').substring(0, 80)}...</p>
            <div className="btn-group">
              <button onClick={() => onHandleSelect(item)}>Route</button>
              <Link to={`${linkPath}?openId=${item.firebaseId || item.id}`} className="secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Details</Link>
            </div>
          </div>
        </PopupContent>
      </Popup>
    </Marker>
  );
};

interface BulusanMapProps {
  items: any[];
  searchQuery?: string;
  selectedCategories?: string[];
  focusLat?: number;
  focusLng?: number;
  focusName?: string;
  autoRoute?: boolean;
  activeTour?: any; // CustomUserTour
}

const BulusanMap = ({ items, searchQuery = '', selectedCategories = [], focusLat, focusLng, focusName, autoRoute, activeTour }: BulusanMapProps) => {
  const [selection, setSelection] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [mobileDetail, setMobileDetail] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem('isLocationEnabled') === 'true');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingRouteDest, setPendingRouteDest] = useState<L.LatLng | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const autoRouteFired = useRef(false);
  const watchId = useRef<number | null>(null);

  const BULUSAN_TOWN_CENTER = L.latLng(12.7533, 124.1362);

  const processedItems = useMemo(() => {
    const coordsMap = new Map();
    return items.map(item => {
      const lat = item.lat || item.coordinates?.lat;
      const lng = item.lng || item.coordinates?.lng;
      const itemWithCoords = { ...item, coordinates: { lat, lng } };
      
      if (!lat || !lng) return itemWithCoords;
      
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      const count = coordsMap.get(key) || 0;
      coordsMap.set(key, count + 1);
      if (count > 0) {
        const angle = count * (Math.PI / 4);
        const radius = 0.00005 * count;
        return { ...itemWithCoords, coordinates: { lat: lat + Math.cos(angle) * radius, lng: lng + Math.sin(angle) * radius } };
      }
      return itemWithCoords;
    });
  }, [items]);

  useEffect(() => {
    localStorage.setItem('isLocationEnabled', isTracking.toString());
    if (isTracking && "geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => setUserLocation(L.latLng(pos.coords.latitude, pos.coords.longitude)),
        () => { setIsTracking(false); }, { enableHighAccuracy: true }
      );
    } else if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, [isTracking]);

  useEffect(() => {
    if (isTracking && userLocation && selection.length === 2) {
      // Live Update: Keep the start point of the route pinned to the moving user
      setSelection(prev => [userLocation, prev[1]]);
    }
  }, [userLocation, isTracking]);

  useEffect(() => {
    if (!mapInstance) return;
    // Deselect: zoom back to Bulusan overview
    if (!focusLat || !focusLng) {
      mapInstance.flyTo([12.75, 124.13], 12, { duration: 1.2 });
      return;
    }
    // Zoom into the selected location
    mapInstance.flyTo([focusLat, focusLng], 17, { duration: 1.5 });
    // One-time: set up routing machine from URL param
    if (autoRoute && !autoRouteFired.current) {
      autoRouteFired.current = true;
      const destination = L.latLng(focusLat, focusLng);
      setTimeout(() => { if (isTracking && userLocation) setSelection([userLocation, destination]); else { setPendingRouteDest(destination); setShowLocationPrompt(true); } }, 900);
    }
  }, [mapInstance, focusLat, focusLng, autoRoute, isTracking, userLocation]);

  useEffect(() => {
    if (activeTour) {
      const nextUncompleted = activeTour.destinations.find((d: any) => !d.completed);
      if (nextUncompleted) {
        const item = items.find(i => (i.firebaseId || i.id).toString() === nextUncompleted.itemId);
        if (item && item.coordinates) {
          const start = isTracking && userLocation ? userLocation : BULUSAN_TOWN_CENTER;
          setSelection([start, L.latLng(item.coordinates.lat, item.coordinates.lng)]);
          if (mapInstance) {
             mapInstance.flyTo([item.coordinates.lat, item.coordinates.lng], 17, { duration: 1 });
          }
        }
      } else {
        // Tour completed
        setSelection([]);
      }
    }
  }, [activeTour, isTracking, userLocation, items, mapInstance]);

  return (
    <MapStyleWrapper>
      <LocationToggle $active={isTracking} onClick={() => setIsTracking(!isTracking)}>
        {isTracking ? <Navigation size={16} /> : <NavigationOff size={16} />} {isTracking ? 'Live Location On' : 'Location Off'}
      </LocationToggle>

      <AnimatePresence>
        {routeInfo && (
          <TravelStatsOverlay 
            initial={{ opacity: 0, y: 40, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <h4>Travel Estimates</h4>
            
            <div className="stats-content">
              <div className="stat-item"><div className="val">{routeInfo.distance}</div><div className="lab">Distance</div></div>
              <div className="stat-item" style={{ textAlign: 'right' }}><div className="val">{routeInfo.time}</div><div className="lab">Arrival</div></div>
            </div>

            <div className="mode-selection">
              <ModeButton $active={travelMode === 'driving'} onClick={() => setTravelMode('driving')} title="Driving Mode"><Car size={18} /></ModeButton>
              <ModeButton $active={travelMode === 'cycling'} onClick={() => setTravelMode('cycling')} title="Cycling Mode"><Bike size={18} /></ModeButton>
              <ModeButton $active={travelMode === 'walking'} onClick={() => setTravelMode('walking')} title="Walking Mode"><Footprints size={18} /></ModeButton>
            </div>

            <div className="close-row">
              <button className="primary" onClick={() => { setSelection([]); setRouteInfo(null); }}>Clear Route</button>
            </div>
          </TravelStatsOverlay>
        )}
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
              <button className="btn-secondary" onClick={() => { if (pendingRouteDest) setSelection([BULUSAN_TOWN_CENTER, pendingRouteDest]); setShowLocationPrompt(false); }}>Use Town Center</button>
            </div>
          </LocationPrompt>
        )}
        {mobileDetail && (
          <MobileBottomSheet 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="handle" onClick={() => setMobileDetail(null)} />
            <h3>{mobileDetail.name}</h3>
            <p>{mobileDetail.description}</p>
            <button className="nav-btn" onClick={() => setSelection([isTracking && userLocation ? userLocation : BULUSAN_TOWN_CENTER, L.latLng(mobileDetail.coordinates.lat, mobileDetail.coordinates.lng)])}>Start Route</button>
          </MobileBottomSheet>
        )}
      </AnimatePresence>

      <MapContainer center={[12.75, 124.13]} zoom={12} style={{ height: '100%', width: '100%', zIndex: 10 }} ref={setMapInstance}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <MapBounds />
        <RoutingEngine waypoints={selection} mode={travelMode} onUpdate={setRouteInfo} />

        {isTracking && userLocation && (
          <Marker position={userLocation} icon={new L.DivIcon({ className: 'user-pin', html: `<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2);"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] })} />
        )}

        {processedItems.map(item => {
          const itemCats = (Array.isArray(item.categories) ? item.categories : [((item as any).category || item.type || 'Others')]).slice(0, 3);
          const priorityCategory = selectedCategories.length > 0 && itemCats.some(ic => selectedCategories.some(sc => sc.toLowerCase().trim() === ic.toLowerCase().trim()))
            ? itemCats.find(ic => selectedCategories.some(sc => sc.toLowerCase().trim() === ic.toLowerCase().trim())) || itemCats[0]
            : itemCats[0];
          
          const queryLower = searchQuery.toLowerCase().trim();
          const itemText = (item.name + ' ' + (item.description || '')).toLowerCase().trim();
          const queryMatch = queryLower === '' || itemText.includes(queryLower);
          const categoryMatch = selectedCategories.length === 0 || selectedCategories.every(sc => itemCats.some(ic => ic.toLowerCase().trim() === sc.toLowerCase().trim()));
          const isMatch = (queryLower !== '' && item.name.toLowerCase().includes(queryLower)) || (queryMatch && categoryMatch);
          const isFocused = focusName === item.name;
          const isFiltering = !!focusName || queryLower !== '' || selectedCategories.length > 0;
          const effectiveMatch = isFiltering ? (focusName ? isFocused : isMatch) : true;
          
          const tourDest = activeTour?.destinations.find((d: any) => d.itemId === (item.firebaseId || item.id).toString());
          const isGhosted = tourDest && tourDest.completed;

          return (
            <BulusanMarker
              key={`${item.entityType}-${item.id}`}
              item={item}
              badges={getDynamicTags(item, items)}
              priorityCategory={priorityCategory}
              isMatch={effectiveMatch}
              isFocused={isFocused}
              isGhosted={isGhosted}
              onMatchDetail={(item: any) => setSelection([isTracking && userLocation ? userLocation : BULUSAN_TOWN_CENTER, L.latLng(item.coordinates.lat, item.coordinates.lng)])}
              onHandleSelect={(item: any) => {
                const start = isTracking && userLocation ? userLocation : BULUSAN_TOWN_CENTER;
                if (start && item.coordinates?.lat) {
                  setSelection([start, L.latLng(item.coordinates.lat, item.coordinates.lng)]);
                }
              }}
              isMobile={window.innerWidth < 768}
              setMobileDetail={setMobileDetail}
            />
          );
        })}
      </MapContainer>
    </MapStyleWrapper>
  );
};

export default BulusanMap;
