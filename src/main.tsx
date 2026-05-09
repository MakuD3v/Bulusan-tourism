import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from 'styled-components'
import { lightTheme, darkTheme } from './styles/theme'
import GlobalStyles from './styles/GlobalStyles'
import { AuthProvider } from './hooks/useAuth'
import { ThemeContextProvider, useThemeMode } from './hooks/useTheme'
import { GoogleOAuthProvider } from '@react-oauth/google'

const RootApp = () => {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <GlobalStyles />
      <App />
    </ThemeProvider>
  );
};

// Use an environment variable for the client ID. The user must define VITE_GOOGLE_CLIENT_ID in their .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeContextProvider>
          <RootApp />
        </ThemeContextProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
