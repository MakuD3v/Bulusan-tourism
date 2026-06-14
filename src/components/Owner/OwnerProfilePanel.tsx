import React, { useState, useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Camera, Save, Loader2, CheckCircle2, 
  MapPin, Settings, Award, Heart, MessageSquare, 
  Compass, LayoutDashboard, Star, ExternalLink, Trash2, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { useAttractions, useEnterprises, useHeritage } from '../../hooks/useData';
import SmartMedia from '../Common/SmartMedia';
import { TourBooking } from '../../data/types';
import { bookingService } from '../../utils/bookingService';
import { useAlert } from '../Common/AlertProvider';

const Wrap = styled.div`
  max-width: 1000px;
`;

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

// Owner settings styles
const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 40px;
  padding: 28px;
  background: rgba(8, 20, 48, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
`;

const AvatarRing = styled.div`
  position: relative;
  width: 90px;
  height: 90px;
  flex-shrink: 0;

  .avatar-img {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    object-fit: cover;
    background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    font-weight: 800;
    color: white;
    border: 2px solid rgba(144, 205, 244, 0.25);
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  .upload-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #2b6cb0;
    border: 2px solid #050d20;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: background 0.2s;

    &:hover { background: #3182ce; }
  }
`;

const AvatarMeta = styled.div`
  .name {
    font-size: 1.3rem;
    font-weight: 800;
    color: #e2ecf7;
    margin-bottom: 4px;
  }
  .email {
    font-size: 0.88rem;
    color: #5a7098;
    margin-bottom: 12px;
  }
  .hint {
    font-size: 0.78rem;
    color: #2d4070;
  }
`;

const FieldGroup = styled.div`
  margin-bottom: 24px;

  label {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #3d5a8a;
    margin-bottom: 10px;
  }

  .input-wrap {
    position: relative;

    svg {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #2d4070;
      pointer-events: none;
    }

    input {
      width: 100%;
      background: rgba(8, 20, 48, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 14px 16px 14px 46px;
      color: #c8d9f0;
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.2s;

      &::placeholder { color: #2d4070; }

      &:focus {
        outline: none;
        border-color: rgba(144, 205, 244, 0.3);
        background: rgba(8, 20, 48, 0.7);
        box-shadow: 0 0 0 4px rgba(43, 108, 176, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
`;

const SaveBtn = styled(motion.button)`
  padding: 14px 32px;
  background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(26, 54, 93, 0.5);
  }

  &:disabled { opacity: 0.6; cursor: wait; }
`;

const SuccessBanner = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: rgba(52, 211, 153, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 12px;
  color: #34d399;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 28px;
`;

const OwnerProfilePanel: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'settings' | 'overview' | 'itineraries' | 'tours' | 'reviews'>('settings');

  const { data: attractions } = useAttractions([]);
  const { data: enterprises } = useEnterprises([]);
  const { data: heritage } = useHeritage([]);
  
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null);

  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!user) return;
    bookingService.getAll().then(all => {
      setBookings(all.filter(b => b.userId === user.id).sort((a,b) => b.createdAt - a.createdAt));
      setLoadingBookings(false);
    }).catch(() => setLoadingBookings(false));
  }, [user]);

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

  if (!user) return null;

  const explorerPoints = (itineraryItems.length * 10) + (myReviews.length * 50);

  const removeItem = async (baseId: number, entityType: string) => {
    showConfirm('Remove from Itinerary', 'Remove this place from your itinerary?', async () => {
      const globalId = entityType === 'Enterprise' ? baseId + 1000000 
                     : entityType === 'Heritage' ? baseId + 2000000 
                     : baseId;
      const newItinerary = (user?.itinerary || []).filter(iid => String(iid) !== String(globalId));
      try {
        await updateUser({ itinerary: newItinerary } as any);
      } catch (err) { console.error(err); }
    });
  };

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'OW';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await apiClient.upload(file);
      if (res.url) {
        setAvatarPreview(res.url);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateUser({ name, avatar: avatarPreview ?? undefined } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap>
      <TabNav>
        <TabBtn $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}><Settings size={18} /> Profile Settings</TabBtn>
        <TabBtn $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><LayoutDashboard size={18} /> Explorer Overview</TabBtn>
        <TabBtn $active={activeTab === 'itineraries'} onClick={() => setActiveTab('itineraries')}><Compass size={18} /> Saved Wonders</TabBtn>
        <TabBtn $active={activeTab === 'tours'} onClick={() => setActiveTab('tours')}><MapPin size={18} /> My Bookings</TabBtn>
        <TabBtn $active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}><MessageSquare size={18} /> Contributions</TabBtn>
      </TabNav>

      <AnimatePresence mode="wait">
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {saved && (
              <SuccessBanner initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <CheckCircle2 size={18} /> Profile updated successfully!
              </SuccessBanner>
            )}

            <AvatarSection>
              <AvatarRing>
                <div className="avatar-img">
                  {avatarPreview ? <img src={avatarPreview} alt={name} /> : initials}
                </div>
                <div className="upload-btn" onClick={() => fileInputRef.current?.click()} title="Change avatar">
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </AvatarRing>
              <AvatarMeta>
                <div className="name">{user?.name}</div>
                <div className="email">{user?.email}</div>
                <div className="hint">Click the camera icon to change your avatar</div>
              </AvatarMeta>
            </AvatarSection>

            <FieldGroup>
              <label>Display Name</label>
              <div className="input-wrap">
                <User size={17} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
            </FieldGroup>

            <FieldGroup>
              <label>Email Address</label>
              <div className="input-wrap">
                <Mail size={17} />
                <input type="email" value={user?.email ?? ''} disabled placeholder="email@example.com" />
              </div>
            </FieldGroup>

            <SaveBtn onClick={handleSave} disabled={saving} whileTap={{ scale: 0.97 }}>
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </SaveBtn>
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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

        {activeTab === 'itineraries' && (
          <motion.div key="itinerary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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

        {activeTab === 'tours' && (
          <motion.div key="tours" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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
                                            {booking.customStops.filter(s => s.dayIndex === idx).map((stop, sIdx) => (
                                              <div key={sIdx} style={{ display: 'flex', gap: '6px' }}><span style={{ color: '#3b82f6' }}>•</span> {stop.itemName}</div>
                                            ))}
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
                          </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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
      </AnimatePresence>
    </Wrap>
  );
};

export default OwnerProfilePanel;
