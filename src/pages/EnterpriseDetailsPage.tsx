import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Heart, Star, X, Clock, Phone, Globe, MessageSquare, Coffee } from 'lucide-react';
import StarRating from '../components/Common/StarRating';
import AuthGuardPopup from '../components/Common/AuthGuardPopup';
import OfferCapsule from '../components/Common/OfferCapsule';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { useAlert } from '../components/Common/AlertProvider';
import { getMediaUrl } from '../utils/mediaUtils';
import { getDynamicTags } from '../utils/tagUtils';

// ─── STYLES ─────────────────────────────────────────────────────────────────
const PageContainer = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(15, 23, 42, 0.85); /* Darkened backdrop */
  backdrop-filter: blur(12px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const CardWrapper = styled(motion.div)`
  width: 100%;
  max-width: 650px;
  max-height: 90vh;
  background: #1e293b; /* Sleek dark surface bg */
  border-radius: 24px;
  overflow-y: auto;
  box-shadow: 0 30px 80px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  position: relative;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

  @media (max-width: 768px) {
    max-height: 95vh;
    border-radius: 24px 24px 0 0;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  z-index: 50;
  transition: all 0.2s;
  &:hover { background: rgba(239, 68, 68, 0.8); border-color: transparent; }
`;

const PreviewImageArea = styled.div`
  width: 100%;
  height: 300px;
  position: relative;
  flex-shrink: 0;
  img { width: 100%; height: 100%; object-fit: cover; }
  &::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 120px;
    background: linear-gradient(to top, #1e293b 0%, transparent 100%);
  }
`;

const PreviewCatBadge = styled.span`
  position: absolute;
  top: 16px; left: 16px;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 0.75rem; font-weight: 800;
  padding: 6px 14px; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.5px;
  border: 1px solid rgba(255,255,255,0.1);
  z-index: 10;
`;

const PreviewBody = styled.div`
  padding: 0 28px 32px;
  margin-top: -20px;
  position: relative;
  z-index: 20;
`;

const PreviewName = styled.h2`
  font-size: 2rem;
  font-weight: 900;
  color: white;
  margin: 0 0 8px;
  font-family: ${p => p.theme.fonts.heading};
  line-height: 1.1;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
`;

const PreviewLocation = styled.div`
  display: flex; align-items: center; gap: 6px;
  color: #94a3b8; font-size: 0.95rem; font-weight: 600;
  margin-bottom: 20px;
`;

const PreviewDivider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255,255,255,0.08);
  margin: 20px 0;
`;

const PreviewInfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const PreviewRowIcon = styled.div`
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  display: flex; align-items: center; justify-content: center;
  color: var(--cta-blue);
  flex-shrink: 0;
`;

const PreviewRowContent = styled.div`
  flex: 1;
  .label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .value { font-size: 0.95rem; font-weight: 600; color: #f8fafc; line-height: 1.5; }
`;

const TagsPreview = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px;
  span {
    background: rgba(46,117,182,0.15);
    color: #60a5fa;
    border: 1px solid rgba(46,117,182,0.3);
    font-size: 0.75rem; font-weight: 700;
    padding: 4px 12px; border-radius: 20px;
  }
`;

const DescriptionBlock = styled.div`
  background: rgba(255,255,255,0.03);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255,255,255,0.05);
  margin-top: 24px;
  
  .desc-label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
  .desc-text { font-size: 0.95rem; color: #cbd5e1; line-height: 1.7; opacity: 0.9; }
`;

const ActionButtonsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled.button<{ $primary?: boolean, $success?: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  font-weight: 800;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  background: ${p => p.$success ? 'linear-gradient(135deg, #10b981, #059669)' : p.$primary ? 'linear-gradient(135deg, var(--cta-blue), var(--primary-blue))' : 'rgba(255,255,255,0.08)'};
  color: white;
  border: ${p => (p.$primary || p.$success) ? 'none' : '1px solid rgba(255,255,255,0.1)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    background: ${p => !p.$primary && !p.$success && 'rgba(255,255,255,0.15)'};
  }
`;

// Reviews
const ReviewsBlock = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.08);

  h3 {
    font-size: 1.1rem;
    color: white;
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 16px;
    font-weight: 800;
  }
`;

const ReviewItem = styled.div`
  background: rgba(255,255,255,0.03);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 12px;

  .r-header {
    display: flex; gap: 12px; margin-bottom: 8px; align-items: center;
  }
  img { width: 32px; height: 32px; border-radius: 50%; }
  .r-author { font-weight: 700; font-size: 0.85rem; color: #f8fafc; }
  .r-date { font-size: 0.7rem; color: #64748b; }
  p { font-size: 0.85rem; color: #cbd5e1; line-height: 1.5; margin-top: 4px; }
`;

const ReviewInputBlock = styled.div`
  margin-top: 16px;
  background: rgba(255,255,255,0.03);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: white;
  margin-top: 8px;
  &::placeholder { color: #64748b; }
`;

// ─── COMPONENT ──────────────────────────────────────────────────────────────
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

  useEffect(() => { setItem(selectedItem); }, [selectedItem]);
  useEffect(() => { if (user) setItinerary(user.itinerary || []); }, [user]);

  if (!selectedItem) return null;

  const thumbnail = getMediaUrl(selectedItem.img || (selectedItem.photos && selectedItem.photos[0]));

  const toggleItinerary = async (baseId: number) => {
    const itemId = baseId + 1000000;
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

  const handlePostReview = async () => {
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
    } catch (err) { 
      showAlert('Error', 'Failed to post review. Please try again.', 'error'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const dynamicTags = getDynamicTags(item, []);

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <CardWrapper
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <CloseButton onClick={onClose}><X size={20} /></CloseButton>

        <PreviewImageArea>
          {thumbnail && <img src={thumbnail} alt="Enterprise preview" />}
          {item.categories?.[0] && (
            <PreviewCatBadge>{item.categories[0]}</PreviewCatBadge>
          )}
        </PreviewImageArea>

        <PreviewBody>
          <PreviewName>{item.name}</PreviewName>
          
          <PreviewLocation>
            <MapPin size={16} />
            {item.location}
          </PreviewLocation>

          <PreviewInfoBlock>
            {/* Rates */}
            {item.rates && (
              <PreviewRow>
                <PreviewRowIcon><Coffee size={18} /></PreviewRowIcon>
                <PreviewRowContent>
                  <div className="label">Rates / Packages</div>
                  <div className="value" style={{ whiteSpace: 'pre-line' }}>{item.rates}</div>
                </PreviewRowContent>
              </PreviewRow>
            )}

            {/* Offers */}
            {item.offers && item.offers.length > 0 && (
              <PreviewRow>
                <PreviewRowContent style={{ width: '100%' }}>
                  <div className="label">Offers</div>
                  <div style={{ marginTop: '8px' }}>
                    {item.offers.map((o: any) => (
                      <OfferCapsule key={o.id || o.name} offer={o} />
                    ))}
                  </div>
                </PreviewRowContent>
              </PreviewRow>
            )}

            {/* Operating Hours */}
            {item.metadata?.hours && (
              <PreviewRow>
                <PreviewRowIcon><Clock size={18} /></PreviewRowIcon>
                <PreviewRowContent>
                  <div className="label">Operating Hours</div>
                  <div className="value">{item.metadata.hours}</div>
                </PreviewRowContent>
              </PreviewRow>
            )}

            {/* Contact */}
            {item.metadata?.contact && (
              <PreviewRow>
                <PreviewRowIcon><Phone size={18} /></PreviewRowIcon>
                <PreviewRowContent>
                  <div className="label">Contact</div>
                  <div className="value">{item.metadata.contact}</div>
                </PreviewRowContent>
              </PreviewRow>
            )}

            {/* Website */}
            {item.metadata?.website && (
              <PreviewRow>
                <PreviewRowIcon><Globe size={18} /></PreviewRowIcon>
                <PreviewRowContent>
                  <div className="label">Website</div>
                  <a 
                    href={item.metadata.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}
                  >
                    Official Site
                  </a>
                </PreviewRowContent>
              </PreviewRow>
            )}
          </PreviewInfoBlock>

          {/* Tags */}
          {(item.tags?.length > 0 || dynamicTags.length > 0) && (
            <TagsPreview>
              {dynamicTags.map((t: string) => <span key={t}>{t}</span>)}
              {item.tags?.map((t: string) => <span key={t}>#{t}</span>)}
            </TagsPreview>
          )}

          {/* Description */}
          {item.description && (
            <DescriptionBlock>
              <div className="desc-label">Description</div>
              <div className="desc-text">{item.description}</div>
            </DescriptionBlock>
          )}

          {/* Amenities */}
          {item.amenities && item.amenities.length > 0 && (
            <DescriptionBlock>
              <div className="desc-label">Amenities</div>
              <div className="desc-text">
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {item.amenities.map((amenity: string, i: number) => (
                    <li key={i}>{amenity}</li>
                  ))}
                </ul>
              </div>
            </DescriptionBlock>
          )}

          {/* Action Buttons */}
          <ActionButtonsGrid>
            <ActionButton $primary onClick={() => {
              navigate(`/explore?lat=${item.lat ?? item.coordinates?.lat}&lng=${item.lng ?? item.coordinates?.lng}&name=${encodeURIComponent(item.name)}&autoRoute=true`);
            }}>
              <MapPin size={18}/> View on Map
            </ActionButton>
            
            <ActionButton 
              $success={itinerary.includes(item.id + 1000000)}
              onClick={() => toggleItinerary(item.id)}
            >
              <Heart size={18} fill={itinerary.includes(item.id + 1000000) ? 'white' : 'none'} />
              {itinerary.includes(item.id + 1000000) ? 'Saved' : 'Save Landmark'}
            </ActionButton>
          </ActionButtonsGrid>

          {/* Reviews */}
          <ReviewsBlock>
            <h3><MessageSquare size={18} color="#60a5fa" /> Community Reviews</h3>
            
            {item.reviews && item.reviews.length > 0 ? (
              item.reviews.map((review: any) => (
                <ReviewItem key={review.id}>
                  <div className="r-header">
                    <img loading="lazy" src={review.avatar} alt="Reviewer" />
                    <div>
                      <div className="r-author">{review.author}</div>
                      <div className="r-date">
                        {review.date ? new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size={14} />
                  <p>"{review.comment}"</p>
                </ReviewItem>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                No reviews yet. Be the first to share your experience!
              </p>
            )}

            <ReviewInputBlock>
              <div style={{ flex: 1 }}>
                <StarRating rating={newRating} editable onChange={setNewRating} size={18} />
                <StyledInput
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>
              <button
                disabled={submitting}
                onClick={handlePostReview}
                style={{
                  background: 'var(--cta-blue)', color: 'white', border: 'none',
                  padding: '10px 16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer'
                }}
              >
                Post
              </button>
            </ReviewInputBlock>
          </ReviewsBlock>

        </PreviewBody>
      </CardWrapper>

      <AuthGuardPopup
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        actionName={authAction}
      />
    </PageContainer>
  );
};

export default EnterpriseDetailsPage;
