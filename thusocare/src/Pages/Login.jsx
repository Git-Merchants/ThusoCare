import React, { useState } from 'react';
import '../Styling/LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseConfig';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleLogin = async (e) => {
      
        e.preventDefault();
        setError('');
        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            setError(error.message);
            return;
        }
        // Fetch user profile from 'users' table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, surname')
            .eq('email', email)
            .single();
        if (userError || !userData) {
            setError('Login successful, but could not fetch user profile.');
        } else {
            navigate('/Home');
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/Home` 
                }
            });

            if (error) {
                setError(error.message);
                return;
            }

            // Navigate after successful login
            if (data) {
                navigate('/Home');
            }
        } catch (err) {
            console.error('Google login error:', err);
            setError('An error occurred during Google login');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Login to ThusoCare</h1>
                <p className="login-subtitle">
                    Enter your details to access your dashboard.
                </p>
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="you@example.com"
                            className="input-field"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            className="input-field"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">
                        Log In
                    </button>
                    <button
                        type="button"
                        className="login-btn"
                        onClick={handleGoogleLogin}
                    >
                        Login with Google
                    </button>
                    <a href="#" className="forgot-password">
                        Forgot Password?
                    </a>
                    {error && <div className="message-box">{error}</div>}
                </form>
                <div className="signup-link">
                    Don't have an account? <a href="#">Sign Up</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;