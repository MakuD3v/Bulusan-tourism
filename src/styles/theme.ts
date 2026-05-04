import 'styled-components';

export const theme = {
  colors: {
    primaryBlue: '#0045A5',
    darkBlue: '#0B2147',
    ctaBlue: '#2E75B6',
    softBlue: '#E1E9F1',
    accentBlue: '#7BB9E8',
    lightBg: '#F8FAFC',
    white: '#FFFFFF',
    textDark: '#1E293B',
    textLight: '#475569',
  },
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  fontSizes: {
    h1: 'clamp(2.2rem, 7vw, 4rem)',
    h2: 'clamp(1.6rem, 4vw, 2.2rem)',
    h3: 'clamp(1.1rem, 2vw, 1.4rem)',
    body: '0.975rem',
    small: '0.825rem'
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2.5rem',
    xl: '4rem',
    xxl: '6rem'
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    filter: 'blur(16px)',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
  },
  shadows: {
    card: '0 10px 40px -10px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(46, 117, 182, 0.15)',
    soft: '0 4px 20px rgba(0, 0, 0, 0.03)'
  }
};

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: typeof theme.colors;
    fonts: typeof theme.fonts;
    fontSizes: typeof theme.fontSizes;
    spacing: typeof theme.spacing;
    glass: typeof theme.glass;
    shadows: typeof theme.shadows;
  }
}
