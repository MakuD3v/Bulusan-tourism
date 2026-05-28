import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, ArrowRight, ArrowLeft, Loader2, Key, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

const SplitContainer = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #030a1c;
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

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(3, 10, 28, 0.35);
    z-index: 2;
  }

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
  padding: 40px;
  position: relative;
  z-index: 3;
  background: radial-gradient(circle at 80% 20%, rgba(18, 48, 92, 0.15) 0%, transparent 60%);

  @media (max-width: 480px) {
    padding: 24px 16px;
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
  max-width: 460px;
  background: rgba(8, 20, 48, 0.45);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 28px;
  padding: 48px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);

  @media (max-width: 480px) {
    padding: 32px 24px;
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
  margin-bottom: 36px;
  font-size: 0.95rem;
  text-align: left;
  line-height: 1.5;
`;

const InputGroup = styled.div`
  margin-bottom: 24px;
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
    
    & > svg {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #5c70b8;
      transition: color 0.3s;
    }

    input {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 16px 14px 48px;
      color: #f1f5f9;
      font-size: 0.95rem;
      transition: all 0.3s ease;

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
    background: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
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

const SuccessMsg = styled(motion.div)`
  background: rgba(46, 204, 113, 0.1);
  border: 1px solid rgba(46, 204, 113, 0.2);
  color: #69f0ae;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const pulse = keyframes`
  0% { opacity: 0.5; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.5; transform: scale(0.98); }
`;

const WaitingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  
  .icon-wrapper {
    width: 64px;
    height: 64px;
    background: rgba(43, 108, 176, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8ab4f8;
    margin-bottom: 24px;
    animation: ${pulse} 2s infinite ease-in-out;
  }

  h3 {
    color: #f1f5f9;
    font-size: 1.2rem;
    margin-bottom: 12px;
    font-family: ${(props) => props.theme.fonts.heading};
  }

  p {
    color: #9faed4;
    text-align: center;
    font-size: 0.95rem;
    line-height: 1.6;
    max-width: 80%;
  }
`;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const navigate = useNavigate();

  // Check on load if they already have a pending recovery
  useEffect(() => {
    const pendingEmail = localStorage.getItem('pending_recovery_email');
    if (pendingEmail) {
      setEmail(pendingEmail);
      setIsWaiting(true);
    }
  }, []);

  // Polling logic when isWaiting is true
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isWaiting && email) {
      interval = setInterval(async () => {
        try {
          const res = await apiClient.get(`/auth/recovery/status/${encodeURIComponent(email)}`);
          if (res.status === 'APPROVED' && res.token) {
            clearInterval(interval);
            // Admin approved! Log them in automatically with rememberMe
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('bulusan_user', JSON.stringify(res.user));
            localStorage.removeItem('pending_recovery_email');
            
            // Redirect based on role
            if (res.user?.role === 'OWNER') {
              if (res.user?.approvalStatus === 'APPROVED') navigate('/owner-dashboard');
              else navigate('/owner-pending');
            } else if (res.user?.role === 'ADMIN') {
              navigate('/admin-portal');
            } else {
              navigate('/discover');
            }
          } else if (res.status === 'REJECTED') {
            clearInterval(interval);
            setIsWaiting(false);
            localStorage.removeItem('pending_recovery_email');
            setError('Your recovery request was declined by the administrator.');
          }
        } catch (e) {
          // Silent fail to keep polling
        }
      }, 3000); // poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWaiting, email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/recovery/request', { email });
      localStorage.setItem('pending_recovery_email', email);
      setIsWaiting(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit recovery request.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('pending_recovery_email');
    setIsWaiting(false);
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
          onClick={() => navigate('/login')}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft size={16} /> Back to Login
        </BackButton>

        <GlassCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {!isWaiting ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Title>Account Recovery</Title>
                <Subtitle>
                  Enter your email address. A Super Admin will review your request and connect you back to your account.
                </Subtitle>

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
                    <label>E-mail Address</label>
                    <div className="input-wrapper">
                      <Mail size={18} />
                      <input
                        type="email"
                        placeholder="Enter your registered e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </InputGroup>

                  <ActionButton type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Request Access <ArrowRight size={18} />
                      </>
                    )}
                  </ActionButton>
                </form>

                <p style={{ marginTop: '28px', color: '#7b8cbe', fontSize: '0.9rem', textAlign: 'center' }}>
                  Remembered your password?{' '}
                  <Link
                    to="/login"
                    style={{
                      color: '#8ab4f8',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Log in here
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <WaitingIndicator>
                  <div className="icon-wrapper">
                    <Key size={32} />
                  </div>
                  <h3>Request Submitted</h3>
                  <p>
                    Waiting for Super Admin approval. You will be logged in automatically once approved.
                    <br /><br />
                    <span style={{ fontSize: '0.85rem', color: '#5c70b8' }}>
                      (You can safely close this window and come back later. We'll remember your request.)
                    </span>
                  </p>
                </WaitingIndicator>

                <ActionButton 
                  type="button" 
                  onClick={handleCancel}
                  style={{ background: 'rgba(255, 255, 255, 0.05)', boxShadow: 'none', marginTop: '20px' }}
                >
                  Cancel Request
                </ActionButton>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </FormPane>
    </SplitContainer>
  );
};

export default ForgotPasswordPage;
