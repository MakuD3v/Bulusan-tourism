import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useAttractions, useEnterprises } from '../../hooks/useData';
import { useNavigate } from 'react-router-dom';
import CentricCarousel from '../Common/CentricCarousel';
import FeaturedCarouselCard from '../Common/FeaturedCarouselCard';
import ReviewBubble from '../Common/ReviewBubble';
import { getDynamicTags } from '../../utils/tagUtils';

const SlideshowContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto clamp(2rem, 5vw, 4rem) auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 0 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 60px;
    padding: 0 16px;
  }
`;

const CarouselSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: ${(props) => props.theme.colors.darkBlue};
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 800;
  text-align: center;
  margin-bottom: 8px;

  span {
    color: ${(props) => props.theme.colors.ctaBlue};
  }
`;

// An item is "top rated" if it has badge 'top' or 'featured', or rating >= 4.5
const isItemTopRated = (item: any): boolean => {
  if (item.featured) return true;
  if (item.rating >= 4.5) return true;
  return false;
};

const Carousel = ({ items, type, basePath }: { items: any[], type: string, basePath: string }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const activeItem = items[activeIndex];
  const activeIsTopRated = activeItem ? isItemTopRated(activeItem) : false;
  const activeReviews: any[] = (activeItem?.reviews || []).filter((r: any) => r && (r.comment || r.text));

  return (
    <CarouselSection>
      <SectionTitle>Top <span>{type}</span></SectionTitle>
      <CentricCarousel
        items={items}
        onActiveIndexChange={setActiveIndex}
        renderItem={(item: any, isActive: boolean) => {
           let badge: 'new' | 'top' | 'trending' | 'featured' | 'most-visited' | undefined = undefined;
           const isNew = (Date.now() - new Date(item.dateAdded || 0).getTime()) <= 30 * 24 * 3600 * 1000;
           
           if (item.featured) badge = 'featured';
           else if (isNew) badge = 'new';
           else if (item.rating >= 4.8) badge = 'top';
           else if ((item.visits || 0) >= 50) badge = 'trending';

           let displayCat = item.category || item.type || 'Stay';
           if (Array.isArray(item.categories)) displayCat = item.categories[0];

           const thisIsTopRated = isActive && activeIsTopRated;
           const thisReviews = isActive ? activeReviews : [];

           return (
             <div style={{ position: 'relative', width: '100%', height: '100%' }}>
               <FeaturedCarouselCard 
                 item={item}
                 badge={badge}
                 badges={getDynamicTags(item, items)}
                 categoryName={displayCat}
                 onClick={() => navigate(`/${basePath}?openId=${item.id || item.id}`)}
               />
               {/* Bubble positioned outside the card's clipping bounds */}
               {thisIsTopRated && thisReviews.length > 0 && (
                  <div style={{ position: 'absolute', top: '-15px', right: '-15px', zIndex: 50 }}>
                    <ReviewBubble reviews={thisReviews} isTopRated={thisIsTopRated} />
                  </div>
               )}
             </div>
           );
        }}
      />
    </CarouselSection>
  );
};

const FeaturedSlideshow = () => {
  const { data: attractions } = useAttractions();
  const { data: enterprises } = useEnterprises();

  // Take top 5 for the slideshow
  const featuredAttractions = [...attractions].sort((a, b) => (b.visits || 0) - (a.visits || 0)).slice(0, 5);
  const featuredEnterprises = [...enterprises].sort((a: any, b: any) => (b.visits || 0) - (a.visits || 0)).slice(0, 5);

  return (
    <SlideshowContainer>
      <Carousel items={featuredAttractions} type="Attractions" basePath="attractions" />
      <Carousel items={featuredEnterprises} type="Enterprises" basePath="enterprises" />
    </SlideshowContainer>
  );
};

export default FeaturedSlideshow;
