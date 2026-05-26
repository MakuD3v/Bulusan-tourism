import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Settings, MapPin, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { MainHeader, ContentArea } from '../components/Layout/DashboardLayout';

const TabNav = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 16px;
  overflow-x: auto;
  
  &::-webkit-scrollbar { display: none; }
`;

const TabBtn = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? 'rgba(144, 205, 244, 0.15)' : 'transparent'};
  color: ${p => p.$active ? '#90cdf4' : '#94a3b8'};
  border: 1px solid ${p => p.$active ? 'rgba(144, 205, 244, 0.3)' : 'transparent'};
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(144, 205, 244, 0.1);
    color: #e2ecf7;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  
  label { display: block; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; color: #e2ecf7; }
  input, textarea {
    width: 100%;
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 1rem;
    font-family: inherit;
    outline: none;
    transition: all 0.2s;

    &:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
  }
  textarea { resize: none; }
`;

const SubmitButton = styled.button`
  background: #3b82f6;
  color: white;
  padding: 14px 44px;
  border-radius: 30px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);

  &:hover {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(59, 130, 246, 0.3);
  }
`;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pins');
  const { user } = useAuth();
  const [msg, setMsg] = useState('');

  const mockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('Content submitted and updated globally!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <>
      <MainHeader>
        <div>
          <h1>{activeTab === 'pins' ? 'Map Pins' : activeTab === 'assets' ? 'Media Assets' : 'Settings'}</h1>
          <div className="meta">Admin Tools Dashboard</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#e2ecf7' }}>{user?.name || 'Administrator'}</div>
            <div style={{ fontSize: '0.75rem', color: '#90cdf4', fontWeight: 700, textTransform: 'uppercase' }}>{user?.email === 'admin@bulusan.com' ? 'Super Admin' : 'Admin'}</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1e3a8a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            AD
          </div>
        </div>
      </MainHeader>

      <ContentArea>
        <TabNav>
          <TabBtn $active={activeTab === 'pins'} onClick={() => setActiveTab('pins')}><MapPin size={18} /> Map Pins</TabBtn>
          <TabBtn $active={activeTab === 'assets'} onClick={() => setActiveTab('assets')}><ImageIcon size={18} /> Media Assets</TabBtn>
          <TabBtn $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}><Settings size={18} /> Settings</TabBtn>
        </TabNav>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', maxWidth: '800px' }}>
          {activeTab === 'pins' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ color: '#e2ecf7', marginBottom: '24px' }}>Manage Map Locations</h2>
              <form onSubmit={mockSubmit}>
                <FormGroup>
                  <label>Location Name</label>
                  <input type="text" placeholder="e.g. Dancalan Beach" required />
                </FormGroup>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <FormGroup style={{ flex: 1 }}>
                    <label>Latitude</label>
                    <input type="text" placeholder="12.75" required />
                  </FormGroup>
                  <FormGroup style={{ flex: 1 }}>
                    <label>Longitude</label>
                    <input type="text" placeholder="124.13" required />
                  </FormGroup>
                </div>
                <FormGroup>
                  <label>Description</label>
                  <textarea rows={4} placeholder="Description details..." required />
                </FormGroup>
                <SubmitButton type="submit">Drop Pin</SubmitButton>
                {msg && <p style={{ color: '#10b981', marginTop: '16px', fontWeight: 'bold' }}>{msg}</p>}
              </form>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ color: '#e2ecf7', marginBottom: '24px' }}>Asset Management</h2>
              <p style={{ color: '#94a3b8' }}>Upload functionality simulating Supreme Control</p>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ color: '#e2ecf7', marginBottom: '24px' }}>CMS Settings</h2>
              <p style={{ color: '#94a3b8' }}>Configuration panel for admin accounts.</p>
            </motion.div>
          )}
        </div>
      </ContentArea>
    </>
  );
};

export default AdminDashboard;
