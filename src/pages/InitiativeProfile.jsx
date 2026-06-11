import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import EventCard from '../components/EventCard';

export default function InitiativeProfile({ initiativeId, onBack, onSelectEvent }) {
  const { t, apiFetch, user } = useApp();
  const [initiative, setInitiative] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        // Fetch all active initiatives and find the current one
        const inits = await apiFetch('initiatives.php');
        const found = inits.find(i => i.id === parseInt(initiativeId));
        setInitiative(found);

        // Fetch events and filter by this initiative
        const allEvents = await apiFetch('events.php');
        const filtered = allEvents.filter(e => e.initiative_id === parseInt(initiativeId));
        setEvents(filtered);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [initiativeId, user]);

  if (loading) {
    return (
      <div className="initiative-profile-page section">
        <div className="container text-center">
          <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 24px auto' }}></div>
          <div className="skeleton" style={{ width: '250px', height: '32px', margin: '0 auto 16px auto' }}></div>
          <div className="skeleton" style={{ width: '400px', height: '80px', margin: '0 auto 40px auto' }}></div>
        </div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="initiative-profile-page section">
        <div className="container text-center">
          <h2>Iniciativa no encontrada</h2>
          <button onClick={onBack} className="btn btn-outline mt-3">&larr; Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="initiative-profile-page section">
      <div className="container">
        {/* Back Button */}
        <button onClick={onBack} className="btn btn-outline mb-4">
          &larr; {t('directory.title')}
        </button>

        {/* Profile Card */}
        <div className="profile-header-card">
          <div className="profile-bg-decor"></div>
          <div className="profile-header-flex">
            <div className="profile-avatar-wrapper">
              <img 
                src={initiative.logo} 
                alt={initiative.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150';
                }}
              />
            </div>
            <div className="profile-header-info">
              <h1 className="profile-name">{initiative.name}</h1>
              <p className="profile-desc">{initiative.description}</p>

              <div className="profile-social-box">
                <span className="social-box-title">{t('profile.contact')}:</span>
                <div className="profile-social-links">
                  {initiative.website && (
                    <a href={initiative.website} target="_blank" rel="noopener noreferrer" className="profile-social-link">
                      🌐 Sitio Web
                    </a>
                  )}
                  {initiative.instagram && (
                    <a href={initiative.instagram} target="_blank" rel="noopener noreferrer" className="profile-social-link">
                      📸 Instagram
                    </a>
                  )}
                  {initiative.facebook && (
                    <a href={initiative.facebook} target="_blank" rel="noopener noreferrer" className="profile-social-link">
                      👤 Facebook
                    </a>
                  )}
                  <a href={`mailto:${initiative.email}`} className="profile-social-link">
                    ✉️ Enviar Correo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="profile-events-section mt-5">
          <h2 className="section-title mb-4">{t('profile.eventsTitle')}</h2>
          
          {events.length === 0 ? (
            <div className="no-events-box text-center">
              <p>{t('profile.noEvents')}</p>
            </div>
          ) : (
            <div className="grid-events">
              {events.map(event => (
                <EventCard 
                  key={event.id}
                  event={event}
                  onSelect={onSelectEvent}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .profile-header-card {
          background-color: var(--bg-white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }

        .profile-bg-decor {
          height: 120px;
          background: linear-gradient(135deg, var(--color-violet) 0%, var(--color-red) 50%, var(--color-green) 100%);
        }

        .profile-header-flex {
          display: flex;
          padding: 0 40px 40px 40px;
          gap: 40px;
          margin-top: -60px;
          align-items: flex-start;
        }

        .profile-avatar-wrapper {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          overflow: hidden;
          border: 5px solid var(--bg-white);
          box-shadow: var(--shadow-md);
          background-color: var(--bg-cream);
          flex-shrink: 0;
        }

        .profile-avatar-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-header-info {
          padding-top: 65px;
          flex-grow: 1;
        }

        .profile-name {
          font-size: 2.2rem;
          color: var(--color-violet);
          margin-bottom: 12px;
        }

        .profile-desc {
          color: var(--text-dark);
          font-size: 1.05rem;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .profile-social-box {
          background-color: var(--bg-cream);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          padding: 16px 20px;
        }

        .social-box-title {
          display: block;
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--color-violet);
          font-size: 0.9rem;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .profile-social-links {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .profile-social-link {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-dark);
          background-color: var(--bg-white);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--border-light);
          transition: var(--transition-smooth);
        }

        .profile-social-link:hover {
          border-color: var(--color-violet);
          color: var(--color-violet);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .no-events-box {
          background-color: var(--bg-white);
          border: 1px dashed var(--border-light);
          padding: 40px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }

        @media (max-width: 992px) {
          .profile-header-flex {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 0 24px 24px 24px;
          }

          .profile-header-info {
            padding-top: 16px;
            width: 100%;
          }

          .profile-social-links {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
