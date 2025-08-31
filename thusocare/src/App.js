import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Corrected import paths based on a common project structure.
// Assumes App.jsx is located in a subdirectory of src.
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
const AuthLayout = ({ children }) => 
    <div className="auth-layout">{children}</div>;

// This is the main application component that defines all your routes.
// It does NOT need to be wrapped in <Router> because it is already
// being rendered inside a single <Router> in your index.js file.
function App() {
  return (
    // The TranslationProvider and AuthProvider should stay here,
    // as they provide context to all the routes and pages below.
    <TranslationProvider>
      <AuthProvider>
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
          <Route path="/Home" element={<Home/>} />


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

// The RequireAuth component remains the same, as it is a child of the <Router>
// and can safely use the useNavigate hook.
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to the login page if the user is not authenticated
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    // Show a loading indicator while the auth state is being checked
    return <div>Loading...</div>;
  }

  // Render the children (the protected page) if the user is authenticated, otherwise render null
  return user ? children : null;
};

export default App;