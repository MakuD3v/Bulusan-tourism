import styled from 'styled-components';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { Globe, Camera, MessageCircle, PlayCircle, MapPin, Mail, Phone, Music } from 'lucide-react';

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
            <p><MapPin size={16} /> Office of the Municipal Tourism Officer (OMTO), LGU Bulusan, Brgy. Central, Bulusan, Sorsogon, 4704, Philippines</p>
            <p style={{ gap: '16px' }}>
              <span><strong>Office Hours:</strong> Monday to Friday | 8:00 AM – 5:00 PM</span>
            </p>
            <p style={{ gap: '16px' }}>
              <span><Mail size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> bulusantourism@gmail.com</span>
              <span><Phone size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> +63-908-446-6527</span>
            </p>
          </div>

          <div className="social-icons">
            <a href="https://www.facebook.com/bulusan.phl.tourism" target="_blank" rel="noreferrer" aria-label="Facebook"><Globe size={18} /></a>
            <a href="https://www.instagram.com/bulusanphltourism/" target="_blank" rel="noreferrer" aria-label="Instagram"><Camera size={18} /></a>
            <a href="https://www.tiktok.com/@bulusantourismphl" target="_blank" rel="noreferrer" aria-label="TikTok"><Music size={18} /></a>
            <a href="https://x.com/bulusantourism" target="_blank" rel="noreferrer" aria-label="X (Twitter)"><MessageCircle size={18} /></a>
            <a href="https://www.youtube.com/@BulusanPhlTourism" target="_blank" rel="noreferrer" aria-label="YouTube"><PlayCircle size={18} /></a>
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
