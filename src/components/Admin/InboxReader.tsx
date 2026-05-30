import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Mail, Search, Reply, Trash2, CheckCircle2 } from 'lucide-react';
import AdminSearchBar from './AdminSearchBar';
import { Inquiry } from '../../data/types';
import { dbService } from '../../api/db';
import { useAlert } from '../Common/AlertProvider';

interface InboxReaderProps {
  inquiries: Inquiry[];
}

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &.reply {
    background: var(--cta-blue);
    color: white;
    &:hover { background: var(--primary-blue); }
  }
  &.read {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
    &:hover { background: rgba(34, 197, 94, 0.2); }
  }
  &.delete {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    &:hover { background: rgba(239, 68, 68, 0.2); }
  }
`;

const InboxReader: React.FC<InboxReaderProps> = ({ inquiries }) => {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert, showConfirm } = useAlert();

  const filteredInquiries = (inquiries || []).filter(inq => 
    inq.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReply = async () => {
    if (!selectedInquiry) return;
    
    // Open Gmail directly in compose mode
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedInquiry.email)}`;
    window.open(gmailUrl, '_blank');

    // Auto-mark as read when replying
    if (selectedInquiry.status === 'New') {
      await handleMarkAsRead();
    }
  };

  const handleMarkAsRead = async () => {
    if (!selectedInquiry) return;
    try {
      await dbService.update('inquiries', selectedInquiry.id.toString(), { status: 'Read' });
      setSelectedInquiry({ ...selectedInquiry, status: 'Read' });
      showAlert('Success', 'Message marked as read', 'success');
    } catch (err) {
      showAlert('Error', 'Failed to update status', 'error');
    }
  };

  const handleDelete = () => {
    if (!selectedInquiry) return;
    showConfirm('Delete Message', 'Are you sure you want to delete this message?', async () => {
      try {
        await dbService.delete('inquiries', selectedInquiry.id.toString());
        setSelectedInquiry(null);
        showAlert('Success', 'Message deleted', 'success');
      } catch (err) {
        showAlert('Error', 'Failed to delete message', 'error');
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', height: '600px' }}>
        <div style={{ background: 'var(--surface-bg)', borderRadius: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <AdminSearchBar 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Search sender or subject..."
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredInquiries.map((inq: Inquiry) => (
              <div key={inq.id} onClick={() => setSelectedInquiry(inq)} style={{ padding: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', cursor: 'pointer', background: selectedInquiry?.id === inq.id ? 'rgba(148, 163, 184, 0.05)' : 'transparent', borderLeft: inq.status === 'New' ? '4px solid var(--cta-blue)' : '4px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: inq.status === 'New' ? 800 : 500, color: 'var(--text-dark)' }}>{inq.sender}</div>
                  {inq.status === 'New' && <div style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>New</div>}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>{inq.subject}</div>
              </div>
            ))}
            {filteredInquiries.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>No messages found.</div>
            )}
          </div>
        </div>
        <div style={{ background: 'var(--surface-bg)', borderRadius: '20px', padding: '40px', display: 'flex', flexDirection: 'column' }}>
          {selectedInquiry ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginBottom: '8px' }}>{selectedInquiry.subject}</h3>
                  <div style={{ color: 'var(--text-light)' }}>From: <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{selectedInquiry.sender}</span> ({selectedInquiry.email})</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <ActionButton className="reply" onClick={handleReply}>
                    <Reply size={16} /> Reply
                  </ActionButton>
                  {selectedInquiry.status === 'New' && (
                    <ActionButton className="read" onClick={handleMarkAsRead}>
                      <CheckCircle2 size={16} /> Mark Read
                    </ActionButton>
                  )}
                  <ActionButton className="delete" onClick={handleDelete}>
                    <Trash2 size={16} />
                  </ActionButton>
                </div>
              </div>
              
              <div style={{ flex: 1, background: 'rgba(148, 163, 184, 0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)', overflowY: 'auto' }}>
                <p style={{ lineHeight: '1.6', color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>{selectedInquiry.message}</p>
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', flexDirection: 'column' }}>
              <Mail size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p>Select an inquiry to read</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InboxReader;
