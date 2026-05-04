import React, { useState } from 'react';
import styled from 'styled-components';
import { UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client';

const PanelContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid rgba(0,0,0,0.05);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  color: var(--dark-blue);
  
  h2 {
    font-size: 1.5rem;
    font-family: 'Playfair Display', serif;
  }
`;

const FormGroup = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;

  label {
    font-weight: 600;
    color: #475569;
    font-size: 0.95rem;
  }

  input {
    padding: 14px;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: var(--cta-blue);
      box-shadow: 0 0 0 3px rgba(46, 117, 182, 0.1);
    }
  }

  button {
    padding: 14px;
    background: var(--cta-blue);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover {
      background: var(--dark-blue);
    }

    &:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
  }
`;

const Message = styled.div<{ $type: 'error' | 'success' }>`
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.$type === 'error' ? '#fef2f2' : '#f0fdf4'};
  color: ${props => props.$type === 'error' ? '#ef4444' : '#16a34a'};
  border: 1px solid ${props => props.$type === 'error' ? '#fecaca' : '#bbf7d0'};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AdminManagementPanel = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await apiClient.put('/auth/promote', { targetEmail: email });
      if (res.error) {
        setStatus({ type: 'error', msg: res.error });
      } else {
        setStatus({ type: 'success', msg: res.message || 'Successfully promoted to ADMIN.' });
        setEmail('');
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Failed to promote user.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelContainer>
      <Header>
        <ShieldAlert size={28} />
        <h2>Super Admin Area</h2>
      </Header>
      
      <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
        Only the designated super admin account has access to this panel. Enter the email address of a registered user below to upgrade their account privileges to <strong>ADMIN</strong>.
      </p>

      <FormGroup onSubmit={handlePromote}>
        <div>
          <label>Target User Email</label>
          <input 
            type="email" 
            placeholder="user@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        {status && (
          <Message $type={status.type}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            {status.msg}
          </Message>
        )}

        <button type="submit" disabled={loading || !email}>
          <UserPlus size={18} />
          {loading ? 'Promoting...' : 'Promote to Admin'}
        </button>
      </FormGroup>
    </PanelContainer>
  );
};

export default AdminManagementPanel;
