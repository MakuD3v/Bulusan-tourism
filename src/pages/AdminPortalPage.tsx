import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  MapPin,
  FileText,
  Mail,
  LogOut,
  Settings,
  History,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAttractions, useEnterprises, useBlogs, useInquiries, useHeritage } from '../hooks/useData';

import OverviewPanel from '../components/Admin/OverviewPanel';
import ModerationDashboard from '../components/Admin/ModerationDashboard';
import InboxReader from '../components/Admin/InboxReader';
import AttractionsManager from '../components/Admin/AttractionsManager';
import EnterprisesManager from '../components/Admin/EnterprisesManager';
import AdminManagementPanel from '../components/Admin/AdminManagementPanel';
import PendingApprovalsPanel from '../components/Admin/PendingApprovalsPanel';
import { MainHeader, ContentArea } from '../components/Layout/DashboardLayout';

const TabNav = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 16px;
  overflow-x: auto;
  
  &::-webkit-scrollbar { display: none; }
`;

const TabBtn = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? 'rgba(144, 205, 244, 0.15)' : 'transparent'};
  color: ${p => p.$active ? '#90cdf4' : '#94a3b8'};
  border: 1px solid ${p => p.$active ? 'rgba(144, 205, 244, 0.3)' : 'transparent'};
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(144, 205, 244, 0.1);
    color: #e2ecf7;
  }
`;

const AdminPortalPage = () => {
    const { role, isDemoMode, user } = useAuth();

    const getInitialTab = (): 'overview' => {
        return 'overview';
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'attractions' | 'enterprises' | 'heritage' | 'moderation' | 'inbox' | 'admin_management' | 'pending_approvals'>(getInitialTab);
    
    const { data: attractions } = useAttractions([]);
    const { data: enterprises } = useEnterprises([]);
    const { data: heritageItems } = useHeritage([]);
    const { data: blogPosts } = useBlogs([]);
    const { data: inboxInquiries } = useInquiries();

    return (
        <>
            <MainHeader>
                <div>
                    <h1>{activeTab === 'moderation' ? 'Content Moderation' : activeTab === 'admin_management' ? 'Admin Management' : activeTab.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h1>
                    <div className="meta">Admin Portal ({role})</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#e2ecf7' }}>{user?.name || 'Administrator'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#90cdf4', fontWeight: 700, textTransform: 'uppercase' }}>Super Admin</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#1e3a8a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        AD
                    </div>
                </div>
            </MainHeader>

            <ContentArea>
                {isDemoMode && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fcd34d', padding: '12px 24px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={18} />
                        <strong>Demo Mode Active:</strong> Firebase is not configured. Accounts and data will be stored locally in your browser.
                    </div>
                )}

                <TabNav>
                    <TabBtn $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><BarChart3 size={18} /> Overview</TabBtn>
                    <TabBtn $active={activeTab === 'attractions'} onClick={() => setActiveTab('attractions')}><MapPin size={18} /> Attractions</TabBtn>
                    <TabBtn $active={activeTab === 'enterprises'} onClick={() => setActiveTab('enterprises')}><MapPin size={18} /> Enterprises</TabBtn>
                    <TabBtn $active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')}><FileText size={18} /> Moderation</TabBtn>
                    <TabBtn $active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')}><Mail size={18} /> Inbox</TabBtn>
                    <TabBtn $active={activeTab === 'pending_approvals'} onClick={() => setActiveTab('pending_approvals')}><UserCheck size={18} /> Pending Appeals</TabBtn>
                    {user?.email === 'admin@bulusan.com' && (
                        <TabBtn $active={activeTab === 'admin_management'} onClick={() => setActiveTab('admin_management')}><ShieldAlert size={18} /> Admin Management</TabBtn>
                    )}
                </TabNav>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ height: '100%', minHeight: '500px' }}
                    >
                        {activeTab === 'overview' && (
                            <OverviewPanel 
                                attractions={attractions} 
                                enterprises={enterprises}
                                heritageItems={heritageItems}
                                blogPosts={blogPosts} 
                                inboxInquiries={inboxInquiries} 
                            />
                        )}
                        {activeTab === 'attractions' && <AttractionsManager attractions={attractions} />}
                        {activeTab === 'enterprises' && <EnterprisesManager enterprises={enterprises} />}
                        {activeTab === 'moderation' && (
                            <ModerationDashboard 
                                attractions={attractions} 
                                enterprises={enterprises} 
                                blogPosts={blogPosts} 
                            />
                        )}
                        {activeTab === 'inbox' && <InboxReader inquiries={inboxInquiries} />}
                        {activeTab === 'pending_approvals' && <PendingApprovalsPanel />}
                        {activeTab === 'admin_management' && user?.email === 'admin@bulusan.com' && <AdminManagementPanel />}
                    </motion.div>
                </AnimatePresence>
            </ContentArea>
        </>
    );
};

export default AdminPortalPage;
