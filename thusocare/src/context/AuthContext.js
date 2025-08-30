
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client outside the component to ensure it's a singleton
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
     const fetchUserProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name') // Select the 'name' column
          .eq('user_id', userId)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data); // Set the profile data
      } catch (err) {
        console.error('Error fetching user profile:', err.message);
        setProfile(null);
      }
    };
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setUser(session?.user ?? null);
      } catch (err) {
        setError('Failed to check session: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        setUser(session?.user ?? null);
        setError(null); // Clear any previous errors on state change
      } catch (err) {
        setError('Failed to update auth state: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []); // No dependencies needed since supabase is a constant

  return (
    <AuthContext.Provider value={{ user, profile,loading, error }}>
      {children} {/* Render children regardless of loading to handle errors */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
