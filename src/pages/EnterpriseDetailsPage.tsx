import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Search, MapPin, Heart, Star, X, Clock, DollarSign, Info, Sparkles, Award, TrendingUp, Users, Zap, Tag } from 'lucide-react';
import { Enterprise, Review } from '../data/types';
import GalleryWithThumbnails from '../components/Common/GalleryWithThumbnails';
import StarRating from '../components/Common/StarRating';
import AuthGuardPopup from '../components/Common/AuthGuardPopup';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../api/db';
import { apiClient } from '../api/client';
import { getDynamicTags } from '../utils/tagUtils';
import { useAlert } from '../components/Common/AlertProvider';

const PageContainer = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: var(--surface-bg);
  z-index: 2000;
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    overflow-y: auto;
    z-index: 2100;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 32px;
  right: 60px;
  background: var(--surface-bg);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: var(--text-dark);
  padding: 10px 20px;
  border-radius: 30px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);

  &:hover {
    background: var(--soft-blue);
    color: var(--cta-blue);
  }

  @media (max-width: 1024px) {
    top: 16px;
    right: 20px;
    position: fixed;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 32px 60px 40px;
  overflow: hidden; /* Prevent body scroll on desktop */
  
  @media (max-width: 1024px) {
    padding: 70px 20px 20px;
    overflow: visible;
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 24px;
  flex-shrink: 0;
  
  h2 {
    font-size: 3rem;
    color: var(--dark-blue);
    font-family: 'Outfit', sans-serif;
    margin: 0 0 16px 0;
    line-height: 1.1;
    
    @media (max-width: 768px) {
      font-size: 2.2rem;
    }
  }
`;

const DetailTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  
  .tag-pill {
    background: #f0f7ff;
    color: var(--cta-blue);
    padding: 8px 18px;
    border-radius: 30px;
    font-size: 0.85rem;
    font-weight: 800;
    border: 1px solid rgba(46, 117, 182, 0.1);
    box-shadow: 0 4px 12px rgba(46, 117, 182, 0.05);
  }
  
  .dynamic-pill {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
  }
`;

const SplitLayout = styled.div`
  display: flex;
  gap: 40px;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    overflow: visible;
  }
`;

const LeftColumn = styled.div`
  flex: 1.8;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;
`;

const DetailsScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 20px;
  padding-bottom: 20px;
  
  &::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }

  @media (max-width: 1024px) {
    overflow-y: visible;
    padding-right: 0;
    padding-bottom: 0;
  }
`;

const MediaSection = styled.div`
  width: 100%;
  flex-shrink: 0;
`;

const RightColumn = styled.div`
  flex: 1.2;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 24px;
  padding-right: 20px;

  &::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }

  @media (max-width: 1024px) {
    overflow-y: visible;
    padding-right: 0;
  }
`;

const InfoCard = styled.div<{ $glass?: boolean, $highlight?: boolean }>`
  background: ${(props) => props.$highlight ? 'var(--highlight-bg, #fffbeb)' : props.$glass ? 'rgba(255, 255, 255, 0.05)' : 'var(--surface-bg)'};
  border: 1px solid ${(props) => props.$highlight ? 'var(--highlight-border, #fde68a)' : 'rgba(148, 163, 184, 0.1)'};
  padding: 32px;
  border-radius: 24px;
  box-shadow: ${(props) => props.theme.shadows.soft};
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 16px;
    color: var(--dark-blue);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  p {
    font-size: 1rem;
    line-height: 1.7;
    color: ${(props) => props.theme.colors.textDark};
    opacity: 0.85;
  }
`;

const SwitcherHeader = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  background: var(--surface-bg);
  padding: 8px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
`;

const SwitchButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px;
  background: ${p => p.$active ? 'var(--cta-blue)' : 'rgba(148, 163, 184, 0.05)'};
  color: ${p => p.$active ? 'white' : 'var(--text-light)'};
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${p => p.$active ? 'var(--cta-blue)' : 'rgba(148, 163, 184, 0.1)'};
    color: ${p => p.$active ? 'white' : 'var(--dark-blue)'};
  }
`;

const OfferItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--surface-bg);
  border: 1px solid rgba(0,0,0,0.05);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);

  img {
    width: 60px; height: 60px;
    border-radius: 12px;
    object-fit: cover;
  }

  .offer-details {
    flex: 1;
    .name { font-weight: 700; color: var(--text-dark); margin-bottom: 4px; }
    .price { font-weight: 900; color: var(--cta-blue); }
  }
`;

const ActionButtonsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

const ActionButton = styled.button<{ $primary?: boolean, $success?: boolean }>`
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  font-weight: 800;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  background: ${p => p.$success ? '#10b981' : p.$primary ? 'var(--dark-blue)' : 'var(--light-bg)'};
  color: ${p => (p.$primary || p.$success) ? 'var(--surface-bg)' : 'var(--text-dark)'};
  border: ${p => (p.$primary || p.$success) ? 'none' : '1px solid rgba(148, 163, 184, 0.2)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }
`;


const EnterpriseDetailsPage = ({ item: selectedItem, onClose }: { item: any, onClose: () => void }) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showAlert } = useAlert();
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
  const [authAction, setAuthAction] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [itinerary, setItinerary] = useState<number[]>([]);
  const [item, setItem] = useState(selectedItem);
  const [activeTab, setActiveTab] = useState<'reviews' | 'offers'>('reviews');

  useEffect(() => {
    setItem(selectedItem);
  }, [selectedItem]);

  useEffect(() => {
    if (user) setItinerary(user.itinerary || []);
  }, [user]);

  if (!selectedItem) return null;

  const toggleItinerary = async (baseId: number) => {
    const itemId = baseId + 1000000; // Enterprise Offset to avoid ID collision with Attractions
    if (!user) {
      setAuthAction('save this to your itinerary');
      setIsAuthPopupOpen(true);
      return;
    }
    const newItinerary = user.itinerary.includes(itemId)
      ? user.itinerary.filter(iid => iid !== itemId)
      : [...user.itinerary, itemId];

    try {
      await updateUser({ itinerary: newItinerary });
      setItinerary(newItinerary);
    } catch (err) {
      console.error("Failed to update itinerary", err);
    }
  };

  // Limit photos to 4
  const allAvailablePhotos = [selectedItem.img, ...(selectedItem.photos || [])].filter(Boolean);
  const uniquePhotos = Array.from(new Set(allAvailablePhotos));
  const limitedGallery = uniquePhotos.slice(0, 4);

  return (
    <PageContainer
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <CloseButton onClick={onClose}>
         <X size={18} /> Close
      </CloseButton>

      <ContentWrapper>
        <HeaderSection>
           <h2>{selectedItem.name}</h2>
           {(selectedItem.tags?.length > 0 || getDynamicTags(selectedItem, []).length > 0) && (
              <DetailTags>
                {/* Category tags */}
                {(Array.isArray(selectedItem.categories) ? selectedItem.categories : [selectedItem.categories]).filter(Boolean).map((cat: string) => (
                  <span key={cat} className="tag-pill" style={{ background: 'var(--cta-blue)', color: 'white' }}>
                    {cat}
                  </span>
                ))}
              
                {/* Dynamic/System tags */}
                {getDynamicTags(selectedItem, []).map((tag: string) => {
                   let Icon = Star;
                   let bgGradient = 'rgba(255, 215, 0, 0.3)';
                   let textCol = 'var(--cta-blue)';
                   
                   if (tag === 'New') { Icon = Zap; bgGradient = 'linear-gradient(135deg, #10b981, #059669)'; textCol = 'white'; }
                   else if (tag === 'Top Rated') { Icon = Star; bgGradient = 'linear-gradient(135deg, #f59e0b, #d97706)'; textCol = 'white'; }
                   else if (tag === 'Trending') { Icon = TrendingUp; bgGradient = 'linear-gradient(135deg, #ef4444, #dc2626)'; textCol = 'white'; }
                   else if (tag === 'Featured') { Icon = Award; bgGradient = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; textCol = 'white'; }
                   else if (tag === 'Most Visited') { Icon = Users; bgGradient = 'linear-gradient(135deg, #8b5cf6, #6d28d9)'; textCol = 'white'; }

                   return (
                     <span key={tag} className="tag-pill dynamic-pill" style={{ background: bgGradient, color: textCol, border: 'none', textShadow: 'none' }}>
                        <Icon size={12} style={{ display: 'inline', marginRight: 4, fill: tag === 'Top Rated' || tag === 'New' ? 'white' : 'none' }} /> {tag.toUpperCase()}
                     </span>
                   );
                })}
                
                {/* Custom tags */}
                {selectedItem.tags?.map((tag: string) => (
                  <span key={tag} className="tag-pill">
                    #{tag.toUpperCase()}
                  </span>
                ))}
              </DetailTags>
           )}
        </HeaderSection>

        <SplitLayout>
          {/* LEFT COLUMN: Media (Blue) & Details (Yellow) */}
          <LeftColumn>
             {/* Media Section */}
             <MediaSection>
               <GalleryWithThumbnails
                 images={limitedGallery}
                 videoUrl={selectedItem.videoUrl}
               />
             </MediaSection>

             {/* Details Section (Yellow) */}
             <DetailsScrollArea>
               <InfoCard $highlight>
                  <h3><Info size={22} color="#d97706" /> Details & Actions</h3>
                  
                  <p style={{ color: '#92400e', fontWeight: 500 }}>{selectedItem.description}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <MapPin size={24} color="#d97706" />
                         <div>
                           <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Location</div>
                           <div style={{ fontWeight: 700, color: '#78350f' }}>{selectedItem.location}</div>
                         </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <Clock size={24} color="#d97706" />
                         <div>
                           <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Operating Hours</div>
                           <div style={{ fontWeight: 700, color: '#78350f' }}>{selectedItem.metadata?.hours || 'Not specified'}</div>
                         </div>
                      </div>
                  </div>

                  <ActionButtonsGrid>
                    <ActionButton onClick={() => {
                      navigate(`/explore?lat=${selectedItem.lat ?? selectedItem.coordinates?.lat}&lng=${selectedItem.lng ?? selectedItem.coordinates?.lng}&name=${encodeURIComponent(selectedItem.name)}&autoRoute=true`);
                    }}>
                      <MapPin size={18}/> View on Map
                    </ActionButton>
                    
                    <ActionButton 
                      $primary={!itinerary.includes(selectedItem.id + 1000000)} 
                      $success={itinerary.includes(selectedItem.id + 1000000)}
                      onClick={() => toggleItinerary(selectedItem.id)}
                    >
                      <Heart size={18} fill={itinerary.includes(selectedItem.id + 1000000) ? 'white' : 'none'} />
                      {itinerary.includes(selectedItem.id + 1000000) ? 'Saved' : 'Save Landmark'}
                    </ActionButton>
                    
                    {selectedItem.metadata?.website && (
                       <ActionButton $primary as="a" href={selectedItem.metadata.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          Official Site
                       </ActionButton>
                    )}
                  </ActionButtonsGrid>

               </InfoCard>
             </DetailsScrollArea>
          </LeftColumn>

          {/* RIGHT COLUMN: Reviews & Offers (Red) */}
          <RightColumn>
             {/* Always show switcher for Enterprises */}
             <SwitcherHeader>
                <SwitchButton 
                  $active={activeTab === 'reviews'} 
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews
                </SwitchButton>
                <SwitchButton 
                  $active={activeTab === 'offers'} 
                  onClick={() => setActiveTab('offers')}
                >
                  Offers & Menu
                </SwitchButton>
             </SwitcherHeader>

             {/* OFFERS TAB CONTENT */}
             {activeTab === 'offers' && (
                <InfoCard>
                  <h3><Tag size={22} color="var(--cta-blue)" /> Available Offers</h3>
                  {selectedItem.offers && selectedItem.offers.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {selectedItem.offers.map((offer: any) => (
                              <OfferItem key={offer.id}>
                                  {offer.image && <img loading="lazy" src={offer.image} alt={offer.name} />}
                                  <div className="offer-details">
                                      <div className="name">{offer.name}</div>
                                      <div className="price">PHP {offer.price}</div>
                                  </div>
                              </OfferItem>
                          ))}
                      </div>
                  ) : (
                      <p>Contact the enterprise or visit their official website for rates.</p>
                  )}
                </InfoCard>
             )}

             {/* REVIEWS TAB CONTENT */}
             {activeTab === 'reviews' && (
                <InfoCard>
                   <h3><Star size={20} color="#f59e0b" fill="#f59e0b" /> Community Reviews</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {item.reviews && item.reviews.length > 0 ? (
                      item.reviews.map((review: any) => (
                        <div key={review.id} style={{ background: 'rgba(148, 163, 184, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                            <img loading="lazy" src={review.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="Reviewer" />
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-dark)' }}>{review.author}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                {review.date ? new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              </div>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.85rem', opacity: 0.8, color: 'var(--text-dark)' }}>"{review.comment}"</p>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.9rem', opacity: 0.5, fontStyle: 'italic', color: 'var(--text-light)' }}>No reviews yet. Be the first to share!</p>
                    )}
                  </div>

                  <div style={{ marginTop: '24px', background: 'rgba(148, 163, 184, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <StarRating rating={newRating} editable onChange={setNewRating} size={20} />
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', marginTop: '8px', color: 'var(--text-dark)' }}
                        />
                      </div>
                      <button
                        disabled={submitting}
                        onClick={async () => {
                          if (!user) { setAuthAction('post review'); setIsAuthPopupOpen(true); return; }
                          if (newRating === 0) return showAlert('Validation Error', 'Please select a star rating first.', 'error');
                          setSubmitting(true);
                          try {
                            const reviewPayload = {
                              author: user.name,
                              avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
                              rating: newRating,
                              comment: newComment,
                            };
                            const newReview = await apiClient.post(`/reviews/enterprise/${item.id}`, reviewPayload);
                            setItem((prev: any) => ({ ...prev, reviews: [...(prev.reviews || []), newReview] }));
                            setNewComment(''); setNewRating(0);
                          } catch (err) { showAlert('Error', 'Failed to post review. Please try again.', 'error'); } finally { setSubmitting(false); }
                        }}
                        style={{ background: 'var(--cta-blue)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </InfoCard>
             )}
          </RightColumn>
        </SplitLayout>
      </ContentWrapper>

      <AuthGuardPopup
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        actionName={authAction}
      />
    </PageContainer>
  );
};

export default EnterpriseDetailsPage;
