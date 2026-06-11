import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import EventCard from '../components/EventCard';

export default function Home({ onSelectEvent, onJoinClick }) {
  const { t, apiFetch, user } = useApp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch events on mount and when user session changes
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('events.php');
        setEvents(data);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [user]);

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase()) ||
      event.initiative_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || event.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Featured event is the earliest active (non-cancelled) event in the future
  const today = new Date().toISOString().split('T')[0];
  const activeFutureEvents = filteredEvents.filter(e => e.status !== 'cancelled' && e.date >= today);
  const featuredEvent = activeFutureEvents.length > 0 ? activeFutureEvents[0] : null;

  // Remaining events (excluding the featured one)
  const listEvents = featuredEvent 
    ? filteredEvents.filter(e => e.id !== featuredEvent.id)
    : filteredEvents;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container-inner">
          <h1 className="hero-title">{t('hero.title')}</h1>
          <p className="hero-subtitle">{t('hero.subtitle')}</p>
          <p className="hero-intro">{t('hero.intro')}</p>
          <div className="hero-actions">
            <a href="#events-section" className="btn btn-primary">{t('hero.exploreEvents')}</a>
            {!user && (
              <button onClick={onJoinClick} className="btn btn-secondary">{t('hero.joinAsInitiative')}</button>
            )}
          </div>
        </div>
      </section>

      {/* Purpose Explain Banner */}
      <section className="purpose-banner">
        <div className="container purpose-grid">
          <div className="purpose-content">
            <h2 className="purpose-title">{t('home.bannerTitle')}</h2>
            <p className="purpose-text">{t('home.bannerText')}</p>
          </div>
          <div className="purpose-graphics">
            <div className="flag-circle red"></div>
            <div className="flag-circle green"></div>
            <div className="flag-circle violet"></div>
          </div>
        </div>
      </section>

      {/* Featured Event Section */}
      {loading ? (
        <section className="section featured-section skeleton-section">
          <div className="container">
            <div className="skeleton-title skeleton"></div>
            <div className="skeleton-featured skeleton"></div>
          </div>
        </section>
      ) : featuredEvent ? (
        <section className="section featured-section">
          <div className="container">
            <h2 className="section-title text-center mb-4">{t('home.nextEvent')}</h2>
            <div className="featured-card" onClick={() => onSelectEvent(featuredEvent)}>
              <div className="featured-image-wrapper">
                <img 
                  src={featuredEvent.flyer} 
                  alt={featuredEvent.title} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600';
                  }}
                />
              </div>
              <div className="featured-details">
                <div className="badge-row">
                  <span className="badge badge-red">{t(`categories.${featuredEvent.category}`)}</span>
                  {featuredEvent.visibility === 'members' && (
                    <span className="badge badge-private">🔒 {t('home.visibilityMembers')}</span>
                  )}
                </div>
                <h3 className="featured-title-text">{featuredEvent.title}</h3>
                <p className="featured-date">📅 {featuredEvent.date} - {featuredEvent.time} hs</p>
                <p className="featured-organizer">🌎 {t('eventDetail.organizedBy')}: <strong>{featuredEvent.initiative_name}</strong></p>
                <p className="featured-location">📍 {featuredEvent.location}</p>
                <p className="featured-description">{featuredEvent.description.substring(0, 160)}...</p>
                <button className="btn btn-primary mt-3">{t('home.viewDetails')}</button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Main Calendar Section */}
      <section className="section events-calendar-section" id="events-section">
        <div className="container">
          <h2 className="section-title mb-4">{t('home.upcomingEvents')}</h2>

          {/* Filters Bar */}
          <div className="filters-bar">
            <input
              type="text"
              className="form-input search-input"
              placeholder={t('home.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <select
              className="form-select category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">{t('home.allCategories')}</option>
              {['festival', 'concert', 'theater', 'food', 'workshop', 'social', 'charity', 'other'].map(cat => (
                <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
              ))}
            </select>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid-events">
              {[1, 2, 3].map(n => (
                <div key={n} className="skeleton-card skeleton"></div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="no-events-box text-center">
              <p>{t('home.noEvents')}</p>
            </div>
          ) : (
            <div className="grid-events">
              {filteredEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onSelect={onSelectEvent} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        .hero-container-inner {
          max-width: 800px;
        }

        .hero-intro {
          font-size: 1.1rem;
          margin-bottom: 32px;
          color: var(--text-muted);
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        /* Purpose Banner */
        .purpose-banner {
          background-color: var(--bg-white);
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 60px 0;
        }

        .purpose-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          align-items: center;
          gap: 40px;
        }

        .purpose-title {
          font-size: 2rem;
          margin-bottom: 16px;
        }

        .purpose-text {
          font-size: 1.05rem;
          color: var(--text-muted);
          line-height: 1.7;
        }

        .purpose-graphics {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          height: 150px;
        }

        .flag-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          position: absolute;
          opacity: 0.85;
          backdrop-filter: blur(4px);
        }

        .flag-circle.red {
          background-color: var(--color-red);
          left: 40px;
          z-index: 1;
        }

        .flag-circle.green {
          background-color: var(--color-green);
          left: 100px;
          top: 40px;
          z-index: 2;
        }

        .flag-circle.violet {
          background-color: var(--color-violet);
          left: 160px;
          z-index: 3;
        }

        /* Featured Card */
        .featured-card {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          background-color: var(--bg-white);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .featured-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .featured-image-wrapper {
          height: 380px;
          background-color: #f0ede9;
        }

        .featured-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .featured-details {
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .badge-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .featured-title-text {
          font-size: 1.8rem;
          margin-bottom: 12px;
          color: var(--color-violet);
        }

        .featured-date {
          color: var(--color-red);
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .featured-organizer, .featured-location {
          font-size: 0.95rem;
          margin-bottom: 6px;
        }

        .featured-description {
          color: var(--text-muted);
          margin-top: 10px;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* Filters Bar */
        .filters-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
          background-color: var(--bg-white);
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-sm);
        }

        .search-input {
          flex: 1;
        }

        .category-select {
          width: 250px;
        }

        /* Skeletons */
        .skeleton-section {
          padding-bottom: 0;
        }

        .skeleton-title {
          width: 200px;
          height: 32px;
          margin: 0 auto 24px auto;
        }

        .skeleton-featured {
          height: 350px;
          border-radius: var(--radius-lg);
        }

        .skeleton-card {
          height: 400px;
          border-radius: var(--radius-md);
        }

        .no-events-box {
          background-color: var(--bg-white);
          border: 1px dashed var(--border-light);
          padding: 40px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-weight: 500;
        }

        .mb-4 { margin-bottom: 32px; }
        .text-center { text-align: center; }
        .mt-3 { margin-top: 24px; }

        @media (max-width: 992px) {
          .featured-card {
            grid-template-columns: 1fr;
          }
          .featured-image-wrapper {
            height: 250px;
          }
          .featured-details {
            padding: 24px;
          }
          .purpose-grid {
            grid-template-columns: 1fr;
          }
          .purpose-graphics {
            height: 100px;
            margin-top: -20px;
          }
          .flag-circle {
            width: 60px;
            height: 60px;
          }
          .flag-circle.red { left: calc(50% - 70px); }
          .flag-circle.green { left: calc(50% - 25px); top: 15px; }
          .flag-circle.violet { left: calc(50% + 20px); }
        }

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
          }
          .category-select {
            width: 100%;
          }
          .hero-actions {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
