import React, { useState, useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, MapPin, Calendar, Settings, 
  LogOut, Award, Heart, MessageSquare, Compass, 
  LayoutDashboard, Star, ChevronRight, Share2,
  Trash2, ExternalLink, ShieldAlert, CheckCircle2,
  Image as ImageIcon, Loader2, X
} from 'lucide-react';
import { useAttractions, useEnterprises, useHeritage } from '../hooks/useData';
import { dbService } from '../api/db';
import { apiClient } from '../api/client';
import SmartMedia from '../components/Common/SmartMedia';

const PortalContainer = styled(motion.div).attrs({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
})`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: var(--light-bg);
  overflow-x: hidden;
  position: relative;

  @media (max-width: 1024px) {
    flex-direction: column;
    padding-bottom: 80px; /* Space for bottom nav */
  }
`;

const Sidebar = styled.div`
  width: 280px;
  background: ${(props) => props.theme.colors.darkBlue === '#F8FAFC' ? props.theme.colors.softBlue : props.theme.colors.darkBlue};
  color: ${(props) => props.theme.colors.darkBlue === '#F8FAFC' ? '#F8FAFC' : '#FFFFFF'};
  display: flex;
  flex-direction: column;
  padding: 32px 0;
  flex-shrink: 0;
  position: sticky;
  top: 72px; /* Anchor Below Header */
  height: calc(100vh - 72px); /* Standard Dashboard height */
  z-index: 900; 
  overflow-y: auto; /* Allow scrolling inside sidebar if menu gets too long */

  /* Hide scrollbar for clean dashboard look */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 1024px) {
    width: 100%;
    height: 72px;
    padding: 0;
    flex-direction: row;
    position: fixed;
    bottom: 0;
    top: auto;
    left: 0;
    background: var(--surface-bg);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
    border-top: 1px solid rgba(0,0,0,0.05);
    z-index: 1001; /* Keep above footer on mobile */
  }

  .desktop-logout-only {
    padding: 0 32px;
    margin-top: auto;
    margin-bottom: 24px;
    @media (max-width: 1024px) { display: none; }
  }

  .mobile-logout-only {
    display: none;
    @media (max-width: 1024px) { display: flex; flex-shrink: 0; }
  }
  
  .logo {
    font-size: 1.8rem;
    font-weight: 900;
    padding: 0 32px;
    margin-bottom: 48px;
    letter-spacing: 2px;
    font-family: ${(props) => props.theme.fonts.heading};

    @media (max-width: 1024px) {
      display: none;
    }

    span { 
      color: ${(props) => props.theme.colors.darkBlue === '#F8FAFC' ? '#F8FAFC' : '#FFFFFF'}; 
      font-family: 'Pacifico', cursive;
      font-weight: normal;
      text-transform: none;
      letter-spacing: 0;
      margin-left: 2px;
    }
  }

  nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px;

    @media (max-width: 1024px) {
      flex-direction: row;
      overflow-x: auto;
      padding: 0 12px;
      gap: 4px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      &::-webkit-scrollbar { display: none; }
      align-items: center;
      height: 100%;
    }
  }
`;

const NavItem = styled.button<{ $active?: boolean }>`
  font-family: ${(props) => props.theme.fonts.body};
  background: ${(props) => props.$active ? 'rgba(128,128,128,0.2)' : 'transparent'};
  color: ${(props) => props.$active ? (props.theme.colors.darkBlue === '#F8FAFC' ? '#3B82F6' : '#FFFFFF') : 'rgba(148,163,184,0.8)'};
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem; /* Slightly larger for better readability */
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    flex: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: transparent;
    color: ${(props) => props.$active ? props.theme.colors.ctaBlue : '#64748b'};
    padding: 12px 0;
    gap: 4px;
    border-radius: 0;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (min-width: 1025px) {
    padding: 16px 24px;
    font-size: 1rem;
    gap: 16px;
    border-radius: 12px;
  }

  &:hover {
    background: rgba(128,128,128,0.2);
    color: ${(props) => props.theme.colors.darkBlue === '#F8FAFC' ? '#3B82F6' : '#FFFFFF'};
    @media (max-width: 1024px) {
      background: transparent;
      color: ${(props) => props.theme.colors.ctaBlue};
    }
  }
  
  svg { 
    opacity: ${(props) => props.$active ? 1 : 0.7};
    @media (max-width: 1024px) {
      width: 20px;
      height: 20px;
      opacity: 1;
    }
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 48px;

  @media (max-width: 1024px) {
    padding: 32px 20px 48px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 32px;
  }

  h1 { 
    font-size: 2.8rem; 
    color: var(--dark-blue); 
    font-family: ${(props) => props.theme.fonts.heading};
    font-weight: 900;
    letter-spacing: -1px;
    margin-top: 4px;

    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--surface-bg);
    padding: 12px 24px;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);

    @media (max-width: 768px) {
      width: 100%;
      padding: 12px 16px;
    }
    
    .avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: ${(props) => props.theme.colors.ctaBlue}; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 1.2rem;
    }
  }
`;

const ExplorerRank = styled.div<{ $points: number }>`
  background: ${(props) => props.$points > 200 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : props.$points > 50 ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#94a3b8'};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: inline-block;
  margin-top: 4px;
`;

const StatCard = styled.div`
  background: var(--surface-bg);
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid #f1f5f9;

  .icon-box {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: #f0f7ff; color: ${(props) => props.theme.colors.ctaBlue};
  }
  
  .val { font-size: 1.8rem; font-weight: 800; color: var(--text-dark); }
  .label { color: var(--text-light); font-size: 0.9rem; font-weight: 600; }
`;

const ItineraryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
`;

const WonderCard = styled(motion.div)`
  background: var(--surface-bg);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
  
  .img-box {
    height: 180px; width: 100%; overflow: hidden; position: relative;
    img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .badge { position: absolute; top: 12px; left: 12px; padding: 4px 8px; border-radius: 8px; background: rgba(255,255,255,0.9); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #444; }
  }

  &:hover .img-box img { transform: scale(1.1); }
  
  .info {
    padding: 20px;
    h4 { font-size: 1.1rem; color: var(--text-dark); margin-bottom: 8px; }
    .loc { display: flex; align-items: center; gap: 4px; color: var(--text-light); font-size: 0.85rem; margin-bottom: 16px; }
    
    .actions {
      display: flex;
      gap: 12px;
      button {
        flex: 1; padding: 10px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s;
        &.map { background: #f0f7ff; color: #2e75b6; &:hover { background: #2e75b6; color: white; } }
        &.remove { background: #fff1f2; color: #e11d48; &:hover { background: #e11d48; color: white; } }
      }
    }
  }
`;

const ReviewItem = styled.div`
  background: var(--surface-bg);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  margin-bottom: 16px;
  
  .target { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
  .rating { color: #f59e0b; margin-bottom: 8px; display: flex; gap: 2px; }
  .text { color: #475569; line-height: 1.6; font-size: 0.95rem; }
`;

const NotificationOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const NotificationCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 40px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  text-align: center;
  position: relative;

  h3 { margin: 16px 0 8px; font-size: 1.5rem; color: #1e293b; font-family: 'Outfit', sans-serif; }
  p { color: #64748b; font-size: 1rem; line-height: 1.6; margin-bottom: 24px; }
  .close-btn { position: absolute; top: 20px; right: 20px; background: transparent; border: none; color: #94a3b8; cursor: pointer; transition: 0.2s; &:hover { color: #1e293b; } }
  .action-btn { background: var(--cta-blue); color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; width: 100%; font-size: 1.05rem; }
`;

export default function AccountPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'itineraries' | 'reviews' | 'settings' | 'appeal'>('overview');
  const { data: attractions } = useAttractions([]);
  const { data: enterprises } = useEnterprises([]);
  const { data: heritage } = useHeritage([]);
  
  const [userName, setUserName] = useState(user?.name || '');

  // Appeal states
  const [appealData, setAppealData] = useState<any>(null);
  const [fetchingAppeal, setFetchingAppeal] = useState(true);
  const [appealMsg, setAppealMsg] = useState('');
  const [appealImage, setAppealImage] = useState<File | null>(null);
  const [appealPreview, setAppealPreview] = useState<string | null>(null);
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification states
  const [showNotification, setShowNotification] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchAppeal = async () => {
      try {
        const res = await apiClient.get('/appeals/me');
        if (res && res.id) {
          setAppealData(res);
          // Show popup logic
          if (!notificationDismissed && (res.status === 'APPROVED' || res.status === 'REJECTED')) {
            setShowNotification(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch appeal:', err);
      } finally {
        setFetchingAppeal(false);
      }
    };
    fetchAppeal();
  }, [user, notificationDismissed]);

  const unifiedList = useMemo(() => {
    return [
      ...attractions.map(a => ({ ...a, entityType: 'Attraction' })),
      ...enterprises.map(a => ({ ...a, entityType: 'Enterprise' })),
      ...heritage.map(h => ({ ...h, entityType: 'Heritage' }))
    ];
  }, [attractions, enterprises, heritage]);

  const itineraryItems = useMemo(() => {
    if (!user?.itinerary) return [];
    return unifiedList.filter(item => {
      const globalId = item.entityType === 'Enterprise' ? item.id + 1000000 
                     : item.entityType === 'Heritage' ? item.id + 2000000 
                     : item.id;
      return user.itinerary.includes(globalId);
    });
  }, [user, unifiedList]);

  const myReviews = useMemo(() => {
    if (!user) return [];
    const reviews: any[] = [];
    unifiedList.forEach(item => {
      if (item.reviews) {
        item.reviews.forEach((r: any) => {
          if (r.author === user.name) {
            reviews.push({ ...r, targetName: item.name, targetId: item.id, targetType: item.entityType, id: (item as any).id });
          }
        });
      }
    });
    return reviews;
  }, [user, unifiedList]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const explorerPoints = (itineraryItems.length * 10) + (myReviews.length * 50);
  const rank = explorerPoints > 200 ? 'Bulusan Master' : explorerPoints > 50 ? 'Pathfinder' : 'Novice Explorer';

  const handleUpdateName = async () => {
    try {
        await dbService.update('users', (user as any).id, { name: userName });
        alert('Profile updated!');
    } catch (err) { alert('Update failed.'); }
  };

  const removeItem = async (baseId: number, entityType: string) => {
    if (!confirm('Remove this place from your itinerary?')) return;
    const globalId = entityType === 'Enterprise' ? baseId + 1000000 
                   : entityType === 'Heritage' ? baseId + 2000000 
                   : baseId;
    const newItinerary = (user?.itinerary || []).filter(iid => String(iid) !== String(globalId));
    try {
      await updateUser({ itinerary: newItinerary });
    } catch (err) { console.error(err); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAppealImage(file);
      setAppealPreview(URL.createObjectURL(file));
    }
  };

  const submitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealMsg || !appealImage) return alert('Message and image are required.');
    setSubmittingAppeal(true);
    
    try {
      // 1. Upload Image
      const formData = new FormData();
      formData.append('file', appealImage);
      
      const token = localStorage.getItem('auth_token');
      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      
      // 2. Submit Appeal
      const res = await apiClient.post('/appeals', {
        message: appealMsg,
        image: uploadData.url
      });
      
      setAppealData(res);
      alert('Appeal submitted successfully! Admin will review it soon.');
    } catch (err) {
      console.error(err);
      alert('Failed to submit appeal. Please try again.');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const claimBadge = async () => {
    try {
      const res = await apiClient.post('/appeals/claim', {});
      if (res.success) {
        await updateUser({ role: 'OWNER' });
        setShowNotification(false);
        setNotificationDismissed(true);
        navigate('/owner-dashboard');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to claim badge.');
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
    setNotificationDismissed(true);
  };

  return (
    <PortalContainer>
      {/* NOTIFICATION OVERLAY */}
      <AnimatePresence>
        {showNotification && appealData && (
          <NotificationOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NotificationCard initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <button className="close-btn" onClick={dismissNotification}><X size={24} /></button>
              
              {appealData.status === 'APPROVED' ? (
                <>
                  <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto' }} />
                  <h3>Appeal Approved!</h3>
                  <p>Congratulations, your owner appeal was approved by the administration. You can now claim your Owner Badge and access the dashboard.</p>
                  <button className="action-btn" onClick={claimBadge}>Claim Owner Badge</button>
                </>
              ) : (
                <>
                  <ShieldAlert size={64} color="#ef4444" style={{ margin: '0 auto' }} />
                  <h3>Appeal Rejected</h3>
                  <p>Unfortunately, your owner appeal was not approved at this time.</p>
                  {appealData.adminReply && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px' }}>
                      <strong>Admin Note:</strong> {appealData.adminReply}
                    </div>
                  )}
                  <button className="action-btn" style={{ background: '#f1f5f9', color: '#475569' }} onClick={dismissNotification}>Close</button>
                </>
              )}
            </NotificationCard>
          </NotificationOverlay>
        )}
      </AnimatePresence>

      <Sidebar>
        <div className="logo" onClick={() => navigate('/discover')} style={{ cursor: 'pointer' }}>BULU<span>SAN</span></div>
        <nav>
          <NavItem $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><LayoutDashboard size={20} /> My Dashboard</NavItem>
          <NavItem $active={activeTab === 'itineraries'} onClick={() => setActiveTab('itineraries')}><Compass size={20} /> Saved Wonders</NavItem>
          <NavItem $active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}><MessageSquare size={20} /> My Contributions</NavItem>
          
          {user.role === 'USER' && (
            <NavItem $active={activeTab === 'appeal'} onClick={() => setActiveTab('appeal')}><ShieldAlert size={20} /> Owner Appeal</NavItem>
          )}

          <NavItem $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}><Settings size={20} /> Settings</NavItem>
          
          {/* On mobile, Log Out joins the scrollable nav for better density */}
          <div className="mobile-logout-only">
            <NavItem onClick={() => { logout(); navigate('/discover'); }}><LogOut size={20} /> Log Out</NavItem>
          </div>
        </nav>
        
        <div className="desktop-logout-only">
          <NavItem onClick={() => { logout(); navigate('/discover'); }}><LogOut size={20} /> Log Out</NavItem>
        </div>
      </Sidebar>

      <MainContent>
        <Header>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--cta-blue)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px' }}>Tadyaw, {user.name}!</span>
            <h1>Explorer Hub</h1>
          </div>
          <div className="user-card">
            <div className="avatar">
              <UserIcon size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{user.name}</div>
              <ExplorerRank $points={explorerPoints}>{rank}</ExplorerRank>
            </div>
          </div>
        </Header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview" 
              initial={{ opacity: 0, scale: 0.99 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                <StatCard>
                  <div className="icon-box"><Award size={24}/></div>
                  <div className="val">{explorerPoints.toLocaleString()}</div>
                  <div className="label">Explorer points</div>
                </StatCard>
                <StatCard>
                  <div className="icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}><Compass size={24}/></div>
                  <div className="val">{itineraryItems.length}</div>
                  <div className="label">Saved wonders</div>
                </StatCard>
                <StatCard>
                  <div className="icon-box" style={{ background: '#fff7ed', color: '#f59e0b' }}><MessageSquare size={24}/></div>
                  <div className="val">{myReviews.length}</div>
                  <div className="label">Real reviews</div>
                </StatCard>
              </div>

              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginBottom: '24px' }}>Pinned for Adventure</h3>
              <ItineraryGrid>
                {itineraryItems.slice(0, 3).map(item => (
                  <WonderCard key={`${item.entityType}-${item.id}`} whileHover={{ y: -5 }}>
                    <div className="img-box" style={{ background: '#eee' }}>
                      <SmartMedia type="img" src={item.photos?.[0] || item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="badge">{item.entityType}</div>
                    </div>
                    <div className="info">
                      <h4>{item.name}</h4>
                      <div className="loc"><MapPin size={14}/> {item.location}</div>
                      <div className="actions">
                        <button className="map" onClick={() => navigate(`/explore?search=${encodeURIComponent(item.name)}`)}>Explore Map</button>
                        <button className="remove" onClick={() => removeItem(item.id, item.entityType)}>Remove</button>
                      </div>
                    </div>
                  </WonderCard>
                ))}
                {itineraryItems.length === 0 && (
                   <div style={{ gridColumn: '1 / -1', padding: '64px', background: 'var(--surface-bg)', border: '1px dashed #cbd5e1', borderRadius: '24px', textAlign: 'center' }}>
                      <Heart size={48} color="#cbd5e1" style={{ marginBottom: '16px' }}/>
                      <p style={{ color: '#94a3b8', fontWeight: 600 }}>No wonders saved yet. Start your journey!</p>
                      <button onClick={() => navigate('/attractions')} style={{ marginTop: '20px', padding: '12px 24px', background: 'var(--cta-blue)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Browse Attractions</button>
                   </div>
                )}
              </ItineraryGrid>
            </motion.div>
          )}

          {activeTab === 'appeal' && (
            <motion.div 
              key="appeal" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 style={{ fontSize: '1.6rem', color: 'var(--text-dark)', marginBottom: '32px' }}>Enterprise Owner Appeal</h3>
              
              <div style={{ background: 'var(--surface-bg)', padding: '40px', borderRadius: '24px', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                {fetchingAppeal ? (
                   <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={32} color="var(--cta-blue)" /></div>
                ) : appealData ? (
                   <div>
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '30px', fontWeight: 800, fontSize: '0.9rem', marginBottom: '24px',
                       background: appealData.status === 'APPROVED' ? '#ecfdf5' : appealData.status === 'REJECTED' ? '#fef2f2' : '#fffbeb',
                       color: appealData.status === 'APPROVED' ? '#10b981' : appealData.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                     }}>
                       {appealData.status === 'APPROVED' && <CheckCircle2 size={18}/>}
                       {appealData.status === 'REJECTED' && <X size={18}/>}
                       {appealData.status === 'PENDING' && <Clock size={18}/>}
                       STATUS: {appealData.status}
                     </div>

                     {appealData.status === 'APPROVED' && (
                       <div style={{ marginBottom: '24px' }}>
                         <p style={{ color: '#475569', marginBottom: '16px' }}>Your appeal was approved! You can now claim your Owner Badge.</p>
                         <button onClick={claimBadge} style={{ padding: '14px 28px', background: 'var(--cta-blue)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Claim Owner Badge</button>
                       </div>
                     )}

                     {appealData.status === 'REJECTED' && appealData.adminReply && (
                       <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                         <strong style={{ display: 'block', color: '#1e293b', marginBottom: '8px' }}>Admin Response:</strong>
                         <p style={{ color: '#475569', margin: 0, lineHeight: 1.6 }}>{appealData.adminReply}</p>
                       </div>
                     )}

                     <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>Your Submission</p>
                        <p style={{ color: '#475569', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>"{appealData.message}"</p>
                        <img src={appealData.image} alt="Appeal" style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', marginTop: '16px' }} />
                     </div>
                   </div>
                ) : (
                  <form onSubmit={submitAppeal}>
                    <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
                      Want to list your enterprise on Bulusan Tourism? Submit an appeal with proof of ownership (e.g., a photo of your business permit or the storefront).
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569' }}>Why do you want to become an owner?</label>
                      <textarea 
                        required
                        value={appealMsg}
                        onChange={e => setAppealMsg(e.target.value)}
                        placeholder="Tell us about your enterprise..."
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '120px', fontSize: '1rem', outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569' }}>Proof of Ownership (Image)</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', height: '160px', border: '2px dashed #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: appealPreview ? 'transparent' : '#f8fafc', overflow: 'hidden', position: 'relative' }}
                      >
                        {appealPreview ? (
                          <img src={appealPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <>
                            <ImageIcon size={32} color="#94a3b8" style={{ marginBottom: '12px' }} />
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Click to upload image</span>
                          </>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={submittingAppeal}
                      style={{ width: '100%', padding: '16px', background: 'var(--cta-blue)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      {submittingAppeal ? <Loader2 className="animate-spin" size={20} /> : 'Submit Appeal'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {/* OTHER TABS OMITTED FOR BREVITY BUT KEPT IN CODE */}
          {activeTab === 'itineraries' && (
            <motion.div 
              key="itinerary" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.6rem', color: 'var(--text-dark)' }}>My Saved Wonders</h3>
                <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{itineraryItems.length} items total</span>
              </div>
              <ItineraryGrid>
                {itineraryItems.map(item => (
                  <WonderCard key={`${item.entityType}-${item.id}`}>
                    <div className="img-box" style={{ background: '#eee' }}>
                      <SmartMedia type="img" src={item.photos?.[0] || item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="badge">{item.entityType}</div>
                    </div>
                    <div className="info">
                      <h4>{item.name}</h4>
                      <div className="loc"><MapPin size={14}/> {item.location || 'Bulusan'}</div>
                      <div className="actions">
                        <button className="map" onClick={() => navigate(`/explore?search=${encodeURIComponent(item.name)}`)}>Focus Map</button>
                        <button className="remove" onClick={() => removeItem(item.id, item.entityType)}><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </WonderCard>
                ))}
              </ItineraryGrid>
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div 
              key="reviews" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 style={{ fontSize: '1.6rem', color: 'var(--text-dark)', marginBottom: '32px' }}>Your Community Contributions</h3>
              <div style={{ maxWidth: '800px' }}>
                {myReviews.map((rev, idx) => (
                  <ReviewItem key={idx}>
                    <div className="target">
                      <div style={{ width: 40, height: 40, background: '#f0f7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Compass size={20} color="var(--cta-blue)"/></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Reviewing {rev.targetType}</div>
                        <div style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{rev.targetName}</div>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{rev.date}</div>
                    </div>
                    <div className="rating">
                      {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < rev.rating ? '#f59e0b' : 'none'} color={i < rev.rating ? '#f59e0b' : '#cbd5e1'} />)}
                    </div>
                    <p className="text">"{rev.comment}"</p>
                  </ReviewItem>
                ))}
                {myReviews.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '64px', background: 'var(--surface-bg)', borderRadius: '24px' }}>
                    <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '16px' }}/>
                    <p style={{ color: '#94a3b8' }}>You haven't posted any reviews yet. Help others explore Bulusan!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 style={{ fontSize: '1.6rem', color: 'var(--text-dark)', marginBottom: '32px' }}>Profile Settings</h3>
              <div style={{ background: 'var(--surface-bg)', padding: '40px', borderRadius: '24px', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569' }}>Public Display Name</label>
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569' }}>Email Address (Verified)</label>
                    <input 
                      type="email" 
                      value={user.email} 
                      disabled 
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }} 
                    />
                  </div>
                  <button 
                    onClick={handleUpdateName}
                    style={{ padding: '16px', background: 'var(--cta-blue)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1.05rem' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </MainContent>
    </PortalContainer>
  );
}
