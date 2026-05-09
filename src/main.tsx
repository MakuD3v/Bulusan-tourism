import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from 'styled-components'
import { lightTheme, darkTheme } from './styles/theme'
import GlobalStyles from './styles/GlobalStyles'
import { AuthProvider } from './hooks/useAuth'
import { ThemeContextProvider, useThemeMode } from './hooks/useTheme'

const RootApp = () => {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <GlobalStyles />
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeContextProvider>
        <RootApp />
      </ThemeContextProvider>
    </AuthProvider>
  </React.StrictMode>,
)
