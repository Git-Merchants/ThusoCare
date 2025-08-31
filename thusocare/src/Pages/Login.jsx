import React, { useState } from 'react';
import { supabase } from '../supabase/supabaseConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setUser(data.user);

    // Fetch user info from 'users' table using email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, surname')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      setError('Login successful, but could not fetch user profile.');
    } else {
      setProfile(userData);
    }
  };

  if (user && profile) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h1>Welcome {profile.name} {profile.surname}</h1>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h1 className="login-title">Login to ThusoCare</h1>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="login-btn">Log In</button>
        {error && <div className="message-box">{error}</div>}
      </form>
    </div>
  );
};

export default Login;