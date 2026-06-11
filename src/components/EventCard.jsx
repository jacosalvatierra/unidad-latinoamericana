import React from 'react';
import { useApp } from '../context/AppContext';

export default function EventCard({ event, onSelect }) {
  const { t, lang } = useApp();

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'festival': return 'badge-gold';
      case 'concert': return 'badge-red';
      case 'workshop': return 'badge-green';
      default: return 'badge-violet';
    }
  };

  const formatDate = (dateString) => {
    try {
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      const date = new Date(dateString);
      
      // Select locale based on lang
      const locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-US';
      return date.toLocaleDateString(locale, options);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <article className={`card event-card ${event.status === 'cancelled' ? 'event-cancelled' : ''}`}>
      <div className="card-image-wrapper">
        <img 
          src={event.flyer} 
          alt={event.title} 
          className="card-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600'; // Fallback flyer
          }}
        />
        {event.status === 'cancelled' && (
          <div className="cancelled-overlay">
            <span className="cancelled-text">{t('home.cancelledBadge').toUpperCase()}</span>
          </div>
        )}
        <div className="card-badge-container">
          <span className={`badge ${getCategoryBadgeClass(event.category)}`}>
            {t(`categories.${event.category}`)}
          </span>
          {event.visibility === 'members' && (
            <span className="badge badge-private">
              🔒 {t('home.visibilityMembers')}
            </span>
          )}
        </div>
      </div>

      <div className="card-content">
        <span className="event-date-text">📅 {formatDate(event.date)} - {event.time} hs</span>
        <h3 className="event-title">{event.title}</h3>
        <p className="event-organizer">{t('eventDetail.organizedBy')}: <strong>{event.initiative_name}</strong></p>
        <p className="event-location-text">📍 {event.location}</p>

        {event.needs_help && event.status !== 'cancelled' && (
          <div className="help-alert-badge">
            🤝 {t('eventDetail.needHelp')}
          </div>
        )}
        
        <button className="btn btn-outline card-action-btn" onClick={() => onSelect(event)}>
          {t('home.viewDetails')} &rarr;
        </button>
      </div>

      <style>{`
        .event-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .card-image-wrapper {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
          background-color: #f0ede9;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .event-card:hover .card-image {
          transform: scale(1.05);
        }

        .card-badge-container {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 6px;
        }

        .badge-private {
          background-color: rgba(43, 41, 39, 0.85);
          color: white;
          backdrop-filter: blur(4px);
        }

        .cancelled-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(200, 75, 49, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .cancelled-text {
          color: white;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: 2px;
          border: 3px solid white;
          padding: 6px 16px;
          transform: rotate(-10deg);
        }

        .event-cancelled {
          border-color: rgba(200, 75, 49, 0.3);
        }

        .event-cancelled .card-content {
          opacity: 0.7;
        }

        .card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .event-date-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-red);
          margin-bottom: 8px;
        }

        .event-title {
          font-size: 1.25rem;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 3rem;
          line-height: 1.5rem;
        }

        .event-organizer {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .event-location-text {
          font-size: 0.9rem;
          color: var(--text-dark);
          margin-bottom: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .help-alert-badge {
          font-size: 0.75rem;
          background-color: rgba(44, 94, 67, 0.08);
          color: var(--color-green);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: 1px dashed rgba(44, 94, 67, 0.2);
          margin-bottom: 16px;
          font-weight: 500;
          line-height: 1.4;
        }

        .card-action-btn {
          margin-top: auto;
          width: 100%;
        }
      `}</style>
    </article>
  );
}
