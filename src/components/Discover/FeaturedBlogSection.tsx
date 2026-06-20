import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Clock, User } from 'lucide-react';
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

const HeroCard = styled(motion.div)`
  position: relative;
  max-width: 1300px;
  margin: 0 auto;
  border-radius: 32px;
  overflow: hidden;
  cursor: pointer;
  min-height: 520px;
  display: flex;
  align-items: flex-end;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.3);

  &:hover .bg-img {
    transform: scale(1.04);
  }

  @media (max-width: 768px) {
    min-height: 420px;
    border-radius: 24px;
  }
`;

const BgImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(3, 10, 28, 0.95) 0%,
    rgba(3, 10, 28, 0.6) 45%,
    rgba(3, 10, 28, 0.1) 100%
  );
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
  padding: clamp(28px, 5vw, 56px);
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: flex-end;
  gap: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const TextBlock = styled.div`
  max-width: 720px;
`;

const CategoryBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--cta-blue);
  color: white;
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  font-size: clamp(1.6rem, 3.5vw, 2.8rem);
  font-family: 'Outfit', sans-serif;
  color: white;
  margin-bottom: 16px;
  line-height: 1.15;
  font-weight: 800;
`;

const Excerpt = styled.p`
  color: rgba(255, 255, 255, 0.75);
  font-size: clamp(0.9rem, 1.5vw, 1rem);
  line-height: 1.7;
  margin-bottom: 28px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    -webkit-line-clamp: 3;
  }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-weight: 600;

  img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.3);
  }
`;

const ReadButton = styled(motion.button)`
  background: white;
  color: #0f172a;
  border: none;
  font-weight: 800;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 14px 28px;
  border-radius: 50px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.3s ease;

  &:hover {
    background: var(--cta-blue);
    color: white;
    gap: 16px;
    box-shadow: 0 12px 30px rgba(46, 117, 182, 0.4);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
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
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => navigate('/blog')}
      >
        <BgImage
          className="bg-img"
          src={getMediaUrl(featured.image) || '/default-placeholder.jpg'}
          alt={featured.title}
        />
        <Overlay />

        <CardContent>
          <TextBlock>
            <CategoryBadge>
              <BookOpen size={13} />
              {featured.category || 'Travel Guide'}
            </CategoryBadge>
            <Title>{featured.title}</Title>
            <Excerpt>{featured.excerpt || 'Discover the untold stories of Bulusan in this exciting community post.'}</Excerpt>
            <Meta>
              <MetaItem>
                {featured.authorAvatar
                  ? <img src={getMediaUrl(featured.authorAvatar)} alt={featured.authorName} />
                  : <User size={16} />
                }
                {featured.authorName || 'Local Explorer'}
              </MetaItem>
              {featured.readTime && (
                <MetaItem>
                  <Clock size={14} />
                  {featured.readTime}
                </MetaItem>
              )}
              {featured.date && (
                <MetaItem>• {featured.date}</MetaItem>
              )}
            </Meta>
          </TextBlock>

          <ReadButton
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); navigate('/blog'); }}
          >
            Read Story <ArrowRight size={18} />
          </ReadButton>
        </CardContent>
      </HeroCard>
    </SectionWrapper>
  );
};

export default FeaturedBlogSection;
