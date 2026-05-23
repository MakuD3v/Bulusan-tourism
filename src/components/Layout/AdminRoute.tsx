import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { Monitor, Smartphone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const MobileBlocker = styled.div`
  position: fixed;
  inset: 0;
  background: #0a192f;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
  text-align: center;
`;

const BlockerCard = styled.div`
  max-width: 400px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  padding: 48px 32px;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;

  .icon-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
    color: ${(props) => props.theme.colors.accentBlue};
    
    .divider { width: 40px; height: 1px; background: rgba(255,255,255,0.2); }
  }

  h2 {
    font-family: ${(props) => props.theme.fonts.heading};
    font-size: 1.8rem;
    margin-bottom: 16px;
    line-height: 1.2;
  }

  p {
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
    margin-bottom: 32px;
  }

  button {
    background: var(--surface-bg);
    color: #0a192f;
    border: none;
    padding: 14px 28px;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s;
    &:hover { transform: scale(1.05); }
  }
`;

const AdminRoute = () => {
  const { role, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return null;

  if (role !== 'ADMIN' && role !== 'OWNER') {
    return <Navigate to="/discover" replace />;
  }

  if (isMobile) {
    return (
      <MobileBlocker>
        <BlockerCard>
          <div className="icon-row">
            <Smartphone size={32} opacity={0.5} />
            <div className="divider" />
            <Monitor size={48} />
          </div>
          <h2>Desktop Only Access</h2>
          <p>
            The Admin Dashboard contains complex management tools that require a larger screen. 
            Please log in from a desktop browser to manage the platform.
          </p>
          <button onClick={() => window.location.href = '/discover'}>
            <ArrowLeft size={18} /> Back to Discover
          </button>
        </BlockerCard>
      </MobileBlocker>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
