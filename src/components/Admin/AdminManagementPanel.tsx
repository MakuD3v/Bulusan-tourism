import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { UserPlus, ShieldAlert, CheckCircle2, UserMinus, Search, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client';

const PanelContainer = styled.div`
  background: var(--surface-bg);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--dark-blue);
  
  h2 {
    font-size: 1.5rem;
    font-family: 'Outfit', sans-serif;
  }
`;

const SearchBox = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }
  
  input {
    width: 100%;
    padding: 16px 16px 16px 48px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-dark);
    border-radius: 12px;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: var(--cta-blue);
      box-shadow: 0 0 0 3px rgba(46, 117, 182, 0.1);
    }
  }
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);

  .info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .name { font-weight: 700; color: var(--text-dark); }
    .email { font-size: 0.85rem; color: var(--text-light); }
  }

  button {
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;

    &.promote {
      background: rgba(37, 99, 235, 0.1);
      color: #3b82f6;
      &:hover { background: #2563eb; color: white; }
    }

    &.demote {
      background: rgba(220, 38, 38, 0.1);
      color: #f87171;
      &:hover { background: #dc2626; color: white; }
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const Message = styled.div<{ $type: 'error' | 'success' }>`
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.$type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(22, 163, 74, 0.1)'};
  color: ${props => props.$type === 'error' ? '#f87171' : '#4ade80'};
  border: 1px solid ${props => props.$type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(22, 163, 74, 0.2)'};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: -16px;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
`;

const Popup = styled.div`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 32px;
  border-radius: 20px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  
  h3 { margin-bottom: 12px; color: var(--text-dark); }
  p { color: var(--text-light); margin-bottom: 24px; line-height: 1.5; }
  
  .actions {
    display: flex; gap: 12px;
    button {
      flex: 1; padding: 12px; border-radius: 12px; font-weight: bold; border: none; cursor: pointer;
      &.cancel { background: rgba(255, 255, 255, 0.05); color: var(--text-light); &:hover { background: rgba(255, 255, 255, 0.1); } }
      &.confirm { background: #ef4444; color: white; &:hover { background: #dc2626; } }
    }
  }
`;

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AdminManagementPanel = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userToDemote, setUserToDemote] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get('/auth/users');
      setUsers(data);
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePromote = async (userId: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await apiClient.put('/auth/promote', { userId });
      if (res.error) setStatus({ type: 'error', msg: res.error });
      else {
        setStatus({ type: 'success', msg: res.message });
        fetchUsers();
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Failed to promote user.' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDemote = async () => {
    if (!userToDemote) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await apiClient.put('/auth/demote', { userId: userToDemote.id });
      if (res.error) setStatus({ type: 'error', msg: res.error });
      else {
        setStatus({ type: 'success', msg: res.message });
        fetchUsers();
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Failed to demote user.' });
    } finally {
      setLoading(false);
      setUserToDemote(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const regularUsers = filteredUsers.filter(u => u.role !== 'ADMIN');
  const adminUsers = users.filter(u => u.role === 'ADMIN');

  return (
    <>
      <PanelContainer>
        <Header>
          <ShieldAlert size={28} />
          <h2>Super Admin Area</h2>
        </Header>
        
        {status && (
          <Message $type={status.type}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            {status.msg}
          </Message>
        )}

        <div>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-dark)', fontWeight: 700 }}>Add New Admin</h3>
          <SearchBox>
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchBox>
          
          {search && (
            <UserList style={{ marginTop: '16px' }}>
              {regularUsers.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>No regular users found matching "{search}"</div>
              ) : (
                regularUsers.map(u => (
                  <UserItem key={u.id}>
                    <div className="info">
                      <span className="name">{u.name}</span>
                      <span className="email">{u.email}</span>
                    </div>
                    <button className="promote" disabled={loading} onClick={() => handlePromote(u.id)}>
                      <UserPlus size={16} /> Promote
                    </button>
                  </UserItem>
                ))
              )}
            </UserList>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-dark)', fontWeight: 700 }}>Current Administrators</h3>
          <UserList>
            {adminUsers.map(u => (
              <UserItem key={u.id}>
                <div className="info">
                  <span className="name">{u.name} {u.email === 'admin@bulusan.com' && '(Super Admin)'}</span>
                  <span className="email">{u.email}</span>
                </div>
                {u.email !== 'admin@bulusan.com' && (
                  <button className="demote" disabled={loading} onClick={() => setUserToDemote(u)}>
                    <UserMinus size={16} /> Remove
                  </button>
                )}
              </UserItem>
            ))}
          </UserList>
        </div>
      </PanelContainer>

      {userToDemote && (
        <Overlay>
          <Popup>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h3>Remove Admin Privileges?</h3>
            <p>Are you sure you want to remove <strong>{userToDemote.name}</strong> from the administration team? They will lose access to the Admin Portal.</p>
            <div className="actions">
              <button className="cancel" onClick={() => setUserToDemote(null)}>Cancel</button>
              <button className="confirm" onClick={confirmDemote}>Yes, Remove</button>
            </div>
          </Popup>
        </Overlay>
      )}
    </>
  );
};

export default AdminManagementPanel;
