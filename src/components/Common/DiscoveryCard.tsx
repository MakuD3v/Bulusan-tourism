import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MapPin, Star, Heart, Zap, TrendingUp, Award, Users } from 'lucide-react';
import { getMapIconUrl } from '../Admin/CategoryTagConfig';
import { getMediaUrl } from '../../utils/mediaUtils';

const CardWrapper = styled(motion.div)`
  background: var(--surface-bg);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 350px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  border: 1px solid rgba(0,0,0,0.05);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
    border-color: ${(props) => props.theme.colors.ctaBlue}44;
  }

  .image-container {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0; left: 0;
    overflow: hidden;
    z-index: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .badges-wrapper {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      z-index: 2;
    }

    .badge {

      padding: 6px 14px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 800;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      z-index: 2;
      color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      
      &.badge-new {
        background: linear-gradient(135deg, #10b981, #059669); /* Green */
      }
      
      &.badge-top {
        background: linear-gradient(135deg, #f59e0b, #d97706); /* Orange */
      }
      
      &.badge-trending {
        background: linear-gradient(135deg, #ef4444, #dc2626); /* Red */
      }
      
      /* Make sure SVG icons inside inherit the white text color and don't get forced to CTA blue */
      svg {
         color: white;
      }
    }
  }

  &:hover .image-container img {
    transform: scale(1.08);
  }

  .content {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 60px 24px 24px;
    display: flex;
    flex-direction: column;
    z-index: 2;
    background: linear-gradient(to top, rgba(11, 33, 71, 0.95) 0%, rgba(11, 33, 71, 0.6) 60%, transparent 100%);

    @media (max-width: 640px) {
      padding: 60px 16px 16px;
    }
    
    h3 {
      font-size: 1.4rem;
      color: white;
      font-family: ${(props) => props.theme.fonts.heading};
      margin-bottom: 8px;
      line-height: 1.25;
      font-weight: 800;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);

      @media (max-width: 640px) {
        font-size: 1.1rem;
        margin-bottom: 6px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .category-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .category-pill {
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: white;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
      
      img {
         height: 14px;
         width: auto;
         filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)) brightness(0) invert(1);
      }
    }
    
    .row-divider {
       color: #94a3b8;
       font-size: 0.8rem;
    }
    
    .rating-inline {
       display: flex;
       align-items: center;
       gap: 4px;
       font-weight: 800;
       font-size: 0.75rem;
       color: white;
       background: transparent;
       padding: 0;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0;
      padding-top: 0;

      .location {
        display: flex;
        align-items: center;
        gap: 6px;
        color: rgba(255,255,255,0.75);
        font-size: 0.75rem;
        font-weight: 500;

        @media (max-width: 640px) {
          font-size: 0.65rem;
        }
      }
      
      .action-icon {
        color: rgba(255,255,255,0.6);
        transition: all 0.2s;
        &:hover { color: #f43f5e; }

        @media (max-width: 640px) {
          svg { width: 14px; height: 14px; }
        }
      }
    }
  }
`;

interface DiscoveryCardProps {
  image: string;
  category: string | string[];
  title: string;
  description: string;
  location: string;
  rating?: number;
  badge?: 'new' | 'top' | 'trending' | 'featured' | 'most-visited'; // Kept for backwards compatibility
  badges?: string[]; // Array for multiple tags
  onClick?: () => void;
  index?: number;
  $noAnimate?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.5, 
      delay: index * 0.05,
      ease: [0.215, 0.61, 0.355, 1] as any // EaseOutCubic
    }
  }),
  static: { opacity: 1, scale: 1, y: 0 }
};

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  image,
  category,
  title,
  description,
  location,
  rating,
  badge,
  badges = [],
  onClick,
  index = 0,
  $noAnimate = false
}) => {
  return (
    <CardWrapper
      variants={cardVariants}
      initial={$noAnimate ? "static" : "hidden"}
      whileInView={$noAnimate ? "static" : "visible"}
      custom={index}
      viewport={{ once: true }}
      onClick={onClick}
    >
      <div className="image-container">
        <img src={getMediaUrl(image)} alt={title} />
        <div className="overlay" />
        <div className="badges-wrapper">
          {(!badges || badges.length === 0) && (
            <>
              {badge === 'new' && (
                <div className="badge badge-new">
                  <Zap size={11} fill="white" /> New
                </div>
              )}
              {badge === 'top' && (
                <div className="badge badge-top">
                  <Star size={11} fill="white" /> Top Rated
                </div>
              )}
              {badge === 'trending' && (
                <div className="badge badge-trending">
                  <TrendingUp size={11} /> Trending
                </div>
              )}
              {badge === 'featured' && (
                <div className="badge badge-featured">
                  <Award size={11} /> Featured
                </div>
              )}
              {badge === 'most-visited' && (
                <div className="badge badge-visited">
                  <Users size={11} /> Most Visited
                </div>
              )}
            </>
          )}

          {badges?.map(tag => {
            let Icon = Star;
            let badgeClass = 'badge badge-top';
            if (tag === 'New') { Icon = Zap; badgeClass = 'badge badge-new'; }
            else if (tag === 'Top Rated') { Icon = Star; badgeClass = 'badge badge-top'; }
            else if (tag === 'Trending') { Icon = TrendingUp; badgeClass = 'badge badge-trending'; }
            else if (tag === 'Featured') { Icon = Award; badgeClass = 'badge badge-featured'; }
            else if (tag === 'Most Visited') { Icon = Users; badgeClass = 'badge badge-visited'; }
            else return null;
            
            return (
              <div key={tag} className={badgeClass}>
                 <Icon size={11} fill={tag === 'Top Rated' || tag === 'New' ? 'white' : 'currentColor'} /> {tag}
              </div>
            );
          })}
        </div>
      </div>
      <div className="content">
        <h3>{title}</h3>
        
        <div className="meta-row">
          <div className="category-container">
            {Array.isArray(category) ? (
              category.map((cat, i) => (
                <div key={i} className="category-pill">
                   <img src={getMapIconUrl(cat)} alt={cat} />
                   {cat}
                </div>
              ))
            ) : (
              <div className="category-pill">
                 <img src={getMapIconUrl(category)} alt={category} />
                 {category}
              </div>
            )}
          </div>
          
          {rating && <div className="row-divider">|</div>}
          
          {rating && (
            <div className="rating-inline">
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {rating}
            </div>
          )}
        </div>
        
        <div className="card-footer">
          <div className="location">
            <MapPin size={14} color="#94a3b8" /> {location}
          </div>
          <motion.div whileHover={{ scale: 1.2 }} className="action-icon">
            <Heart size={18} />
          </motion.div>
        </div>
      </div>
    </CardWrapper>
  );
};

export default DiscoveryCard;
