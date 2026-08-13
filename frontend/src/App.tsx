import React, { useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ColorModeContext } from './contexts/ColorModeContext';
import { getTheme, type ColorMode } from './theme';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import WeekDetailPage from './pages/WeekDetailPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ClosedProjectsPage from './pages/ClosedProjectsPage';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/projects/:projectId" element={<RequireAuth><ProjectDetailPage /></RequireAuth>} />
      <Route path="/closed" element={<RequireAuth><ClosedProjectsPage /></RequireAuth>} />
      <Route path="/weekly" element={<RequireAuth><MainPage /></RequireAuth>} />
      <Route path="/weeks/:weekId" element={<RequireAuth><WeekDetailPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAdmin><SettingsPage /></RequireAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<ColorMode>(
    () => (localStorage.getItem('colorMode') as ColorMode) || 'light'
  );
  const colorMode = useMemo(() => ({
    mode,
    toggle: () => setMode((m) => {
      const next: ColorMode = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    }),
  }), [mode]);
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
