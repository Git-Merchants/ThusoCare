import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import '../Styling/Signup.css';

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
  const [idNumber, setIdNumber] = useState('');
  const [gender, setGender] = useState(''); // Default to empty string
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
  const [age, setAge] = useState(null);

  // Initialize Supabase and handle auth state changes
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('User is logged in:', session.user);
       
       
      }
    };
    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in:', session.user);
          // Redirect to health profile after successful sign-in
          navigate('/Home');
        }
      }
    );

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Validate South African ID number
  const validateSAID = (idNumber) => {
    // Check if ID is 13 digits
    if (!/^\d{13}$/.test(idNumber)) {
        return 'ID Number must be 13 digits';
    }

    // Basic date validation from ID
    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));

    if (month < 1 || month > 12) {
        return 'Invalid month in ID Number';
    }

    if (day < 1 || day > 31) {
        return 'Invalid day in ID Number';
    }

    return null; // Return null if valid
};

const calculateAgeFromID = (idNumber) => {
    const year = parseInt(idNumber.substring(0, 2));
    const currentYear = new Date().getFullYear() % 100;
    const birthYear = year <= currentYear ? 2000 + year : 1900 + year;
    const age = new Date().getFullYear() - birthYear;
    return age;
};

  // Handle form submission with Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate ID Number format only
    const idError = validateSAID(idNumber);
    if (idError) {
        setError(idError);
        setLoading(false);
        return;
    }

    // Calculate age from ID
    const userAge = calculateAgeFromID(idNumber);
    setAge(userAge);

    try {
      // Sign up with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            surname: surname,
            gender: gender,
            phone: phone,
            age: userAge // Store age in the database
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
            name: firstName,
            surname: surname,
            gender: gender,
            phone: phone,
            age: userAge // Store age in profiles table
          }
        ]);

      if (dbError) {
        setError(`Failed to save user data: ${dbError.message}`);
        await supabase.auth.admin.deleteUser(authData.user.id);
        setLoading(false);
        return;
      }

      // Success: Show modal instead of immediate navigation
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

          {/* ID Number and Gender */}
          <div className="form-grid">
            <div className="input-group">
              <input
                type="text"
                placeholder="ID Number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="input-field"
                required
              />
            </div>
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
      <Modal show={showModal} onClose={() => navigate('/health-profile')}>
        <h2>Account Created!</h2>
        <p>Your account has been successfully created. Welcome to ThusoCare!</p>
      </Modal>
    </div>
  );
};

export default Signup;