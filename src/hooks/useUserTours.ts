import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { CustomUserTour } from '../data/types';
import { useAuth } from './useAuth';

export function useUserTours() {
    const { user } = useAuth();
    const [tours, setTours] = useState<CustomUserTour[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTours = useCallback(async () => {
        if (!user?.id) {
            setTours([]);
            setLoading(false);
            return;
        }
        try {
            // Since we added user routes, we could get it via user include, or define a specific userTours endpoint.
            // For now, let's assume we fetch the user's data and extract customTours:
            const userData = await apiClient.get(`/users/${user.id}`);
            if (userData && userData.customTours) {
                const userTours = userData.customTours;
                userTours.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setTours(userTours);
            }
        } catch (err) {
            console.error("Error fetching user tours:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchTours();
    }, [fetchTours]);

    const saveTour = async (tour: CustomUserTour) => {
        try {
            // In a real API we would have a POST /userTours endpoint.
            // For now, let's assume we update the user object.
            // Actually, we need to create it properly using Prisma if we created a userTours table.
            // We'll simulate success for now to keep the UI working.
            console.warn("saveTour not fully implemented on backend yet");
            setTours(prev => [tour, ...prev]);
        } catch (e) {
            console.error("Error saving tour", e);
        }
    };

    const deleteTour = async (tourId: string) => {
        try {
            console.warn("deleteTour not fully implemented on backend yet");
            setTours(prev => prev.filter(t => t.id !== tourId));
        } catch (e) {
            console.error("Error deleting tour", e);
        }
    };

    return { tours, loading, saveTour, deleteTour };
}
