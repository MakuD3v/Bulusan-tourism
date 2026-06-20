import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBlogs } from '../../hooks/useData';
import FeaturedSplitCard from '../Common/FeaturedSplitCard';

const SectionWrapper = styled.section`
  padding: 60px 24px;
  background: var(--surface-bg);
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 40px 20px;
  }
`;

const SectionHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;

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
    font-size: clamp(2rem, 5vw, 4rem);
    font-family: 'Barabara', sans-serif;
    color: var(--dark-blue);
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
`;

const Skeleton = styled.div`
  width: 100%;
  height: 600px;
  background: #f1f5f9;
  border-radius: 40px;
  animation: pulse 1.5s infinite ease-in-out;

  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;const FeaturedBlogSection = () => {
  const { data: blogs, loading } = useBlogs();
  const navigate = useNavigate();

  if (loading) {
    return (
      <SectionWrapper>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Skeleton />
        </div>
      </SectionWrapper>
    );
  }

  const featuredBlog = blogs && blogs.length > 0 ? blogs[blogs.length - 1] : null;

  if (!featuredBlog) {
    return null;
  }

  return (
    <SectionWrapper>
      <SectionHeader
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="subtitle">Community Stories</span>
        <h2>FEATURED STORIES</h2>
      </SectionHeader>
      <FeaturedSplitCard post={featuredBlog} onClick={() => navigate('/blog')} />
    </SectionWrapper>
  );
};

export default FeaturedBlogSection;
