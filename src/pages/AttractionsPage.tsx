import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Heart, Star, X, Clock, DollarSign, Info, Sparkles, Award, TrendingUp, Users, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAttractions } from '../hooks/useData';
import { useLocation, useNavigate } from 'react-router-dom';
import { Attraction, Review } from '../data/types';
import MediaCarousel from '../components/Common/MediaCarousel';
import StarRating from '../components/Common/StarRating';
import AuthGuardPopup from '../components/Common/AuthGuardPopup';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../api/db';
import SmartMedia from '../components/Common/SmartMedia';
import StandardPageHeader from '../components/Common/StandardPageHeader';
import DiscoveryCard from '../components/Common/DiscoveryCard';
import SectionHeader from '../components/Common/SectionHeader';
import CentricCarousel from '../components/Common/CentricCarousel';
import SharedCategoryScroller from '../components/Common/SharedCategoryScroller';
import { ATTRACTION_CATEGORIES, getMapIconUrl } from '../components/Admin/CategoryTagConfig';
import { getDynamicTags } from '../utils/tagUtils';
import AttractionDetailsPage from './AttractionDetailsPage';

const PageContainer = styled(motion.div)`
  width: 100%;
  padding: 0 64px 64px;

  @media (max-width: 1024px) {
    padding: 0 32px 48px;
  }

  @media (max-width: 768px) {
    padding: 0 20px 40px;
  }
`;

const HeroContainer = styled.div`
  position: relative;
  width: 100vw;
  margin-left: -64px;
  padding: 0 64px 32px;
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  
  @media (max-width: 1024px) {
    margin-left: -32px;
    padding: 0 32px 24px;
  }

  @media (max-width: 768px) {
    margin-left: -20px;
    padding: 0 20px 20px;
  }

  .video-container {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    overflow: hidden;
    z-index: 0;
  }

  .video-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(
      to bottom,
      ${(props) => props.theme.colors.lightBg}66 0%,
      ${(props) => props.theme.colors.lightBg}cc 50%,
      ${(props) => props.theme.colors.lightBg} 100%
    );
    z-index: 1;
  }

  & > section {
    background: transparent !important;
    position: relative;
    z-index: 2;
  }

  .controls-wrapper {
    position: relative;
    z-index: 2;
  }
`;

import FeaturedCarouselCard from '../components/Common/FeaturedCarouselCard';
import React, { useState as useStateLocal } from 'react';

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  align-items: center;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: var(--surface-bg);
  padding: 16px 28px;
  border-radius: 40px;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 15px 40px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 600px;

  input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 1.1rem;
    margin-left: 12px;
    width: 100%;
    font-family: ${(props) => props.theme.fonts.body};
    color: ${(props) => props.theme.colors.textDark};
    
    &::placeholder { color: #94a3b8; }
  }
`;

const FilterAreaContainer = styled.div`
  flex: 1;
  min-width: 0;
  
  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  max-width: var(--container-max-width);
  margin: 0 auto;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const HorizontalScroller = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 20px;
  padding-bottom: 24px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  
  > div {
    flex: 0 0 320px;
    
    @media (max-width: 768px) {
       flex: 0 0 280px;
    }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(11, 33, 71, 0.4);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: var(--surface-bg);
  border-radius: 32px;
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  box-shadow: 0 40px 100px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  
  .immersive-carousel-wrapper {
     position: absolute;
     top: 0; left: 0; width: 100%; height: 100%;
  }
  
  .immersive-carousel-wrapper > div {
     border-radius: 0 !important;
  }
`;

const ImmersiveHeaderContainer = styled.div`
  position: relative;
  width: 100%;
  height: 45vh;
  min-height: 400px;
  flex-shrink: 0;

  .close-btn {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 100;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.4);
    color: white;
    padding: 10px 20px;
    border-radius: 30px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(255,255,255,0.4);
    }
  }

  .header-content {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 80px 40px 40px;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
    color: white;
    z-index: 10;
    pointer-events: none;

    span {
      font-size: 0.85rem;
      color: ${(props) => props.theme.colors.ctaBlue};
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      display: block;
      margin-bottom: 8px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h2 {
      font-size: 3.5rem;
      font-family: 'Outfit', sans-serif;
      margin: 0 0 16px 0;
      background: linear-gradient(135deg, ${(props) => props.theme.colors.darkBlue} 0%, ${(props) => props.theme.colors.ctaBlue} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 10px 20px rgba(0,0,0,0.05);
      line-height: 1.1;
      
      @media (max-width: 768px) {
        font-size: 2.5rem;
      }
    }
    
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      pointer-events: auto;
      
      .tag-pill {
        background: rgba(255,255,255,0.2);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
      }
      
      .dynamic-pill {
        background: rgba(255, 215, 0, 0.3);
        border-color: rgba(255, 215, 0, 0.6);
        color: white;
      }
    }
  }
`;

const DetailTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  
  .tag-pill {
    background: #f0f7ff;
    color: var(--cta-blue);
    padding: 8px 18px;
    border-radius: 30px;
    font-size: 0.85rem;
    font-weight: 800;
    border: 1px solid rgba(46, 117, 182, 0.1);
    box-shadow: 0 4px 12px rgba(46, 117, 182, 0.05);
    transition: all 0.2s;
    
    &:hover {
      background: #e0efff;
      transform: translateY(-2px);
    }
  }
  
  .dynamic-pill {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
    &:hover { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
  }
`;

const ModalBody = styled.div`
  padding: 40px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 40px;
  
  /* Scrollbar refinement */
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 48px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div<{ $glass?: boolean }>`
  background: ${(props) => props.$glass ? 'rgba(248, 250, 252, 0.5)' : 'white'};
  border: 1px solid rgba(0,0,0,0.05);
  padding: 32px;
  border-radius: 24px;
  box-shadow: ${(props) => props.theme.shadows.soft};
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 16px;
    color: ${(props) => props.theme.colors.darkBlue};
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

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
`;

const StatCard = styled.div`
  background: #f8fafc;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.03);
  
  .label {
    font-size: 0.7rem;
    color: ${(props) => props.theme.colors.textLight};
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  
  .value {
    font-size: 1.1rem;
    font-weight: 700;
    color: ${(props) => props.theme.colors.darkBlue};
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const parsePricing = (feeStr: string) => {
   if (!feeStr || feeStr === 'Free Admission' || feeStr === 'Free' || feeStr === 'Contact for Rates') return feeStr;
   if (feeStr.includes('|')) {
      return feeStr.split('|').map(p => {
         const [label, price] = p.split(':', 2);
         return { label: label?.trim(), price: price?.trim() };
      });
   }
   return feeStr;
};

const AttractionsPage = () => {
  const { data: attractions, loading } = useAttractions();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [itinerary, setItinerary] = useState<number[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, updateUser } = useAuth();
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
  const [authAction, setAuthAction] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [featuredCarouselIndex, setFeaturedCarouselIndex] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openId = params.get('openId');
    if (openId && attractions.length > 0) {
      const target = attractions.find(a => 
        a.id?.toString() === openId
      );
      if (target) setSelectedItem(target);
    } else if (selectedItem) {
      // Keep selectedItem in sync with live data (for reactive reviews)
      const fresh = attractions.find(a => a.id === selectedItem.id);
      if (fresh) setSelectedItem(fresh);
    }
  }, [location.search, attractions]);

  useEffect(() => {
    if (user) setItinerary(user.itinerary || []);
  }, [user]);

  const closeModal = () => {
    setSelectedItem(null);
    if (location.search.includes('openId')) {
      navigate(-1);
    }
  };

  const toggleItinerary = async (id: number) => {
    if (!user) {
      setAuthAction('save this to your itinerary');
      setIsAuthPopupOpen(true);
      return;
    }
    const newItinerary = user.itinerary.includes(id)
      ? user.itinerary.filter(iid => iid !== id)
      : [...user.itinerary, id];

    try {
      await updateUser({ itinerary: newItinerary });
      setItinerary(newItinerary);
    } catch (err) {
      console.error("Failed to update itinerary", err);
    }
  };
    // Replaced local categories with ATTRACTION_CATEGORIES
    
  // Highest ranks for badges
  const maxRating = attractions.length > 0 ? Math.max(...attractions.map(a => a.rating || 0)) : 0;
  const maxVisits = attractions.length > 0 ? Math.max(...attractions.map(a => a.visits || 0)) : 0;

  const [visitedTags, setVisitedTags] = useState<string[]>(() => JSON.parse(localStorage.getItem('user_visited_tags') || '[]'));

  const handleOpenModal = (item: any) => {
    setSelectedItem(item);
    navigate(`/attractions?openId=${item.id || item.id}`);
    
    if (item.tags) {
      const newTags = Array.from(new Set([...visitedTags, ...item.tags])) as string[];
      setVisitedTags(newTags);
      localStorage.setItem('user_visited_tags', JSON.stringify(newTags));
    }
    // Track real-time interaction
    if (item.id) {
      dbService.trackInteraction('attractions', item.id);
    }
  };

  const filteredData = attractions.filter(item => {
    const itemCategories = Array.isArray(item.categories) ? item.categories : [((item as any).category || 'Nature')];
    const categoryMatch = selectedCategories.length === 0 || 
                         selectedCategories.every(sc => itemCategories.some(ic => ic.toLowerCase() === sc.toLowerCase()));
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && matchesSearch;
  }).sort((a, b) => (b.visits || 0) - (a.visits || 0));

  const itineraryItems = attractions.filter(a => itinerary.includes(a.id));
  const itineraryTags = [...new Set(itineraryItems.flatMap(a => a.tags || []))];
  const itineraryCategories = [...new Set(itineraryItems.flatMap(a => a.categories || [(a as any).category]))];

  const featuredItems = [...attractions]
    .filter(i => {
      const isTrending = (i.visits || 0) >= 50;
      const isTopRated = (i.reviews?.length || 0) >= 10 && (i.rating || 0) >= 4.0;
      const hasSharedTag = i.tags?.some((t: string) => itineraryTags.includes(t) || visitedTags.includes(t));
      const hasSharedCat = Array.isArray(i.categories) 
          ? i.categories.some((c: string) => itineraryCategories.includes(c)) 
          : itineraryCategories.includes((i as any).category);
      return isTrending || isTopRated || hasSharedTag || hasSharedCat;
    })
    .sort((a, b) => (b.visits || 0) - (a.visits || 0))
    .slice(0, 15);

  const recommendedItems = [...attractions]
    .filter(a => !featuredItems.find(f => f.id === a.id))
    .filter(a => {
      const hasSharedTag = a.tags?.some((t: string) => itineraryTags.includes(t) || visitedTags.includes(t));
      const hasSharedCat = Array.isArray(a.categories) 
          ? a.categories.some((c: string) => itineraryCategories.includes(c)) 
          : itineraryCategories.includes((a as any).category);
      return hasSharedTag || hasSharedCat;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 15);

  const THREE_WEEKS = 21 * 24 * 3600 * 1000;
  const ONE_WEEK = 7 * 24 * 3600 * 1000;

  const isNew = (item: any) => {
    const added = new Date(item.dateAdded || 0).getTime();
    return Date.now() - added <= THREE_WEEKS;
  };

  const isTrending = (item: any) => {
    const added = new Date(item.dateAdded || 0).getTime();
    return (item.visits || 0) >= 50 && (Date.now() - added) <= ONE_WEEK;
  };

  const isTopRated = (item: any) => {
    const reviewCount = Array.isArray(item.reviews) ? item.reviews.length : 0;
    return reviewCount >= 10 && (item.rating || 0) >= 4.5;
  };

  const renderCard = (item: any, index: number) => {
    let badge: 'new' | 'top' | 'trending' | 'featured' | 'most-visited' | undefined = undefined;
    
    if (item.featured) {
      badge = 'featured';
    } else if (isTrending(item)) {
      badge = 'trending';
    } else if (isTopRated(item)) {
      badge = 'top';
    } else if (isNew(item)) {
      badge = 'new';
    }

    let displayCat = item.category || 'Nature';
    if (Array.isArray(item.categories)) {
      displayCat = item.categories[0];
      if (selectedCategories.length > 0) {
        const match = selectedCategories.find(sc => item.categories.some((ic: string) => ic.toLowerCase() === sc.toLowerCase()));
        if (match) displayCat = match;
      }
    }

    return (
      <DiscoveryCard
        key={item.id}
        index={index}
        image={item.photos?.[0] || item.img}
        category={displayCat}
        title={item.name}
        description={item.description}
        location={item.location}
        rating={item.rating}
        badge={badge}
        badges={getDynamicTags(item, attractions)}
        onClick={() => handleOpenModal(item)}
      />
    );
  };

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={!loading ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <HeroContainer>
        <div className="video-container">
          <SmartMedia
            src="https://youtu.be/sBFeTzfXeu8"
            type="video"
            className="video-bg"
            autoPlay
            loop
            muted
            unmuteOnInteraction={false}
          />
          <div className="hero-overlay" />
        </div>

        <StandardPageHeader
          tagline="Where wonders flow from ridges to reef"
          title="ATTRACTIONS"
          statementContent={{
            thin: "Experience the",
            bold: "Natural",
            accent: "Wonders"
          }}
          isStatic
        />

        <ControlsContainer className="controls-wrapper">
          <SearchBar>
            <Search size={20} color="#888" />
            
            {selectedCategories.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', marginLeft: '12px', alignItems: 'center' }}>
                 {selectedCategories.map(cat => (
                   <img loading="lazy" key={cat} src={getMapIconUrl(cat)} alt={cat} title={cat} style={{ width: 18, height: 18, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
                 ))}
                 <div style={{ width: '1px', height: '16px', background: 'rgba(0,0,0,0.1)', marginLeft: '4px' }} />
              </div>
            )}

            <input
              type="text"
              placeholder="Search for attractions, hotels, restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            )}
          </SearchBar>
          <FilterAreaContainer>
            <SharedCategoryScroller
              categories={ATTRACTION_CATEGORIES}
              activeCategories={selectedCategories}
              onSelect={setSelectedCategories}
            />
          </FilterAreaContainer>
        </ControlsContainer>
      </HeroContainer>

      <Grid>
        {search === '' && selectedCategories.length === 0 && featuredItems.length > 0 && (
          <div style={{ gridColumn: '1/-1', marginBottom: '40px' }}>
            <SectionHeader
              subtitle="Must-See"
              title={<>Featured <span style={{ color: 'var(--cta-blue)' }}>Attractions</span></>}
            />
             <CentricCarousel
              items={featuredItems}
              onActiveIndexChange={setFeaturedCarouselIndex}
              renderItem={(item: any, isActive: boolean) => {
                 let badge: 'new' | 'top' | 'trending' | 'featured' | 'most-visited' | undefined = undefined;
                 if (item.featured) badge = 'featured';
                 else if (isTrending(item)) badge = 'trending';
                 else if (isTopRated(item)) badge = 'top';
                 else if (isNew(item)) badge = 'new';

                 let displayCat = item.category || 'Nature';
                 if (Array.isArray(item.categories)) displayCat = item.categories[0];

                 return (
                   <FeaturedCarouselCard 
                     item={item}
                     badge={badge}
                     badges={getDynamicTags(item, attractions)}
                     categoryName={displayCat}
                     onClick={() => handleOpenModal(item)}
                   />
                 );
              }}
            />
          </div>
        )}

        {search === '' && selectedCategories.length === 0 && recommendedItems.length > 0 && (
          <div style={{ gridColumn: '1/-1', marginBottom: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <SectionHeader
              subtitle="Personalized"
              title={<>Recommended <span style={{ color: 'var(--accent-blue)' }}>For You</span></>}
            />
            <Grid>
              {recommendedItems.map((item, index) => renderCard(item, index))}
            </Grid>
          </div>
        )}

        {search === '' && selectedCategories.length === 0 && (
          <div style={{ gridColumn: '1/-1', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', marginBottom: '8px' }}>
            <SectionHeader
              subtitle="Collection"
              title="All Attractions"
            />
          </div>
        )}

        {filteredData.length > 0 ? (
          filteredData.map((item, index) => renderCard(item, index))
        ) : !loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.7)', borderRadius: '32px', border: '1px solid #eee' }}>
            <h2 style={{ color: '#2e75b6', marginBottom: '16px' }}>Bulusan Wonders Coming Soon!</h2>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>No attractions found matching your criteria. We are constantly discovering new gems!</p>
          </div>
        ) : null}
      </Grid>

      <AnimatePresence>
        {selectedItem && (
          <AttractionDetailsPage
            item={selectedItem}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
      <AuthGuardPopup
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        actionName={authAction}
      />
    </PageContainer>
  );
};

export default AttractionsPage;
