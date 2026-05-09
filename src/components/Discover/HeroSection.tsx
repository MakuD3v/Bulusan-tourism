import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mountain, Waves, Trees, Droplets, Info } from 'lucide-react';
import SmartMedia from '../Common/SmartMedia';

const HeroContainer = styled.section`
  height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
`;

const VideoBgWrapper = styled.div`
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 1;
  
  .video-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const HeroOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(11, 33, 71, 0.7) 0%,
    rgba(11, 33, 71, 0.5) 50%,
    rgba(11, 33, 71, 0.85) 100%
  );
  z-index: 2;
`;

const HeroContent = styled(motion.div)`
  position: relative;
  z-index: 10;
  max-width: 1100px;
  padding: 0 24px;
  text-align: center;

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 8px 16px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 24px;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: ${(props) => props.theme.colors.accentBlue};
  }

  h1 {
    font-size: clamp(3rem, 10vw, 8.5rem);
    font-family: ${(props) => props.theme.fonts.heading};
    font-weight: 900;
    line-height: 1.05;
    margin-bottom: 24px;
    letter-spacing: -3px;
    color: white;
    text-shadow: 0 10px 40px rgba(0,0,0,0.3);

    @media (max-width: 768px) {
      letter-spacing: -1px;
    }
    
    .tagline {
      display: block;
      font-family: ${(props) => props.theme.fonts.body};
      font-size: 0.14em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 14px;
      color: ${(props) => props.theme.colors.accentBlue};
      margin-bottom: 24px;
      opacity: 0.9;

      @media (max-width: 768px) {
        letter-spacing: 6px;
        font-size: 0.18em;
      }

      em {
        font-style: normal;
        font-weight: 800;
        color: white;
      }
    }

    .main-title {
      display: block;
      font-style: normal;
      background: linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
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
      color: white;
      opacity: 0.85;

      @media (max-width: 768px) {
        font-size: 0.28em;
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
    color: rgba(255,255,255,0.8);
    margin-bottom: 48px;
    line-height: 1.6;
    max-width: 700px;
    margin-inline: auto;
    font-weight: 400;

    @media (max-width: 768px) {
      font-size: 1.1rem;
      margin-bottom: 40px;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: 12px;
  }
`;

const SymmetricalButton = styled(motion(Link)) <{ $secondary?: boolean }>`
  background: ${(props) => (props.$secondary ? 'rgba(255,255,255,0.1)' : props.theme.colors.ctaBlue)};
  color: white;
  border: ${(props) => (props.$secondary ? '1px solid rgba(255,255,255,0.3)' : 'none')};
  padding: clamp(14px, 2vh, 18px) clamp(24px, 4vw, 40px);
  border-radius: 60px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 240px;
  backdrop-filter: ${(props) => (props.$secondary ? 'blur(10px)' : 'none')};
  box-shadow: ${(props) => (props.$secondary ? 'none' : '0 15px 30px rgba(46, 117, 182, 0.2)')};
  transition: all 0.3s ease;
  text-decoration: none;

  @media (max-width: 768px) {
    flex: 1;
    min-width: 140px;
    padding: 12px 20px;
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    min-width: 45%;
    font-size: 0.85rem;
    padding: 10px 12px;
  }

  &:hover {
    background: ${(props) => (props.$secondary ? 'rgba(255,255,255,0.2)' : '#1e40af')};
    transform: translateY(-4px);
    box-shadow: ${(props) => (props.$secondary ? '0 10px 20px rgba(0,0,0,0.2)' : '0 25px 50px rgba(46, 117, 182, 0.4)')};
  }
`;

const FloatingNav = styled(motion.div)`
  max-width: var(--container-max-width);
  width: calc(100% - 40px);
  margin: -80px auto 100px auto;
  background: ${(props) => props.theme.glass.background};
  backdrop-filter: ${(props) => props.theme.glass.filter};
  border: ${(props) => props.theme.glass.border};
  padding: 32px 48px;
  border-radius: 32px;
  box-shadow: ${(props) => props.theme.glass.shadow};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 100;
  
  @media (max-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 24px;
    margin: -40px 20px 80px;
  }

  @media (max-width: 640px) {
    gap: 16px;
    padding: 20px;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;

    @media (max-width: 640px) {
      gap: 8px;
    }

    .icon-box {
      width: 40px; height: 40px;
      background: var(--surface-bg);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${(props) => props.theme.colors.ctaBlue};
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      flex-shrink: 0;

      @media (max-width: 640px) {
        width: 32px; height: 32px;
        svg { width: 16px; height: 16px; }
      }
    }

    div { line-height: 1.2; }

    strong {
      display: block;
      color: ${(props) => props.theme.colors.darkBlue};
      font-size: 0.9rem;
      font-weight: 800;

      @media (max-width: 640px) {
        font-size: 0.75rem;
      }
    }

    span {
      font-size: 0.75rem;
      color: ${(props) => props.theme.colors.darkBlue};
      opacity: 0.7;
      font-weight: 600;

      @media (max-width: 640px) {
        font-size: 0.65rem;
      }
    }
  }
`;

import { ArrowRight, Map, Sparkles } from 'lucide-react';

const HeroSection = () => {
  return (
    <>
      <HeroContainer>
        <VideoBgWrapper>
          <SmartMedia
            src="https://youtu.be/sBFeTzfXeu8"
            type="video"
            className="video-bg"
            autoPlay
            loop
            muted
            unmuteOnInteraction={false}
          />
        </VideoBgWrapper>
        <HeroOverlay />

        <HeroContent
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <motion.div
            className="badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.0 }}
          >
            <Sparkles size={16} /> Welcome to the heart of Sorsogon
          </motion.div>

          <h1>
            <span className="tagline">Where wonders <em>flow</em> from ridges to reef</span>
            <span className="main-title">BULUSAN</span>
            <span className="statement">
              <span className="thin-italic">Experience the</span>
              <span className="bold-serif">Nature's Sanctuary</span>
            </span>
          </h1>

          <ButtonGroup>
            <SymmetricalButton
              to="/attractions"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Exploring <ArrowRight size={20} />
            </SymmetricalButton>

            <SymmetricalButton
              to="/explore"
              $secondary
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Map size={20} /> View Map
            </SymmetricalButton>
          </ButtonGroup>
        </HeroContent>
      </HeroContainer>

      <FloatingNav 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1.0, delay: 1.2 }}
      >
        <div className="nav-item">
          <div className="icon-box"><Mountain size={24} /></div>
          <div><strong>1,565m Peak</strong><span>Sorsogon's Highest</span></div>
        </div>
        <div className="nav-item">
          <div className="icon-box"><Waves size={24} /></div>
          <div><strong>Alpine Vistas</strong><span>'Switzerland of Orient'</span></div>
        </div>
        <div className="nav-item">
          <div className="icon-box"><Trees size={24} /></div>
          <div><strong>3,672 Hectares</strong><span>Protected Natural Park</span></div>
        </div>
        <div className="nav-item">
          <div className="icon-box"><Droplets size={24} /></div>
          <div><strong>'Bulus' Flow</strong><span>Land of Waterfalls</span></div>
        </div>
      </FloatingNav>
    </>
  );
};

export default HeroSection;


