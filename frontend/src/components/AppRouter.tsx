import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import MainLayout from './Layout/MainLayout';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Projects = React.lazy(() => import('../pages/Projects'));
const Documents = React.lazy(() => import('../pages/Documents'));
const Upload = React.lazy(() => import('../pages/Upload'));
const Training = React.lazy(() => import('../pages/Training'));
const Analytics = React.lazy(() => import('../pages/Analytics'));
const Settings = React.lazy(() => import('../pages/Settings'));

// Legacy wizard component (for backward compatibility)
const MainWizard = React.lazy(() => import('./MainWizard'));

const LoadingFallback: React.FC<{ pageName?: string }> = ({ pageName }) => (
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    minHeight="60vh"
    gap={2}
  >
    <CircularProgress size={48} />
    <Typography variant="h6" color="textSecondary">
      Loading {pageName || 'page'}...
    </Typography>
  </Box>
);

const AppRouter: React.FC = () => {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Main application pages */}
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<LoadingFallback pageName="Dashboard" />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/projects"
            element={
              <Suspense fallback={<LoadingFallback pageName="Projects" />}>
                <Projects />
              </Suspense>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <Suspense fallback={<LoadingFallback pageName="Project Details" />}>
                <Projects />
              </Suspense>
            }
          />
          <Route
            path="/documents"
            element={
              <Suspense fallback={<LoadingFallback pageName="Documents" />}>
                <Documents />
              </Suspense>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <Suspense fallback={<LoadingFallback pageName="Document Details" />}>
                <Documents />
              </Suspense>
            }
          />
          <Route
            path="/upload"
            element={
              <Suspense fallback={<LoadingFallback pageName="Upload" />}>
                <Upload />
              </Suspense>
            }
          />
          <Route
            path="/training"
            element={
              <Suspense fallback={<LoadingFallback pageName="Training" />}>
                <Training />
              </Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<LoadingFallback pageName="Analytics" />}>
                <Analytics />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<LoadingFallback pageName="Settings" />}>
                <Settings />
              </Suspense>
            }
          />

          {/* Legacy wizard route (for backward compatibility) */}
          <Route
            path="/wizard"
            element={
              <Suspense fallback={<LoadingFallback pageName="Wizard" />}>
                <MainWizard />
              </Suspense>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
};

export default AppRouter;