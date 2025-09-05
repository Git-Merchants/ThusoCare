import React, { useState } from 'react';
import '../Styling/LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseConfig';
import LanguageSelector from '../services/translationService';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        // First check if user is a medic (allow login with email or name)
        const { data: medicData, error: medicError } = await supabase
            .from('medics')
            .select('name, email, password')
            .or(`name.eq.${email},email.eq.${email}`)
            .single();
        
        if (medicData && medicData.password === password) {
            // Store logged-in doctor info
            localStorage.setItem('loggedInDoctor', JSON.stringify({
                name: medicData.name,
                surname: medicData.surname || '',
                email: medicData.email
            }));
            navigate('/doc-dashboard');
            return;
        }
        
        // If not a medic, try regular user authentication with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) {
            console.error('Login error:', error);
            if (error.message.includes('Email not confirmed')) {
                setError('Please check your email and confirm your account before logging in.');
            } else {
                setError(error.message || 'Invalid login credentials');
            }
            return;
        }
        
        // Check if user exists in users table
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

            // OAuth will handle redirect automatically via Supabase
            // No need to navigate here as user will be redirected
        } catch (err) {
            console.error('Google login error:', err);
            setError('An error occurred during Google login');
        }
    };

    return (
        <div className="login-container">
            
            {/*Transalation */}
            {/* Navigation Bar */}
            <nav className="navbar">
            <div className="navbar-content">
                <div className="logo">ThusoCare</div>
                    <div className="nav-links">
                    {/* Language Selector Component */}
                        <LanguageSelector />
                    </div>
                </div>
             </nav>
             
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
                    <button type="submit" className="nav-btn login-btn">
                        Log In
                    </button>
                    <button
                        type="button"
                        className="nav-btn google-btn"
                        onClick={handleGoogleLogin}
                    >
                        <img src={require('../images/google.png')} alt="Google" className="google-icon" />
                        Login with Google
                    </button>
                    <a href="#" className="forgot-password">
                        Forgot Password?
                    </a>
                    {error && <div className="message-box">{error}</div>}
                </form>
                <div className="signup-link">
                    Don't have an account? <a href="/signup">Sign Up</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;