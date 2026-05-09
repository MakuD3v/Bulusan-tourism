import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Mail, Search } from 'lucide-react';
import AdminSearchBar from './AdminSearchBar';
import { Inquiry } from '../../data/types';

interface InboxReaderProps {
  inquiries: Inquiry[];
}

const InboxReader: React.FC<InboxReaderProps> = ({ inquiries }) => {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInquiries = (inquiries || []).filter(inq => 
    inq.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inq.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div key={inq.id} onClick={() => setSelectedInquiry(inq)} style={{ padding: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', cursor: 'pointer', background: selectedInquiry?.id === inq.id ? 'rgba(148, 163, 184, 0.05)' : 'transparent' }}>
                <div style={{ fontWeight: 700 }}>{inq.sender}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{inq.subject}</div>
              </div>
            ))}
            {filteredInquiries.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>No messages found.</div>
            )}
          </div>
        </div>
        <div style={{ background: 'var(--surface-bg)', borderRadius: '20px', padding: '40px' }}>
          {selectedInquiry ? (
            <>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-dark)' }}>{selectedInquiry.subject}</h3>
              <div style={{ marginBottom: '24px', color: 'var(--text-light)' }}>From: {selectedInquiry.sender} ({selectedInquiry.email})</div>
              <p style={{ lineHeight: '1.6', color: 'var(--text-dark)' }}>{selectedInquiry.message}</p>
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
