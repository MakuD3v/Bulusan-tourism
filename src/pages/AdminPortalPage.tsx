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
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAttractions, useEnterprises, useBlogs, useInquiries, useHeritage } from '../hooks/useFirestore';

// New Atomic Components
import OverviewPanel from '../components/Admin/OverviewPanel';
import ModerationDashboard from '../components/Admin/ModerationDashboard';
import InboxReader from '../components/Admin/InboxReader';
import AttractionsManager from '../components/Admin/AttractionsManager';
import EnterprisesManager from '../components/Admin/EnterprisesManager';
import AdminManagementPanel from '../components/Admin/AdminManagementPanel';
const PortalContainer = styled(motion.div).attrs({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
})`
  display: flex;
  min-height: 100vh;
  background: var(--light-bg);
  padding: 16px;
  gap: 20px;
  overflow: hidden;
`;

const Sidebar = styled.aside`
  width: 280px;
  background: ${(props) => props.theme.glass.background};
  backdrop-filter: ${(props) => props.theme.glass.filter};
  border: ${(props) => props.theme.glass.border};
  border-radius: 24px;
  color: var(--text-dark);
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  z-index: 100;

  .logo {
    padding: 40px 32px;
    font-size: 1.8rem;
    font-family: ${(props) => props.theme.fonts.heading};
    font-weight: 900;
    letter-spacing: -1px;
    color: ${(props) => props.theme.colors.darkBlue};
    span { color: ${(props) => props.theme.colors.ctaBlue}; }
  }

  nav {
    flex: 1;
    padding: 0 16px;
  }
`;

const NavItem = styled.div<{ $active: boolean }>`
  padding: 16px 20px;
  border-radius: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${(props) => props.$active ? 'var(--cta-blue)' : 'transparent'};
  color: ${(props) => props.$active ? 'white' : 'var(--text-light)'};
  font-weight: ${(props) => props.$active ? '700' : '600'};

  &:hover {
    background: ${(props) => props.$active ? 'var(--cta-blue)' : 'rgba(46, 117, 182, 0.08)'};
    color: ${(props) => props.$active ? 'white' : 'var(--cta-blue)'};
    transform: ${(props) => props.$active ? 'none' : 'translateX(4px)'};
  }

  svg {
    color: ${(props) => props.$active ? 'white' : 'currentColor'};
  }
`;

const MainContent = styled.main`
  flex: 1;
  background: var(--surface-bg);
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  padding: 48px;
  overflow-y: auto;
  max-height: calc(100vh - 32px);
  border: 1px solid rgba(0,0,0,0.03);
  
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.3); border-radius: 10px; }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0,0,0,0.05);

  h1 { 
    font-size: 2.2rem; 
    color: ${(props) => props.theme.colors.darkBlue}; 
    font-family: ${(props) => props.theme.fonts.heading};
  }

  .user-badge {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface-bg);
    border: 1px solid rgba(0,0,0,0.05);
    padding: 8px 24px 8px 8px;
    border-radius: 30px;
    font-weight: 700;
    color: var(--text-dark);
    box-shadow: none;
    
    .avatar {
      width: 36px; height: 36px; 
      border-radius: 50%; 
      background: var(--cta-blue); 
      color: white; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 0.85rem;
    }
  }
`;

const AdminPortalPage = () => {
    const { role, logout, isDemoMode, user } = useAuth();

    const getInitialTab = () => {
        if (role === 'OWNER') {
            if (user?.ownedAttraction) return 'attractions';
            if (user?.ownedEnterprise) return 'enterprises';
            return 'attractions';
        }
        return 'overview';
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'attractions' | 'enterprises' | 'heritage' | 'moderation' | 'inbox' | 'admin_management'>(getInitialTab);
    
    // Type any has been kept for hooks where strict entity models might missing properties on the fly, 
    // but the sub-components correctly typed.
    const { data: attractions } = useAttractions([]);
    const { data: enterprises } = useEnterprises([]);
    const { data: heritageItems } = useHeritage([]);
    const { data: blogPosts } = useBlogs([]);
    const { data: inboxInquiries } = useInquiries();

    const handleLogout = () => { logout(); window.location.href = '/discover'; };

    React.useEffect(() => {
        if (role === 'OWNER') {
            if (user?.ownedAttraction) {
                setActiveTab('attractions');
            } else if (user?.ownedEnterprise) {
                setActiveTab('enterprises');
            }
        }
    }, [role, user]);

    return (
        <PortalContainer>
            <Sidebar>
                <div className="logo">BULU<span>SAN</span></div>
                <nav>
                    {role === 'ADMIN' && (
                        <>
                            <NavItem $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><BarChart3 size={20} /> Overview</NavItem>
                            <NavItem $active={activeTab === 'attractions'} onClick={() => setActiveTab('attractions')}><MapPin size={20} /> Manage Attractions</NavItem>
                            <NavItem $active={activeTab === 'enterprises'} onClick={() => setActiveTab('enterprises')}><MapPin size={20} /> Manage Enterprises</NavItem>
                            <NavItem $active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')}><FileText size={20} /> Content Moderation</NavItem>
                            <NavItem $active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')}><Mail size={20} /> Inquiry Inbox</NavItem>
                            {user?.email === 'admin@bulusan.com' && (
                                <NavItem $active={activeTab === 'admin_management'} onClick={() => setActiveTab('admin_management')}><ShieldAlert size={20} /> Admin Management</NavItem>
                            )}
                        </>
                    )}
                    {role === 'OWNER' && (
                        <>
                            {user?.ownedAttraction && (
                                <NavItem $active={activeTab === 'attractions'} onClick={() => setActiveTab('attractions')}><MapPin size={20} /> My Attraction</NavItem>
                            )}
                            {user?.ownedEnterprise && (
                                <NavItem $active={activeTab === 'enterprises'} onClick={() => setActiveTab('enterprises')}><MapPin size={20} /> My Enterprise</NavItem>
                            )}
                        </>
                    )}
                </nav>
                <div style={{ padding: '32px' }}>
                    <NavItem $active={false} onClick={handleLogout}><LogOut size={20} /> Sign Out</NavItem>
                </div>
            </Sidebar>

            <MainContent>
                <Header>
                    <h1>{activeTab === 'moderation' ? 'Content Moderation' : activeTab === 'admin_management' ? 'Admin Management' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                    <div className="user-badge">
                        <div className="avatar">AD</div>
                        <span>{role} Dashboard</span>
                    </div>
                </Header>

                {isDemoMode && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 24px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={18} />
                        <strong>Demo Mode Active:</strong> Firebase is not configured. Accounts and data will be stored locally in your browser.
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{ height: '100%' }}
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
                        {activeTab === 'admin_management' && user?.email === 'admin@bulusan.com' && <AdminManagementPanel />}
                    </motion.div>
                </AnimatePresence>
            </MainContent>
        </PortalContainer>
    );
};

export default AdminPortalPage;
