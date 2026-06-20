import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Clock, MapPin } from 'lucide-react';
import { useBlogs } from '../../hooks/useData';
import { getMediaUrl } from '../../utils/mediaUtils';

const SectionWrapper = styled.section`
  padding: 60px clamp(20px, 5vw, 80px);
  background: var(--surface-bg);
  position: relative;
  overflow: hidden;
`;

const SectionHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 48px;

  .subtitle {
    display: inline-block;
    color: var(--cta-blue);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 5px;
    font-size: 0.8rem;
    margin-bottom: 12px;
  }

  h2 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-family: 'Outfit', sans-serif;
    font-weight: 900;
    color: var(--dark-blue);
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: -1px;

    span {
      color: var(--cta-blue);
    }
  }
`;

/* Matches exactly the FeaturedCarouselCard design */
const HeroCard = styled(motion.div)<{ $bg: string }>`
  position: relative;
  max-width: 1300px;
  margin: 0 auto;
  border-radius: 20px;
  background-image: url(${props => props.$bg});
  background-size: cover;
  background-position: center;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 32px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  cursor: pointer;

  /* EXACT same gradient as FeaturedCarouselCard */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(11, 33, 71, 0.95) 0%, rgba(11, 33, 71, 0.4) 60%, transparent 100%);
    z-index: 1;
    transition: opacity 0.4s ease;
  }

  &:hover::before {
    opacity: 0.85;
  }

  /* Subtle zoom on bg image */
  background-size: cover;
  transition: background-size 0.6s ease;

  .content-z {
    position: relative;
    z-index: 2;
  }

  /* NEW badge top-right */
  .badges-wrapper {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 2;
  }

  .badge-pill {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* Category pill — same frosted glass style */
  .cat-pill {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 6px 14px;
    border-radius: 30px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }

  .row-items {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  h3 {
    font-size: clamp(1.5rem, 3.5vw, 2.2rem);
    font-family: 'Outfit', sans-serif;
    font-weight: 800;
    margin-bottom: 10px;
    line-height: 1.1;
    color: white !important;
  }

  .location {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 10px;
    font-weight: 500;
  }

  p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    min-height: 380px;
    border-radius: 16px;
    padding: 24px;
  }
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
  flex-wrap: wrap;
  gap: 16px;
`;

const AuthorMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 600;

  img {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.3);
  }

  .dot {
    opacity: 0.4;
  }
`;

const ReadButton = styled.button`
  background: white;
  color: #0b2147;
  border: none;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 22px;
  border-radius: 30px;
  white-space: nowrap;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--cta-blue);
    color: white;
    gap: 14px;
    box-shadow: 0 8px 24px rgba(46, 117, 182, 0.4);
  }
`;

const FeaturedBlogSection = () => {
  const { data: blogs, loading } = useBlogs();
  const navigate = useNavigate();

  if (loading || !blogs || blogs.length === 0) return null;

  const publishedBlogs = [...blogs].reverse().filter((b: any) => b.status === 'Published' || !b.status);
  const featured = publishedBlogs[0] || blogs[blogs.length - 1];

  if (!featured) return null;

  return (
    <SectionWrapper>
      <SectionHeader
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="subtitle">Community Stories</span>
        <h2>Featured <span>Stories</span></h2>
      </SectionHeader>

      <HeroCard
        $bg={getMediaUrl(featured.image) || '/default-placeholder.jpg'}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => navigate('/blog')}
      >
        {/* NEW badge top-right */}
        <div className="badges-wrapper">
          <div className="badge-pill">
            <BookOpen size={11} /> Latest
          </div>
        </div>

        <div className="content-z">
          <div className="row-items">
            <div className="cat-pill">
              <BookOpen size={13} />
              {featured.category || 'Travel Guide'}
            </div>
            {featured.readTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                <Clock size={14} /> {featured.readTime}
              </div>
            )}
          </div>

          <h3>{featured.title}</h3>

          <div className="location">
            <MapPin size={14} /> By {featured.authorName || 'Local Explorer'}
          </div>

          <p>{featured.excerpt || 'Discover the untold stories of Bulusan in this exciting community post.'}</p>

          <BottomRow>
            <AuthorMeta>
              {featured.authorAvatar
                ? <img src={getMediaUrl(featured.authorAvatar)} alt={featured.authorName} />
                : null
              }
              <span>{featured.authorName || 'Local Explorer'}</span>
              {featured.date && <><span className="dot">•</span><span>{featured.date}</span></>}
            </AuthorMeta>

            <ReadButton onClick={(e) => { e.stopPropagation(); navigate('/blog'); }}>
              Read Story <ArrowRight size={16} />
            </ReadButton>
          </BottomRow>
        </div>
      </HeroCard>
    </SectionWrapper>
  );
};

export default FeaturedBlogSection;
