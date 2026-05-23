import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, MapPin, Building2, User, LogOut,
  TrendingUp, Eye, Star, Plus, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import AttractionsManager from '../components/Admin/AttractionsManager';
import EnterprisesManager from '../components/Admin/EnterprisesManager';
import OwnerAnalyticsPanel from '../components/Owner/OwnerAnalyticsPanel';
import OwnerProfilePanel from '../components/Owner/OwnerProfilePanel';

// ─── Layout ──────────────────────────────────────────────────────────────────
const Layout = styled(motion.div).attrs({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
})`
  display: flex;
  min-height: 100vh;
  background: #050d20;
  font-family: 'Outfit', 'Inter', sans-serif;
  padding: 16px;
  gap: 16px;
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = styled.aside`
  width: 260px;
  flex-shrink: 0;
  background: rgba(8, 20, 48, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarLogo = styled.div`
  padding: 36px 28px 20px;
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: -1px;
  color: #e2ecf7;
  span { color: #90cdf4; }

  .tagline {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #3d5a8a;
    margin-top: 4px;
  }
`;

const SidebarNav = styled.nav`
  flex: 1;
  padding: 8px 16px;
`;

const NavItem = styled.div<{ $active: boolean }>`
  padding: 13px 18px;
  border-radius: 14px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 13px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${p => p.$active
    ? 'linear-gradient(135deg, rgba(43, 108, 176, 0.25) 0%, rgba(26, 54, 93, 0.4) 100%)'
    : 'transparent'};
  color: ${p => p.$active ? '#90cdf4' : '#5a7098'};
  font-weight: ${p => p.$active ? '700' : '600'};
  font-size: 0.9rem;
  border: 1px solid ${p => p.$active ? 'rgba(144, 205, 244, 0.15)' : 'transparent'};

  &:hover {
    background: ${p => p.$active
      ? 'linear-gradient(135deg, rgba(43, 108, 176, 0.3) 0%, rgba(26, 54, 93, 0.5) 100%)'
      : 'rgba(255, 255, 255, 0.04)'};
    color: ${p => p.$active ? '#90cdf4' : '#9faed4'};
    transform: ${p => p.$active ? 'none' : 'translateX(4px)'};
  }

  svg { flex-shrink: 0; }
`;

const SidebarDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: 8px 16px;
`;

const UserCard = styled.div`
  padding: 20px 20px 24px;
  display: flex;
  align-items: center;
  gap: 14px;

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 800;
    color: white;
    flex-shrink: 0;
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  .info {
    flex: 1;
    min-width: 0;
    .name {
      color: #c8d9f0;
      font-size: 0.9rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #4d88c4;
    }
  }
`;

const SignOutBtn = styled.button`
  width: calc(100% - 32px);
  margin: 0 16px 16px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.12);
  border-radius: 12px;
  color: #9b4f4f;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.25);
    color: #ef4444;
  }
`;

// ─── Main Content ─────────────────────────────────────────────────────────────
const Main = styled.main`
  flex: 1;
  background: rgba(6, 15, 36, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 32px);

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(144, 205, 244, 0.15); border-radius: 8px; }
`;

const MainHeader = styled.header`
  padding: 40px 48px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    color: #e2ecf7;
    letter-spacing: -0.5px;
  }

  .meta {
    font-size: 0.85rem;
    color: #4d6899;
    margin-top: 4px;
  }
`;

const ContentArea = styled.div`
  padding: 40px 48px;
`;

type Tab = 'analytics' | 'attractions' | 'enterprises' | 'profile';

const NAV: { id: Tab; label: string; Icon: any }[] = [
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'attractions', label: 'My Attractions', Icon: MapPin },
  { id: 'enterprises', label: 'My Enterprises', Icon: Building2 },
  { id: 'profile', label: 'Profile', Icon: User },
];

const TAB_LABELS: Record<Tab, string> = {
  analytics: 'Analytics',
  attractions: 'My Attractions',
  enterprises: 'My Enterprises',
  profile: 'My Profile',
};

// ─── Component ────────────────────────────────────────────────────────────────
const OwnerDashboard = () => {
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    window.location.href = '/discover';
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'OW';

  return (
    <Layout>
      {/* ── Sidebar ── */}
      <Sidebar>
        <SidebarLogo>
          BULU<span>SAN</span>
          <div className="tagline">Owner Portal</div>
        </SidebarLogo>

        <SidebarNav>
          {NAV.map(({ id, label, Icon }) => (
            <NavItem
              key={id}
              $active={activeTab === id}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              {label}
            </NavItem>
          ))}
        </SidebarNav>

        <SidebarDivider />

        <UserCard>
          <div className="avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : initials}
          </div>
          <div className="info">
            <div className="name">{user?.name ?? 'Owner'}</div>
            <div className="badge">Owner</div>
          </div>
        </UserCard>

        <SignOutBtn onClick={handleLogout}>
          <LogOut size={15} />
          Sign Out
        </SignOutBtn>
      </Sidebar>

      {/* ── Main ── */}
      <Main>
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
        </MainHeader>

        <ContentArea>
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
      </Main>
    </Layout>
  );
};

export default OwnerDashboard;
