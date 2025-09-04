import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Use global supabase client to avoid multiple instances
let supabase;
if (!window.supabaseClient) {
  window.supabaseClient = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
  );
}
supabase = window.supabaseClient;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setCurrentUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Session error:', err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes (similar to onAuthStateChanged)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user);
        setCurrentUser(session?.user ?? null);
        if (event !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user: currentUser, currentUser, loading, supabase }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return { ...context, user: context.currentUser };
};