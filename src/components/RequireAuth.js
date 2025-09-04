// src/components/RequireAuth.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children }) => {
  const { currentUser } = useAuth();

  console.log('RequireAuth - currentUser:', !!currentUser);

  // If no user, redirect to login
  if (!currentUser) {
    console.log('RequireAuth: No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render children
  console.log('RequireAuth: User authenticated, rendering protected content');
  return children;
};

export default RequireAuth;