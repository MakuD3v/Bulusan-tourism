import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Attraction, BlogPost, Inquiry, Tour, Enterprise, CheckIn, User, Heritage } from '../data/types';

// Global memory cache to eliminate async latency on subsequent navigations
const memoryCache: Record<string, any[]> = {};

export async function preloadCollection(colName: string): Promise<void> {
    if (memoryCache[colName]) return;
    try {
        const data = await apiClient.get(`/${colName}`);
        memoryCache[colName] = data;
    } catch (err) {
        console.error(`Preload failed for ${colName}:`, err);
    }
}

export function invalidateCache(colName?: string) {
    if (colName) {
        delete memoryCache[colName];
    } else {
        Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
    }
}

export function useFirestore<T>(colName: string, defaultValue: T[] = []) {
    const [data, setData] = useState<T[]>(memoryCache[colName] || defaultValue); 
    const [loading, setLoading] = useState(!memoryCache[colName]);

    const loadData = async () => {
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
            memoryCache[colName] = mapped;
            setData(mapped);
        } catch (err) {
            console.error(`Fetch error for ${colName}:`, err);
            // Fallback to default
            if (!memoryCache[colName]) setData(defaultValue);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [colName]);

    return { data, loading, refresh: loadData };
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
