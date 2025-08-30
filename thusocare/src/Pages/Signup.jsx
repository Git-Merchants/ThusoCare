

import React, { useState, useEffect } from 'react';
import '../Styling/Signup.css';



// The main application component
const App = () => {
  // State for form fields
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  // State for Supabase
  const [supabase, setSupabase] = useState(null);
  const [userId, setUserId] = useState(null);

  // Initialize Supabase
  useEffect(() => {
    
  }, []);

  // Handle form submission with Supabase
  const handleSubmit = async (e) => {
    
    
  };

  // Handle Google Login with Supabase
  const handleGoogleLogin = async () => {
    
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
                <option value="male">Male</option>
                <option value="female">Female</option>
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
          >
            Create Account
          </button>
        </form>

        {/* Message Box */}
        {message && (
          <div className="message-box">
            {message}
          </div>
        )}
      </div>
    </div>
  );
    
};

export default App;
