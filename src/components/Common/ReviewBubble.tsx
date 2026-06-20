import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { getMediaUrl } from '../../utils/mediaUtils';

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(-12px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const BubbleWrapper = styled(motion.div)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: 220px;
`;

const Bubble = styled(motion.div)`
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-radius: 16px 4px 16px 16px;
  padding: 12px 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;

  /* Speech bubble tail in top-right */
  &::after {
    content: '';
    position: absolute;
    top: -8px;
    right: 0;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-bottom: 10px solid rgba(255,255,255,0.96);
  }
`;

const BubbleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
  flex-shrink: 0;
`;

const AvatarFallback = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e75b6, #0b2147);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const AuthorName = styled.span`
  font-size: 0.75rem;
  font-weight: 800;
  color: #0b2147;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Stars = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
`;

const Comment = styled.p`
  font-size: 0.72rem;
  color: #475569;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-style: italic;
`;

interface ReviewBubbleProps {
  reviews: any[];
  isTopRated: boolean;
}

const ReviewBubble: React.FC<ReviewBubbleProps> = ({ reviews, isTopRated }) => {
  const [reviewIndex, setReviewIndex] = useState(0);
  const timerRef = useRef<any>(null);

  // Shuffle every 3s while mounted and top rated
  useEffect(() => {
    if (!isTopRated || !reviews.length) return;
    // Reset to random starting index
    setReviewIndex(Math.floor(Math.random() * reviews.length));

    timerRef.current = setInterval(() => {
      setReviewIndex(prev => (prev + 1) % reviews.length);
    }, 3000);

    return () => clearInterval(timerRef.current);
  }, [isTopRated, reviews]);

  if (!isTopRated || !reviews.length) return null;

  const review = reviews[reviewIndex];
  if (!review) return null;

  const initials = (review.author || review.userName || 'U').charAt(0).toUpperCase();
  const avatarSrc = review.avatar || review.userAvatar;

  return (
    <BubbleWrapper
      initial={{ opacity: 0, y: -10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="wait">
        <Bubble
          key={reviewIndex}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <BubbleHeader>
            {avatarSrc
              ? <Avatar src={getMediaUrl(avatarSrc)} alt={review.author} />
              : <AvatarFallback>{initials}</AvatarFallback>
            }
            <AuthorName>{review.author || review.userName || 'Visitor'}</AuthorName>
            <Stars>
              {Array.from({ length: Math.round(review.rating || 5) }).map((_, i) => (
                <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />
              ))}
            </Stars>
          </BubbleHeader>
          <Comment>"{review.comment || review.text || 'Absolutely wonderful place!'}"</Comment>
        </Bubble>
      </AnimatePresence>
    </BubbleWrapper>
  );
};

export default ReviewBubble;
