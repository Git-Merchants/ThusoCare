import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation(); // Get current route

    useEffect(() => {
        console.log('AuthContext useEffect triggered');
        const checkSession = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    console.error('Session error:', sessionError);
                    throw new Error('Failed to check session: ' + sessionError.message);
                }
                console.log('Session checked:', session?.user ? 'User found' : 'No user');
                setUser(session?.user ?? null);
            } catch (err) {
                console.error('Error in checkSession:', err);
                setError('Authentication error: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(() => {
            if (loading) {
                console.error('Session check timed out');
                setError('Session check timed out');
                setLoading(false);
            }
        }, 10000);

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, 'Current path:', location.pathname);
            if (event === 'SIGNED_IN') {
                setUser(session?.user ?? null);
                // Only navigate to /home if on an unauthenticated route
                if (['/login', '/signup', '/landing', '/'].includes(location.pathname)) {
                    console.log('Navigating to /home from unauthenticated route');
                    navigate('/home', { replace: true });
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                console.log('Navigating to /login on SIGNED_OUT');
                navigate('/login', { replace: true });
            }
        });

        const refreshInterval = setInterval(async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                setUser(session?.user ?? null);
            } catch (err) {
                console.error('Error refreshing session:', err);
                setError('Session refresh error: ' + err.message);
            }
        }, 5 * 60 * 1000);

        return () => {
            subscription?.unsubscribe();
            clearTimeout(timeout);
            clearInterval(refreshInterval);
        };
    }, [navigate, location.pathname]);

    return (
        <AuthContext.Provider value={{ user, loading, error, supabase }}>
            {children}
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