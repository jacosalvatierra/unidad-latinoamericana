import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function EventDetail({ event, onBack, onSelectInitiative }) {
  const { t, lang } = useApp();
  const [shareCopied, setShareCopied] = useState(false);

  const formatDate = (dateString) => {
    try {
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      const date = new Date(dateString);
      const locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-US';
      return date.toLocaleDateString(locale, options);
    } catch (e) {
      return dateString;
    }
  };

  // Google Calendar URL Generator
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(event.title);
    const desc = encodeURIComponent(event.description + `\n\nOrganizado por: ${event.initiative_name}`);
    const loc = encodeURIComponent(event.location);
    
    // Dates format: YYYYMMDDTHHmmSSZ
    const cleanDate = event.date.replace(/-/g, '');
    const cleanTime = event.time.replace(/:/g, '') + '00';
    const startDateTime = `${cleanDate}T${cleanTime}`;
    
    // Add 3 hours for end date
    const endHour = (parseInt(event.time.split(':')[0]) + 3).toString().padStart(2, '0');
    const endDateTime = `${cleanDate}T${endHour}${event.time.split(':')[1]}00`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${desc}&location=${loc}`;
  };

  // Client-Side Native ICS File Downloader
  const downloadIcsFile = () => {
    const cleanDate = event.date.replace(/-/g, '');
    const cleanTime = event.time.replace(/:/g, '') + '00';
    const start = `${cleanDate}T${cleanTime}`;
    
    const endHour = (parseInt(event.time.split(':')[0]) + 3).toString().padStart(2, '0');
    const end = `${cleanDate}T${endHour}${event.time.split(':')[1]}00`;
    
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Unidad Latinoamericana//Calendar//ES',
      'BEGIN:VEVENT',
      `UID:event-${event.id}@unidadlatinoamericana.com`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    
    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    // Generate a shareable URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?event=${event.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleFlyerDownload = () => {
    // Open flyer in a new tab for download
    window.open(event.flyer, '_blank');
  };

  const getGoogleMapsUrl = () => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
  };

  return (
    <div className="event-detail-page section">
      <div className="container">
        {/* Back Button */}
        <button onClick={onBack} className="btn btn-outline mb-4 back-btn">
          &larr; {t('eventDetail.back')}
        </button>

        {/* Detailed Layout Grid */}
        <div className="detail-grid">
          {/* Left: Flyer Image */}
          <div className="detail-image-card">
            <img 
              src={event.flyer} 
              alt={event.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600';
              }}
            />
            {event.status === 'cancelled' && (
              <div className="detail-cancelled-banner">
                {t('eventDetail.cancelledTitle').toUpperCase()}
              </div>
            )}
            
            <div className="image-card-actions">
              <button onClick={handleFlyerDownload} className="btn btn-secondary w-100">
                📥 {t('eventDetail.downloadFlyer')}
              </button>
            </div>
          </div>

          {/* Right: Event Info */}
          <div className="detail-info-card">
            <div className="badge-row mb-2">
              <span className={`badge ${event.category === 'festival' ? 'badge-gold' : event.category === 'concert' ? 'badge-red' : 'badge-green'}`}>
                {t(`categories.${event.category}`)}
              </span>
              {event.visibility === 'members' && (
                <span className="badge badge-private">🔒 {t('home.visibilityMembers')}</span>
              )}
            </div>

            <h1 className="detail-title">{event.title}</h1>
            
            <div className="organizer-info" onClick={() => onSelectInitiative(event.initiative_id)}>
              <span className="organizer-avatar">🌎</span>
              <div>
                <p className="org-label">{t('eventDetail.organizedBy')}</p>
                <p className="org-name">{event.initiative_name}</p>
              </div>
            </div>

            <hr className="divider" />

            <div className="detail-meta-list">
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <div>
                  <strong>{t('eventDetail.dateAndTime')}</strong>
                  <p>{formatDate(event.date)}</p>
                  <p className="meta-sub">{event.time} hs</p>
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <div>
                  <strong>{t('eventDetail.location')}</strong>
                  <p>{event.location}</p>
                  <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer" className="maps-link">
                    🗺️ Ver en Google Maps &rarr;
                  </a>
                </div>
              </div>
            </div>

            {event.needs_help && event.status !== 'cancelled' && (
              <div className="help-box mb-3">
                <h4>🤝 {t('dashboard.needsHelpCheckbox')}</h4>
                <p>{t('eventDetail.needHelp')}</p>
              </div>
            )}

            <div className="detail-desc-box">
              <h3>{t('eventDetail.description')}</h3>
              <p className="desc-text">{event.description}</p>
            </div>

            <div className="action-buttons-grid">
              <div className="calendar-dropdown-container">
                <button className="btn btn-primary w-100">
                  📅 {t('eventDetail.addToCalendar')}
                </button>
                <div className="calendar-options">
                  <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">Google Calendar</a>
                  <button onClick={downloadIcsFile}>iCal / Outlook (.ics)</button>
                </div>
              </div>

              <button onClick={handleShare} className="btn btn-outline share-btn">
                {shareCopied ? '✅ Copiado!' : `🔗 ${t('eventDetail.share')}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .back-btn {
          font-weight: 600;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 48px;
          align-items: start;
        }

        .detail-image-card {
          background-color: var(--bg-white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 16px;
          box-shadow: var(--shadow-md);
          position: relative;
        }

        .detail-image-card img {
          width: 100%;
          border-radius: var(--radius-md);
          max-height: 550px;
          object-fit: contain;
          background-color: #f0ede9;
        }

        .detail-cancelled-banner {
          background-color: var(--color-red);
          color: white;
          font-family: var(--font-display);
          font-weight: 800;
          padding: 12px;
          text-align: center;
          border-radius: var(--radius-sm);
          margin-top: 12px;
          letter-spacing: 1px;
        }

        .image-card-actions {
          margin-top: 16px;
        }

        .detail-info-card {
          background-color: var(--bg-white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: var(--shadow-md);
        }

        .detail-title {
          font-size: 2.2rem;
          color: var(--color-violet);
          margin-bottom: 24px;
        }

        .organizer-info {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: var(--transition-smooth);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          background-color: var(--bg-cream);
          border: 1px solid var(--border-light);
          display: inline-flex;
        }

        .organizer-info:hover {
          background-color: rgba(82, 54, 99, 0.05);
          border-color: var(--color-violet);
        }

        .organizer-avatar {
          font-size: 1.8rem;
        }

        .org-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.2;
        }

        .org-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-violet);
          margin: 0;
          line-height: 1.2;
        }

        .divider {
          border: 0;
          height: 1px;
          background-color: var(--border-light);
          margin: 24px 0;
        }

        .detail-meta-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
        }

        .meta-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .meta-icon {
          font-size: 1.5rem;
          background-color: var(--bg-cream);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid var(--border-light);
        }

        .meta-item strong {
          display: block;
          font-family: var(--font-display);
          color: var(--color-violet);
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .meta-sub {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .maps-link {
          font-size: 0.85rem;
          color: var(--color-green);
          font-weight: 600;
          display: inline-block;
          margin-top: 4px;
        }

        .maps-link:hover {
          text-decoration: underline;
        }

        .help-box {
          background-color: var(--color-green-glow);
          border: 1px dashed rgba(44, 94, 67, 0.3);
          border-radius: var(--radius-sm);
          padding: 16px;
          color: var(--color-green);
        }

        .help-box h4 {
          color: var(--color-green);
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .help-box p {
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.4;
        }

        .detail-desc-box {
          margin-bottom: 32px;
        }

        .detail-desc-box h3 {
          font-size: 1.1rem;
          margin-bottom: 12px;
        }

        .desc-text {
          color: var(--text-dark);
          font-size: 1rem;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .action-buttons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .calendar-dropdown-container {
          position: relative;
        }

        .calendar-dropdown-container:hover .calendar-options {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .calendar-options {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background-color: var(--bg-white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(10px);
          transition: var(--transition-smooth);
          z-index: 10;
          overflow: hidden;
        }

        .calendar-options a, .calendar-options button {
          padding: 12px;
          text-align: center;
          font-size: 0.9rem;
          font-weight: 500;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-dark);
          transition: var(--transition-smooth);
        }

        .calendar-options a:hover, .calendar-options button:hover {
          background-color: var(--bg-cream);
          color: var(--color-violet);
        }

        .calendar-options a {
          border-bottom: 1px solid var(--border-light);
        }

        .w-100 {
          width: 100%;
        }

        @media (max-width: 992px) {
          .detail-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .detail-info-card {
            padding: 24px;
          }
        }

        @media (max-width: 600px) {
          .action-buttons-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
