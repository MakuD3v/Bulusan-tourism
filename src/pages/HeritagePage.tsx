import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeritage as useHeritageHook } from '../hooks/useData';
import { useLocation, useNavigate } from 'react-router-dom';
import { History, MapPin, Landmark, Search, X, Clock, Info, ArrowRight, Star, TrendingUp, Zap, Award } from 'lucide-react';
import { Heritage } from '../data/types';
import StandardPageHeader from '../components/Common/StandardPageHeader';
import SectionHeader from '../components/Common/SectionHeader';
import DiscoveryCard from '../components/Common/DiscoveryCard';
import CentricCarousel from '../components/Common/CentricCarousel';
import SmartMedia from '../components/Common/SmartMedia';
import { dbService } from '../api/db';

const PageContainer = styled(motion.div)`
  background: #f8fafc;
  min-height: 100vh;
  width: 100%;
  padding: 0 var(--section-padding) var(--section-padding);
`;

const HeroSection = styled.section`
  height: 50vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  background: url('https://images.unsplash.com/photo-1590050752117-23a9d7fc20c3?auto=format&fit=crop&q=80') center/cover;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(11, 33, 71, 0.6);
  }
  
  .content {
    position: relative;
    z-index: 1;
    max-width: 800px;
    padding: 0 24px;
    
    h1 { 
      font-size: clamp(2.5rem, 8vw, 4rem); 
      margin-bottom: 16px; 
      font-family: ${(props) => props.theme.fonts.heading}; 
    }
    p { font-size: 1.15rem; opacity: 0.9; letter-spacing: 1px; }

    @media (max-width: 768px) {
      padding: 0 20px;
    }
  }

  @media (max-width: 768px) {
    height: 40vh;
  }
`;

const ContentGrid = styled.div`
  max-width: var(--container-max-width);
  margin: 40px auto 100px auto;
  display: grid;
  gap: 48px;
  position: relative;
  z-index: 2;

  @media (max-width: 968px) {
    margin-top: 16px;
    margin-bottom: 60px;
    gap: 32px;
    padding: 0 16px;
    overflow-x: hidden;
  }
`;

const HistoryCard = styled(motion.div)`
  background: ${(props) => props.theme.glass.background};
  backdrop-filter: ${(props) => props.theme.glass.filter};
  border: ${(props) => props.theme.glass.border};
  border-radius: 32px;
  overflow: hidden;
  box-shadow: ${(props) => props.theme.glass.shadow};
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 500px;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    min-height: auto;
    border-radius: 24px;
  }
  
  .image-side {
    background-size: cover;
    background-position: center;
    position: relative;
    background-color: #e2e8f0;
    
    &::after {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(to right, rgba(0,0,0,0.2), transparent);
    }
  }
  
  .text-side {
    padding: 64px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    @media (max-width: 768px) {
      padding: 32px 24px;
    }
    
    .period {
      color: ${(props) => props.theme.colors.ctaBlue};
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 16px;
      font-size: 0.75rem;

      @media (max-width: 768px) {
        letter-spacing: 2px;
        margin-bottom: 12px;
      }
    }
    
    h2 { 
      font-size: 2.8rem; 
      margin-bottom: 24px; 
      color: ${(props) => props.theme.colors.darkBlue};
      font-family: ${(props) => props.theme.fonts.heading};
      font-weight: 900;
      line-height: 1.1;

      @media (max-width: 768px) {
        font-size: 1.65rem;
        margin-bottom: 16px;
      }
    }
    
    p { 
      line-height: 1.8; 
      color: var(--text-light); 
      margin-bottom: 20px; 
      font-size: 1.1rem;
      opacity: 0.9;

      @media (max-width: 768px) {
        font-size: 0.95rem;
        line-height: 1.6;
        margin-bottom: 16px;
      }
    }
    
    .significance {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 32px;
      background: rgba(46, 117, 182, 0.05);
      border-radius: 20px;
      font-style: italic;
      color: #475569;
      margin-top: 12px;
      border: 1px solid rgba(46, 117, 182, 0.1);

      @media (max-width: 768px) {
        padding: 20px;
        font-size: 0.85rem;
        gap: 12px;
      }
    }
  }
  
  &:nth-child(even) {
    .image-side { order: 2; }
    .text-side { order: 1; }
  }
`;

const SectionHeaderWrapper = styled.div`
  width: 100%;
  text-align: center;
  margin-bottom: 24px;
  overflow: hidden;

  @media (max-width: 968px) {
    margin-bottom: 8px;
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

/* Shown on desktop (≥969px), hidden on mobile */
const DesktopCards = styled.div`
  display: contents;

  @media (max-width: 968px) {
    display: none;
  }
`;

/* Hidden on desktop, shown on mobile (≤968px) */
const MobileGrid = styled.div`
  display: none;

  @media (max-width: 968px) {
    display: block;
    width: 100%;
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
  max-width: 900px;
  max-height: 90vh;
  box-shadow: 0 40px 100px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const ModalBody = styled.div`
  padding: 40px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 24px;
  }

  .period {
    color: ${(props) => props.theme.colors.ctaBlue};
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 4px;
    margin-bottom: 12px;
    font-size: 0.75rem;
  }

  h2 {
    font-size: 2.2rem;
    color: ${(props) => props.theme.colors.darkBlue};
    font-family: ${(props) => props.theme.fonts.heading};
    margin-bottom: 24px;
    line-height: 1.2;
  }

  .history-text {
    line-height: 1.8;
    color: #475569;
    font-size: 1.05rem;
    margin-bottom: 32px;
  }
  
  .significance-box {
    padding: 32px;
    background: rgba(46, 117, 182, 0.05);
    border-radius: 24px;
    display: flex;
    gap: 20px;
    border: 1px solid rgba(46, 117, 182, 0.1);
    
    @media (max-width: 768px) {
      padding: 20px;
      flex-direction: column;
      gap: 12px;
    }
    
    strong { color: ${(props) => props.theme.colors.darkBlue}; }
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  max-width: var(--container-max-width);
  margin-left: auto;
  margin-right: auto;
  align-items: center;
  width: 100%;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: var(--surface-bg);
  padding: 10px 20px;
  border-radius: 30px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: ${(props) => props.theme.shadows.soft};
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: 460px;

  @media (max-width: 968px) {
    max-width: 100%;
  }

  input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 0.95rem;
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

export default function HeritagePage() {
  const { data: items, loading } = useHeritageHook([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<Heritage | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.significance && item.significance.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={!loading ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <StandardPageHeader
        tagline="Echoes of Time & Tradition"
        title="OUR HERITAGE"
        statementContent={{
          thin: "Walking through the",
          bold: "Ancestral",
          accent: "Sanctuary"
        }}
        description="Discover the layered stories, architectural marvels, and preserved customs that define the resilient spirit of Bulusan."
        isStatic
      />

      <ControlsContainer>
        <SearchBar>
          <Search size={20} color="#888" />
          <input
            type="text"
            placeholder="Search historical sites..."
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
      </ControlsContainer>

      <ContentGrid>
        {items.length > 0 && search === '' && (
          <div style={{ marginBottom: '40px' }}>
            <SectionHeader
              subtitle="Ancient Echoes"
              title={<>Featured <span style={{ color: 'var(--cta-blue)' }}>Landmarks</span></>}
            />
            <CentricCarousel
              items={items.slice(0, 5)}
              renderItem={(item) => (
                <DiscoveryCard
                  image={item.img || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80'}
                  category={item.period}
                  title={item.name}
                  description={item.significance}
                  location="Bulusan, Sorsogon"
                  onClick={() => {
                    setSelectedItem(item);
                    if (item.id) dbService.trackInteraction('heritage', item.id);
                  }}
                />
              )}
            />
          </div>
        )}

        <SectionHeaderWrapper>
          <SectionHeader
            subtitle="Legacy of Sorsogon"
            title={<>Historical <span style={{ color: 'var(--cta-blue)' }}>Landmarks</span></>}
          />
        </SectionHeaderWrapper>

        {filteredItems.length > 0 ? (
          <>
            {/* Desktop View: Interactive History Timeline Cards — shown via CSS on desktop */}
            <DesktopCards>
              {filteredItems.map((item, idx) => (
                <HistoryCard
                  key={`desktop-${item.id || idx}`}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="connector" />
                  <div className="dot" />
                  <div className="content">
                    <div className="period">{item.period}</div>
                    <div className="inner">
                      <div className="image-side">
                        <SmartMedia type="img" src={item.img || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80'} alt={item.name} />
                      </div>
                      <div className="text-side">
                        <h3>{item.name}</h3>
                        <p>{item.significance}</p>
                        <button onClick={() => {
                          setSelectedItem(item);
                          if (item.id) dbService.trackInteraction('heritage', item.id);
                        }}>
                          Read Full Story <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </HistoryCard>
              ))}
            </DesktopCards>

            {/* Mobile/Tablet View: High-Density Grid — shown via CSS on mobile */}
            <MobileGrid>
              <Grid>
                {filteredItems.map((item, idx) => {
                  let badge: 'new' | 'top' | 'trending' | 'featured' | 'most-visited' | undefined = undefined;
                  if ((item.rating || 0) >= 4.7) badge = 'top';
                  else if ((item.visits || 0) >= 30) badge = 'trending';

                  return (
                    <DiscoveryCard
                      key={`mobile-${item.id || idx}`}
                      image={item.img || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80'}
                      category={item.period}
                      title={item.name}
                      description={item.significance}
                      location="Bulusan, Sorsogon"
                      index={idx}
                      rating={item.rating}
                      badge={badge}
                      onClick={() => {
                        setSelectedItem(item);
                        if (item.id) dbService.trackInteraction('heritage', item.id);
                      }}
                    />
                  );
                })}
              </Grid>
            </MobileGrid>
          </>
        ) : !loading ? (
          <div style={{ textAlign: 'center', padding: '100px', background: 'var(--surface-bg)', borderRadius: 24 }}>
            <History size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <p style={{ color: '#94a3b8' }}>No heritage stories shared yet. Check back soon!</p>
          </div>
        ) : null}
      </ContentGrid>

      {/* Heritage Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <ModalContent
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ position: 'relative', height: '350px', background: '#eee' }}>
                <SmartMedia type="img" src={selectedItem.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  onClick={() => setSelectedItem(null)}
                  style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--surface-bg)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                  <X size={24} />
                </button>
              </div>
              <ModalBody>
                <div className="period">{selectedItem.period}</div>
                <h2>{selectedItem.name}</h2>
                <div className="history-text">
                  <p>{selectedItem.description}</p>
                  <p>{selectedItem.fullHistory}</p>
                </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <div className="significance-box" style={{ flex: 1 }}>
                      <Landmark size={28} color="var(--cta-blue)" style={{ flexShrink: 0 }} />
                      <div>
                        <strong>Historical Significance</strong>
                        <div style={{ marginTop: '8px', color: 'var(--text-light)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                          {selectedItem.significance}
                        </div>
                      </div>
                    </div>
                    {selectedItem.coordinates && (
                      <button 
                        onClick={() => navigate(`/explore?lat=${selectedItem.coordinates.lat}&lng=${selectedItem.coordinates.lng}&name=${encodeURIComponent(selectedItem.name)}&autoRoute=true`)}
                        style={{ background: 'var(--surface-bg)', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e: any) => { e.currentTarget.style.borderColor = 'var(--cta-blue)'; e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseOut={(e: any) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
                      >
                        <MapPin size={24} color="var(--cta-blue)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--dark-blue)', textTransform: 'uppercase' }}>On Map</span>
                      </button>
                    )}
                  </div>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
