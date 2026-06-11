import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Register({ onLoginClick }) {
  const { t, apiFetch } = useApp();
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !description) return;

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('register.php', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          description,
          logo: logo || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150', // placeholder default
          website,
          instagram,
          facebook
        })
      });

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || 'Ocurrió un error al procesar el registro.');
      }
    } catch (err) {
      console.error(err);
      if (err.message === 'email_exists') {
        setError(lang === 'es' ? 'El correo electrónico ya está registrado.' : 'Email already exists.');
      } else {
        setError('Error de conexión con el servidor. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register-page section">
        <div className="container flex-center">
          <div className="success-register-card card text-center">
            <span className="success-icon">💌</span>
            <h2>{t('register.successTitle')}</h2>
            <p className="success-msg-text">{t('register.successMessage')}</p>
            <button onClick={onLoginClick} className="btn btn-primary mt-4">
              {t('nav.login')}
            </button>
          </div>
        </div>
        <style>{`
          .success-register-card {
            width: 100%;
            max-width: 550px;
            padding: 50px 40px;
            background-color: var(--bg-white);
          }
          .success-icon {
            font-size: 4rem;
            display: block;
            margin-bottom: 20px;
          }
          .success-msg-text {
            color: var(--text-muted);
            font-size: 1rem;
            line-height: 1.6;
            margin-top: 12px;
          }
          .mt-4 { margin-top: 24px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="register-page section">
      <div className="container flex-center">
        <div className="register-card card">
          <div className="register-header text-center">
            <h2>{t('register.title')}</h2>
            <p className="register-subtitle">{t('register.subtitle')}</p>
          </div>

          {error && <div className="alert-error-box">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">
                  {t('register.name')} *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="ej. Asociación Cantapueblo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  {t('register.email')} *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="ej. info@cantapueblo.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  {t('register.password')} *
                </label>
                <input
                  id="reg-password"
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-logo">
                  Logo / Avatar *
                </label>
                <input
                  id="reg-logo"
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={handleLogoUpload}
                  disabled={loading}
                  required
                />
                {logo && (
                  <div className="reg-logo-preview-box">
                    <img src={logo} alt="Logo preview" className="reg-logo-preview-img" />
                  </div>
                )}
              </div>

            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-desc">
                {t('register.description')} *
              </label>
              <textarea
                id="reg-desc"
                className="form-textarea"
                rows="4"
                placeholder={t('register.descriptionHelp')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-website">
                  {t('register.website')}
                </label>
                <input
                  id="reg-website"
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-insta">
                  {t('register.instagram')}
                </label>
                <input
                  id="reg-insta"
                  type="url"
                  className="form-input"
                  placeholder="https://instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-fb">
                  {t('register.facebook')}
                </label>
                <input
                  id="reg-fb"
                  type="url"
                  className="form-input"
                  placeholder="https://facebook.com/..."
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
              {loading ? '...' : t('register.submit')}
            </button>
          </form>

          <div className="register-footer text-center mt-4">
            <p>
              ¿Ya tienes cuenta?{' '}
              <button onClick={onLoginClick} className="login-redirect-btn">
                {t('nav.login')}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .register-card {
          width: 100%;
          max-width: 750px;
          padding: 40px;
          background-color: var(--bg-white);
        }

        .register-header h2 {
          font-size: 1.8rem;
          margin-bottom: 8px;
        }

        .register-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 24px;
          line-height: 1.4;
        }

        .register-form {
          width: 100%;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
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

        .form-textarea {
          resize: vertical;
        }

        .reg-logo-preview-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid var(--border-light);
          margin-top: 8px;
          background-color: var(--bg-cream);
        }

        .reg-logo-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }


        .login-redirect-btn {
          background: none;
          border: none;
          color: var(--color-violet);
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0;
        }

        .login-redirect-btn:hover {
          text-decoration: underline;
          color: var(--color-red);
        }

        .w-100 { width: 100%; }
        .mt-3 { margin-top: 24px; }
        .mt-4 { margin-top: 24px; }

        @media (max-width: 768px) {
          .form-grid-2, .form-grid-3 {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
}
