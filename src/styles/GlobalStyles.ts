import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    color-scheme: light;
    --primary-blue: #0045A5;
    --dark-blue: #0B2147;
    --cta-blue: #2E75B6;
    --light-bg: #F8FAFC;
    --text-dark: #1E293B;
    --text-light: #64748B;
    
    /* Responsive Spacing Variables */
    --section-padding: clamp(3rem, 8vw, 6rem);
    --container-max-width: 1280px;
    --border-radius-lg: 24px;
    --border-radius-md: 16px;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${(props) => props.theme.fonts.body};
    font-size: ${(props) => props.theme.fontSizes.body};
    line-height: 1.7;
    background-color: ${(props) => props.theme.colors.lightBg};
    color: ${(props) => props.theme.colors.textDark};
    -webkit-font-smoothing: antialiased;
    letter-spacing: -0.01em;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${(props) => props.theme.fonts.heading};
    font-weight: 700;
    color: ${(props) => props.theme.colors.darkBlue};
    line-height: 1.2;
  }

  h1 { font-size: ${(props) => props.theme.fontSizes.h1}; }
  h2 { font-size: ${(props) => props.theme.fontSizes.h2}; }
  h3 { font-size: ${(props) => props.theme.fontSizes.h3}; }

  a {
    text-decoration: none;
    color: inherit;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Custom Scrollbar for premium feel */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #f8fafc;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
    border: 2px solid #f8fafc;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Global background layer */
  .bg-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: 
      radial-gradient(circle at 10% 20%, rgba(46, 117, 182, 0.03) 0%, transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(0, 69, 165, 0.02) 0%, transparent 40%);
    z-index: -1;
    pointer-events: none;
  }
`;

export default GlobalStyles;
