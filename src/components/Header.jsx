import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Header({ currentPage, setCurrentPage }) {
  const { t, lang, changeLanguage, user, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    handleNav('home');
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        <div className="header-logo" onClick={() => handleNav('home')}>
          <span className="logo-icon">🌎</span>
          <span className="logo-text">Unidad Latinoamericana</span>
        </div>

        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>

        <nav className={`header-nav ${menuOpen ? 'nav-open' : ''}`}>
          <button 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            {t('nav.home')}
          </button>
          
          <button 
            className={`nav-link ${currentPage === 'directory' ? 'active' : ''}`}
            onClick={() => handleNav('directory')}
          >
            {t('nav.directory')}
          </button>

          {user ? (
            <>
              <button 
                className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNav('dashboard')}
              >
                {t('nav.dashboard')}
              </button>
              
              <button className="nav-link logout-btn" onClick={handleLogout}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <button 
                className={`nav-link ${currentPage === 'register' ? 'active' : ''}`}
                onClick={() => handleNav('register')}
              >
                {t('nav.register')}
              </button>
              
              <button 
                className={`nav-link login-nav-btn ${currentPage === 'login' ? 'active' : ''}`}
                onClick={() => handleNav('login')}
              >
                {t('nav.login')}
              </button>
            </>
          )}

          <div className="lang-switcher">
            {['es', 'de', 'en'].map((l) => (
              <button
                key={l}
                className={`lang-btn ${lang === l ? 'active' : ''}`}
                onClick={() => changeLanguage(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <style>{`
        .site-header {
          background-color: var(--bg-white);
          border-bottom: 1px solid var(--border-light);
          position: sticky;
          top: 0;
          z-index: 100;
          height: 70px;
          display: flex;
          align-items: center;
          backdrop-filter: blur(8px);
          background-color: rgba(255, 255, 255, 0.95);
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 100%;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.35rem;
          color: var(--color-violet);
          transition: var(--transition-smooth);
        }

        .header-logo:hover {
          opacity: 0.85;
        }

        .logo-icon {
          font-size: 1.6rem;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          background: none;
          border: none;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px 4px;
          position: relative;
          transition: var(--transition-smooth);
        }

        .nav-link:hover, .nav-link.active {
          color: var(--color-violet);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 4px;
          right: 4px;
          height: 3px;
          background: linear-gradient(90deg, var(--color-green), var(--color-red));
          border-radius: 2px;
        }

        .login-nav-btn {
          border: 1.5px solid var(--color-violet);
          border-radius: var(--radius-sm);
          padding: 6px 16px;
          color: var(--color-violet);
        }

        .login-nav-btn:hover, .login-nav-btn.active {
          background-color: var(--color-violet);
          color: var(--text-light);
        }

        .logout-btn {
          color: var(--color-red);
        }

        .logout-btn:hover {
          color: #a03c27;
        }

        .lang-switcher {
          display: flex;
          align-items: center;
          background-color: var(--bg-cream);
          padding: 4px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
          margin-left: 8px;
        }

        .lang-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 4px;
          transition: var(--transition-smooth);
        }

        .lang-btn.active {
          background-color: var(--bg-white);
          color: var(--color-violet);
          box-shadow: var(--shadow-sm);
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-dark);
          cursor: pointer;
        }

        @media (max-width: 992px) {
          .mobile-menu-btn {
            display: block;
          }

          .header-nav {
            position: absolute;
            top: 70px;
            left: 0;
            right: 0;
            background-color: var(--bg-white);
            flex-direction: column;
            padding: 24px;
            gap: 20px;
            border-bottom: 1px solid var(--border-light);
            box-shadow: var(--shadow-md);
            transform: translateY(-120%);
            opacity: 0;
            transition: var(--transition-smooth);
            pointer-events: none;
          }

          .header-nav.nav-open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
          }

          .nav-link {
            width: 100%;
            text-align: center;
            padding: 12px 0;
          }

          .nav-link.active::after {
            bottom: 4px;
            left: 30%;
            right: 30%;
          }

          .login-nav-btn {
            width: 80%;
            max-width: 250px;
          }

          .lang-switcher {
            margin-left: 0;
            margin-top: 10px;
            padding: 6px;
          }
          
          .lang-btn {
            padding: 6px 12px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </header>
  );
}
