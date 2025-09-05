import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import '../Styling/Signup.css';
import LanguageSelector from '../services/translationService';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// The main application component
const Signup = () => {
  const navigate = useNavigate();

  // State for form fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [gender, setGender] = useState(''); // Default to empty string
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for error, loading, and message
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // State for Supabase
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Check if user is already logged in and redirect
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/Home');
      }
    };
    checkExistingSession();
  }, [navigate]);



  // Handle form submission with Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Sign up with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: null,
          data: {
            first_name: firstName,
            surname: surname,
            gender: gender,
            age: age,
            phone: phone
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Store additional user data in profiles table
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            user_id: authData.user.id,
            email: email,
            name: firstName,
            surname: surname,
            gender: gender,
            age: age,
            phone: phone
          }
        ]);

      if (dbError) {
        setError(`Failed to save user data: ${dbError.message}`);
        setLoading(false);
        return;
      }

      // Success: Show modal and navigate to home
      setShowModal(true);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Login with Supabase
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
           redirectTo: `${window.location.origin}/Home` 
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // If successful, the user will be redirected to health-profile
      // The redirectTo option above handles the redirect automatically
      console.log('Google sign-in successful, redirecting to health profile...');
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Simple Modal Component
  const Modal = ({ show, onClose, children }) => {
    if (!show) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          {children}
          <button className="modal-close-btn" onClick={onClose}>Continue</button>
        </div>
      </div>
    );
  };

  return (
    <div className="main-container">

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
                      
      <div className="card-container">
        <div className="header-section">
          <h1 className="title">Join ThusoCare</h1>
          <p className="subtitle">Create your account to access personalized healthcare services.</p>
        </div>

        {/* Display User ID */}
        {userId && (
          <div className="user-id-display">
            Your User ID: <span className="user-id">{userId}</span>
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="nav-btn google-btn"
          disabled={loading}
        >
          <img src={require('../images/google.png')} alt="Google" className="google-icon" />
          Sign up with Google
        </button>

        <div className="divider">
          <span className="divider-span">OR</span>
        </div>

        {/* Sign-up Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Name and Surname */}
          <div className="form-grid">
            <div className="input-group">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                placeholder="Surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Gender and Age */}
          <div className="form-grid">
            <div className="input-group">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input-field"
                required
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="input-group">
              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="input-field"
                min="1"
                max="120"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="input-group">
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          {/* Confirm Password */}
          <div className="input-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="nav-btn signup-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="message-box" style={{ color: 'red' }}>
            {error}
          </div>
        )}

        {/* Message Box */}
        {message && (
          <div className="message-box">
            {message}
          </div>
        )}
      </div>
      {/* Success Modal */}
      <Modal show={showModal} onClose={() => navigate('/Home')}>
        <h2>Account Created!</h2>
        <p>Your account has been successfully created. Welcome to ThusoCare!</p>
      </Modal>
    </div>
  );
};

export default Signup;