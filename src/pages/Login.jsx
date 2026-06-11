import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login({ onRegisterClick, onLoginSuccess }) {
  const { t, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    const res = await login(email, password);
    setLoading(false);

    if (res && res.success) {
      onLoginSuccess();
    } else {
      if (res && res.error === 'pending_approval') {
        setError(t('login.error')); // Translates to pending approval / invalid credentials
      } else {
        setError(t('login.error'));
      }
    }
  };

  return (
    <div className="login-page section">
      <div className="container flex-center">
        <div className="login-card card">
          <div className="login-header text-center">
            <h2>{t('login.title')}</h2>
            <p className="login-subtitle">{t('login.subtitle')}</p>
          </div>

          {error && <div className="alert-error-box">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                {t('login.email')}
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                {t('login.password')}
              </label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
              {loading ? '...' : t('login.submit')}
            </button>
          </form>

          <div className="login-footer text-center mt-4">
            <p>
              {t('login.dontHaveAccount')}{' '}
              <button onClick={onRegisterClick} className="register-redirect-btn">
                {t('login.registerHere')}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 40px;
          background-color: var(--bg-white);
        }

        .login-header h2 {
          font-size: 1.8rem;
          margin-bottom: 8px;
        }

        .login-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 24px;
          line-height: 1.4;
        }

        .alert-error-box {
          background-color: var(--color-red-glow);
          color: var(--color-red);
          border: 1px solid rgba(200, 75, 49, 0.25);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .login-form {
          width: 100%;
        }

        .register-redirect-btn {
          background: none;
          border: none;
          color: var(--color-violet);
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0;
          transition: var(--transition-smooth);
        }

        .register-redirect-btn:hover {
          text-decoration: underline;
          color: var(--color-red);
        }

        .w-100 { width: 100%; }
        .mt-2 { margin-top: 16px; }
        .mt-4 { margin-top: 24px; }
      `}</style>
    </div>
  );
}
