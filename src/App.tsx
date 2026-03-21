import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary
import AuthProvider, { useAuth } from './contexts/AuthContext'; // Import from new context file
import { syncThemePreference, themePreferenceEventName } from './utils/themePreference';

// Lazy load pages for better performance and clear separation
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))



const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const ThemeBootstrap = () => {
  useEffect(() => {
    const syncTheme = () => {
      syncThemePreference(window.localStorage.getItem('robo_user_email'));
    };

    syncTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => syncTheme();

    window.addEventListener('storage', syncTheme);
    window.addEventListener(themePreferenceEventName, syncTheme as EventListener);
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener(themePreferenceEventName, syncTheme as EventListener);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return null;
};

function App() {
  return (
    <Router>
      <ErrorBoundary> {/* Wrap Routes with ErrorBoundary */}
        <AuthProvider>
          <ThemeBootstrap />
          <Suspense fallback={
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-primary)', color: 'var(--accent-blue)' }}>
              <div style={{ fontSize: 'var(--font-size-lg)' }} className="loader">Loading RoboMedic...</div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  )
}

export default App
