import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Attraction, BlogPost, Inquiry, Tour, Enterprise, CheckIn, User, Heritage } from '../data/types';

// Global memory cache to eliminate async latency on subsequent navigations
const memoryCache: Record<string, { data: any[], timestamp: number }> = {};
const collectionEvents = new EventTarget();

// Cache TTL in milliseconds (5 seconds)
const CACHE_TTL = 5000;

const MOCK_ATTRACTIONS: Attraction[] = [
    {
        id: 10001,
        name: "Bulusan Lake Viewing Deck",
        categories: ["Nature", "Scenic"],
        rating: 4.8,
        location: "Bulusan Volcano Natural Park, Sorsogon",
        coordinates: { lat: 12.769, lng: 124.057 },
        img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800",
        description: "A stunning elevated viewing deck overlooking the serene Bulusan Lake, nestled within the lush crater of the Bulusan Volcano. Perfect for sunrise photography and nature walks.",
        featured: true,
        isFreeAdmission: false,
        tags: ["Lake", "Volcano", "Scenic"],
        metadata: { entranceFee: "₱50", hours: "6:00 AM - 5:00 PM", difficulty: "Moderate" },
        visits: 892,
        ...({
          ownerId: 'mock-owner-id',
          ownerName: 'Local Owner',
        } as any)
    },
    {
        id: 10002,
        name: "Dancalan Beach Resort",
        categories: ["Beach", "Swimming"],
        rating: 4.6,
        location: "Dancalan, Bulusan, Sorsogon",
        coordinates: { lat: 12.745, lng: 124.101 },
        img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
        description: "A pristine black-sand beach with calm, crystal-clear waters ideal for swimming, snorkeling, and beachside relaxation.",
        featured: false,
        isFreeAdmission: true,
        tags: ["Beach", "Swimming", "Black Sand"],
        metadata: { entranceFee: "Free", hours: "Open 24 Hours", difficulty: "Easy" },
        visits: 1540,
        ...({
          ownerId: 'mock-owner-id',
          ownerName: 'Local Owner',
        } as any)
    },
    {
        id: 10003,
        name: "San Bernardino Heritage Church",
        categories: ["Heritage", "Cultural"],
        rating: 4.9,
        location: "San Bernardino, Sorsogon",
        coordinates: { lat: 12.760, lng: 124.088 },
        img: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=800",
        description: "A centuries-old colonial church standing as a testament to the rich Catholic heritage of Sorsogon. Features stunning baroque architecture and intricate stone carvings.",
        featured: true,
        isFreeAdmission: true,
        tags: ["Heritage", "Church", "Colonial"],
        metadata: { entranceFee: "Free", hours: "7:00 AM - 6:00 PM", difficulty: "Easy" },
        visits: 2100,
        ...({
          ownerId: 'mock-admin-id',
          ownerName: 'Local Admin',
        } as any)
    },
    {
        id: 10004,
        name: "Tukuran Falls",
        categories: ["Waterfalls", "Adventure"],
        rating: 4.7,
        location: "Irosin, Sorsogon",
        coordinates: { lat: 12.706, lng: 124.035 },
        img: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=800",
        description: "A majestic multi-tiered waterfall hidden deep within the rainforest of Irosin. The cool turquoise waters are perfect for swimming and cliff diving.",
        featured: false,
        isFreeAdmission: false,
        tags: ["Waterfall", "Swimming", "Nature"],
        metadata: { entranceFee: "₱30", hours: "7:00 AM - 4:00 PM", difficulty: "Moderate" },
        visits: 678,
        ...({
          ownerId: 'mock-admin-id',
          ownerName: 'Local Admin',
        } as any)
    }
];

// Admin sees ALL mock attractions. Owner sees only their own.
export function getMockAttractionsByRole(userId?: string): Attraction[] {
    if (!userId) return MOCK_ATTRACTIONS;
    if (userId === 'mock-owner-id') return MOCK_ATTRACTIONS.filter((a: any) => a.ownerId === 'mock-owner-id');
    // Admin or user sees all
    return MOCK_ATTRACTIONS;
}

export async function preloadCollection(colName: string): Promise<void> {
    if (memoryCache[colName] && (Date.now() - memoryCache[colName].timestamp < CACHE_TTL)) return;

    if (colName === 'attractions') {
        memoryCache[colName] = { data: MOCK_ATTRACTIONS, timestamp: Date.now() };
        return;
    }

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

        if (colName === 'attractions') {
            memoryCache[colName] = { data: MOCK_ATTRACTIONS, timestamp: Date.now() };
            setData(MOCK_ATTRACTIONS as unknown as T[]);
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
