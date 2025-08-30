import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './Pages/Landing.jsx'; 
import Translation from './Pages/Translation.jsx';
import LoginPage from './Pages/Login.jsx'; 
import SignUp from './Pages/Signup.jsx';

import './App.css'; 

// Placeholder components to prevent errors
const AuthLayout = ({ children }) => 
    <div className="auth-layout">{children}</div>;

const ProfileForm = () => 
    <div>Profile Form Page</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/landing" replace />} />
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
        <Route 
          path="/profile-form" 
          element={
            <AuthLayout>
              <ProfileForm />
            </AuthLayout>
          } 
        />
        <Route path="/translation" element={<Translation />} />
      </Routes>
    </Router>
  );
}

export default App;
