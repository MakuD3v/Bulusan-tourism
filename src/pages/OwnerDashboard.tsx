import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, MapPin, Building2, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import OwnerAnalyticsPanel from '../components/Owner/OwnerAnalyticsPanel';
import AttractionsManager from '../components/Admin/AttractionsManager';
import EnterprisesManager from '../components/Admin/EnterprisesManager';
import OwnerProfilePanel from '../components/Owner/OwnerProfilePanel';
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

type Tab = 'analytics' | 'attractions' | 'enterprises' | 'profile';

const TAB_LABELS: Record<Tab, string> = {
  analytics: 'Analytics',
  attractions: 'My Attractions',
  enterprises: 'My Enterprises',
  profile: 'My Profile',
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [myAttractions, setMyAttractions] = useState<any[]>([]);
  const [myEnterprises, setMyEnterprises] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchOwnerData = async () => {
    setLoadingData(true);
    try {
      const [atRes, enRes] = await Promise.all([
        apiClient.get('/attractions/mine'),
        apiClient.get('/enterprises/mine'),
      ]);
      setMyAttractions(Array.isArray(atRes) ? atRes : []);
      setMyEnterprises(Array.isArray(enRes) ? enRes : []);
    } catch (e) {
      console.error('Failed to load owner data', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, []);

  return (
    <>
      <MainHeader>
        <div>
          <h1>{TAB_LABELS[activeTab]}</h1>
          <div className="meta">
            {activeTab === 'analytics' && `${myAttractions.length} attraction${myAttractions.length !== 1 ? 's' : ''} · ${myEnterprises.length} enterprise${myEnterprises.length !== 1 ? 's' : ''}`}
            {activeTab === 'attractions' && `${myAttractions.length} listing${myAttractions.length !== 1 ? 's' : ''}`}
            {activeTab === 'enterprises' && `${myEnterprises.length} listing${myEnterprises.length !== 1 ? 's' : ''}`}
            {activeTab === 'profile' && user?.email}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#e2ecf7' }}>{user?.name || 'Owner'}</div>
            <div style={{ fontSize: '0.75rem', color: '#90cdf4', fontWeight: 700, textTransform: 'uppercase' }}>Enterprise Owner</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2b6cb0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
            {user?.avatar ? <img loading="lazy" src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.name?.slice(0, 2).toUpperCase() || 'OW')}
          </div>
        </div>
      </MainHeader>

      <ContentArea>
        <TabNav>
          <TabBtn $active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}><BarChart3 size={18} /> Analytics</TabBtn>
          <TabBtn $active={activeTab === 'attractions'} onClick={() => setActiveTab('attractions')}><MapPin size={18} /> My Attractions</TabBtn>
          <TabBtn $active={activeTab === 'enterprises'} onClick={() => setActiveTab('enterprises')}><Building2 size={18} /> My Enterprises</TabBtn>
          <TabBtn $active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}><User size={18} /> My Profile</TabBtn>
        </TabNav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'analytics' && (
              <OwnerAnalyticsPanel
                attractions={myAttractions}
                enterprises={myEnterprises}
                loading={loadingData}
              />
            )}

            {activeTab === 'attractions' && (
              <AttractionsManager
                attractions={myAttractions}
                ownerMode
                onDataChange={fetchOwnerData}
              />
            )}

            {activeTab === 'enterprises' && (
              <EnterprisesManager
                enterprises={myEnterprises}
                ownerMode
                onDataChange={fetchOwnerData}
              />
            )}

            {activeTab === 'profile' && (
              <OwnerProfilePanel />
            )}
          </motion.div>
        </AnimatePresence>
      </ContentArea>
    </>
  );
};

export default OwnerDashboard;
