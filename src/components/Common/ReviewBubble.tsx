import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { getMediaUrl } from '../../utils/mediaUtils';

const BubbleOuter = styled(motion.div)`
  pointer-events: none;
  max-width: 200px;
  width: 200px;
`;

const Bubble = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 12px 32px rgba(11, 33, 71, 0.18), 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  border: 1px solid rgba(0,0,0,0.06);

  /* Speech bubble tail — LEFT side pointing towards the card */
  &::before {
    content: '';
    position: absolute;
    top: 18px;
    left: -10px;
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 10px solid white;
    filter: drop-shadow(-2px 0 2px rgba(0,0,0,0.04));
  }
`;
const BubbleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Avatar = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
  flex-shrink: 0;
`;

const AvatarFallback = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e75b6, #0b2147);
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const AuthorInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AuthorName = styled.div`
  font-size: 0.78rem;
  font-weight: 800;
  color: #0b2147;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Stars = styled.div`
  display: flex;
  gap: 1px;
  align-items: center;
  margin-top: 1px;
`;

const Comment = styled.p`
  font-size: 0.75rem;
  color: #475569;
  line-height: 1.55;
  margin: 0;
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
`;

const QuoteIcon = styled.div`
  color: #e2e8f0;
  position: absolute;
  top: 10px;
  right: 12px;
`;

interface ReviewBubbleProps {
  reviews: any[];
  isTopRated: boolean;
}

const ReviewBubble: React.FC<ReviewBubbleProps> = ({ reviews, isTopRated }) => {
  const [reviewIndex, setReviewIndex] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isTopRated || !reviews.length) return;
    setReviewIndex(Math.floor(Math.random() * reviews.length));

    timerRef.current = setInterval(() => {
      setReviewIndex(prev => (prev + 1) % reviews.length);
    }, 1500);

    return () => clearInterval(timerRef.current);
  }, [isTopRated, reviews]);

  if (!isTopRated || !reviews.length) return null;

  const review = reviews[reviewIndex];
  if (!review) return null;

  const commentText = review.comment || review.text || '';
  if (!commentText) return null;

  const initials = (review.author || review.userName || 'U').charAt(0).toUpperCase();
  const avatarSrc = review.avatar || review.userAvatar;

  return (
    <BubbleOuter
      initial={{ opacity: 0, y: -12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="wait">
        <Bubble
          key={reviewIndex}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <QuoteIcon><Quote size={18} /></QuoteIcon>
          <BubbleHeader>
            {avatarSrc
              ? <Avatar src={getMediaUrl(avatarSrc)} alt={review.author} />
              : <AvatarFallback>{initials}</AvatarFallback>
            }
            <AuthorInfo>
              <AuthorName>{review.author || review.userName || 'Visitor'}</AuthorName>
              <Stars>
                {Array.from({ length: Math.round(review.rating || 5) }).map((_, i) => (
                  <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" />
                ))}
              </Stars>
            </AuthorInfo>
          </BubbleHeader>
          <Comment>"{commentText}"</Comment>
        </Bubble>
      </AnimatePresence>
    </BubbleOuter>
  );
};

export default ReviewBubble;
