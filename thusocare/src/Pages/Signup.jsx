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
          redirectTo: process.env.NEXT_PUBLIC_REDIRECT_URL,
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
          className="button google-btn"
          disabled={loading}
        >
          <svg style={{ marginRight: '0.5rem' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" role="img">
            <path d="M12.0001 9.27838V12.9238H16.3335C16.1423 14.1678 15.4216 15.2289 14.3644 15.9392V18.6672H18.067C20.3703 16.5165 21.6668 13.4111 21.6668 9.27838C21.6668 8.65349 21.614 8.04944 21.5033 7.45688H12.0001V9.27838Z" fill="#FFFFFF"></path>
            <path d="M12.0001 21.6667C15.2536 21.6667 18.067 20.6121 20.2678 18.6675L16.5647 15.9395C15.5225 16.6346 14.2858 17.0396 12.9998 17.0396C10.3664 17.0396 8.11584 15.2755 7.29178 12.9238H3.58866V15.7511C5.39763 19.3361 8.52735 21.6667 12.0001 21.6667Z" fill="#FFFFFF"></path>
            <path d="M7.29168 12.9238C6.91898 11.8596 6.72251 10.7416 6.72251 9.58334C6.72251 8.42502 6.91898 7.30704 7.29168 6.24285V3.41504H3.58866C2.39999 5.86475 1.72253 8.62933 1.72253 11.5417C1.72253 14.454 2.39999 17.2186 3.58866 19.6683L7.29168 16.8405V12.9238Z" fill="#FFFFFF"></path>
            <path d="M12.0001 5.41666C13.8443 5.41666 15.5398 6.06454 16.8926 7.24157L20.3015 3.83269C18.0673 1.95662 15.2539 0.83332 12.0001 0.83332C8.52735 0.83332 5.39763 3.16391 3.58866 6.74895L7.29168 9.57616C8.11584 7.22449 10.3664 5.4604 12.9998 5.4604H13.0001L12.0001 5.41666Z" fill="#FFFFFF"></path>
          </svg>
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
            className="button signup-btn"
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