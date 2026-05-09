import { apiClient } from '../api/client';
import { invalidateCache } from '../hooks/useFirestore';

export const dbService = {
    add: async (colName: string, data: any) => {
        try {
            const res = await apiClient.post(`/${colName}`, data);
            invalidateCache(colName);
            return res;
        } catch (e) {
            console.error(`Error adding to ${colName}:`, e);
            throw e;
        }
    },

    delete: async (colName: string, id: string | number) => {
        try {
            const res = await apiClient.delete(`/${colName}/${id}`);
            invalidateCache(colName);
            return res;
        } catch (e) {
            console.error(`Error deleting from ${colName}:`, e);
            throw e;
        }
    },

    update: async (colName: string, id: string | number, data: any) => {
        try {
            const res = await apiClient.put(`/${colName}/${id}`, data);
            invalidateCache(colName);
            return res;
        } catch (e) {
            console.error(`Error updating ${colName}:`, e);
            throw e;
        }
    },

    trackInteraction: async (colName: string, id: string | number) => {
        try {
            return await apiClient.post(`/interaction/${colName}/${id}`, {});
        } catch (e) {
            console.error(`Error tracking interaction for ${colName}:`, e);
        }
    },

    updateGlobalStats: async (incrementVisitors: boolean = false) => {
        try {
            return await apiClient.post(`/global-stats`, { incrementVisitors });
        } catch (e) {
            console.error(`Error updating global stats:`, e);
        }
    }
};
