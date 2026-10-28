import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './pages/ProtectedRoute';
import RouteFallback from './components/shared/RouteFallback';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Classifier = lazy(() => import('./pages/Classifier'));
const SpectralAnalysis = lazy(() => import('./pages/SpectralAnalysis'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NetworkMonitor = lazy(() => import('./pages/NetworkMonitor'));
const SignUpPage = lazy(() => import('./pages/SignUp'));
const PageNotFound = lazy(() => import('./pages/Page404'));

/**
 * Route table. Pages are code-split so the initial bundle does not ship
 * three.js, mapbox or the charting packages to marketing visitors. The
 * Suspense boundary lives in AppLayout, so the navbar/footer stay mounted
 * while a page chunk loads.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="About" element={<About />} />
        <Route path="Classifier" element={<Classifier />} />
      </Route>

      <Route element={<AppLayout showFooter={false} />}>
        <Route path="SpectralAnalysis" element={<SpectralAnalysis />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="Dashboard" element={<Dashboard />} />
          <Route path="NetworkMonitor" element={<NetworkMonitor />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Route>

      <Route
        path="SignUp"
        element={
          <Suspense fallback={<RouteFallback />}>
            <SignUpPage />
          </Suspense>
        }
      />

      {/* Friendly lowercase aliases for the capitalized canonical routes. */}
      <Route path="dashboard" element={<Navigate to="/Dashboard" replace />} />
      <Route path="network-monitor" element={<Navigate to="/NetworkMonitor" replace />} />
      <Route path="classifier" element={<Navigate to="/Classifier" replace />} />
      <Route path="spectral-analysis" element={<Navigate to="/SpectralAnalysis" replace />} />
      <Route path="about" element={<Navigate to="/About" replace />} />
    </Routes>
  );
}
