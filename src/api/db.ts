import { apiClient } from '../api/client';

export const dbService = {
    add: async (colName: string, data: any) => {
        try {
            return await apiClient.post(`/${colName}`, data);
        } catch (e) {
            console.error(`Error adding to ${colName}:`, e);
            throw e;
        }
    },

    delete: async (colName: string, id: string | number) => {
        try {
            return await apiClient.delete(`/${colName}/${id}`);
        } catch (e) {
            console.error(`Error deleting from ${colName}:`, e);
            throw e;
        }
    },

    update: async (colName: string, id: string | number, data: any) => {
        try {
            return await apiClient.put(`/${colName}/${id}`, data);
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
