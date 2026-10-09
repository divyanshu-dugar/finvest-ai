import {
  Cpu, HeartPulse, Landmark, ShoppingBag, ShoppingBasket, Flame, Factory,
  Pickaxe, Building, Zap, RadioTower, Briefcase,
} from 'lucide-react';

// Sector names match the API's SIC-to-sector mapping. Each gets an icon and a color code.
export const SECTORS = {
  'Technology': { icon: Cpu, color: '#2456c8' },
  'Healthcare': { icon: HeartPulse, color: '#c2334d' },
  'Financial Services': { icon: Landmark, color: '#0e6f84' },
  'Consumer Discretionary': { icon: ShoppingBag, color: '#c4561b' },
  'Consumer Staples': { icon: ShoppingBasket, color: '#9a6b06' },
  'Energy': { icon: Flame, color: '#b5401f' },
  'Industrials': { icon: Factory, color: '#4b5563' },
  'Materials': { icon: Pickaxe, color: '#7c5a3a' },
  'Real Estate': { icon: Building, color: '#0f7a6c' },
  'Utilities': { icon: Zap, color: '#3b6fb0' },
  'Communication Services': { icon: RadioTower, color: '#a23b8a' },
  'Other': { icon: Briefcase, color: '#6a6d67' },
};

export const SECTOR_NAMES = Object.keys(SECTORS);

export function getSector(name) {
  return SECTORS[name] || SECTORS.Other;
}
