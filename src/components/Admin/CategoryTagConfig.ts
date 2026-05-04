// ─────────────────────────────────────────────────────────────────────────────
// Shared Category + Tag configuration for all Admin Managers
// Each category has: label, icon (Lucide name), bg colour, text colour
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryDef {
  label: string;
  icon: string;   // Lucide icon component name (PascalCase)
  bg: string;
  color: string;
}

// ── ATTRACTIONS ──────────────────────────────────────────────────────────────
export const ATTRACTION_CATEGORIES: CategoryDef[] = [
  { label: 'Nature',     icon: 'TreePine',        bg: '#dcfce7', color: '#15803d' },
  { label: 'Falls',      icon: 'Waves',           bg: '#dbeafe', color: '#1d4ed8' },
  { label: 'Volcano',    icon: 'Mountain',        bg: '#fee2e2', color: '#b91c1c' },
  { label: 'Lake',       icon: 'Droplets',        bg: '#e0f2fe', color: '#0369a1' },
  { label: 'Beach',      icon: 'Sunset',          bg: '#fef9c3', color: '#a16207' },
  { label: 'Hiking',     icon: 'Footprints',      bg: '#f3e8ff', color: '#7e22ce' },
  { label: 'Cave',       icon: 'Moon',            bg: '#1e293b', color: '#e2e8f0' },
  { label: 'Wildlife',   icon: 'Bird',            bg: '#ecfccb', color: '#365314' },
  { label: 'Gardens',    icon: 'Flower2',         bg: '#fce7f3', color: '#9d174d' },
  { label: 'Viewpoint',  icon: 'Telescope',       bg: '#ede9fe', color: '#6d28d9' },
  { label: 'River',      icon: 'Anchor',          bg: '#cffafe', color: '#0e7490' },
  { label: 'Spring',     icon: 'Droplet',         bg: '#e0f7fa', color: '#006064' },
  { label: 'Landmarks',  icon: 'Landmark',        bg: '#f5f5f4', color: '#44403c' },
  { label: 'Park',       icon: 'Leaf',            bg: '#d1fae5', color: '#065f46' },
  { label: 'Ruins',      icon: 'Layers',          bg: '#fef3c7', color: '#92400e' },
  { label: 'Other',      icon: 'MapPin',          bg: '#f1f5f9', color: 'var(--text-light)' },
  { label: 'Church',         icon: 'Church',          bg: '#fef9c3', color: '#a16207' },
  { label: 'Fort',           icon: 'Castle',          bg: '#fee2e2', color: '#b91c1c' },
  { label: 'Museum',         icon: 'Landmark',        bg: '#dbeafe', color: '#1d4ed8' },
  { label: 'Monument',       icon: 'Crown',           bg: '#f5f5f4', color: '#44403c' },
  { label: 'Ancestral Home', icon: 'Archive',         bg: '#fef3c7', color: '#92400e' },
  { label: 'Cemetery',       icon: 'Cross',           bg: '#e2e8f0', color: '#475569' },
  { label: 'Shrine',         icon: 'Star',            bg: '#f3e8ff', color: '#7e22ce' },
  { label: 'Cultural Site',  icon: 'Drama',           bg: '#ecfccb', color: '#365314' },
  { label: 'Archaeological', icon: 'ScanSearch',      bg: '#fce7f3', color: '#9d174d' },
  { label: 'Indigenous',     icon: 'Feather',         bg: '#d1fae5', color: '#065f46' },
];

export const ATTRACTION_TAGS: string[] = [
  'Adventure', 'Relaxing', 'Scenic', 'Thrilling', 'Peaceful', 'Romantic', 'Spiritual',
  'Family Friendly', 'Solo Friendly', 'Group Tour', 'Couple', 'Senior Friendly', 'Kid Friendly',
  'Outdoor', 'Swimming', 'Trekking', 'Camping', 'Bird Watching', 'Diving', 'Snorkeling',
  'Historical', 'Cultural', 'Indigenous', 'Educational', 'Photography Spot',
  'Free Entry', 'Budget', 'Must Visit', 'Hidden Gem', 'Wheelchair Accessible', 'Pet Friendly',
  'Best in Summer', 'Best in Rainy Season', 'Year Round',
  'Pre-Colonial', 'Spanish Colonial', 'American Era', 'World War II', 'Post-War', 'Contemporary',
  'Religious', 'Political', 'Military', 'Archaeological', 'Natural Heritage',
  'Guided Tours Available', 'Paid Entry', 'Open Daily',
  'Artifacts', 'Architecture', 'Inscriptions', 'Oral Tradition', 'Festival Site',
];

// ── ENTERPRISES ───────────────────────────────────────────────────────────
export const ENTERPRISE_CATEGORIES: CategoryDef[] = [
  { label: 'Hotel',          icon: 'BedDouble',       bg: '#dbeafe', color: '#1d4ed8' },
  { label: 'Resort',         icon: 'Palmtree',        bg: '#fef9c3', color: '#a16207' },
  { label: 'Hostel',         icon: 'Bed',             bg: '#f3e8ff', color: '#7e22ce' },
  { label: 'Pension House',  icon: 'Home',            bg: '#dcfce7', color: '#15803d' },
  { label: 'Cottage',        icon: 'House',           bg: '#fed7aa', color: '#c2410c' },
  { label: 'Glamping',       icon: 'Tent',            bg: '#d1fae5', color: '#065f46' },
  { label: 'Swimming Pool',  icon: 'Waves',           bg: '#cffafe', color: '#0e7490' },
  { label: 'Restaurant',     icon: 'UtensilsCrossed', bg: '#fee2e2', color: '#b91c1c' },
  { label: 'Cafe',           icon: 'Coffee',          bg: '#fef3c7', color: '#92400e' },
  { label: 'Bar & Lounge',   icon: 'Wine',            bg: '#ede9fe', color: '#6d28d9' },
  { label: 'Spa & Wellness', icon: 'Sparkles',        bg: '#fce7f3', color: '#9d174d' },
  { label: 'Function Hall',  icon: 'Building',        bg: '#f0fdf4', color: '#166534' },
  { label: 'Farm Stay',      icon: 'Wheat',           bg: '#ecfccb', color: '#365314' },
  { label: 'Camping Site',   icon: 'Tent',            bg: '#e0f2fe', color: '#0369a1' },
];

export const ENTERPRISE_TAGS: string[] = [
  'Luxury', 'Mid-Range', 'Budget', 'Backpacker',
  'Romantic', 'Family Friendly', 'Group Booking', 'Business Ready', 'Honeymoon Suite',
  'Pool', 'Free WiFi', 'Air Conditioning', 'Restaurant On-Site', 'Room Service',
  'Free Parking', 'Pet Friendly', 'Bar', 'Spa', 'Gym', 'Conference Room',
  'Nature View', 'Mountain View', 'Lake View', 'Ocean View', 'Garden View',
  'Local Cuisine', 'Breakfast Included', 'All Inclusive',
  'Wheelchair Accessible', '24h Reception', 'Early Check-In', 'Late Check-Out',
];


// ── BLOG ───────────────────────────────────────────────────────────────────
export const BLOG_CATEGORIES: CategoryDef[] = [
  { label: 'Travel Guide',   icon: 'Map',           bg: '#e0f2fe', color: '#0369a1' },
  { label: 'Adventure',      icon: 'Compass',       bg: '#dcfce7', color: '#15803d' },
  { label: 'Food & Culture', icon: 'Utensils',      bg: '#fed7aa', color: '#c2410c' },
  { label: 'Updates',        icon: 'Radio',         bg: '#fee2e2', color: '#b91c1c' },
];

// Helper to reliably map any category name to the exact static generated SVG file
export const getMapIconUrl = (category: string) => {
  let catLower = (category || '').toLowerCase();
  
  let iconName = catLower
    .replace(/\s&\s/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  if (!iconName) iconName = 'general';
  
  return `/map-icons/${iconName}.svg`;
};
