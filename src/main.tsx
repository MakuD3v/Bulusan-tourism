import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from 'styled-components'
import { theme } from './styles/theme'
import GlobalStyles from './styles/GlobalStyles'
import { AuthProvider } from './hooks/useAuth'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
