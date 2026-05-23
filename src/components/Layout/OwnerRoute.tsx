import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { Monitor, Smartphone, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';

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

  p { color: rgba(255, 255, 255, 0.6); line-height: 1.6; margin-bottom: 32px; }

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

const PendingCard = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #030a1c;
  padding: 40px;

  .card {
    max-width: 480px;
    width: 100%;
    text-align: center;
    background: rgba(8, 20, 48, 0.6);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    padding: 56px 40px;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.4);

    .icon {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(251, 191, 36, 0.1);
      border: 2px solid rgba(251, 191, 36, 0.3);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 28px;
      color: #fbbf24;
    }

    h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.8rem;
      color: #e2ecf7;
      margin-bottom: 12px;
      font-weight: 800;
    }

    p { color: #7b8cbe; line-height: 1.7; margin-bottom: 32px; font-size: 0.95rem; }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 32px;
      text-align: left;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);

      .step-icon {
        width: 36px; height: 36px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        font-size: 0.75rem;
        font-weight: 800;
      }

      .step-text {
        .label { font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
        .desc { font-size: 0.9rem; color: #9faed4; }
      }
    }

    .step.done .step-icon { background: rgba(52, 211, 153, 0.15); color: #34d399; }
    .step.done .label { color: #34d399; }
    .step.pending .step-icon { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .step.pending .label { color: #fbbf24; }
    .step.waiting .step-icon { background: rgba(148, 163, 184, 0.1); color: #64748b; }
    .step.waiting .label { color: #64748b; }

    button {
      width: 100%;
      padding: 14px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      color: #9faed4;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: rgba(255, 255, 255, 0.08); color: #e2ecf7; }
    }
  }
`;

const OwnerRoute = () => {
  const { role, user, loading, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return null;

  // Not an owner at all
  if (role !== 'OWNER') {
    return <Navigate to="/discover" replace />;
  }

  // Owner but email not verified
  if (!user?.emailVerified) {
    return (
      <PendingCard>
        <div className="card">
          <div className="icon"><Clock size={36} /></div>
          <h2>Verify Your Email</h2>
          <p>We sent a verification link to your email. Please click it before you can access your dashboard.</p>
          <div className="steps">
            <div className="step pending">
              <div className="step-icon">1</div>
              <div className="step-text">
                <div className="label">Email Verification</div>
                <div className="desc">Check your inbox and click the verification link</div>
              </div>
            </div>
            <div className="step waiting">
              <div className="step-icon">2</div>
              <div className="step-text">
                <div className="label">Admin Approval</div>
                <div className="desc">Our team will review your account</div>
              </div>
            </div>
            <div className="step waiting">
              <div className="step-icon">3</div>
              <div className="step-text">
                <div className="label">Dashboard Access</div>
                <div className="desc">Manage your listings freely</div>
              </div>
            </div>
          </div>
          <button onClick={() => { logout(); window.location.href = '/login'; }}>Sign out</button>
        </div>
      </PendingCard>
    );
  }

  // Owner email verified but pending approval
  if (user?.approvalStatus === 'PENDING') {
    return (
      <PendingCard>
        <div className="card">
          <div className="icon"><Clock size={36} /></div>
          <h2>Awaiting Approval</h2>
          <p>Your email is verified! Our admin team is reviewing your owner account. You'll get an email notification once approved.</p>
          <div className="steps">
            <div className="step done">
              <div className="step-icon">✓</div>
              <div className="step-text">
                <div className="label">Email Verified</div>
                <div className="desc">Your email address is confirmed</div>
              </div>
            </div>
            <div className="step pending">
              <div className="step-icon">2</div>
              <div className="step-text">
                <div className="label">Admin Approval</div>
                <div className="desc">Waiting for our team to review your account</div>
              </div>
            </div>
            <div className="step waiting">
              <div className="step-icon">3</div>
              <div className="step-text">
                <div className="label">Dashboard Access</div>
                <div className="desc">Manage your listings freely</div>
              </div>
            </div>
          </div>
          <button onClick={() => { logout(); window.location.href = '/login'; }}>Sign out</button>
        </div>
      </PendingCard>
    );
  }

  // Rejected
  if (user?.approvalStatus === 'REJECTED') {
    return (
      <PendingCard>
        <div className="card">
          <div className="icon" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <ShieldCheck size={36} />
          </div>
          <h2 style={{ color: '#ef4444' }}>Account Rejected</h2>
          <p>Unfortunately your owner account application was not approved. Please contact <strong style={{ color: '#90cdf4' }}>admin@bulusan.com</strong> for more information.</p>
          <button onClick={() => { logout(); window.location.href = '/discover'; }}>Back to Discover</button>
        </div>
      </PendingCard>
    );
  }

  // Mobile blocker for owners too
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
          <p>The Owner Dashboard requires a larger screen. Please log in from a desktop browser to manage your listings.</p>
          <button onClick={() => window.location.href = '/discover'}>
            <ArrowLeft size={18} /> Back to Discover
          </button>
        </BlockerCard>
      </MobileBlocker>
    );
  }

  return <Outlet />;
};

export default OwnerRoute;
