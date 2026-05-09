import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Attraction, BlogPost, Inquiry, Tour, Enterprise, CheckIn, User, Heritage } from '../data/types';

// Global memory cache to eliminate async latency on subsequent navigations
const memoryCache: Record<string, { data: any[], timestamp: number }> = {};
const collectionEvents = new EventTarget();

// Cache TTL in milliseconds (5 seconds)
const CACHE_TTL = 5000;

export async function preloadCollection(colName: string): Promise<void> {
    if (memoryCache[colName] && (Date.now() - memoryCache[colName].timestamp < CACHE_TTL)) return;
    try {
        const data = await apiClient.get(`/${colName}`);
        memoryCache[colName] = { data, timestamp: Date.now() };
    } catch (err) {
        console.error(`Preload failed for ${colName}:`, err);
    }
}

export function invalidateCache(colName?: string) {
    if (colName) {
        delete memoryCache[colName];
        collectionEvents.dispatchEvent(new CustomEvent('updated', { detail: { colName } }));
    } else {
        Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
        collectionEvents.dispatchEvent(new CustomEvent('updated', { detail: { colName: 'all' } }));
    }
}

export function useFirestore<T>(colName: string, defaultValue: T[] = []) {
    const [data, setData] = useState<T[]>(memoryCache[colName]?.data || defaultValue); 
    const [loading, setLoading] = useState(!memoryCache[colName]);

    const loadData = async (force: boolean = false) => {
        // If data is fresh and not forced, skip fetch
        if (!force && memoryCache[colName] && (Date.now() - memoryCache[colName].timestamp < CACHE_TTL)) {
            setLoading(false);
            return;
        }

        try {
            const typeMap: Record<string, string> = {
                'attractions': 'Attraction',
                'enterprises': 'Enterprise',
                'heritage': 'Heritage',
                'blogs': 'Blog',
                'tours': 'Tour'
            };
            const entityType = typeMap[colName] || 'Unknown';
            const res = await apiClient.get(`/${colName}`);
            const mapped = res.map((item: any) => ({ 
                ...item, 
                firebaseId: item.id.toString(),
                entityType 
            }));
            memoryCache[colName] = { data: mapped, timestamp: Date.now() };
            setData(mapped);
        } catch (err) {
            console.error(`Fetch error for ${colName}:`, err);
            if (!memoryCache[colName]) setData(defaultValue);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Listen for global cache invalidations/updates
        const handleUpdate = (e: any) => {
            if (e.detail.colName === colName || e.detail.colName === 'all') {
                loadData(true); // Force reload on update
            }
        };

        collectionEvents.addEventListener('updated', handleUpdate);
        return () => collectionEvents.removeEventListener('updated', handleUpdate);
    }, [colName]);

    return { data, loading, refresh: () => loadData(true) };
}

export function useUsers(initialData: User[] = []) {
    return useFirestore<User>('users', initialData);
}

export function useAttractions(initialData: Attraction[] = []) {
    return useFirestore<Attraction>('attractions', initialData);
}

export function useBlogs(initialData: BlogPost[] = []) {
    return useFirestore<BlogPost>('blogs', initialData);
}

export function useInquiries(initialData: Inquiry[] = []) {
    return useFirestore<Inquiry>('inquiries', initialData);
}

export function useTours(initialData: Tour[] = []) {
    return useFirestore<Tour>('tours', initialData);
}

export function useEnterprises(initialData: Enterprise[] = []) {
    return useFirestore<Enterprise>('enterprises', initialData);
}

export function useHeritage(initialData: Heritage[] = []) {
    return useFirestore<Heritage>('heritage', initialData);
}

export function useCheckIns(initialData: CheckIn[] = []) {
    return useFirestore<CheckIn>('checkins', initialData);
}

export function useGlobalStats() {
    const [stats, setStats] = useState<any>({ totalVisitors: 0 });
    const [loading, setLoading] = useState(true);

    const loadStats = () => {
        setLoading(true);
        apiClient.get('/global-stats').then(res => {
            if (res.length > 0) {
                setStats(res[0]);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        loadStats();
        // Polling for real-time dashboard feel (every 30s)
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return { stats, loading, refresh: loadStats };
}
