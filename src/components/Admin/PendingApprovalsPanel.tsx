import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, User, Mail, Calendar, Clock, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../api/client';

interface PendingOwner {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  approvalStatus: string;
  emailVerified: boolean;
}

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

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1fr 180px 120px 160px;
  padding: 14px 28px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #94a3b8;
`;

const TableRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 180px 120px 160px;
  padding: 20px 28px;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.2s;

  &:last-child { border-bottom: none; }
  &:hover { background: #fafcff; }
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

  .name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
  .email {
    color: #94a3b8;
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }
`;

const DateCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.85rem;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(251, 191, 36, 0.12);
  color: #b45309;
  border: 1px solid rgba(251, 191, 36, 0.25);
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ApproveBtn = styled(motion.button)`
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: #065f46;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover { background: rgba(52, 211, 153, 0.2); }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const RejectBtn = styled(motion.button)`
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #991b1b;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover { background: rgba(239, 68, 68, 0.15); }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const EmptyState = styled.div`
  padding: 80px 24px;
  text-align: center;
  color: #94a3b8;

  h3 { font-size: 1rem; font-weight: 700; color: #64748b; margin: 16px 0 8px; }
  p { font-size: 0.88rem; }
`;

const PendingApprovalsPanel: React.FC = () => {
  const [owners, setOwners] = useState<PendingOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [processed, setProcessed] = useState<Set<string>>(new Set());

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/auth/pending-owners');
      setOwners(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to fetch pending owners', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleApprove = async (ownerId: string, name: string) => {
    setActionLoading(prev => ({ ...prev, [`approve-${ownerId}`]: true }));
    try {
      await apiClient.post('/auth/approve-owner', { userId: ownerId });
      setProcessed(prev => new Set(prev).add(ownerId));
      setOwners(prev => prev.filter(o => o.id !== ownerId));
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setActionLoading(prev => ({ ...prev, [`approve-${ownerId}`]: false }));
    }
  };

  const handleReject = async (ownerId: string) => {
    if (!confirm('Are you sure you want to reject this owner account?')) return;
    setActionLoading(prev => ({ ...prev, [`reject-${ownerId}`]: true }));
    try {
      await apiClient.post('/auth/reject-owner', { userId: ownerId });
      setOwners(prev => prev.filter(o => o.id !== ownerId));
    } catch (e) {
      console.error('Reject failed', e);
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject-${ownerId}`]: false }));
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <Section>
      <SectionHeader>
        <div>
          <h2>Pending Owner Approvals</h2>
          <p>
            {loading ? 'Loading…' : `${owners.length} owner${owners.length !== 1 ? 's' : ''} waiting for approval`}
          </p>
        </div>
        <RefreshBtn onClick={fetch} disabled={loading}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh
        </RefreshBtn>
      </SectionHeader>

      <Card>
        {loading ? (
          <EmptyState>
            <Loader2 size={32} className="animate-spin" />
            <h3>Loading pending owners…</h3>
          </EmptyState>
        ) : owners.length === 0 ? (
          <EmptyState>
            <ShieldCheck size={40} opacity={0.3} />
            <h3>No Pending Approvals</h3>
            <p>All owner accounts have been reviewed. Check back later.</p>
          </EmptyState>
        ) : (
          <>
            <TableHead>
              <span>Owner</span>
              <span>Registered</span>
              <span>Status</span>
              <span>Actions</span>
            </TableHead>
            {owners.map((owner, i) => {
              const initials = owner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const isApproving = actionLoading[`approve-${owner.id}`];
              const isRejecting = actionLoading[`reject-${owner.id}`];

              return (
                <TableRow
                  key={owner.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <OwnerInfo>
                    <div className="avatar">{initials}</div>
                    <div>
                      <div className="name">{owner.name}</div>
                      <div className="email">
                        <Mail size={12} />
                        {owner.email}
                      </div>
                    </div>
                  </OwnerInfo>

                  <DateCell>
                    <Calendar size={14} />
                    {formatDate(owner.joinedDate)}
                  </DateCell>

                  <div>
                    <StatusBadge>
                      <Clock size={12} />
                      Pending
                    </StatusBadge>
                  </div>

                  <Actions>
                    <ApproveBtn
                      onClick={() => handleApprove(owner.id, owner.name)}
                      disabled={isApproving || isRejecting}
                      whileTap={{ scale: 0.96 }}
                    >
                      {isApproving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      Approve
                    </ApproveBtn>
                    <RejectBtn
                      onClick={() => handleReject(owner.id)}
                      disabled={isApproving || isRejecting}
                      whileTap={{ scale: 0.96 }}
                    >
                      {isRejecting ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                      Reject
                    </RejectBtn>
                  </Actions>
                </TableRow>
              );
            })}
          </>
        )}
      </Card>
    </Section>
  );
};

export default PendingApprovalsPanel;
