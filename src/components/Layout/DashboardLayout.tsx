import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  Compass, MapPin, Building2, Map, 
  BookOpen, Mail, User, LogOut, LogIn, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';

// ─── Layout ──────────────────────────────────────────────────────────────────
export const Layout = styled(motion.div).attrs({
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

export const Sidebar = styled.aside`
  width: 260px;
  flex-shrink: 0;
  background: rgba(8, 20, 48, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 1024px) {
    display: none; /* In a real app we'd need a mobile drawer, but let's hide on mobile for now or implement later */
  }
`;

export const SidebarLogo = styled(Link)`
  padding: 36px 28px 20px;
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: -1px;
  color: #e2ecf7;
  text-decoration: none;
  display: block;

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

export const SidebarNav = styled.nav`
  flex: 1;
  padding: 8px 16px;
  overflow-y: auto;
  
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(144, 205, 244, 0.15); border-radius: 4px; }
`;

export const NavItem = styled(Link)<{ $active: boolean }>`
  padding: 13px 18px;
  border-radius: 14px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 13px;
  cursor: pointer;
  text-decoration: none;
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

  .notif-badge {
    margin-left: auto;
    background: #e11d48;
    color: white;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 20px;
    min-width: 20px;
    text-align: center;
    line-height: 1.4;
    animation: pulse-badge 2s infinite;
  }

  @keyframes pulse-badge {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;

export const SidebarDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: 8px 16px;
`;

export const UserCard = styled.div`
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

export const SignOutBtn = styled.button`
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

export const Main = styled.main`
  flex: 1;
  background: rgba(6, 15, 36, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 32px);
  position: relative;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(144, 205, 244, 0.15); border-radius: 8px; }
`;

export const MainHeader = styled.header`
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
    margin-bottom: 4px;
  }

  .meta {
    font-size: 0.85rem;
    color: #4d6899;
  }
`;

export const ContentArea = styled.div`
  padding: 40px 48px;
  color: #e2ecf7; /* Default text color for dark mode */
`;

const GLOBAL_NAV = [
  { path: '/discover', label: 'Discover', Icon: Compass },
  { path: '/attractions', label: 'Attractions', Icon: MapPin },
  { path: '/enterprises', label: 'Enterprises', Icon: Building2 },
  { path: '/explore', label: 'Tours & Map', Icon: Map },
  { path: '/blog', label: 'Blog', Icon: BookOpen },
  { path: '/contact', label: 'Contact', Icon: Mail }
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  // Poll for pending approvals for admin users
  const fetchPendingCount = useCallback(async () => {
    if (role !== 'ADMIN') return;
    try {
      const [appeals, recovery] = await Promise.all([
        apiClient.get('/appeals'),
        apiClient.get('/auth/recovery/pending'),
      ]);
      const appealCount = Array.isArray(appeals) ? appeals.length : 0;
      const recoveryCount = Array.isArray(recovery) ? recovery.length : 0;
      setPendingCount(appealCount + recoveryCount);
    } catch (e) {
      // Silent fail
    }
  }, [role]);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000); // every 10s
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const handleLogout = () => {
    logout();
    navigate('/discover');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <Layout>
      <Sidebar>
        <SidebarLogo to="/discover">
          BULU<span>SAN</span>
          <div className="tagline">Explore Dashboard</div>
        </SidebarLogo>

        <SidebarNav>
          {GLOBAL_NAV.map(({ path, label, Icon }) => {
            const isActive = location.pathname === path || (path === '/discover' && location.pathname === '/');
            return (
              <NavItem key={path} to={path} $active={isActive}>
                <Icon size={18} />
                {label}
              </NavItem>
            );
          })}

          {user && <SidebarDivider />}
          
          {user && (
            <>
              {role !== 'OWNER' && (
                <NavItem to="/account" $active={location.pathname === '/account'}>
                  <User size={18} />
                  My Account
                </NavItem>
              )}
              {role === 'OWNER' && (
                <NavItem to="/owner-dashboard" $active={location.pathname === '/owner-dashboard'}>
                  <LayoutDashboard size={18} />
                  Owner Portal
                </NavItem>
              )}
              {role === 'ADMIN' && (
                <NavItem to="/admin-portal" $active={location.pathname === '/admin-portal'}>
                  <LayoutDashboard size={18} />
                  Admin Portal
                  {pendingCount > 0 && <span className="notif-badge">{pendingCount}</span>}
                </NavItem>
              )}
            </>
          )}
        </SidebarNav>

        <SidebarDivider />

        {user ? (
          <>
            <UserCard>
              <div className="avatar">
                {user?.avatar ? <img src={user.avatar} alt="" /> : initials}
              </div>
              <div className="info">
                <div className="name">{user.name}</div>
                <div className="badge">{role || 'Explorer'}</div>
              </div>
            </UserCard>
            <SignOutBtn onClick={handleLogout}>
              <LogOut size={15} />
              Sign Out
            </SignOutBtn>
          </>
        ) : (
          <div style={{ padding: '0 16px 16px' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <SignOutBtn style={{ background: 'rgba(144, 205, 244, 0.1)', color: '#90cdf4', borderColor: 'rgba(144, 205, 244, 0.2)', margin: 0, width: '100%' }}>
                <LogIn size={15} />
                Sign In
              </SignOutBtn>
            </Link>
          </div>
        )}
      </Sidebar>

      <Main>
        <Outlet />
      </Main>
    </Layout>
  );
};

export default DashboardLayout;
