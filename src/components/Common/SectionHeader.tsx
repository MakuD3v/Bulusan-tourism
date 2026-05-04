import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HeaderWrapper = styled(motion.div)`
  text-align: center;
  margin-bottom: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  
  .subtitle {
    display: inline-block;
    color: ${(props) => props.theme.colors.ctaBlue};
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 5px;
    font-size: 0.85rem;
    margin-bottom: 16px;
  }
  
  h2 {
    font-size: clamp(1.6rem, 5vw, 4rem);
    font-family: ${(props) => props.theme.fonts.heading};
    color: inherit;
    line-height: 1.1;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;

    @media (max-width: 768px) {
      font-size: 1.8rem;
    }
  }
`;

interface SectionHeaderProps {
  subtitle?: string;
  title: string | React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ subtitle, title, className, style }) => {
  return (
    <HeaderWrapper
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] as any }}
    >
      {subtitle && <span className="subtitle">{subtitle}</span>}
      <h2>{title}</h2>
    </HeaderWrapper>
  );
};

export default SectionHeader;
