import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Lock, UserPlus, Loader2, CheckCircle2, ArrowLeft, Clock, KeyRound } from 'lucide-react';

const SplitContainer = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  background: #030a1c; /* Slate black-navy base */
  font-family: ${(props) => props.theme.fonts.body};
  overflow: hidden;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const VideoPane = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;

  /* Dim the video slightly overall */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(3, 10, 28, 0.35);
    z-index: 2;
  }

  /* Directional fade: heavy on the right to bleed into form panel,
     lighter vignette on top/bottom for cinematic feel */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to right,  transparent 40%, rgba(3, 10, 28, 1) 100%),
      linear-gradient(to bottom, rgba(3, 10, 28, 0.6) 0%, transparent 20%, transparent 80%, rgba(3, 10, 28, 0.6) 100%);
    z-index: 3;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const IframeWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100vw;
  height: 56.25vw;
  min-height: 100vh;
  min-width: 177.77vh;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const FormPane = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 40px;
  position: relative;
  z-index: 3;
  overflow-y: auto;
  background: radial-gradient(circle at 80% 20%, rgba(18, 48, 92, 0.15) 0%, transparent 60%);

  @media (max-width: 480px) {
    padding: 32px 16px;
  }
`;

const BackButton = styled(motion.button)`
  position: absolute;
  top: 32px;
  left: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #9faed4;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #e2ecf7;
    transform: translateX(-3px);
  }
`;

const GlassCard = styled(motion.div)`
  width: 100%;
  max-width: 540px;
  background: rgba(8, 20, 48, 0.45);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 28px;
  padding: 40px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);

  @media (max-width: 480px) {
    padding: 32px 20px;
    border-radius: 20px;
  }
`;

const Title = styled.h2`
  font-family: ${(props) => props.theme.fonts.heading};
  font-size: 2.2rem;
  color: #e2ecf7;
  margin-bottom: 6px;
  font-weight: 800;
  letter-spacing: -0.5px;
  text-align: left;
`;

const Subtitle = styled.p`
  color: #7b8cbe;
  margin-bottom: 28px;
  font-size: 0.95rem;
  text-align: left;
`;

const ToggleContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 32px;
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
  background: ${(props) => (props.$active ? 'linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%)' : 'transparent')};
  color: ${(props) => (props.$active ? '#fff' : '#9faed4')};
  border: none;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #fff;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
  text-align: left;

  label {
    display: block;
    color: #9faed4;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 8px;
    margin-left: 2px;
  }

  .input-wrapper {
    position: relative;
    
    svg {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #5c70b8;
      transition: color 0.3s;
    }

    input, select, textarea {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 16px 14px 48px;
      color: #f1f5f9;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      font-family: inherit;

      &::placeholder {
        color: rgba(92, 112, 184, 0.5);
      }

      &:focus {
        border-color: #2b6cb0;
        background: rgba(255, 255, 255, 0.07);
        box-shadow: 0 0 0 4px rgba(43, 108, 176, 0.15);
        outline: none;

        & + svg {
          color: #8ab4f8;
        }
      }
    }

    select {
      appearance: none;
      cursor: pointer;
      option {
        background: #0d172e;
        color: #f1f5f9;
      }
    }

    textarea {
      min-height: 100px;
      resize: vertical;
    }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(26, 54, 93, 0.35);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  margin-top: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(26, 54, 93, 0.5);
    background: linear-gradient(135deg, #3182ce 0%, #2a4365 100%);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.75;
    cursor: wait;
  }
`;

const SuccessCard = styled(motion.div)`
  background: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.25);
  color: #99ffbb;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  font-size: 1rem;
  text-align: center;
`;

const ErrorMsg = styled(motion.div)`
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.2);
  color: #ff8888;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 0.85rem;
  text-align: left;
`;

const SignUpPage = () => {
  const [role, setRole] = useState<'USER' | 'OWNER'>('USER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const { signup, verifyCode } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signup(name, email, password, { role });
      if (result.success) {
        if (result.requiresVerification) {
          setShowVerification(true);
        } else {
          setSuccess(true);
          setTimeout(() => navigate('/discover'), 2000);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    try {
      const result = await verifyCode(email, verificationCode);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          if (role === 'OWNER') {
            navigate('/owner-pending');
          } else {
            navigate('/discover');
          }
        }, 2000);
      } else {
        setError('Verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SplitContainer>
      <VideoPane>
        <IframeWrapper>
          <iframe
            src="https://www.youtube-nocookie.com/embed/sBFeTzfXeu8?autoplay=1&mute=1&loop=1&playlist=sBFeTzfXeu8&controls=0&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&enablejsapi=1"
            title="Bulusan Tourism Cinematic Preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </IframeWrapper>
      </VideoPane>

      <FormPane>
        <BackButton
          onClick={() => navigate('/discover')}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft size={16} /> Back to Discover
        </BackButton>

        <GlassCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {success ? (
            <SuccessCard
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle2 size={48} color="#2ecc71" />
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: '8px 0' }}>
                  Verification Successful!
                </h3>
                <p style={{ color: '#a3b899' }}>
                  {role === 'OWNER'
                    ? `Welcome, ${name}! Redirecting to owner status page...`
                    : `Welcome, ${name}! Preparing your discovery guide…`}
                </p>
              </div>
            </SuccessCard>
          ) : showVerification ? (
            <>
              <Title>Verify Email</Title>
              <Subtitle>We sent a 6-digit code to <strong>{email}</strong>.</Subtitle>
              
              <form onSubmit={handleVerify}>
                {error && (
                  <ErrorMsg
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </ErrorMsg>
                )}

                <InputGroup>
                  <label>Verification Code</label>
                  <div className="input-wrapper">
                    <KeyRound size={18} />
                    <input
                      type="text"
                      placeholder="XXXX-XXXX"
                      value={verificationCode}
                      onChange={(e) => {
                        // auto-format: uppercase, insert dash after 4 chars
                        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4, 8);
                        setVerificationCode(val);
                      }}
                      maxLength={9}
                      required
                      style={{ letterSpacing: '4px', fontFamily: 'monospace', fontSize: '1.1rem' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#5c70b8', marginTop: '6px', marginLeft: '4px' }}>
                    Enter the 8-character code from your email (e.g. K4X9-2BQR)
                  </p>
                </InputGroup>

                <ActionButton type="submit" disabled={verifying}>
                  {verifying ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>Verify & Continue <CheckCircle2 size={18} /></>
                  )}
                </ActionButton>
              </form>
            </>
          ) : (
            <>
              <Title>Create an account</Title>
              <Subtitle>Join the digital adventure companion of Bulusan.</Subtitle>

              <ToggleContainer>
                <ToggleBtn
                  type="button"
                  $active={role === 'USER'}
                  onClick={() => setRole('USER')}
                >
                  Explorer User
                </ToggleBtn>
                <ToggleBtn
                  type="button"
                  $active={role === 'OWNER'}
                  onClick={() => setRole('OWNER')}
                >
                  Enterprise Owner
                </ToggleBtn>
              </ToggleContainer>

              <form onSubmit={handleSubmit}>
                {error && (
                  <ErrorMsg
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </ErrorMsg>
                )}

                <InputGroup>
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <User size={18} />
                    <input
                      type="text"
                      placeholder="e.g. Maria Clara"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </InputGroup>

                <FormGrid>
                  <InputGroup>
                    <label>E-mail</label>
                    <div className="input-wrapper">
                      <Mail size={18} />
                      <input
                        type="email"
                        placeholder="explorer@bulusan.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </InputGroup>

                  <InputGroup>
                    <label>Password</label>
                    <div className="input-wrapper">
                      <Lock size={18} />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </InputGroup>
                </FormGrid>

                <AnimatePresence>
                  {role === 'OWNER' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0 16px', paddingTop: '20px' }} />
                      <div style={{ background: 'rgba(43, 108, 176, 0.08)', border: '1px solid rgba(144, 205, 244, 0.12)', borderRadius: '12px', padding: '14px 18px', fontSize: '0.88rem', color: '#7b9dce', lineHeight: 1.6 }}>
                        <strong style={{ color: '#90cdf4' }}>Owner Account</strong> — After registering and verifying your email, you will await admin approval.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ActionButton type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      {role === 'OWNER' ? 'Create Owner Account' : 'Start Exploring'} <UserPlus size={18} />
                    </>
                  )}
                </ActionButton>
              </form>

              <p style={{ marginTop: '28px', color: '#7b8cbe', fontSize: '0.9rem' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#8ab4f8',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Sign In
                </Link>
              </p>
            </>
          )}
        </GlassCard>
      </FormPane>
    </SplitContainer>
  );
};

export default SignUpPage;
