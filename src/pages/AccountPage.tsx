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
  Image as ImageIcon, Loader2, X, Clock, Building2
} from 'lucide-react';
import { useAttractions, useEnterprises, useHeritage } from '../hooks/useData';
import { dbService } from '../api/db';
import { apiClient } from '../api/client';
import SmartMedia from '../components/Common/SmartMedia';
import { MainHeader, ContentArea } from '../components/Layout/DashboardLayout';
import { TourBooking } from '../data/types';
import { bookingService } from '../utils/bookingService';

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
  background: rgba(255, 255, 255, 0.03);
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  .icon-box {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255, 255, 255, 0.05); color: #90cdf4;
  }
  
  .val { font-size: 1.8rem; font-weight: 800; color: #e2ecf7; }
  .label { color: #94a3b8; font-size: 0.9rem; font-weight: 600; }
`;

const ItineraryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
`;

const WonderCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  .img-box {
    height: 180px; width: 100%; overflow: hidden; position: relative;
    img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .badge { position: absolute; top: 12px; left: 12px; padding: 4px 8px; border-radius: 8px; background: rgba(0,0,0,0.7); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #fff; }
  }

  &:hover .img-box img { transform: scale(1.1); }
  
  .info {
    padding: 20px;
    h4 { font-size: 1.1rem; color: #e2ecf7; margin-bottom: 8px; }
    .loc { display: flex; align-items: center; gap: 4px; color: #94a3b8; font-size: 0.85rem; margin-bottom: 16px; }
    
    .actions {
      display: flex;
      gap: 12px;
      button {
        flex: 1; padding: 10px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s;
        &.map { background: rgba(144, 205, 244, 0.1); color: #90cdf4; &:hover { background: rgba(144, 205, 244, 0.2); } }
        &.remove { background: rgba(239, 68, 68, 0.1); color: #ef4444; &:hover { background: rgba(239, 68, 68, 0.2); } }
      }
    }
  }
`;

const ReviewItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 16px;
  
  .target { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
  .rating { color: #f59e0b; margin-bottom: 8px; display: flex; gap: 2px; }
  .text { color: #cbd5e1; line-height: 1.6; font-size: 0.95rem; }
`;

const NotificationOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(5, 13, 32, 0.8);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const NotificationCard = styled(motion.div)`
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  text-align: center;
  position: relative;
  color: #e2ecf7;

  h3 { margin: 16px 0 8px; font-size: 1.5rem; font-family: 'Outfit', sans-serif; }
  p { color: #94a3b8; font-size: 1rem; line-height: 1.6; margin-bottom: 24px; }
  .close-btn { position: absolute; top: 20px; right: 20px; background: transparent; border: none; color: #94a3b8; cursor: pointer; transition: 0.2s; &:hover { color: #fff; } }
  .action-btn { background: #3b82f6; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; width: 100%; font-size: 1.05rem; }
`;

export default function AccountPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'itineraries' | 'tours' | 'reviews' | 'settings' | 'appeal'>('overview');
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

  // Bookings state
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!user) return;
    bookingService.getAll().then(all => {
      setBookings(all.filter(b => b.userId === user.id).sort((a,b) => b.createdAt - a.createdAt));
      setLoadingBookings(false);
    }).catch(() => setLoadingBookings(false));
  }, [user]);

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
        if (res.token) localStorage.setItem('auth_token', res.token);
        if (res.user) localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        setShowNotification(false);
        window.location.href = '/owner-dashboard';
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
    <>
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
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px' }}>
                      <strong>Admin Note:</strong> {appealData.adminReply}
                    </div>
                  )}
                  <button className="action-btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={dismissNotification}>Close</button>
                </>
              )}
            </NotificationCard>
          </NotificationOverlay>
        )}
      </AnimatePresence>

      <MainHeader>
        <div>
          <h1>Explorer Hub</h1>
          <div className="meta">Welcome back, {user.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#e2ecf7' }}>{user.name}</div>
            <ExplorerRank $points={explorerPoints}>{rank}</ExplorerRank>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            <UserIcon size={24} />
          </div>
        </div>
      </MainHeader>

      <ContentArea>
        <TabNav>
          <TabBtn $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><LayoutDashboard size={18} /> Overview</TabBtn>
          <TabBtn $active={activeTab === 'itineraries'} onClick={() => setActiveTab('itineraries')}><Compass size={18} /> Saved Wonders</TabBtn>
          <TabBtn $active={activeTab === 'tours'} onClick={() => setActiveTab('tours')}><MapPin size={18} /> My Tours & Bookings</TabBtn>
          <TabBtn $active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}><MessageSquare size={18} /> Contributions</TabBtn>
          {user.role === 'USER' && (
            <TabBtn $active={activeTab === 'appeal'} onClick={() => setActiveTab('appeal')}><ShieldAlert size={18} /> Owner Appeal</TabBtn>
          )}
          <TabBtn $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}><Settings size={18} /> Settings</TabBtn>
        </TabNav>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                <StatCard>
                  <div className="icon-box"><Award size={24}/></div>
                  <div className="val">{explorerPoints.toLocaleString()}</div>
                  <div className="label">Explorer points</div>
                </StatCard>
                <StatCard>
                  <div className="icon-box" style={{ color: '#10b981' }}><Compass size={24}/></div>
                  <div className="val">{itineraryItems.length}</div>
                  <div className="label">Saved wonders</div>
                </StatCard>
                <StatCard>
                  <div className="icon-box" style={{ color: '#f59e0b' }}><MessageSquare size={24}/></div>
                  <div className="val">{myReviews.length}</div>
                  <div className="label">Real reviews</div>
                </StatCard>
              </div>

              <h3 style={{ fontSize: '1.4rem', color: '#e2ecf7', marginBottom: '24px' }}>Pinned for Adventure</h3>
              <ItineraryGrid>
                {itineraryItems.slice(0, 3).map(item => (
                  <WonderCard key={`${item.entityType}-${item.id}`} whileHover={{ y: -5 }}>
                    <div className="img-box" style={{ background: '#111' }}>
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
                   <div style={{ gridColumn: '1 / -1', padding: '64px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px', textAlign: 'center' }}>
                      <Heart size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }}/>
                      <p style={{ color: '#94a3b8', fontWeight: 600 }}>No wonders saved yet. Start your journey!</p>
                      <button onClick={() => navigate('/attractions')} style={{ marginTop: '20px', padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Browse Attractions</button>
                   </div>
                )}
              </ItineraryGrid>
            </motion.div>
          )}

          {activeTab === 'tours' && (
            <motion.div key="tours" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h3 style={{ fontSize: '1.4rem', color: '#e2ecf7', marginBottom: '24px' }}>My Tours & Bookings</h3>
              {loadingBookings ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={32} color="#3b82f6" /></div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: '64px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px', textAlign: 'center' }}>
                   <MapPin size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }}/>
                   <p style={{ color: '#94a3b8', fontWeight: 600 }}>You haven't booked any tours yet.</p>
                   <button onClick={() => navigate('/explore')} style={{ marginTop: '20px', padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Plan a Trip</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {bookings.map(booking => (
                    <div key={booking.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                           <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px',
                             background: booking.status === 'Confirmed' ? 'rgba(16,185,129,0.1)' : booking.status === 'Cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                             color: booking.status === 'Confirmed' ? '#10b981' : booking.status === 'Cancelled' ? '#ef4444' : '#f59e0b' }}>
                             {booking.status}
                           </div>
                           <h4 style={{ fontSize: '1.2rem', color: '#e2ecf7', margin: '0 0 4px' }}>{booking.routeName}</h4>
                           <div style={{ color: '#90aecb', fontSize: '0.8rem' }}>REF: {booking.id.slice(-10).toUpperCase()}</div>
                        </div>
                        {booking.status === 'Confirmed' && booking.qrCode && (
                          <div style={{ textAlign: 'center', background: 'white', padding: '8px', borderRadius: '12px' }}>
                             <div style={{ width: '80px', height: '80px', background: `url('https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${booking.qrCode}') center/cover` }}></div>
                             <div style={{ fontSize: '0.55rem', color: '#1e293b', fontWeight: 800, marginTop: '4px' }}>TICKET CODE</div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                         <div>
                            <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#5a7098', margin: '0 0 12px', letterSpacing: '1px' }}>Itinerary Schedule</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                               {booking.scheduledDates.map((date, idx) => (
                                 <div key={date} style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, height: 'fit-content' }}>Day {idx+1}</div>
                                    <div>
                                       <div style={{ color: '#e2ecf7', fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                       {booking.isCustom && booking.customStops ? (
                                         <div style={{ fontSize: '0.8rem', color: '#90aecb', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {booking.customStops.slice(idx * 3, (idx + 1) * 3).map((stop, sIdx) => (
                                              <div key={sIdx} style={{ display: 'flex', gap: '6px' }}><span style={{ color: '#3b82f6' }}>•</span> {stop.itemName}</div>
                                            ))}
                                            {booking.customStops.slice(idx * 3, (idx + 1) * 3).length === 0 && <span style={{ opacity: 0.5 }}>Rest Day / Free Time</span>}
                                         </div>
                                       ) : (
                                         <div style={{ fontSize: '0.8rem', color: '#90aecb' }}>Curated Stops for Day {idx+1}</div>
                                       )}
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div>
                            <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#5a7098', margin: '0 0 12px', letterSpacing: '1px' }}>Travel Details</h5>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Pace</span> <strong>{booking.pace || 'Moderate'}</strong></div>
                               <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Transport</span> <strong>{booking.transport || 'Vehicle'}</strong></div>
                               <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Travelers</span> <strong>{booking.travelers.total} Pax</strong></div>
                               <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Breakdown</span> <span>{booking.travelers.males}M / {booking.travelers.females}F / {booking.travelers.children}C</span></div>
                            </div>
                            
                            {booking.status === 'Confirmed' && (
                              <button onClick={() => navigate(`/explore?activeTourId=${booking.id}`)} style={{ width: '100%', marginTop: '16px', padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                 <MapPin size={16}/> Start Live Tracking
                              </button>
                            )}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'appeal' && (
            <motion.div 
              key="appeal" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h3 style={{ fontSize: '1.6rem', color: '#e2ecf7', marginBottom: '32px' }}>Enterprise Owner Appeal</h3>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '24px', maxWidth: '600px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {fetchingAppeal ? (
                   <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={32} color="#3b82f6" /></div>
                ) : appealData ? (
                   <div>
                     <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '30px', fontWeight: 800, fontSize: '0.9rem', marginBottom: '24px',
                       background: appealData.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : appealData.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                       color: appealData.status === 'APPROVED' ? '#10b981' : appealData.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                     }}>
                       {appealData.status === 'APPROVED' && <CheckCircle2 size={18}/>}
                       {appealData.status === 'REJECTED' && <X size={18}/>}
                       {appealData.status === 'PENDING' && <Clock size={18}/>}
                       STATUS: {appealData.status}
                     </div>

                     {appealData.status === 'APPROVED' && (
                       <div style={{ marginBottom: '24px' }}>
                         <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Your appeal was approved! You can now claim your Owner Badge.</p>
                         <button onClick={claimBadge} style={{ padding: '14px 28px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Claim Owner Badge</button>
                       </div>
                     )}

                     {appealData.status === 'REJECTED' && appealData.adminReply && (
                       <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                         <strong style={{ display: 'block', color: '#e2ecf7', marginBottom: '8px' }}>Admin Response:</strong>
                         <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>{appealData.adminReply}</p>
                       </div>
                     )}

                     <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>Your Submission</p>
                        <p style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>"{appealData.message}"</p>
                        <img src={appealData.image} alt="Appeal" style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', marginTop: '16px' }} />
                     </div>
                   </div>
                ) : (
                  <form onSubmit={submitAppeal}>
                    <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
                      Want to list your enterprise on Bulusan Tourism? Submit an appeal with proof of ownership (e.g., a photo of your business permit or the storefront).
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#e2ecf7' }}>Why do you want to become an owner?</label>
                      <textarea 
                        required
                        value={appealMsg}
                        onChange={e => setAppealMsg(e.target.value)}
                        placeholder="Tell us about your enterprise..."
                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', minHeight: '120px', fontSize: '1rem', outline: 'none', fontFamily: 'inherit' }}
                      />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#e2ecf7' }}>Proof of Ownership (Image)</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', height: '160px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: appealPreview ? 'transparent' : 'rgba(255,255,255,0.02)', overflow: 'hidden', position: 'relative' }}
                      >
                        {appealPreview ? (
                          <img src={appealPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <>
                            <ImageIcon size={32} color="#64748b" style={{ marginBottom: '12px' }} />
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Click to upload image</span>
                          </>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={submittingAppeal}
                      style={{ width: '100%', padding: '16px', background: '#3b82f6', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      {submittingAppeal ? <Loader2 className="animate-spin" size={20} /> : 'Submit Appeal'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'itineraries' && (
            <motion.div 
              key="itinerary" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.6rem', color: '#e2ecf7' }}>My Saved Wonders</h3>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{itineraryItems.length} items total</span>
              </div>
              <ItineraryGrid>
                {itineraryItems.map(item => (
                  <WonderCard key={`${item.entityType}-${item.id}`}>
                    <div className="img-box" style={{ background: '#111' }}>
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
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.6rem', color: '#e2ecf7' }}>My Contributions</h3>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{myReviews.length} reviews published</span>
              </div>

              {myReviews.length === 0 ? (
                <div style={{ padding: '48px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>You haven't published any reviews yet. Share your experiences to help other travelers!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {myReviews.map(r => (
                    <ReviewItem key={r.id}>
                      <div className="target">
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90cdf4' }}>
                           {r.targetType === 'Attraction' ? <MapPin size={20} /> : <Building2 size={20} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#e2ecf7' }}>{r.targetName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.date}</div>
                        </div>
                        <button onClick={() => navigate(`/attractions`)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#90cdf4', cursor: 'pointer' }}><ExternalLink size={20} /></button>
                      </div>
                      <div className="rating">
                        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < r.rating ? "currentColor" : "none"} color={i < r.rating ? "currentColor" : "#475569"} />)}
                      </div>
                      <div className="text">{r.comment}</div>
                    </ReviewItem>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h3 style={{ fontSize: '1.6rem', color: '#e2ecf7', marginBottom: '32px' }}>Account Settings</h3>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '32px', borderRadius: '24px', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Display Name</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)} 
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem', outline: 'none' }}
                    />
                    <button onClick={handleUpdateName} style={{ padding: '0 24px', borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Update</button>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Email Address</label>
                  <input type="text" value={user.email} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', color: '#64748b', fontSize: '1rem' }} />
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>Email address cannot be changed currently.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ContentArea>
    </>
  );
}
