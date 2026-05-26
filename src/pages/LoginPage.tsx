import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

const SplitContainer = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  height: 56.25vw; /* 16:9 aspect ratio */
  min-height: 100vh;
  min-width: 177.77vh; /* 16:9 aspect ratio */
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
  color: #e2ecf7; /* Curved nature pale color */
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

    .password-toggle {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #5c70b8;
      padding: 4px;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }

    .password-toggle:hover {
      color: #8ab4f8;
    }

    .password-toggle svg {
      position: static;
      transform: none;
    }
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  font-size: 0.85rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9faed4;
  cursor: pointer;

  input {
    accent-color: #2b6cb0;
    cursor: pointer;
  }
`;

const ForgotLink = styled(Link)`
  color: #8ab4f8;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;

  &:hover {
    color: #adcbfb;
    text-decoration: underline;
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

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        // Read user from localStorage to decide where to redirect
        const stored = localStorage.getItem('bulusan_user');
        const loggedUser = stored ? JSON.parse(stored) : null;

        if (loggedUser?.role === 'OWNER') {
          if (loggedUser?.approvalStatus === 'APPROVED') {
            navigate('/owner-dashboard');
          } else {
            navigate('/owner-pending');
          }
        } else if (loggedUser?.role === 'ADMIN') {
          navigate('/admin-portal');
        } else {
          navigate('/discover');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
          <Title>Welcome back</Title>
          <Subtitle>Please enter your details.</Subtitle>

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
              <label>E-mail</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="Enter your e-mail"
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="*******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </InputGroup>

            <Row>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </CheckboxLabel>
              <ForgotLink to="/forgot-password">Forgot your password?</ForgotLink>
            </Row>

            <ActionButton type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Log in <ArrowRight size={18} />
                </>
              )}
            </ActionButton>
          </form>

          <p style={{ marginTop: '28px', color: '#7b8cbe', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: '#8ab4f8',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Register here
            </Link>
          </p>
        </GlassCard>
      </FormPane>
    </SplitContainer>
  );
};

export default LoginPage;
