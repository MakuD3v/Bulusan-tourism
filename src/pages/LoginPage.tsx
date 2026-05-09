import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0a192f;
`;

const BackgroundImage = styled.div`
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: url('/bulusan_drone_auth_bg.png') center/cover no-repeat;
  filter: brightness(0.6);
  z-index: 1;
`;

const BackButton = styled(motion.button)`
  position: absolute;
  top: 28px;
  left: 28px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    transform: translateX(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
`;

const GlassCard = styled(motion.div)`
  width: 100%;
  max-width: 450px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 32px;
  padding: 48px;
  position: relative;
  z-index: 10;
  box-shadow: 0 25px 50px rgba(0,0,0,0.3);
  text-align: center;

  @media (max-width: 480px) {
    padding: 32px 24px;
    border-radius: 24px;
    max-width: 90vw;
  }
`;

const Title = styled.h1`
  font-family: ${(props) => props.theme.fonts.heading};
  font-size: 3rem;
  color: white;
  margin-bottom: 8px;
  font-weight: 900;
  letter-spacing: -1px;

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  color: ${(props) => props.theme.colors.accentBlue};
  margin-bottom: 48px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 4px;

  @media (max-width: 480px) {
    margin-bottom: 32px;
    letter-spacing: 2px;
  }
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 24px;
  text-align: left;

  label {
    display: block;
    color: rgba(255,255,255,0.8);
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 8px;
    margin-left: 4px;
  }

  .input-wrapper {
    position: relative;
    svg {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255,255,255,0.4);
    }
    input {
      width: 100%;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 14px 16px 14px 48px;
      color: white;
      font-size: 1rem;
      transition: all 0.3s;
      &:focus {
        border-color: ${(props) => props.theme.colors.ctaBlue};
        background: rgba(255,255,255,0.15);
        outline: none;
      }
    }
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${(props) => props.theme.colors.ctaBlue};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 32px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(46, 117, 182, 0.4);
    background: #1e3a8a;
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

const ErrorMsg = styled(motion.div)`
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid rgba(231, 76, 60, 0.3);
  color: #ff9999;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 0.9rem;
`;

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const success = await login(email, password);
            if (success) {
                navigate('/discover');
            } else {
                setError('Login failed. Please check your email and password.');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError('');
        try {
            if (credentialResponse.credential) {
                const success = await loginWithGoogle(credentialResponse.credential);
                if (success) {
                    navigate('/discover');
                } else {
                    setError('Google Login failed.');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Google Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContainer>
            <BackgroundImage />
            <BackButton
                onClick={() => navigate(-1)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
                <ArrowLeft size={16} /> Back
            </BackButton>
            <GlassCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
                <Title>Welcome Back</Title>
                <Subtitle>The mountains are calling. Sign in to your portal.</Subtitle>

                <form onSubmit={handleSubmit}>
                    {error && <ErrorMsg initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</ErrorMsg>}

                    <InputGroup>
                        <label>Email Address</label>
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

                    <ActionButton type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
                    </ActionButton>
                </form>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', flex: 1 }} />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>or</span>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', flex: 1 }} />
                    </div>
                    <GoogleLogin 
                        onSuccess={handleGoogleSuccess} 
                        onError={() => setError('Google Login Failed')}
                        theme="filled_black"
                        shape="pill"
                        text="continue_with"
                        width="350"
                    />
                </div>

                <p style={{ marginTop: '32px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'white', fontWeight: 700, textDecoration: 'none' }}>Create one</Link>
                </p>
            </GlassCard>
        </AuthContainer>
    );
};

export default LoginPage;
