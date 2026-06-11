import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Directory({ onSelectInitiative }) {
  const { t, apiFetch } = useApp();
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitiatives = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('initiatives.php');
        setInitiatives(data);
      } catch (err) {
        console.error('Failed to fetch initiatives:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitiatives();
  }, []);

  return (
    <div className="directory-page section">
      <div className="container">
        <div className="directory-header text-center mb-5">
          <h1 className="directory-title">{t('directory.title')}</h1>
          <p className="directory-subtitle">{t('directory.subtitle')}</p>
        </div>

        {loading ? (
          <div className="directory-grid">
            {[1, 2, 3].map(n => (
              <div key={n} className="skeleton-card skeleton" style={{ height: '320px' }}></div>
            ))}
          </div>
        ) : initiatives.length === 0 ? (
          <div className="no-initiatives-box text-center">
            <p>{t('directory.noInitiatives')}</p>
          </div>
        ) : (
          <div className="directory-grid">
            {initiatives.map(init => (
              <div key={init.id} className="card initiative-card">
                <div className="card-top-accent"></div>
                <div className="initiative-logo-wrapper">
                  <img 
                    src={init.logo} 
                    alt={init.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150';
                    }}
                  />
                </div>
                <div className="initiative-card-body">
                  <h3 className="initiative-name-text">{init.name}</h3>
                  <span className="badge badge-violet mb-3">
                    📢 {init.events_count || 0} {t('directory.eventsCount')}
                  </span>
                  <p className="initiative-desc-text">{init.description}</p>
                  
                  <div className="initiative-socials">
                    {init.website && (
                      <a href={init.website} target="_blank" rel="noopener noreferrer" className="social-icon" title={t('directory.officialWeb')}>
                        🌐
                      </a>
                    )}
                    {init.instagram && (
                      <a href={init.instagram} target="_blank" rel="noopener noreferrer" className="social-icon instagram" title="Instagram">
                        📸
                      </a>
                    )}
                    {init.facebook && (
                      <a href={init.facebook} target="_blank" rel="noopener noreferrer" className="social-icon facebook" title="Facebook">
                        👤
                      </a>
                    )}
                  </div>

                  <button className="btn btn-outline initiative-action-btn" onClick={() => onSelectInitiative(init.id)}>
                    {t('directory.visitProfile')} &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .directory-header {
          max-width: 700px;
          margin: 0 auto;
        }

        .directory-title {
          font-size: 2.5rem;
          color: var(--color-violet);
          margin-bottom: 12px;
        }

        .directory-subtitle {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .directory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 32px;
        }

        .initiative-card {
          position: relative;
          text-align: center;
          padding-top: 0;
        }

        .card-top-accent {
          height: 12px;
          background: linear-gradient(90deg, var(--color-green), var(--color-red), var(--color-violet));
          width: 100%;
        }

        .initiative-logo-wrapper {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          margin: -50px auto 16px auto;
          border: 4px solid var(--bg-white);
          box-shadow: var(--shadow-md);
          background-color: var(--bg-cream);
          z-index: 2;
          position: relative;
        }

        .initiative-logo-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .initiative-card {
          margin-top: 50px; /* offset for overflowing logo */
        }

        .initiative-card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-grow: 1;
        }

        .initiative-name-text {
          font-size: 1.35rem;
          margin-bottom: 8px;
          color: var(--color-violet);
        }

        .initiative-desc-text {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 24px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 4.05rem;
        }

        .initiative-socials {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .social-icon {
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--bg-cream);
          border: 1px solid var(--border-light);
          transition: var(--transition-smooth);
        }

        .social-icon:hover {
          background-color: var(--color-violet-glow);
          transform: scale(1.1);
        }

        .initiative-action-btn {
          width: 100%;
          margin-top: auto;
        }

        .no-initiatives-box {
          background-color: var(--bg-white);
          border: 1px dashed var(--border-light);
          padding: 40px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }

        .mb-5 { margin-bottom: 48px; }
      `}</style>
    </div>
  );
}
