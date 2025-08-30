import React from 'react';
import '../Styling/LoginPage.css';

const LoginPage = () => {
    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Login to ThusoCare</h1>
                <p className="login-subtitle">
                    Enter your details to access your dashboard.
                </p>
                <form className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="you@example.com"
                            className="input-field"
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
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">
                        Log In
                    </button>
                    <button type="button" className="login-btn">Login with Google</button>
                    <a href="#" className="forgot-password">
                        Forgot Password?
                    </a>
                </form>
                <div className="signup-link">
                    Don't have an account? <a href="#">Sign Up</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
