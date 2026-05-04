import React, { useState } from 'react';
import styled from 'styled-components';
import { apiClient } from '../../api/client';
import { attractions } from '../../data/attractions';
import { blogPosts } from '../../data/blog';
import { Database, UploadCloud, Trash2, CheckCircle, Loader2 } from 'lucide-react';

const SeederContainer = styled.div`
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  max-width: 600px;
  margin: 40px auto;
  text-align: center;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px auto;
  width: 100%;
  justify-content: center;
  background: ${props => props.$variant === 'danger' ? '#fee2e2' : '#f0f7ff'};
  color: ${props => props.$variant === 'danger' ? '#ef4444' : '#2e75b6'};
  transition: all 0.2s;

  &:hover { transform: translateY(-2px); opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const DataSeeder = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const seedData = async () => {
        setLoading(true);
        setStatus('Seeding attractions...');
        try {
            // 1. Seed Attractions
            for (const item of attractions) {
                await apiClient.post('/attractions', item);
            }

            setStatus('Seeding blogs...');
            // 2. Seed Blogs
            for (const post of blogPosts) {
                await apiClient.post('/blogs', post);
            }

            setStatus('Platform data successfully cloud-synced!');
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            console.error(err);
            setStatus('Error seeding data.');
        } finally {
            setLoading(false);
        }
    };

    const clearData = async (col: string) => {
        setLoading(true);
        setStatus(`Clearing ${col}...`);
        try {
            // Fetch all, then delete one by one
            const items = await apiClient.get(`/${col}`);
            for (const item of items) {
                await apiClient.delete(`/${col}/${item.id}`);
            }
            setStatus(`${col} cleared.`);
            setTimeout(() => setStatus(null), 2000);
        } catch (err) {
            setStatus('Error clearing.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SeederContainer>
            <div style={{ color: '#2e75b6', marginBottom: '20px' }}><Database size={48} /></div>
            <h2 style={{ marginBottom: '8px' }}>SQL Data Utility</h2>
            <p style={{ color: '#666', marginBottom: '32px' }}>Use this to push local assets to your Express PostgreSQL database.</p>

            {status && (
                <div style={{ padding: '12px', background: '#ecfdf5', color: '#10b981', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                    {status}
                </div>
            )}

            <Button onClick={seedData} disabled={loading}>
                <UploadCloud size={18} /> Push Static Assets to Database
            </Button>

            <div style={{ display: 'flex', gap: '12px' }}>
                <Button $variant="danger" onClick={() => clearData('attractions')} disabled={loading}>
                    <Trash2 size={16} /> Clear Attractions
                </Button>
                <Button $variant="danger" onClick={() => clearData('blogs')} disabled={loading}>
                    <Trash2 size={16} /> Clear Blogs
                </Button>
            </div>
        </SeederContainer>
    );
};

export default DataSeeder;
