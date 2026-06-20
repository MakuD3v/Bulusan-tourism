import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Star, MapPin, Zap, TrendingUp, Award, Users } from 'lucide-react';
import { getMapIconUrl } from '../Admin/CategoryTagConfig';
import { getMediaUrl } from '../../utils/mediaUtils';
import ReviewBubble from './ReviewBubble';

const CardContainer = styled(motion.div)<{ $bg: string }>`
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background-image: url(${props => props.$bg});
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(11, 33, 71, 0.95) 0%, rgba(11, 33, 71, 0.4) 60%, transparent 100%);
    z-index: 1;
  }

  .content-z {
    z-index: 2;
    position: relative;
  }

  .cat-pill {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3);
    padding: 6px 14px;
    border-radius: 30px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;

    img { height: 16px; width: auto; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)) brightness(0) invert(1); }
  }

  .badges-wrapper {
    position: absolute;
    top: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    z-index: 2;
  }

  .badge-pill {
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(4px);
    color: white;
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 5px;

    &.badge-new { background: linear-gradient(135deg, #10b981, #059669); }
    &.badge-top { background: linear-gradient(135deg, #f59e0b, #d97706); }
    &.badge-trending { background: linear-gradient(135deg, #ef4444, #dc2626); }
    &.badge-featured { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    &.badge-visited { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    
    svg { color: white; }
  }

  .row-items {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    font-size: 1rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }

  h3 {
    font-size: 1.8rem;
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    margin-bottom: 8px;
    line-height: 1.1;
    color: white !important; /* Explicitly enforce white to override global h3 styles */
  }

  .location {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.9);
    margin-bottom: 8px;
    font-weight: 500;
  }

  p {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.7);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }
`;

interface FeaturedCarouselCardProps {
  item: any;
  badge?: string;
  badges?: string[];
  categoryName: string;
  onClick: () => void;
  reviews?: any[];
  isTopRated?: boolean;
}

const FeaturedCarouselCard: React.FC<FeaturedCarouselCardProps> = ({ item, badge, badges = [], categoryName, onClick, reviews = [], isTopRated = false }) => {
  return (
    <CardContainer 
      $bg={getMediaUrl(item.photos?.[0] || item.img)}
      onClick={onClick}
    >
      {/* Floating review bubble — only for top rated */}
      <ReviewBubble reviews={reviews} isTopRated={isTopRated} />
      <div className="badges-wrapper">
        {(!badges || badges.length === 0) && (
          <>
            {badge === 'new' && (
              <div className="badge-pill badge-new">
                <Zap size={11} fill="white" /> New
              </div>
            )}
            {badge === 'top' && (
              <div className="badge-pill badge-top">
                <Star size={11} fill="white" /> Top Rated
              </div>
            )}
            {badge === 'trending' && (
              <div className="badge-pill badge-trending">
                <TrendingUp size={11} /> Trending
              </div>
            )}
            {badge === 'featured' && (
              <div className="badge-pill badge-featured">
                <Award size={11} /> Featured
              </div>
            )}
            {badge === 'most-visited' && (
              <div className="badge-pill badge-visited">
                <Users size={11} /> Most Visited
              </div>
            )}
          </>
        )}

        {badges?.map(tag => {
          let Icon = Star;
          let badgeClass = 'badge-pill badge-top';
          if (tag === 'New') { Icon = Zap; badgeClass = 'badge-pill badge-new'; }
          else if (tag === 'Top Rated') { Icon = Star; badgeClass = 'badge-pill badge-top'; }
          else if (tag === 'Trending') { Icon = TrendingUp; badgeClass = 'badge-pill badge-trending'; }
          else if (tag === 'Featured') { Icon = Award; badgeClass = 'badge-pill badge-featured'; }
          else if (tag === 'Most Visited') { Icon = Users; badgeClass = 'badge-pill badge-visited'; }
          else return null;
          
          return (
            <div key={tag} className={badgeClass}>
                <Icon size={11} fill={tag === 'Top Rated' || tag === 'New' ? 'white' : 'currentColor'} /> {tag}
            </div>
          );
        })}
      </div>
      <div className="content-z">
        <div className="row-items">
          <div className="cat-pill">
             <img src={getMapIconUrl(categoryName)} alt={categoryName} />
             {categoryName}
          </div>
          {item.rating && (
            <div className="rating">
              <Star size={16} fill="currentColor" color="#fbbf24" /> {item.rating}
            </div>
          )}
        </div>
        <h3>{item.name}</h3>
        {item.location && (
           <div className="location">
             <MapPin size={14} /> {item.location}
           </div>
        )}
        <p>{item.description}</p>
      </div>
    </CardContainer>
  );
};

export default FeaturedCarouselCard;
