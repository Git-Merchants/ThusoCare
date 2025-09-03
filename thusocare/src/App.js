import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './Pages/Landing';
import LoginPage from './Pages/Login';
import HealthProfile from './Pages/HealthProfile';
import PatientDashboard from './Pages/PatientProfile';
import SignUp from './Pages/Signup';
import Home from './Pages/Home';
import FaceAuth from './Pages/FaceAuth';
import VideoCall from './Pages/VideoCall';
import QuickMedicHelp from './Pages/QuickMedicHelp';
import DocDashboard from './Pages/DocDashboard';
import { TranslationProvider } from './context/TranslationContext';
import { useAuth } from './context/AuthContext'; // Only import useAuth, not AuthProvider
import './App.css';

// Placeholder component for consistent layout
const AuthLayout = ({ children }) => (
  <div className="auth-layout">{children}</div>
);

// The RequireAuth component with better debugging
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('RequireAuth - user:', user, 'loading:', loading);
    
    if (!loading && !user) {
      console.log('RequireAuth: Redirecting to login - no user found');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    console.log('RequireAuth: Still loading auth state');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log('RequireAuth: No user, returning null');
    return null;
  }

  console.log('RequireAuth: User authenticated, rendering children');
  return children;
};

// Main App component - REMOVED AuthProvider (it's already in index.js)
function App() {
  console.log('App component rendering');

  return (
    // Only TranslationProvider here - AuthProvider is in index.js
    <TranslationProvider>
      <Routes>
        {/* Main Redirect Route */}
        <Route
          path="/"
          element={
            <Navigate
              to="/landing"
              replace
            />
          }
        />

        {/* Public Routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthLayout>
              <SignUp />
            </AuthLayout>
          }
        />
        <Route path="/authentication" element={<FaceAuth />} />

        {/* Protected Routes */}
        <Route
          path="/health-profile"
          element={
            <RequireAuth>
              <HealthProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/patient-dashboard"
          element={
            <RequireAuth>
              <PatientDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/quick-help"
          element={
            <RequireAuth>
              <QuickMedicHelp />
            </RequireAuth>
          }
        />
        {/* Fixed video call route - use dynamic parameter properly */}
        <Route
          path="/video-call/:callId"
          element={
            <RequireAuth>
              <VideoCall />
            </RequireAuth>
          }
        />
        {/* Add a static video call route as fallback */}
        <Route
          path="/video-call"
          element={
            <RequireAuth>
              <VideoCall />
            </RequireAuth>
          }
        />

        {/*Doctor dashboard route*/}
        <Route
          path="/doc-dashboard"
          element={
            <AuthLayout>
              <DocDashboard />
            </AuthLayout>
          }
        />
      </Routes>
    </TranslationProvider>
  );
} 

export default App;