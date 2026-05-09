import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HeaderSection = styled.section`
  padding: var(--section-padding) 24px calc(var(--section-padding) * 0.6);
  background: ${(props) => props.theme.colors.lightBg};
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle at 50% 50%, rgba(46, 117, 182, 0.06) 0%, transparent 60%);
    pointer-events: none;
  }
`;

const Content = styled(motion.div)`
  max-width: 1200px;
  width: 100%;
  z-index: 10;

  h1 {
    font-size: clamp(3rem, 10vw, 6rem);
    font-family: ${(props) => props.theme.fonts.heading};
    font-weight: 950;
    line-height: 0.95;
    margin-bottom: 32px;
    letter-spacing: -4px;
    color: ${(props) => props.theme.colors.darkBlue};
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .tagline {
      display: block;
      font-family: ${(props) => props.theme.fonts.body};
      font-size: 0.16em;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 12px;
      color: ${(props) => props.theme.colors.ctaBlue};
      margin-bottom: 24px;
      opacity: 0.9;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-left: 12px; /* For balance due to tracking */

      @media (max-width: 768px) {
        letter-spacing: 6px;
        font-size: 0.2em;
      }
    }

    .main-title {
      display: block;
      font-style: normal;
      background: linear-gradient(to bottom, ${(props) => props.theme.colors.darkBlue}, ${(props) => props.theme.colors.ctaBlue});
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      padding-bottom: 10px;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
    }

    .statement { 
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      font-size: 0.24em;
      font-weight: 500;
      font-family: ${(props) => props.theme.fonts.body};
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 24px;
      color: ${(props) => props.theme.colors.darkBlue};
      opacity: 0.85;

      @media (max-width: 768px) {
        font-size: 0.28em;
        line-height: 1.4;
        flex-wrap: wrap;
      }
      
      .thin-italic {
        font-weight: 400;
      }

      .bold-serif {
        font-weight: 800;
      }

      .accent {
        font-weight: 800;
        color: ${(props) => props.theme.colors.ctaBlue};
      }
    }
  }

  p {
    font-size: 1.2rem;
    color: ${(props) => props.theme.colors.textDark};
    max-width: 750px;
    margin: 40px auto 0;
    line-height: 1.8;
    opacity: 0.8;
    font-weight: 500;

    @media (max-width: 768px) {
      font-size: 1.05rem;
      margin-top: 32px;
    }
  }
`;

interface StandardPageHeaderProps {
  tagline: string | React.ReactNode;
  title: string;
  statementContent?: {
    thin: string;
    bold: string;
    accent: string;
  };
  description?: string;
  isStatic?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1] as any
    }
  }
};

const titleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.0,
      ease: [0.25, 0.1, 0.25, 1] as any
    }
  }
};

const StandardPageHeader: React.FC<StandardPageHeaderProps> = ({
  tagline,
  title,
  statementContent,
  description,
  isStatic = false
}) => {
  return (
    <HeaderSection>
      <Content
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={titleVariants}>
          <motion.span 
            variants={itemVariants} 
            initial={isStatic ? "visible" : "hidden"}
            className="tagline"
          >
            {tagline}
          </motion.span>
          <motion.span 
            variants={itemVariants} 
            initial={isStatic ? "visible" : "hidden"}
            className="main-title"
          >
            {title}
          </motion.span>
          {statementContent && (
            <motion.span 
              variants={itemVariants} 
              initial={isStatic ? "visible" : "hidden"}
              className="statement"
            >
              <span className="thin-italic">{statementContent.thin}</span>
              <span className="bold-serif">{statementContent.bold}</span>
              <span className="accent">{statementContent.accent}</span>
            </motion.span>
          )}
        </motion.h1>
        {description && (
          <motion.p 
            variants={itemVariants}
            initial={isStatic ? "visible" : "hidden"}
          >
            {description}
          </motion.p>
        )}
      </Content>
    </HeaderSection>
  );
};

export default StandardPageHeader;

