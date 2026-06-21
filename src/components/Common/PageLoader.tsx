import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.5; }
`;

const LoaderContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  width: 100%;
  color: ${({ theme }) => theme.colors.primaryBlue};
  gap: 16px;
`;

const SpinnerWrapper = styled.div`
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingText = styled.p`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textLight};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const PageLoader: React.FC = () => {
  return (
    <LoaderContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <SpinnerWrapper>
        <Loader2 size={40} className="animate-spin" style={{ animationDuration: '3s' }} />
      </SpinnerWrapper>
      <LoadingText>Loading...</LoadingText>
    </LoaderContainer>
  );
};

export default PageLoader;
