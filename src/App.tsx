import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PersistentLayout from './components/Layout/PersistentLayout';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminRoute from './components/Layout/AdminRoute';
import OwnerRoute from './components/Layout/OwnerRoute';
import DiscoverPage from './pages/DiscoverPage';
import AdminDashboard from './pages/AdminDashboard';
import AttractionsPage from './pages/AttractionsPage';
import EnterprisesPage from './pages/EnterprisesPage';
import ToursAndMapPage from './pages/ToursAndMapPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import HeritagePage from './pages/HeritagePage';
import AdminPortalPage from './pages/AdminPortalPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AccountPage from './pages/AccountPage';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerPendingPage from './pages/OwnerPendingPage';
import { useAuth } from './hooks/useAuth';
import UserRoute from './components/Layout/UserRoute';
import { useEffect } from 'react';
import VisitorTracker from './components/Common/VisitorTracker';
import { preloadCollection } from './hooks/useData';
import { AlertProvider } from './components/Common/AlertProvider';

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="popLayout">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Owner pending page */}
        <Route path="/owner-pending" element={<OwnerPendingPage />} />

        {/* ── PUBLIC PAGES — Original header + footer layout ── */}
        <Route element={<PersistentLayout />}>
          <Route path="/" element={<DiscoverPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/attractions" element={<AttractionsPage />} />
          <Route path="/enterprises" element={<EnterprisesPage />} />
          <Route path="/heritage" element={<HeritagePage />} />
          <Route path="/explore" element={<ToursAndMapPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* ── DASHBOARD PAGES — Dark sidebar layout ── */}
        <Route element={<DashboardLayout />}>
          {/* My Account */}
          <Route element={<UserRoute />}>
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* Owner Dashboard */}
          <Route element={<OwnerRoute />}>
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-portal" element={<AdminPortalPage />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    // Pre-warm the cache for instant navigation
    preloadCollection('attractions');
    preloadCollection('enterprises');
    preloadCollection('heritage');
    preloadCollection('blogs');
  }, []);

  return (
    <AlertProvider>
      <BrowserRouter>
        <VisitorTracker />
        <AnimatedRoutes />
      </BrowserRouter>
    </AlertProvider>
  );
}

export default App;
