import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Lock, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

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

const GlassCard = styled(motion.div)`
  width: 100%;
  max-width: 500px;
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
  
  @media (max-width: 480px) {
    padding: 14px;
    font-size: 1rem;
    margin-top: 24px;
  }
`;

const SuccessMsg = styled(motion.div)`
  background: rgba(46, 204, 113, 0.2);
  border: 1px solid rgba(46, 204, 113, 0.3);
  color: #99ffbb;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
`;

const ErrorMsg = styled(motion.div)`
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid rgba(231, 76, 60, 0.4);
  color: #ff9999;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  text-align: left;
`;

const SignUpPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const ok = await signup(name, email, password);
            if (ok) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError('Registration failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContainer>
            <BackgroundImage />
    <GlassCard
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
                <Title>Join the Discovery</Title>
                <Subtitle>Create your portal to start mapping your Bulusan journeys.</Subtitle>

                {success ? (
                    <SuccessMsg initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <CheckCircle2 size={24} />
                        <div>
                            <strong>Explorer account created!</strong><br />
                            Redirecting you to login...
                        </div>
                    </SuccessMsg>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <ErrorMsg initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{error}</ErrorMsg>}

                        <InputGroup>
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <User size={18} />
                                <input
                                    type="text"
                                    placeholder="Maria Clara"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </InputGroup>

                        <InputGroup>
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail size={18} />
                                <input
                                    type="email"
                                    placeholder="maria@bulusan.com"
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
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </InputGroup>

                        <ActionButton type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : <>Start Exploring <UserPlus size={20} /></>}
                        </ActionButton>
                    </form>
                )}

                <p style={{ marginTop: '32px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'white', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
                </p>
            </GlassCard>
        </AuthContainer>
    );
};

export default SignUpPage;
