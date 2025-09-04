import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import RequireAuth from './components/RequireAuth'; // Import the new component
import './App.css';

// Placeholder component for consistent layout
const AuthLayout = ({ children }) => (
  <div className="auth-layout">{children}</div>
);

// Main App component
function App() {
  console.log('App component rendering');

  return (
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
          element={<QuickMedicHelp />}
        />

        {/* Video call routes - completely public */}
        <Route path="/video-call/:callId" element={<VideoCall />} />
        <Route path="/video-call" element={<VideoCall />} />

      

        {/* Doctor dashboard route */}
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