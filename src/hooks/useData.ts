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
        if (Array.isArray(data)) {
            memoryCache[colName] = { data, timestamp: Date.now() };
        } else {
            console.warn(`Preload returned non-array for ${colName}:`, data);
        }
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

export function useCollection<T>(colName: string, defaultValue: T[] = []) {
    const cached = memoryCache[colName]?.data;
    const initialData = Array.isArray(cached) ? cached : defaultValue;
    const [data, setData] = useState<T[]>(initialData);
    const [loading, setLoading] = useState(!Array.isArray(cached));

    const loadData = async (force: boolean = false) => {
        if (!force && Array.isArray(memoryCache[colName]?.data) && (Date.now() - memoryCache[colName].timestamp < CACHE_TTL)) {
            setLoading(false);
            return;
        }

        try {
            const res = await apiClient.get(`/${colName}`);
            if (Array.isArray(res)) {
                memoryCache[colName] = { data: res, timestamp: Date.now() };
                setData(res);
            } else {
                console.warn(`Fetch returned non-array for ${colName}:`, res);
                if (!Array.isArray(memoryCache[colName]?.data)) setData(defaultValue);
            }
        } catch (err) {
            console.error(`Fetch error for ${colName}:`, err);
            if (!Array.isArray(memoryCache[colName]?.data)) setData(defaultValue);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        const handleUpdate = (e: any) => {
            if (e.detail.colName === colName || e.detail.colName === 'all') {
                loadData(true);
            }
        };

        collectionEvents.addEventListener('updated', handleUpdate);
        return () => collectionEvents.removeEventListener('updated', handleUpdate);
    }, [colName]);

    return { data, loading, refresh: () => loadData(true) };
}

export function useUsers(initialData: User[] = []) {
    return useCollection<User>('users', initialData);
}

export function useAttractions(initialData: Attraction[] = []) {
    return useCollection<Attraction>('attractions', initialData);
}

export function useBlogs(initialData: BlogPost[] = []) {
    return useCollection<BlogPost>('blogs', initialData);
}

export function useInquiries(initialData: Inquiry[] = []) {
    return useCollection<Inquiry>('inquiries', initialData);
}

export function useTours(initialData: Tour[] = []) {
    return useCollection<Tour>('tours', initialData);
}

export function useEnterprises(initialData: Enterprise[] = []) {
    return useCollection<Enterprise>('enterprises', initialData);
}

export function useHeritage(initialData: Heritage[] = []) {
    return useCollection<Heritage>('heritage', initialData);
}

export function useCheckIns(initialData: CheckIn[] = []) {
    return useCollection<CheckIn>('checkins', initialData);
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
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return { stats, loading, refresh: loadStats };
}
