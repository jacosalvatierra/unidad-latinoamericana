import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Footer() {
  const { t, apiFetch } = useApp();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      const res = await apiFetch('subscribe.php', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      if (res.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <h3 className="footer-logo">🌎 Unidad Latinoamericana</h3>
          <p className="footer-desc">{t('footer.desc')}</p>
        </div>

        <div className="footer-newsletter">
          <h4>{t('footer.subscribeTitle')}</h4>
          <p>{t('footer.subscribeSubtitle')}</p>
          
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              className="form-input newsletter-input"
              placeholder={t('footer.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading' || status === 'success'}
              required
            />
            <button 
              type="submit" 
              className="btn btn-primary newsletter-btn"
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' ? '...' : t('footer.subscribeBtn')}
            </button>
          </form>

          {status === 'success' && <p className="subscribe-status success">{t('footer.successMsg')}</p>}
          {status === 'error' && <p className="subscribe-status error">{t('footer.errorMsg')}</p>}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-flex">
          <p>&copy; {new Date().getFullYear()} Unidad Latinoamericana. {t('footer.allRights')}</p>
          <div className="footer-socials">
            <span className="social-flag">🇨🇱</span>
            <span className="social-flag">🇦🇷</span>
            <span className="social-flag">🇧🇴</span>
            <span className="social-flag">🇧🇷</span>
            <span className="social-flag">🇨🇴</span>
            <span className="social-flag">🇪🇨</span>
            <span className="social-flag">🇵🇪</span>
            <span className="social-flag">🇻🇪</span>
            <span className="social-flag">🇺🇾</span>
            <span className="social-flag">🇵🇾</span>
            <span className="social-flag">🇲🇽</span>
          </div>
        </div>
      </div>

      <style>{`
        .site-footer {
          background-color: var(--color-violet);
          color: rgba(255, 255, 255, 0.85);
          padding: 60px 0 0 0;
          border-top: 1px solid var(--border-light);
          margin-top: auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
          padding-bottom: 40px;
        }

        .footer-logo {
          color: var(--text-light);
          font-size: 1.4rem;
          margin-bottom: 16px;
        }

        .footer-desc {
          max-width: 320px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .footer-newsletter h4 {
          color: var(--text-light);
          font-size: 1.1rem;
          margin-bottom: 8px;
        }

        .footer-newsletter p {
          font-size: 0.85rem;
          margin-bottom: 16px;
          color: rgba(255, 255, 255, 0.7);
        }

        .newsletter-form {
          display: flex;
          gap: 8px;
        }

        .newsletter-input {
          border: 1px solid rgba(255, 255, 255, 0.2);
          background-color: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .newsletter-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .newsletter-input:focus {
          border-color: var(--color-green);
          box-shadow: 0 0 0 3px rgba(44, 94, 67, 0.3);
          background-color: rgba(255, 255, 255, 0.15);
        }

        .newsletter-btn {
          flex-shrink: 0;
          padding: 12px 20px;
        }

        .subscribe-status {
          font-size: 0.85rem;
          margin-top: 8px;
          font-weight: 500;
        }

        .subscribe-status.success {
          color: #a7f3d0;
        }

        .subscribe-status.error {
          color: #fca5a5;
        }

        .footer-bottom {
          background-color: rgba(0, 0, 0, 0.15);
          padding: 24px 0;
          font-size: 0.85rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-bottom-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-socials {
          display: flex;
          gap: 6px;
          font-size: 1.1rem;
        }

        @media (max-width: 600px) {
          .newsletter-form {
            flex-direction: column;
          }
          .newsletter-btn {
            width: 100%;
          }
        }
      `}</style>
    </footer>
  );
}
