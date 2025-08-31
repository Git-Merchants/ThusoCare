import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Corrected import paths based on a common project structure
import LandingPage from './Pages/Landing';
import LoginPage from './Pages/Login';
import HealthProfile from './Pages/HealthProfile';
import PatientDashboard from './Pages/PatientProfile';
import SignUp from './Pages/Signup';
import Home from './Pages/Home';
import FaceAuth from './Pages/FaceAuth';

// Corrected context import paths
import { TranslationProvider } from './context/TranslationContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import './App.css'; // Global CSS

// Placeholder component for consistent layout
const AuthLayout = ({ children }) => <div className="auth-layout">{children}</div>;

// Component to handle initial redirect for authenticated users
const RedirectAuthenticated = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/Home');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }
  return null; // Render nothing while loading or until redirect
};

// The RequireAuth component ensures protected routes require authentication
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : null;
};

function App() {
  return (
    <TranslationProvider>
      <AuthProvider>
        <Routes>
          {/* Redirect root to landing or Home based on auth state */}
          <Route path="/" element={<RedirectAuthenticated />} />

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
          <Route path="/Home" element={<Home />} />

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
        </Routes>
      </AuthProvider>
    </TranslationProvider>
  );
}

export default App;