import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, Clock, ShieldCheck, Mail, LogOut, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.95); }
`;

const orbit = keyframes`
  from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #030a1c;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
  font-family: 'Outfit', 'Inter', sans-serif;

  &::before {
    content: '';
    position: absolute;
    top: -20%;
    left: -10%;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(43, 108, 176, 0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -10%;
    right: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const Card = styled(motion.div)`
  position: relative;
  z-index: 10;
  max-width: 520px;
  width: 100%;
  background: rgba(8, 20, 48, 0.6);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  padding: 56px 48px;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
  text-align: center;

  @media (max-width: 480px) {
    padding: 40px 28px;
    border-radius: 24px;
  }
`;

const Orb = styled.div<{ $approved?: boolean; $verified?: boolean }>`
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 36px;
  display: flex;
  align-items: center;
  justify-content: center;

  .inner {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: ${p =>
      p.$approved
        ? 'rgba(52, 211, 153, 0.15)'
        : p.$verified
        ? 'rgba(251, 191, 36, 0.12)'
        : 'rgba(43, 108, 176, 0.15)'};
    border: 2px solid ${p =>
      p.$approved
        ? 'rgba(52, 211, 153, 0.4)'
        : p.$verified
        ? 'rgba(251, 191, 36, 0.35)'
        : 'rgba(43, 108, 176, 0.4)'};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${p =>
      p.$approved ? '#34d399' : p.$verified ? '#fbbf24' : '#90cdf4'};
    animation: ${pulse} 2.5s ease-in-out infinite;
  }

  .dot {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${p =>
      p.$approved ? '#34d399' : p.$verified ? '#fbbf24' : '#90cdf4'};
    animation: ${orbit} 3s linear infinite;
    animation-play-state: ${p => (p.$approved ? 'paused' : 'running')};
  }
`;

const Title = styled.h1`
  font-size: 1.9rem;
  font-weight: 800;
  color: #e2ecf7;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  color: #7b8cbe;
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 40px;
  max-width: 380px;
  margin-left: auto;
  margin-right: auto;
`;

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 36px;
  text-align: left;
`;

const Step = styled.div<{ $status: 'done' | 'active' | 'waiting' }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 16px;
  background: ${p =>
    p.$status === 'done'
      ? 'rgba(52, 211, 153, 0.06)'
      : p.$status === 'active'
      ? 'rgba(251, 191, 36, 0.06)'
      : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${p =>
    p.$status === 'done'
      ? 'rgba(52, 211, 153, 0.2)'
      : p.$status === 'active'
      ? 'rgba(251, 191, 36, 0.2)'
      : 'rgba(255, 255, 255, 0.05)'};
  transition: all 0.4s ease;

  .step-icon {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 0.8rem;
    font-weight: 800;
    background: ${p =>
      p.$status === 'done'
        ? 'rgba(52, 211, 153, 0.15)'
        : p.$status === 'active'
        ? 'rgba(251, 191, 36, 0.15)'
        : 'rgba(148, 163, 184, 0.08)'};
    color: ${p =>
      p.$status === 'done'
        ? '#34d399'
        : p.$status === 'active'
        ? '#fbbf24'
        : '#475569'};
    animation: ${p => p.$status === 'active' ? `${pulse} 1.8s ease-in-out infinite` : 'none'};
  }

  .step-text {
    .label {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: ${p =>
        p.$status === 'done'
          ? '#34d399'
          : p.$status === 'active'
          ? '#fbbf24'
          : '#475569'};
      margin-bottom: 3px;
    }
    .desc {
      font-size: 0.88rem;
      color: ${p => p.$status === 'waiting' ? '#334155' : '#8899cc'};
    }
  }
`;

const PollIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #475569;
  font-size: 0.8rem;
  margin-bottom: 24px;

  svg {
    animation: ${orbit} 2s linear infinite;
  }
`;

const SignOutBtn = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #64748b;
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

const OwnerPendingPage = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get('verified') === 'true';
  const [pollCount, setPollCount] = useState(0);

  // Determine state from user
  const isEmailVerified = user?.emailVerified ?? false;
  const approvalStatus = user?.approvalStatus ?? 'PENDING';

  // Poll /auth/me every 10 seconds to check for status changes
  useEffect(() => {
    if (approvalStatus === 'APPROVED') return;

    const poll = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        const updated = res.user;
        // If now approved, reload to trigger route re-evaluation
        if (updated?.approvalStatus === 'APPROVED') {
          localStorage.setItem('bulusan_user', JSON.stringify(updated));
          window.location.href = '/owner-dashboard';
        }
        setPollCount(c => c + 1);
      } catch {
        // silently ignore polling errors
      }
    };

    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, [approvalStatus]);

  // Redirect if already approved
  useEffect(() => {
    if (!loading && approvalStatus === 'APPROVED') {
      navigate('/owner-dashboard', { replace: true });
    }
  }, [approvalStatus, loading, navigate]);

  const handleSignOut = () => {
    logout();
    window.location.href = '/login';
  };

  const getStepStatus = (step: 1 | 2 | 3): 'done' | 'active' | 'waiting' => {
    if (step === 1) return isEmailVerified ? 'done' : 'active';
    if (step === 2) {
      if (!isEmailVerified) return 'waiting';
      if (approvalStatus === 'PENDING') return 'active';
      return 'done';
    }
    if (step === 3) {
      if (approvalStatus === 'APPROVED') return 'done';
      return 'waiting';
    }
    return 'waiting';
  };

  const isApproved = approvalStatus === 'APPROVED';
  const isVerified = isEmailVerified;

  return (
    <Page>
      <Card
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <Orb $approved={isApproved} $verified={isVerified}>
          <div className="inner">
            {isApproved ? (
              <CheckCircle2 size={36} />
            ) : isVerified ? (
              <Clock size={36} />
            ) : (
              <Mail size={36} />
            )}
          </div>
          {!isApproved && <div className="dot" />}
        </Orb>

        <Title>
          {isApproved
            ? 'You\'re Approved! 🎉'
            : isVerified
            ? 'Awaiting Admin Review'
            : 'Check Your Email'}
        </Title>
        <Subtitle>
          {isApproved
            ? 'Your owner account has been approved. Redirecting you to your dashboard...'
            : isVerified
            ? 'Your email is verified! Our admin team will review your account shortly. You\'ll receive an email once approved.'
            : justVerified
            ? 'Your email has been verified! You\'re now in the review queue. We\'ll notify you when approved.'
            : 'We sent a verification link to your email address. Click it to start the approval process.'}
        </Subtitle>

        <Steps>
          <Step $status={getStepStatus(1)}>
            <div className="step-icon">
              {getStepStatus(1) === 'done' ? '✓' : '1'}
            </div>
            <div className="step-text">
              <div className="label">Email Verification</div>
              <div className="desc">
                {getStepStatus(1) === 'done'
                  ? 'Your email address is confirmed'
                  : 'Check your inbox and click the verification link'}
              </div>
            </div>
          </Step>

          <Step $status={getStepStatus(2)}>
            <div className="step-icon">
              {getStepStatus(2) === 'done' ? '✓' : '2'}
            </div>
            <div className="step-text">
              <div className="label">Admin Approval</div>
              <div className="desc">
                {getStepStatus(2) === 'done'
                  ? 'Your account has been approved!'
                  : getStepStatus(2) === 'active'
                  ? 'Waiting for our team to review your account'
                  : 'Our team will review your account'}
              </div>
            </div>
          </Step>

          <Step $status={getStepStatus(3)}>
            <div className="step-icon">
              {getStepStatus(3) === 'done' ? '✓' : '3'}
            </div>
            <div className="step-text">
              <div className="label">Dashboard Access</div>
              <div className="desc">Manage your listings freely</div>
            </div>
          </Step>
        </Steps>

        {!isApproved && (
          <PollIndicator>
            <RefreshCw size={13} />
            Auto-checking for updates every 10 seconds
            {pollCount > 0 && ` · checked ${pollCount}×`}
          </PollIndicator>
        )}

        <SignOutBtn onClick={handleSignOut}>
          <LogOut size={16} />
          Sign out
        </SignOutBtn>
      </Card>
    </Page>
  );
};

export default OwnerPendingPage;
