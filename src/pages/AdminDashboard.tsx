import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Settings, MapPin, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminContainer = styled(motion.div)`
  max-width: 1100px;
  margin: 64px auto;
  background: ${(props) => props.theme.glass.background};
  backdrop-filter: ${(props) => props.theme.glass.filter};
  border: ${(props) => props.theme.glass.border};
  border-radius: 24px;
  box-shadow: ${(props) => props.theme.glass.shadow};
  display: flex;
  min-height: 600px;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 250px;
  background: rgba(255,255,255,0.4);
  border-right: 1px solid rgba(0,0,0,0.05);
  padding: 48px 0;

  .nav-item {
    padding: 16px 32px;
    display: flex;
    align-items: center;
    gap: 16px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.textLight};
    cursor: pointer;
    transition: all 0.2s;

    &:hover, &.active {
      background: rgba(46, 117, 182, 0.1);
      color: ${(props) => props.theme.colors.ctaBlue};
    }
    
    &.active {
      border-right: 4px solid ${(props) => props.theme.colors.ctaBlue};
    }
  }
`;

const DashboardContent = styled.div`
  flex: 1;
  padding: 40px;

  h2 { margin-bottom: 24px; font-size: 1.8rem; }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  
  label { display: block; margin-bottom: 10px; font-weight: 600; font-size: 0.95rem; color: ${(props) => props.theme.colors.darkBlue}; }
  input, textarea {
    width: 100%;
    padding: 14px;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 12px;
    background: rgba(255,255,255,0.8);
    font-size: 1rem;
    font-family: inherit;
    outline: none;
    transition: all 0.2s;

    &:focus { border-color: ${(props) => props.theme.colors.ctaBlue}; box-shadow: 0 0 0 4px rgba(46, 117, 182, 0.1); }
  }
  textarea { resize: none; }
`;

const SubmitButton = styled.button`
  background: ${(props) => props.theme.colors.ctaBlue};
  color: white;
  padding: 14px 44px;
  border-radius: 30px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 16px rgba(46, 117, 182, 0.2);

  &:hover {
    background: ${(props) => props.theme.colors.primaryBlue};
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(46, 117, 182, 0.3);
  }
`;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pins');
  const { logout } = useAuth();
  const [msg, setMsg] = useState('');

  const mockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('Content submitted and updated globally!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <AdminContainer
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Sidebar>
        <div className={`nav-item ${activeTab === 'pins' ? 'active' : ''}`} onClick={() => setActiveTab('pins')}>
          <MapPin size={20} /> Map Pins
        </div>
        <div className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>
          <ImageIcon size={20} /> Media Assets
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={20} /> Settings
        </div>

        <div style={{ padding: '32px' }}>
          <button onClick={logout} style={{
            color: '#e74c3c',
            fontWeight: 'bold',
            background: 'none',
            border: '1px solid rgba(231, 76, 60, 0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>Sign Out</button>
        </div>
      </Sidebar>

      <DashboardContent>
        {activeTab === 'pins' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>Manage Map Locations</h2>
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
              {msg && <p style={{ color: 'green', marginTop: '16px', fontWeight: 'bold' }}>{msg}</p>}
            </form>
          </motion.div>
        )}

        {activeTab === 'assets' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>Asset Management</h2>
            <p>Upload functionality simulating Supreme Control</p>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>CMS Settings</h2>
            <p>Configuration panel for admin accounts.</p>
          </motion.div>
        )}
      </DashboardContent>
    </AdminContainer>
  );
};

export default AdminDashboard;
