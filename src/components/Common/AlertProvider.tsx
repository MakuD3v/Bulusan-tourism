import React, { createContext, useContext, useState, ReactNode } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info' | 'confirm';

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Modal = styled(motion.div)`
  background: var(--surface-bg);
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  overflow: hidden;
  text-align: center;
`;

const IconContainer = styled.div<{ $type: AlertType }>`
  padding: 32px 32px 16px;
  display: flex;
  justify-content: center;
  
  svg {
    width: 64px;
    height: 64px;
    color: ${p => {
      if (p.$type === 'success') return '#10b981';
      if (p.$type === 'error') return '#ef4444';
      if (p.$type === 'confirm') return '#f59e0b';
      return '#3b82f6';
    }};
  }
`;

const Content = styled.div`
  padding: 0 32px 32px;
  
  h3 {
    font-size: 1.5rem;
    color: var(--text-dark);
    margin: 0 0 12px 0;
    font-weight: 800;
  }
  
  p {
    color: var(--text-light);
    font-size: 1rem;
    line-height: 1.5;
    margin: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  border-top: 1px solid #f1f5f9;
  
  button {
    flex: 1;
    padding: 20px;
    background: transparent;
    border: none;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #f8fafc;
    }
  }
  
  .cancel-btn {
    color: var(--text-light);
    border-right: 1px solid #f1f5f9;
  }
  
  .confirm-btn {
    color: var(--cta-blue);
  }
  
  .ok-btn {
    color: var(--cta-blue);
    width: 100%;
  }
`;

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlert({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };

  const closeAlert = () => setAlert(prev => ({ ...prev, isOpen: false }));

  const handleConfirm = () => {
    if (alert.onConfirm) alert.onConfirm();
    closeAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AnimatePresence>
        {alert.isOpen && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Modal
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <IconContainer $type={alert.type}>
                {alert.type === 'success' && <CheckCircle strokeWidth={1.5} />}
                {alert.type === 'error' && <AlertCircle strokeWidth={1.5} />}
                {alert.type === 'confirm' && <AlertCircle strokeWidth={1.5} />}
                {alert.type === 'info' && <Info strokeWidth={1.5} />}
              </IconContainer>
              
              <Content>
                <h3>{alert.title}</h3>
                <p>{alert.message}</p>
              </Content>
              
              <ButtonGroup>
                {alert.type === 'confirm' ? (
                  <>
                    <button className="cancel-btn" onClick={closeAlert}>Cancel</button>
                    <button className="confirm-btn" onClick={handleConfirm}>Confirm</button>
                  </>
                ) : (
                  <button className="ok-btn" onClick={closeAlert}>OK</button>
                )}
              </ButtonGroup>
            </Modal>
          </Overlay>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};
