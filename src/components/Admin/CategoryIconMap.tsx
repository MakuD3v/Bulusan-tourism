import React from 'react';
import {
  TreePine, Waves, Mountain, Droplets, Sunset, Footprints, Moon, Bird, Flower2,
  Telescope, Anchor, Droplet, Landmark, Leaf, Layers, MapPin,
  BedDouble, Palmtree, Bed, Home, House, Tent, UtensilsCrossed, Coffee, Wine,
  Sparkles, Building, Wheat,
  Church, Castle, Crown, Archive, Cross, Star, Drama, ScanSearch, Feather, Flag,
  LucideProps,
} from 'lucide-react';

// ─── Icon registry ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  TreePine, Waves, Mountain, Droplets, Sunset, Footprints, Moon, Bird, Flower2,
  Telescope, Anchor, Droplet, Landmark, Leaf, Layers, MapPin,
  BedDouble, Palmtree, Bed, Home, House, Tent, UtensilsCrossed, Coffee, Wine,
  Sparkles, Building, Wheat,
  Church, Castle, Crown, Archive, Cross, Star, Drama, ScanSearch, Feather, Flag,
};

// ─── CategoryIcon component ───────────────────────────────────────────────────
interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  const Icon = ICON_MAP[name] ?? MapPin;
  return <Icon {...props} />;
};

export default CategoryIcon;
