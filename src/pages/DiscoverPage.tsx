import React, { useEffect, useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Heart, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import HeroSection from '../components/Discover/HeroSection';
import FeaturedSlideshow from '../components/Discover/FeaturedSlideshow';
import FeaturedBlogSection from '../components/Discover/FeaturedBlogSection';
import SmartMedia from '../components/Common/SmartMedia';

// ─── Ambient Animation ────────────────────────────────────────────────────────
const drift = keyframes`
  0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
  33% { transform: translateY(-30px) translateX(15px) scale(1.05); }
  66% { transform: translateY(20px) translateX(-10px) scale(0.95); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.03; transform: scale(1); }
  50% { opacity: 0.07; transform: scale(1.15); }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────
const PageContainer = styled(motion.div)`
  background: ${(props) => props.theme.colors.lightBg};
  overflow-x: hidden;
  position: relative;
`;

// Scroll progress bar at top
const ProgressBar = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    ${(props) => props.theme.colors.ctaBlue},
    ${(props) => props.theme.colors.accentBlue}
  );
  transform-origin: left;
  z-index: 9999;
`;

// ─── Pillars Section ──────────────────────────────────────────────────────────
const PillarsSection = styled.section`
  padding: 80px 24px 60px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 768px) {
    padding: 60px 20px 80px;
  }
`;

const SectionHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;

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
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-family: ${(props) => props.theme.fonts.heading};
    color: inherit;
    line-height: 1.1;
    max-width: 800px;
    margin: 0 auto;
  }
`;

const PillarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  align-items: stretch;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    /* Make third item span both columns */
    & > *:last-child {
      grid-column: span 2;
    }
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const PillarCard = styled(motion.div)`
  background: white;
  padding: 56px 44px;
  border-radius: 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  @media (max-width: 1024px) {
    margin-top: 0;
    padding: 32px 24px;
    border-radius: 28px;
  }

  @media (max-width: 768px) {
    padding: 24px 16px;
    border-radius: 20px;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(46,117,182,0) 0%, rgba(46,117,182,0.03) 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 150px;
    height: 150px;
    background: radial-gradient(circle, rgba(46, 117, 182, 0.06) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(30%, 30%);
  }

  &:hover::before {
    opacity: 1;
  }

  .icon-box {
    width: 60px;
    height: 60px;
    background: ${(props) => props.theme.colors.softBlue};
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.ctaBlue};
    margin-bottom: 24px;
    box-shadow: 0 10px 25px rgba(46, 117, 182, 0.12);
    transition: all 0.3s ease;

    @media (max-width: 768px) {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      svg { width: 22px; height: 22px; }
    }
  }

  &:hover .icon-box {
    background: ${(props) => props.theme.colors.ctaBlue};
    color: white;
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 0 15px 35px rgba(46, 117, 182, 0.3);
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 12px;
    color: ${(props) => props.theme.colors.darkBlue};
    font-family: ${(props) => props.theme.fonts.heading};

    @media (max-width: 768px) {
      font-size: 1.1rem;
      margin-bottom: 8px;
    }
  }

  p {
    color: ${(props) => props.theme.colors.textLight};
    line-height: 1.6;
    font-size: 1rem;
    flex: 1;

    @media (max-width: 768px) {
      font-size: 0.85rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .explore-link {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 24px;
    font-weight: 700;
    font-size: 0.9rem;
    color: ${(props) => props.theme.colors.ctaBlue};
    cursor: pointer;
    transition: gap 0.3s ease;

    @media (max-width: 768px) {
      margin-top: 16px;
      font-size: 0.75rem;
    }

    &:hover {
      gap: 18px;
    }
  }
`;

// ─── Featured Section ─────────────────────────────────────────────────────────
const FeaturedSection = styled(motion.section)`
  padding: 60px 24px 80px;
  background: white;
`;

// ─── Promotional Section ──────────────────────────────────────────────────────
const PromotionalSection = styled.section`
  padding: 120px 0;
  background: ${(props) => props.theme.colors.darkBlue};
  color: white;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 80px 0;
  }
`;

const AmbientOrb = styled.div<{ $size: number; $top: string; $left: string; $delay: string }>`
  position: absolute;
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(100, 160, 230, 1) 0%, transparent 70%);
  top: ${(p) => p.$top};
  left: ${(p) => p.$left};
  animation: ${drift} ${(p) => p.$delay} ease-in-out infinite, ${pulse} 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
`;

const PromoContent = styled.div`
  max-width: 1540px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 80px;
  align-items: center;
  position: relative;
  z-index: 1;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 60px;
    padding: 0 24px;
  }
`;

const CinematicPlayer = styled(motion.div)`
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 40px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: black;

  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.05));
    border-radius: inherit;
    pointer-events: none;
    z-index: 2;
  }

  /* Ambient Glow */
  &::before {
    content: '';
    position: absolute;
    bottom: -40px;
    left: 10%;
    right: 10%;
    height: 80px;
    background: rgba(46, 117, 182, 0.3);
    filter: blur(60px);
    border-radius: 50%;
    z-index: 0;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: relative;
    z-index: 1;
  }

  @media (max-width: 768px) {
    border-radius: 20px;
  }
`;

const PromoText = styled.div`
  h2 {
    font-size: clamp(2.4rem, 4.5vw, 4.2rem);
    font-family: ${(props) => props.theme.fonts.heading};
    margin-bottom: 24px;
    line-height: 1.1;
    color: white;
    font-weight: 900;
    span { color: ${(props) => props.theme.colors.accentBlue}; }

    @media (max-width: 1200px) {
      margin-bottom: 20px;
      text-align: center;
    }
  }

  .section-tagline {
     display: block;
     color: ${(props) => props.theme.colors.ctaBlue};
     font-weight: 800;
     text-transform: uppercase;
     letter-spacing: 5px;
     font-size: 0.9rem;
     margin-bottom: 24px;

     @media (max-width: 1200px) {
       text-align: center;
       width: 100%;
     }
  }

  p {
    font-size: 1.15rem;
    line-height: 1.8;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 48px;
    max-width: 580px;

    @media (max-width: 1200px) {
      font-size: 1.05rem;
      margin-bottom: 32px;
      line-height: 1.7;
      text-align: center;
      margin: 0 auto 32px auto;
    }
  }

  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;

    @media (max-width: 1024px) {
      gap: 16px;
      justify-content: center;
      margin: 0 auto 32px auto;
    }

    .stat-item {
      @media (max-width: 1024px) {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      h4 {
        font-size: 2.2rem;
        font-weight: 900;
        margin-bottom: 6px;
        color: white;
        display: flex;
        align-items: center;

        @media (max-width: 1024px) {
          font-size: 1.5rem;
          justify-content: center;
        }
      }
      span {
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 2px;
        font-weight: 700;
      }
    }
  }

  @media (max-width: 1200px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 0 auto;

    .explore-btn {
      margin: 20px auto 0 auto;
      display: flex !important;
      justify-content: center;
    }
  }
`;

// ─── CTA Section ──────────────────────────────────────────────────────────────
const CtaSection = styled(motion.section)`
  padding: 100px 24px;
  text-align: center;
  background: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 400px;
    background: radial-gradient(ellipse, rgba(46,117,182,0.05) 0%, transparent 70%);
    pointer-events: none;
  }
`;

// ─── Reusable fade-up variant ─────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 50, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }
  }
};

const fadeUpFast = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }
  }
};

const pillarContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const pillarItem = {
  hidden: { opacity: 0, y: 70, scale: 0.94, filter: 'blur(12px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 1,
      ease: [0.16, 1, 0.3, 1] as [number,number,number,number]
    }
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const DiscoverPage = () => {
  const navigate = useNavigate();
  const [counters, setCounters] = useState({ wonders: 0, travelers: 0, rating: 0 });

  // Scroll progress for the top bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Pillar section parallax
  const pillarRef = useRef(null);
  const pillarInView = useInView(pillarRef, { once: true, margin: '-120px' });

  // Hidden gems parallax
  const { scrollY } = useScroll();
  const gemImgY = useTransform(scrollY, [800, 2000], [60, -60]);

  // CTA ref
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: '-80px' });

  // Counting animation triggers when stats come into view
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  useEffect(() => {
    if (!statsInView) return;
    const timer = setInterval(() => {
      setCounters(prev => ({
        wonders: prev.wonders < 15 ? prev.wonders + 1 : 15,
        travelers: prev.travelers < 42 ? prev.travelers + 1 : 42,
        rating: prev.rating < 4.9 ? parseFloat((prev.rating + 0.1).toFixed(1)) : 4.9
      }));
    }, 50);
    return () => clearInterval(timer);
  }, [statsInView]);

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Scroll Progress Bar */}
      <ProgressBar style={{ scaleX }} />

      <HeroSection />

      {/* ── Pillars ── */}
      <PillarsSection ref={pillarRef}>
        <SectionHeader
          variants={fadeUp}
          initial="hidden"
          animate={pillarInView ? 'visible' : 'hidden'}
        >
          <span className="subtitle">The Core Pillars</span>
          <h2>Our commitment to your <br /> extraordinary journey</h2>
        </SectionHeader>

        <motion.div
          variants={pillarContainer}
          initial="hidden"
          animate={pillarInView ? 'visible' : 'hidden'}
        >
          <PillarGrid>
            <PillarCard
              variants={pillarItem}
              whileHover={{ y: -10, boxShadow: '0 30px 70px rgba(0,0,0,0.08)' }}
              onClick={() => navigate('/attractions')}
            >
              <div className="icon-box"><Globe size={30} /></div>
              <h3>Sustainable Tourism</h3>
              <p>We believe in preserving the untouched beauty of Bulusan. Our guides and routes are designed to respect the local ecosystem.</p>
              <div className="explore-link">Explore Attractions <ArrowRight size={18} /></div>
            </PillarCard>

            <PillarCard
              variants={pillarItem}
              whileHover={{ y: -10, boxShadow: '0 30px 70px rgba(0,0,0,0.08)' }}
              onClick={() => navigate('/heritage')}
            >
              <div className="icon-box"><Heart size={30} /></div>
              <h3>Heritage & Culture</h3>
              <p>Bulusan is steeped in centuries of history. Connect with the locals, taste authentic cuisine, and hear the legends of the volcano.</p>
              <div className="explore-link">Meet the people <ArrowRight size={18} /></div>
            </PillarCard>

            <PillarCard
              variants={pillarItem}
              whileHover={{ y: -10, boxShadow: '0 30px 70px rgba(0,0,0,0.08)' }}
              onClick={() => navigate('/explore')}
            >
              <div className="icon-box"><Compass size={30} /></div>
              <h3>Advanced Discovery</h3>
              <p>Our interactive map system allows you to pinpoint local favorites, hidden falls, and the best enterprises in real-time.</p>
              <div className="explore-link">Open Map <ArrowRight size={18} /></div>
            </PillarCard>
          </PillarGrid>
        </motion.div>
      </PillarsSection>

      {/* ── Featured Slideshow ── */}
      <FeaturedSection
        id="featured-discover"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <SectionHeader
          variants={fadeUpFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{ marginBottom: '40px' }}
        >
          <span className="subtitle">Must-See Wonders</span>
          <h2>Featured Destinations</h2>
        </SectionHeader>
        <FeaturedSlideshow />
      </FeaturedSection>

      {/* ── Featured Blog ── */}
      <FeaturedBlogSection />

      {/* ── Promotional Section ── */}
      <PromotionalSection>
        {/* Ambient orbs */}
        <AmbientOrb $size={500} $top="-10%" $left="-5%"  $delay="12s" />
        <AmbientOrb $size={300} $top="60%"  $left="70%"  $delay="18s" />
        <AmbientOrb $size={200} $top="20%"  $left="80%"  $delay="10s" />

        <PromoContent>
          <CinematicPlayer
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <SmartMedia
              type="video"
              src="/Bulusan Promotional Video (All Activities).mp4"
              autoPlay
              loop
              muted
            />
          </CinematicPlayer>

          <PromoText>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <span className="section-tagline">
                Where wonders flow from ridges to reef
              </span>
              <h2>Experience the <span>Authentic Bulusan</span>.</h2>
              <p>
                Bulusan is more than a destination; it is an immersive odyssey through the wildest corners of Sorsogon.
                From the serene emerald waters of the crater lake to the adrenaline of secret waterfalls and the majestic slopes of the volcano,
                discover an adventure where every path leads to a masterpiece of nature.
              </p>

              <motion.button
                onClick={() => navigate('/attractions')}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
                style={{ 
                  background: 'white', 
                  color: '#0b2147', 
                  padding: '16px 40px', 
                  borderRadius: '50px', 
                  border: 'none', 
                  fontWeight: 800, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '1rem',
                  marginTop: '12px'
                }}
                className="explore-btn"
              >
                Start Your Journey <ArrowRight size={20} />
              </motion.button>
            </motion.div>
          </PromoText>
        </PromoContent>
      </PromotionalSection>

      {/* ── CTA ── */}
      <CtaSection
        ref={ctaRef}
        variants={fadeUp}
        initial="hidden"
        animate={ctaInView ? 'visible' : 'hidden'}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <SectionHeader
            variants={fadeUpFast}
            initial="hidden"
            animate={ctaInView ? 'visible' : 'hidden'}
            style={{ marginBottom: '48px' }}
          >
            <span className="subtitle">Adventure Awaits</span>
            <h2>Bulusan is calling. <br /> Will you answer?</h2>
          </SectionHeader>
          <motion.div
            style={{ display: 'flex', justifyContent: 'center' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          >
            <motion.button
              style={{ background: 'var(--cta-blue)', color: 'white', border: 'none', padding: '18px 44px', borderRadius: '60px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(46, 117, 182, 0.25)' }}
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.07, boxShadow: '0 30px 60px rgba(46, 117, 182, 0.35)' }}
              whileTap={{ scale: 0.96 }}
            >
              Join the Adventure <Sparkles size={22} />
            </motion.button>
          </motion.div>
        </div>
      </CtaSection>
    </PageContainer>
  );
};

export default DiscoverPage;
