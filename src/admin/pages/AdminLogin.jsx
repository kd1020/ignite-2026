import React, { useState } from 'react';
        import { useAuth } from '../../context/AuthContext';
        import './AdminLogin.css';


        export default function AdminLogin() {
          const { login, loading } = useAuth();
          const [email, setEmail] = useState('');
          const [password, setPassword] = useState('');
          const [errorMessage, setErrorMessage] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');


    if (!email || !password) {
      setErrorMessage('Please provide both administrator email and password.');
      return;
    }


    try {
      await login(email, password);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    }
  };


  return (
    <div className="admin-login-viewport">
      <div className="login-comic-panel">
        <div className="login-header">
          <div className="login-badge">RESTRICTED PORTAL</div>
          <h1 className="login-title">IGNITE ADMIN</h1>
          <p className="login-subtitle">
            Authenticated access for tournament controllers,
scorekeepers, and organizers.
          </p>
        </div>


        {errorMessage && (
          <div className="login-error-banner" role="alert">
            <span className="error-icon">⚠</span>
            <span>{errorMessage}</span>
          </div>
        )}


        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="adminEmail">ORGANIZER EMAIL</label>
            <input
              id="adminEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ignite2026.org"
              disabled={loading}
              required
            />
          </div>


          <div className="login-field">
            <label htmlFor="adminPassword">SECURITY KEY /
PASSWORD</label>
            <input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              required
            />
          </div>


          <button type="submit" disabled={loading} className="login- submit-btn">
            {loading ? 'AUTHENTICATING...' : 'ENTER DASHBOARD'}
          </button>
        </form>


        <div className="login-footer">
          <p>Role authorization is validated against Supabase database
security rules.</p>
          <a href="/" className="back-link">← Return to Public
Website</a>
        </div>
      </div>
    </div>
  );
}
