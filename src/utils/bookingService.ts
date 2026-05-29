import { apiClient } from '../api/client';
import { idbService } from '../api/dbUtils';
import { CuratedRoute, TourBooking } from '../data/types';

// ─── Palette for booking colours on calendar ─────────────────────────────────
const BOOKING_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
];

function pickColor(existingColors: string[]): string {
  const unused = BOOKING_PALETTE.filter(c => !existingColors.includes(c));
  if (unused.length > 0) return unused[0];
  return BOOKING_PALETTE[Math.floor(Math.random() * BOOKING_PALETTE.length)];
}

// ─── Auto-Schedule logic ──────────────────────────────────────────────────────
/**
 * Distributes route stops across the selected dates based on user answers.
 * Returns the same selectedDates in the right order (they're already chosen by user).
 * In auto mode, if no dates given, returns dates starting from tomorrow.
 */
export function autoScheduleDates(
  estimatedDays: number,
  pace: 'Relaxed' | 'Moderate' | 'Fast'
): string[] {
  const factor = pace === 'Relaxed' ? 1.5 : pace === 'Fast' ? 0.75 : 1;
  const days = Math.max(1, Math.round(estimatedDays * factor));
  const dates: string[] = [];
  const start = new Date();
  start.setDate(start.getDate() + 1); // Tomorrow
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// ─── Curated Routes ───────────────────────────────────────────────────────────
async function isApiAvailable(): Promise<boolean> {
  try {
    await apiClient.get('/attractions');
    return true;
  } catch {
    return false;
  }
}

export const curatedRouteService = {
  async getAll(): Promise<CuratedRoute[]> {
    try {
      const online = await isApiAvailable();
      if (online) {
        const res = await apiClient.get('/curated-routes');
        return Array.isArray(res) ? res : [];
      }
    } catch { /* fall through */ }
    return idbService.getAll('curatedRoutes') as Promise<CuratedRoute[]>;
  },

  async save(route: CuratedRoute): Promise<CuratedRoute> {
    try {
      const online = await isApiAvailable();
      if (online) {
        if (route.id && (route as any)._exists) {
          return await apiClient.put(`/curated-routes/${route.id}`, route);
        }
        return await apiClient.post('/curated-routes', route);
      }
    } catch { /* fall through */ }
    await idbService.put('curatedRoutes', route);
    return route;
  },

  async delete(id: string): Promise<void> {
    try {
      const online = await isApiAvailable();
      if (online) {
        await apiClient.delete(`/curated-routes/${id}`);
        return;
      }
    } catch { /* fall through */ }
    await idbService.delete('curatedRoutes', id);
  },
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const MAX_BOOKINGS_PER_MONTH = 20;

export const bookingService = {
  async getAll(): Promise<TourBooking[]> {
    try {
      const online = await isApiAvailable();
      if (online) {
        const res = await apiClient.get('/bookings');
        return Array.isArray(res) ? res : [];
      }
    } catch { /* fall through */ }
    return idbService.getAll('bookings') as Promise<TourBooking[]>;
  },

  /** Returns how many bookings already exist in a given month (YYYY-MM) */
  async countInMonth(yearMonth: string): Promise<number> {
    const all = await this.getAll();
    return all.filter(b =>
      b.scheduledDates.some(d => d.startsWith(yearMonth)) &&
      b.status !== 'Cancelled'
    ).length;
  },

  async create(booking: Omit<TourBooking, 'id' | 'color' | 'createdAt' | 'status'>): Promise<TourBooking> {
    const all = await this.getAll();
    const usedColors = all.map(b => b.color || '');
    const newBooking: TourBooking = {
      ...booking,
      id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'Pending',
      color: pickColor(usedColors),
      createdAt: Date.now(),
    };

    try {
      const online = await isApiAvailable();
      if (online) {
        return await apiClient.post('/bookings', newBooking);
      }
    } catch { /* fall through */ }

    await idbService.put('bookings', newBooking);
    return newBooking;
  },

  async update(id: string, patch: Partial<TourBooking>): Promise<void> {
    try {
      const online = await isApiAvailable();
      if (online) {
        await apiClient.put(`/bookings/${id}`, patch);
        return;
      }
    } catch { /* fall through */ }
    const all = await this.getAll();
    const existing = all.find(b => b.id === id);
    if (existing) {
      await idbService.put('bookings', { ...existing, ...patch });
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const online = await isApiAvailable();
      if (online) {
        await apiClient.delete(`/bookings/${id}`);
        return;
      }
    } catch { /* fall through */ }
    await idbService.delete('bookings', id);
  },
};
