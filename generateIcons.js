import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import icons from 'lucide-static';

// Need to match CategoryTagConfig's structure roughly
const categories = [
  // Attractions
  { name: 'nature', icon: 'TreePine', color: '#15803d' },
  { name: 'falls', icon: 'Waves', color: '#1d4ed8' },
  { name: 'volcano', icon: 'Mountain', color: '#b91c1c' },
  { name: 'lake', icon: 'Droplets', color: '#0369a1' },
  { name: 'beach', icon: 'Sunset', color: '#a16207' },
  { name: 'hiking', icon: 'Footprints', color: '#7e22ce' },
  { name: 'cave', icon: 'Moon', color: '#e2e8f0' }, 
  { name: 'wildlife', icon: 'Bird', color: '#365314' },
  { name: 'gardens', icon: 'Flower2', color: '#9d174d' },
  { name: 'viewpoint', icon: 'Telescope', color: '#6d28d9' },
  { name: 'river', icon: 'Anchor', color: '#0e7490' },
  { name: 'spring', icon: 'Droplet', color: '#006064' },
  { name: 'landmarks', icon: 'Landmark', color: '#44403c' },
  { name: 'park', icon: 'Leaf', color: '#065f46' },
  { name: 'ruins', icon: 'Layers', color: '#92400e' },
  { name: 'other', icon: 'MapPin', color: '#64748b' },

  // Accommodities
  { name: 'hotel', icon: 'BedDouble', color: '#1d4ed8' },
  { name: 'resort', icon: 'Palmtree', color: '#a16207' },
  { name: 'hostel', icon: 'Bed', color: '#7e22ce' },
  { name: 'pension-house', icon: 'Home', color: '#15803d' },
  { name: 'cottage', icon: 'House', color: '#c2410c' },
  { name: 'glamping', icon: 'Tent', color: '#065f46' },
  { name: 'swimming-pool', icon: 'Waves', color: '#0e7490' },
  { name: 'restaurant', icon: 'UtensilsCrossed', color: '#b91c1c' },
  { name: 'cafe', icon: 'Coffee', color: '#92400e' },
  { name: 'bar-lounge', icon: 'Wine', color: '#6d28d9' },
  { name: 'spa-wellness', icon: 'Sparkles', color: '#9d174d' },
  { name: 'function-hall', icon: 'Building', color: '#166534' },
  { name: 'farm-stay', icon: 'Wheat', color: '#365314' },
  { name: 'camping-site', icon: 'Tent', color: '#0369a1' },

  // Heritage
  { name: 'church', icon: 'Church', color: '#a16207' },
  { name: 'fort', icon: 'Castle', color: '#b91c1c' },
  { name: 'museum', icon: 'Landmark', color: '#1d4ed8' },
  { name: 'monument', icon: 'Crown', color: '#44403c' },
  { name: 'ancestral-home', icon: 'Archive', color: '#92400e' },
  { name: 'cemetery', icon: 'Cross', color: '#475569' },
  { name: 'shrine', icon: 'Star', color: '#7e22ce' },
  { name: 'cultural-site', icon: 'Drama', color: '#365314' },
  { name: 'archaeological', icon: 'ScanSearch', color: '#9d174d' },
  { name: 'indigenous', icon: 'Feather', color: '#065f46' },
  
  // Blog
  { name: 'travel-guide', icon: 'Map', color: '#0369a1' },
  { name: 'adventure', icon: 'Compass', color: '#15803d' },
  { name: 'food-culture', icon: 'Utensils', color: '#c2410c' },
  { name: 'updates', icon: 'Radio', color: '#b91c1c' },

  // Base
  { name: 'general', icon: 'MapPin', color: '#64748b' }
];

const SVG_TEMPLATE = (color, innerPaths) => `
<svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 1C9.5 1 1 9.5 1 20C1 32 20 49 20 49C20 49 39 32 39 20C39 9.5 30.5 1 20 1Z" fill="${color}" stroke="white" stroke-width="1.5"/>
  <circle cx="20" cy="20" r="14" fill="white" fill-opacity="0.95"/>
  <g transform="translate(10, 10) scale(0.833)" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
    ${innerPaths}
  </g>
</svg>
`.trim();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'public', 'map-icons');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

for (const cat of categories) {
  const iconHtml = icons[cat.icon];
  if (!iconHtml) {
    console.error(`Warning: Icon '${cat.icon}' not found in lucide-static for category ${cat.name}`);
    continue;
  }
  
  // Extract paths/shapes from lucide SVG
  const innerPathsMatch = iconHtml.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (innerPathsMatch && innerPathsMatch[1]) {
    const rawPaths = innerPathsMatch[1].trim();
    // Some icons use fill="currentColor" or stroke="currentColor", the <g> block handles this somewhat,
    // but lucide uses standard stroke="currentColor". Which will inherit our stroke logic nicely.
    
    // Convert currentcolor to nothing or let inheritance handle it
    const innerFiltered = rawPaths;

    const finalSvg = SVG_TEMPLATE(cat.color, innerFiltered);
    
    fs.writeFileSync(path.join(OUT_DIR, `${cat.name}.svg`), finalSvg);
    console.log(`Generated -> ${cat.name}.svg (${cat.icon})`);
  }
}
console.log('All icons generated successfully!');
