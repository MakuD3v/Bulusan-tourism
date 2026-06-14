import styled from 'styled-components';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { MapPin, Mail, Phone } from 'lucide-react';

const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const TwitterIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const YoutubeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main<{ $isHeroPage: boolean }>`
  flex: 1;
  /* Top padding ensures content starts below header EXCEPT on Hero pages */
  padding-top: ${(props) => (props.$isHeroPage ? '0' : '72px')}; 
  
  @media (max-width: 1024px) {
    padding-top: ${(props) => (props.$isHeroPage ? '0' : '64px')};
  }
`;

const Footer = styled.footer`
  background: #0B2147;
  color: white;
  padding: clamp(2rem, 4vw, 3rem) 2rem 1.5rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding-bottom: 5rem;
    
    &.hide-on-mobile {
      display: none !important;
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 1px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent);
  }
  
  .footer-content {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .footer-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
    
    img {
      height: 80px;
      object-fit: contain;
    }
  }

  .footer-info {
    text-align: center;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.6;
    margin-bottom: 8px;
    
    p {
      margin: 4px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  }

  .social-icons {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    
    a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      background: rgba(255,255,255,0.03);
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.07);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        background: ${(props) => props.theme.colors.ctaBlue};
        color: white;
        transform: translateY(-4px);
        border-color: transparent;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      }
    }
  }

  .copyright {
    font-size: 0.75rem;
    opacity: 0.4;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 16px;
    width: 100%;
    text-align: center;
    letter-spacing: 0.5px;
    font-weight: 400;
  }
`;

const PersistentLayout = () => {
  const location = useLocation();
  const isHeroPage = location.pathname === '/' || location.pathname === '/discover';

  return (
    <LayoutWrapper>
      <div className="bg-overlay" />
      <Header isTransparent={isHeroPage} />
      <MainContent $isHeroPage={isHeroPage}>
        <Outlet />
      </MainContent>
      <Footer>
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/bulusan_logo_black.png" alt="Bulusan Tourism" />
          </div>
          
          <div className="footer-info">
            <p style={{ gap: '16px' }}>
              <span><Mail size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> bulusantourism@gmail.com</span>
              <span><Phone size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> +63-908-446-6527</span>
            </p>
          </div>

          <div className="social-icons">
            <a href="https://www.facebook.com/bulusan.phl.tourism" target="_blank" rel="noreferrer" aria-label="Facebook"><FacebookIcon size={18} /></a>
            <a href="https://www.instagram.com/bulusanphltourism/" target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon size={18} /></a>
            <a href="https://www.tiktok.com/@bulusantourismphl" target="_blank" rel="noreferrer" aria-label="TikTok"><TikTokIcon size={18} /></a>
            <a href="https://x.com/bulusantourism" target="_blank" rel="noreferrer" aria-label="X (Twitter)"><TwitterIcon size={18} /></a>
            <a href="https://www.youtube.com/@BulusanPhlTourism" target="_blank" rel="noreferrer" aria-label="YouTube"><YoutubeIcon size={18} /></a>
          </div>
          <div className="copyright">
            &copy; {new Date().getFullYear()} Bulusan Tourism Development Office. High-Fidelity Platform by Blueprint.
          </div>
        </div>
      </Footer>
    </LayoutWrapper>
  );
};

export default PersistentLayout;
