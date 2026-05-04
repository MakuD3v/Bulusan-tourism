import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthGuardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Modal = styled(motion.div)`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  padding: 40px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
  position: relative;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  background: ${(props) => props.theme.colors.softBlue};
  color: ${(props) => props.theme.colors.ctaBlue};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
`;

const Title = styled.h2`
  font-family: ${(props) => props.theme.fonts.heading};
  font-size: 1.75rem;
  color: ${(props) => props.theme.colors.darkBlue};
  margin-bottom: 12px;
`;

const Message = styled.p`
  color: ${(props) => props.theme.colors.textLight};
  line-height: 1.6;
  margin-bottom: 32px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PrimaryButton = styled.button`
  background: ${(props) => props.theme.colors.ctaBlue};
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => props.theme.colors.primaryBlue};
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: ${(props) => props.theme.colors.textDark};
  border: 1px solid #cbd5e1;
  padding: 14px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #1E293B;
  }
`;

const AuthGuardPopup: React.FC<AuthGuardPopupProps> = ({ isOpen, onClose, actionName = 'perform this action' }) => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    onClose();
    navigate('/signup');
  };

  const handleLogin = () => {
    onClose();
    navigate('/signup'); // Current project uses SignUpPage for both or has a combined flow
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Modal
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
            
            <IconWrapper>
              <UserCircle size={32} />
            </IconWrapper>
            
            <Title>Account Required</Title>
            <Message>
              You need to be signed in to {actionName}. Create an account to share your experiences and plan your trip!
            </Message>
            
            <ButtonGroup>
              <PrimaryButton onClick={handleSignUp}>
                <UserPlus size={18} />
                Create Free Account
              </PrimaryButton>
              <SecondaryButton onClick={onClose}>
                Maybe Later
              </SecondaryButton>
            </ButtonGroup>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default AuthGuardPopup;
