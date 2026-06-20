import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';
import { getMediaUrl } from '../../utils/mediaUtils';

const ContentContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 50px;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const ImageWrapper = styled(motion.div)`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  position: relative;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  @media (max-width: 1024px) {
    aspect-ratio: 16/9;
    border-radius: 20px;
  }
`;

const TextContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const CategoryBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--cta-blue);
  color: white;
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  align-self: flex-start;
  margin-bottom: 24px;
`;

const Title = styled.h3`
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-family: 'Outfit', sans-serif;
  color: var(--dark-blue);
  margin-bottom: 16px;
  line-height: 1.2;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: var(--cta-blue);
  }
`;

const Excerpt = styled.p`
  color: #475569;
  font-size: 1rem;
  line-height: 1.7;
  margin-bottom: 24px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0,0,0,0.08);
  padding-top: 24px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 24px;
    align-items: flex-start;
  }
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  .details {
    display: flex;
    flex-direction: column;

    .name {
      font-weight: 800;
      color: var(--dark-blue);
      font-size: 0.9rem;
    }

    .date {
      color: var(--text-light);
      font-size: 0.8rem;
      font-weight: 600;
    }
  }
`;

const ReadButton = styled.button`
  background: var(--dark-blue);
  color: white;
  border: none;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 20px;
  transition: all 0.3s ease;

  &:hover {
    gap: 16px;
    background: var(--cta-blue);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(46, 117, 182, 0.2);
  }
`;

interface FeaturedSplitCardProps {
  post: any;
  onClick: () => void;
}

const FeaturedSplitCard: React.FC<FeaturedSplitCardProps> = ({ post, onClick }) => {
  if (!post) return null;

  return (
    <ContentContainer>
      <ImageWrapper
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClick}
      >
        <img src={getMediaUrl(post.image) || '/default-placeholder.jpg'} alt={post.title} />
      </ImageWrapper>

      <TextContent
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <CategoryBadge>
          <BookOpen size={14} />
          {post.category || 'Travel Guide'}
        </CategoryBadge>

        <Title onClick={onClick}>{post.title}</Title>
        <Excerpt>{post.excerpt || 'Discover the untold stories of Bulusan in this exciting community post.'}</Excerpt>

        <Footer>
          <AuthorInfo>
            <img src={getMediaUrl(post.authorAvatar) || `https://i.pravatar.cc/150?u=${encodeURIComponent(post.authorName || 'User')}`} alt={post.authorName} />
            <div className="details">
              <span className="name">{post.authorName || 'Local Explorer'}</span>
              <span className="date">{post.date || 'Recently'} • {post.readTime || '5 min read'}</span>
            </div>
          </AuthorInfo>

          <ReadButton onClick={onClick}>
            Read Story <ArrowRight size={18} />
          </ReadButton>
        </Footer>
      </TextContent>
    </ContentContainer>
  );
};

export default FeaturedSplitCard;
