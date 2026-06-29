import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PersistentLayout from './components/Layout/PersistentLayout';
import DashboardLayout from './components/Layout/DashboardLayout';
import AdminRoute from './components/Layout/AdminRoute';
import OwnerRoute from './components/Layout/OwnerRoute';
import { Suspense, lazy, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import UserRoute from './components/Layout/UserRoute';
import PageLoader from './components/Common/PageLoader';

// Lazy loaded pages
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AttractionsPage = lazy(() => import('./pages/AttractionsPage'));
const EnterprisesPage = lazy(() => import('./pages/EnterprisesPage'));
const ToursAndMapPage = lazy(() => import('./pages/ToursAndMapPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));
const OwnerPendingPage = lazy(() => import('./pages/OwnerPendingPage'));
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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    // Pre-warm the cache for instant navigation
    preloadCollection('attractions');
    preloadCollection('enterprises');
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
