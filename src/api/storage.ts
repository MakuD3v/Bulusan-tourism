import { apiClient } from '../api/client';

/**
 * Uploads a file to the Node.js Express server.
 * @param file The file to upload
 * @param path Optional path string (mostly ignored since server handles filename)
 * @returns A promise that resolves to the download URL
 */
export const uploadFile = async (file: File, path?: string): Promise<string> => {
    try {
        const res = await apiClient.upload(file);
        // Ensure it points to the correct backend host (localhost during dev)
        return `http://localhost:5000${res.url}`;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
};
