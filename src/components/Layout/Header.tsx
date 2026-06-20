import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, UserCircle, LogOut, Settings, LayoutDashboard, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const LogoImageSrc = '/real_bulusan_logo.png';

const HeaderContainer = styled.header<{ $transparent: boolean; $scrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(12px, 2vh, 16px) var(--section-padding);
  background: ${(props) => (!props.$scrolled && props.$transparent ? 'transparent' : props.theme.glass.background)};
  backdrop-filter: ${(props) => (!props.$scrolled && props.$transparent ? 'none' : props.theme.glass.filter)};
  border-bottom: ${(props) => (!props.$scrolled && props.$transparent ? 'none' : props.theme.glass.border)};
  color: ${(props) => (!props.$scrolled && props.$transparent ? 'white' : props.theme.colors.darkBlue)};
  transition: all 0.3s ease;
  box-shadow: ${(props) => (!props.$scrolled && props.$transparent ? 'none' : props.theme.glass.shadow)};

  @media (max-width: 1024px) {
    padding: 12px 24px;
  }
`;

const LogoWrapper = styled(Link)`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
`;

const LogoImage = styled.img`
  height: 48px;
  width: auto;
  object-fit: contain;
`;

const LogoTextContent = styled.div<{ $transparent: boolean, $scrolled: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;

  .main-text {
    font-family: 'Barabara', sans-serif;
    font-size: 1.3rem;
    font-weight: normal;
    background: linear-gradient(90deg, #1d4ed8, #0ea5e9, #22c55e, #eab308, #ec4899, #b91c1c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
    text-transform: uppercase;
  }

  .sub-text {
    font-family: 'Barabara', sans-serif;
    font-size: 1.3rem;
    font-weight: normal;
    color: ${(props) => (!props.$scrolled && props.$transparent ? 'white' : props.theme.colors.darkBlue)};
    line-height: 1;
    letter-spacing: 1px;
    text-transform: uppercase;

    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const NavLinks = styled.nav`
  flex: 2;
  display: flex;
  justify-content: center;
  gap: 24px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const NavItem = styled(Link) <{ $active: boolean }>`
  font-size: 0.85rem;
  font-weight: 700;
  color: inherit;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-width: 80px;
  text-decoration: none;
  opacity: ${(props) => props.$active ? 1 : 0.7};
  white-space: nowrap;

  .nav-text {
    display: block;
    transition: opacity 0.3s ease;
  }

  &::after {
    content: attr(data-baybayin);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    text-align: center;
    transition: all 0.3s ease;
    font-size: 1.1rem;
    opacity: 0;
    font-weight: bold;
    color: var(--cta-blue);
    pointer-events: none;
  }

  &:hover { 
    opacity: 1;
    .nav-text { opacity: 0; }
    &::after { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  }
`;

const IconGroup = styled.div`
  flex: 1;
  justify-content: flex-end;
  display: flex;
  gap: 20px;
  align-items: center;
  position: relative;

  @media (max-width: 768px) {
    gap: 16px;
  }

  svg {
    cursor: pointer;
    transition: transform 0.2s;
    &:hover { transform: scale(1.1); }
  }
`;

const MobileMenuBtn = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 8px;
  z-index: 1100;

  @media (max-width: 1024px) {
    display: flex;
  }
`;

const MobileDrawer = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  width: 85%;
  max-width: 320px;
  height: 100vh;
  background: var(--surface-bg);
  z-index: 1100;
  padding: 80px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.1);
`;

const MobileBackdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  z-index: 1050;
`;

const MobileNavItem = styled(Link)`
  font-size: 1.5rem;
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 800;
  text-decoration: none;
  color: var(--dark-blue);
  display: flex;
  flex-direction: column;

  .baybayin {
    font-size: 0.8rem;
    color: var(--cta-blue);
    font-weight: 500;
    margin-bottom: 2px;
    letter-spacing: 2px;
  }
`;

const UserMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 220px;
  background: var(--surface-bg);
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--dark-blue);
  border: 1px solid rgba(0,0,0,0.05);
`;

const MenuLink = styled(Link)`
  padding: 10px 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: #475569;
  text-decoration: none;
  &:hover { background: #f1f5f9; color: var(--cta-blue); }
`;

const LogoutBtn = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  color: #ef4444;
  margin-top: 4px;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
  &:hover { background: #fef2f2; }
`;

const Header = ({ isTransparent }: { isTransparent: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <HeaderContainer $transparent={isTransparent} $scrolled={isScrolled}>
      <LogoWrapper to="/">
        <LogoImage src={LogoImageSrc} alt="Bulusan Tourism Logo" />
        <LogoTextContent $transparent={isTransparent} $scrolled={isScrolled}>
          <span className="main-text">Bulusan</span>
          <span className="sub-text">Tourism</span>
        </LogoTextContent>
      </LogoWrapper>
      
      <NavLinks>
        {[
          { path: '/discover', label: 'Discover', baybayin: 'ᜆᜓᜃ᜔ᜎᜐ᜔' },
          { path: '/attractions', label: 'Attractions', baybayin: 'ᜆᜈ᜔ᜌᜄ᜔' },
          { path: '/enterprises', label: 'Enterprises', baybayin: 'ᜆᜓᜎᜓᜌ᜔' },
          { path: '/explore', label: 'Tours & Map', baybayin: 'ᜎᜌᜄ᜔' },
          { path: '/blog', label: 'Blog', baybayin: 'ᜃᜓᜏᜒᜈ᜔ᜆᜓ' },
          { path: '/contact', label: 'Contact', baybayin: 'ᜂᜐᜉ᜔' }
        ].filter(item => !(item as any).adminOnly || role === 'ADMIN').map(item => (
          <NavItem
            key={item.path}
            to={item.path}
            $active={location.pathname === item.path || (item.path === '/discover' && location.pathname === '/')}
            data-baybayin={item.baybayin}
          >
            <span className="nav-text">{item.label}</span>
          </NavItem>
        ))}
      </NavLinks>

      <IconGroup>
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Toggle Dark Mode">
          {mode === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        {user ? (
          <div style={{ position: 'relative' }}>
          <div
              onClick={() => setShowMenu(!showMenu)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--cta-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', flexShrink: 0 }}>
                {user.avatar 
                  ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>{user.name?.charAt(0).toUpperCase()}</span>
                }
              </div>
            </div>
            <AnimatePresence>
              {showMenu && (
                <UserMenu
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                >
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {user.avatar 
                        ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>{user.name?.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{user.email}</div>
                    </div>
                  </div>
                  <MenuLink to="/account" onClick={() => setShowMenu(false)}><UserCircle size={16} /> My Account</MenuLink>
                  {role === 'ADMIN' && (
                    <MenuLink to="/admin-portal" onClick={() => setShowMenu(false)}><LayoutDashboard size={16} /> Admin Dashboard</MenuLink>
                  )}
                  {role === 'OWNER' && (
                    <MenuLink to="/owner-dashboard" onClick={() => setShowMenu(false)}><LayoutDashboard size={16} /> Owner Dashboard</MenuLink>
                  )}
                  <LogoutBtn onClick={() => { logout(); navigate('/'); setShowMenu(false); }}>
                    <LogOut size={16} /> Sign Out
                  </LogoutBtn>
                </UserMenu>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link to="/login" style={{ color: !isScrolled && isTransparent && !isMobileMenuOpen ? 'rgba(255,255,255,0.7)' : '#94a3b8', display: 'flex', transition: 'color 0.2s' }}><UserCircle size={26} strokeWidth={2} /></Link>
        )}

        <MobileMenuBtn onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} style={{ color: 'var(--dark-blue)' }} /> : <Menu size={24} />}
        </MobileMenuBtn>
      </IconGroup>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <MobileBackdrop
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <MobileDrawer
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {[
                { path: '/discover', label: 'Discover', baybayin: 'ᜆᜓᜃ᜔ᜎᜐ᜔' },
                { path: '/attractions', label: 'Attractions', baybayin: 'ᜆᜈ᜔ᜌᜄ᜔' },
                { path: '/enterprises', label: 'Enterprises', baybayin: 'ᜆᜓᜎᜓᜌ᜔' },
                { path: '/explore', label: 'Tours & Map', baybayin: 'ᜎᜌᜄ᜔' },
                { path: '/blog', label: 'Blog', baybayin: 'ᜃᜓᜏᜒᜈ᜔ᜆᜓ' },
                { path: '/contact', label: 'Contact', baybayin: 'ᜂᜐᜉ᜔' }
              ].filter(item => !(item as any).adminOnly || role === 'ADMIN').map(item => (
                <MobileNavItem key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="baybayin">{item.baybayin}</span>
                  {item.label}
                </MobileNavItem>
              ))}
            </MobileDrawer>
          </>
        )}
      </AnimatePresence>
    </HeaderContainer>
  );
};

export default Header;
