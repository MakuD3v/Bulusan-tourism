import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, User, Mail, Calendar, Clock, RefreshCw,
  Loader2, ShieldCheck, MessageSquare, ImageIcon, Key, AlertTriangle
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface PendingAppeal {
  id: string;
  userId: string;
  message: string;
  image: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string; joinedDate: string; };
}

interface RecoveryRequest {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
}

// ── Styled Components ──────────────────────────────────────────────────────────
const Section = styled.div``;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    color: #1e2d50;
    letter-spacing: -0.3px;
  }
  p { color: #64748b; font-size: 0.88rem; margin-top: 3px; }
`;

const TabSwitcher = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 14px;
  width: fit-content;
`;

const SubTab = styled.button<{ $active: boolean }>`
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  background: ${p => p.$active ? 'white' : 'transparent'};
  color: ${p => p.$active ? '#1e293b' : '#64748b'};
  box-shadow: ${p => p.$active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'};

  &:hover { color: #1e293b; }
`;

const Badge = styled.span`
  background: #e11d48;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
`;

const RefreshBtn = styled.button`
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  &:hover { background: #f8fafc; color: #1e293b; }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const Card = styled(motion.div)`
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
`;

const EmptyState = styled.div`
  padding: 80px 24px;
  text-align: center;
  color: #94a3b8;
  h3 { font-size: 1rem; font-weight: 700; color: #64748b; margin: 16px 0 8px; }
  p { font-size: 0.88rem; }
`;

const AppealItem = styled(motion.div)`
  padding: 24px 32px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  &:last-child { border-bottom: none; }
`;

const RecoveryItem = styled(motion.div)`
  padding: 20px 32px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  &:last-child { border-bottom: none; }
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const OwnerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 800;
    color: white;
    flex-shrink: 0;
  }
  .avatar-key {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: linear-gradient(135deg, #d97706 0%, #92400e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
  .name { font-weight: 700; color: #1e293b; font-size: 1.05rem; }
  .email { color: #64748b; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; margin-top: 4px; }
`;

const MetaData = styled.div`
  text-align: right;
  .date { color: #64748b; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
  .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: rgba(251, 191, 36, 0.12); color: #b45309; margin-top: 8px; }
  .badge-recovery { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: rgba(239, 68, 68, 0.1); color: #dc2626; margin-top: 8px; }
`;

const ContentBox = styled.div`
  background: #f8fafc;
  border-radius: 16px;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 24px;
  margin-bottom: 20px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const MessageArea = styled.div`
  .label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  p { color: #334155; line-height: 1.6; font-size: 0.95rem; }
`;

const ImageArea = styled.div`
  .label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  img { width: 100%; height: 140px; object-fit: cover; border-radius: 12px; border: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; &:hover { opacity: 0.9; } }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ActionInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  outline: none;
  &:focus { border-color: var(--cta-blue); }
`;

const ApproveBtn = styled(motion.button)`
  background: #10b981;
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  white-space: nowrap;
  &:hover { background: #059669; }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const RejectBtn = styled(motion.button)`
  background: #fff1f2;
  color: #e11d48;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  white-space: nowrap;
  &:hover { background: #ffe4e6; }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const ImageModal = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 40px;
  img { max-width: 100%; max-height: 100%; border-radius: 12px; }
`;

const RecoveryWarning = styled.div`
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 0.85rem;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 10px;
`;

// ── Component ──────────────────────────────────────────────────────────────────
const PendingApprovalsPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'owner' | 'recovery'>('owner');
  const [appeals, setAppeals] = useState<PendingAppeal[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [appealsRes, recoveryRes] = await Promise.all([
        apiClient.get('/appeals'),
        apiClient.get('/auth/recovery/pending'),
      ]);
      setAppeals(Array.isArray(appealsRes) ? appealsRes : []);
      setRecoveryRequests(Array.isArray(recoveryRes) ? recoveryRes : []);
    } catch (e) {
      console.error('Failed to fetch approvals', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAppealAction = async (appealId: string, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !confirm('Are you sure you want to reject this appeal?')) return;
    setActionLoading(prev => ({ ...prev, [appealId]: true }));
    try {
      await apiClient.put(`/appeals/${appealId}`, { status, adminReply: replies[appealId] || '' });
      setAppeals(prev => prev.filter(a => a.id !== appealId));
    } catch (e) {
      console.error(`${status} failed`, e);
      alert(`Failed to ${status.toLowerCase()} appeal.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [appealId]: false }));
    }
  };

  const handleRecoveryAction = async (email: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !confirm('Are you sure you want to reject this recovery request?')) return;
    setActionLoading(prev => ({ ...prev, [email]: true }));
    try {
      await apiClient.put(`/auth/recovery/${action}`, { email });
      setRecoveryRequests(prev => prev.filter(r => r.email !== email));
    } catch (e) {
      console.error(`Recovery ${action} failed`, e);
      alert(`Failed to ${action} recovery request.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [email]: false }));
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const totalPending = appeals.length + recoveryRequests.length;

  return (
    <Section>
      <AnimatePresence>
        {selectedImage && (
          <ImageModal initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="Fullscreen Appeal" />
          </ImageModal>
        )}
      </AnimatePresence>

      <SectionHeader>
        <div>
          <h2>Pending Approvals</h2>
          <p>{loading ? 'Loading…' : `${totalPending} item${totalPending !== 1 ? 's' : ''} waiting for review`}</p>
        </div>
        <RefreshBtn onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh
        </RefreshBtn>
      </SectionHeader>

      {/* Tab Switcher */}
      <TabSwitcher>
        <SubTab $active={activeSubTab === 'owner'} onClick={() => setActiveSubTab('owner')}>
          <User size={15} /> Owner Appeals
          {appeals.length > 0 && <Badge>{appeals.length}</Badge>}
        </SubTab>
        <SubTab $active={activeSubTab === 'recovery'} onClick={() => setActiveSubTab('recovery')}>
          <Key size={15} /> Password Resets
          {recoveryRequests.length > 0 && <Badge>{recoveryRequests.length}</Badge>}
        </SubTab>
      </TabSwitcher>

      <AnimatePresence mode="wait">

        {/* ── OWNER APPEALS TAB ── */}
        {activeSubTab === 'owner' && (
          <motion.div key="owner" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <Card>
              {loading ? (
                <EmptyState><Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} /><h3>Loading appeals…</h3></EmptyState>
              ) : appeals.length === 0 ? (
                <EmptyState>
                  <ShieldCheck size={40} opacity={0.3} style={{ margin: '0 auto' }} />
                  <h3>No Pending Appeals</h3>
                  <p>All owner appeals have been reviewed. Check back later.</p>
                </EmptyState>
              ) : appeals.map((appeal, i) => {
                const initials = appeal.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const isLoading = actionLoading[appeal.id];
                return (
                  <AppealItem key={appeal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <UserRow>
                      <OwnerInfo>
                        <div className="avatar">{initials}</div>
                        <div>
                          <div className="name">{appeal.user.name}</div>
                          <div className="email"><Mail size={12} />{appeal.user.email}</div>
                        </div>
                      </OwnerInfo>
                      <MetaData>
                        <div className="date"><Calendar size={14} /> Submitted {formatDate(appeal.createdAt)}</div>
                        <div className="badge"><Clock size={12} /> Pending Review</div>
                      </MetaData>
                    </UserRow>
                    <ContentBox>
                      <MessageArea>
                        <div className="label"><MessageSquare size={14} /> Appeal Message</div>
                        <p>"{appeal.message}"</p>
                      </MessageArea>
                      <ImageArea>
                        <div className="label"><ImageIcon size={14} /> Proof Attached</div>
                        <img src={appeal.image} alt="Proof" onClick={() => setSelectedImage(appeal.image)} />
                      </ImageArea>
                    </ContentBox>
                    <Actions>
                      <ActionInput
                        placeholder="Optional note or reason (visible to user)..."
                        value={replies[appeal.id] || ''}
                        onChange={(e) => setReplies(prev => ({ ...prev, [appeal.id]: e.target.value }))}
                        disabled={isLoading}
                      />
                      <RejectBtn onClick={() => handleAppealAction(appeal.id, 'REJECTED')} disabled={isLoading} whileTap={{ scale: 0.96 }}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Reject
                      </RejectBtn>
                      <ApproveBtn onClick={() => handleAppealAction(appeal.id, 'APPROVED')} disabled={isLoading} whileTap={{ scale: 0.96 }}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve
                      </ApproveBtn>
                    </Actions>
                  </AppealItem>
                );
              })}
            </Card>
          </motion.div>
        )}

        {/* ── PASSWORD RECOVERY TAB ── */}
        {activeSubTab === 'recovery' && (
          <motion.div key="recovery" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <RecoveryWarning>
              <AlertTriangle size={16} />
              <span><strong>Account Recovery:</strong> Approving instantly logs the user back into their account. Only approve if you can verify the identity of the requester.</span>
            </RecoveryWarning>
            <Card>
              {loading ? (
                <EmptyState><Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} /><h3>Loading requests…</h3></EmptyState>
              ) : recoveryRequests.length === 0 ? (
                <EmptyState>
                  <Key size={40} opacity={0.3} style={{ margin: '0 auto' }} />
                  <h3>No Recovery Requests</h3>
                  <p>No users are currently waiting to recover their account.</p>
                </EmptyState>
              ) : recoveryRequests.map((req, i) => {
                const isLoading = actionLoading[req.email];
                const initials = req.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <RecoveryItem key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <OwnerInfo style={{ flex: 1 }}>
                      <div className="avatar-key"><Key size={18} /></div>
                      <div>
                        <div className="name">{req.name}</div>
                        <div className="email"><Mail size={12} />{req.email}</div>
                      </div>
                    </OwnerInfo>
                    <MetaData>
                      <div className="date"><Clock size={14} /> {formatDate(req.createdAt)}</div>
                      <div className="badge-recovery"><AlertTriangle size={12} /> Waiting for approval</div>
                    </MetaData>
                    <Actions style={{ flexShrink: 0 }}>
                      <RejectBtn onClick={() => handleRecoveryAction(req.email, 'reject')} disabled={isLoading} whileTap={{ scale: 0.96 }}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Reject
                      </RejectBtn>
                      <ApproveBtn onClick={() => handleRecoveryAction(req.email, 'approve')} disabled={isLoading} whileTap={{ scale: 0.96 }}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Grant Access
                      </ApproveBtn>
                    </Actions>
                  </RecoveryItem>
                );
              })}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
};

export default PendingApprovalsPanel;
