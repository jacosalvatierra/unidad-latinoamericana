import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { t, apiFetch, user } = useApp();
  
  // Dashboard navigation tabs
  const [activeTab, setActiveTab] = useState('events'); // events, profile

  // Lists state
  const [myEvents, setMyEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Form states (Event Create/Edit)
  const [editingEvent, setEditingEvent] = useState(null); // null means not editing or creating, otherwise event object (empty id for creating)
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventCategory, setEventCategory] = useState('festival');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventFlyerUrl, setEventFlyerUrl] = useState('');
  const [eventVisibility, setEventVisibility] = useState('public');
  const [eventNeedsHelp, setEventNeedsHelp] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  // Form states (Profile Edit)
  const [profName, setProfName] = useState(user?.name || '');
  const [profDesc, setProfDesc] = useState(user?.description || '');
  const [profLogo, setProfLogo] = useState(user?.logo || '');
  const [profWeb, setProfWeb] = useState(user?.website || '');
  const [profInsta, setProfInsta] = useState(user?.instagram || '');
  const [profFb, setProfFb] = useState(user?.facebook || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Load events for this organization
  const loadMyEvents = async () => {
    try {
      setLoadingEvents(true);
      const allEvents = await apiFetch('events.php');
      // Filter by current user ID
      const filtered = allEvents.filter(e => e.initiative_id === user.id);
      setMyEvents(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyEvents();
    }
  }, [user]);

  // Open Form for creating new event
  const handleNewEvent = () => {
    setEditingEvent({ id: '' });
    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventCategory('festival');
    setEventLocation('');
    setEventDescription('');
    setEventFlyerUrl('');
    setEventVisibility('public');
    setEventNeedsHelp(false);
  };

  // Open Form for editing existing event
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventTime(event.time);
    setEventCategory(event.category);
    setEventLocation(event.location);
    setEventDescription(event.description);
    setEventFlyerUrl(event.flyer);
    setEventVisibility(event.visibility);
    setEventNeedsHelp(event.needs_help);
  };

  // Handles flyer image upload and converts to Base64 (for mock database / light uploads)
  const handleFlyerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert file to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setEventFlyerUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handles logo upload and converts to Base64
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Event Submit (Create or Edit)
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventTime || !eventLocation || !eventDescription) return;

    setSavingEvent(true);
    const action = editingEvent.id === '' ? 'create' : 'edit';
    
    try {
      const payload = {
        action,
        title: eventTitle,
        date: eventDate,
        time: eventTime,
        category: eventCategory,
        location: eventLocation,
        description: eventDescription,
        flyer: eventFlyerUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
        visibility: eventVisibility,
        needs_help: eventNeedsHelp
      };

      if (action === 'edit') {
        payload.id = editingEvent.id;
      }

      const res = await apiFetch('events.php', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setEditingEvent(null);
        loadMyEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEvent(false);
    }
  };

  // Cancel Event
  const handleCancelEvent = async (id) => {
    if (!window.confirm(t('dashboard.cancelConfirm'))) return;

    try {
      const res = await apiFetch('events.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', id })
      });
      if (res.success) {
        loadMyEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id) => {
    if (!window.confirm(t('dashboard.deleteConfirm'))) return;

    try {
      const res = await apiFetch('events.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id })
      });
      if (res.success) {
        loadMyEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');

    try {
      const res = await apiFetch('initiatives.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_profile',
          name: profName,
          description: profDesc,
          logo: profLogo,
          website: profWeb,
          instagram: profInsta,
          facebook: profFb
        })
      });

      if (res.success) {
        setProfileMessage(t('dashboard.profileSuccess'));
        setTimeout(() => setProfileMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setProfileMessage('Error al actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="dashboard-page section">
      <div className="container">
        {/* Welcome header */}
        <div className="dashboard-header mb-4">
          <h1>
            {t('dashboard.title')}
          </h1>
          <p className="welcome-text">
            {t('dashboard.welcome')} <strong>{user?.name}</strong>
          </p>
        </div>

        {/* Form Overlay (Modal) */}
        {editingEvent && (
          <div className="modal-overlay">
            <div className="modal-card card">
              <h2>{editingEvent.id === '' ? t('dashboard.createEvent') : t('dashboard.editEvent')}</h2>
              
              <form onSubmit={handleEventSubmit} className="modal-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('dashboard.eventTitle')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('dashboard.eventCategory')} *</label>
                    <select
                      className="form-select"
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                    >
                      {['festival', 'concert', 'theater', 'food', 'workshop', 'social', 'charity', 'other'].map(c => (
                        <option key={c} value={c}>{t(`categories.${c}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('dashboard.eventDate')} *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('dashboard.eventTime')} *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('dashboard.eventLocation')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dirección, sala, ciudad..."
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('dashboard.eventDescription')} *</label>
                  <textarea
                    className="form-textarea"
                    rows="4"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('dashboard.eventFlyer')} (URL)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://..."
                      value={eventFlyerUrl}
                      onChange={(e) => setEventFlyerUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">O subir imagen desde archivo</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={handleFlyerUpload}
                    />
                  </div>
                </div>

                {eventFlyerUrl && (
                  <div className="flyer-preview-box mb-3">
                    <p className="form-label">Vista previa del flyer:</p>
                    <img src={eventFlyerUrl} alt="Flyer Preview" className="flyer-preview-img" />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('dashboard.eventVisibility')}</label>
                  <select
                    className="form-select"
                    value={eventVisibility}
                    onChange={(e) => setEventVisibility(e.target.value)}
                  >
                    <option value="public">{t('dashboard.visibilityPublicOption')}</option>
                    <option value="members">{t('dashboard.visibilityMembersOption')}</option>
                  </select>
                </div>

                <div className="checkbox-group mb-4">
                  <input
                    id="needs-help"
                    type="checkbox"
                    className="form-checkbox"
                    checked={eventNeedsHelp}
                    onChange={(e) => setEventNeedsHelp(e.target.checked)}
                  />
                  <label htmlFor="needs-help" className="checkbox-label">
                    🤝 {t('dashboard.needsHelpCheckbox')}
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setEditingEvent(null)} disabled={savingEvent}>
                    {t('dashboard.cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingEvent}>
                    {savingEvent ? '...' : t('dashboard.submitCreate')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard layout */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📋 {t('dashboard.tabEvents')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            ⚙️ {t('dashboard.tabProfile')}
          </button>
        </div>

        {/* Tab 1: Events List */}
        {activeTab === 'events' && (
          <div className="dashboard-events-tab">
            <div className="events-tab-header mb-4">
              <h2>{t('dashboard.tabEvents')}</h2>
              <button onClick={handleNewEvent} className="btn btn-primary">
                ➕ {t('dashboard.createEvent')}
              </button>
            </div>

            {loadingEvents ? (
              <div className="skeleton-tab">
                {[1, 2].map(n => (
                  <div key={n} className="skeleton" style={{ height: '80px', marginBottom: '16px' }}></div>
                ))}
              </div>
            ) : myEvents.length === 0 ? (
              <div className="no-events-box text-center">
                <p>{t('dashboard.noEvents')}</p>
                <button onClick={handleNewEvent} className="btn btn-primary mt-3">
                  {t('dashboard.createEvent')}
                </button>
              </div>
            ) : (
              <div className="dashboard-events-list">
                {myEvents.map(e => (
                  <div key={e.id} className="dashboard-event-item">
                    <div className="event-item-img">
                      <img 
                        src={e.flyer} 
                        alt={e.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=150';
                        }}
                      />
                    </div>
                    
                    <div className="event-item-details">
                      <h3>{e.title}</h3>
                      <p className="item-meta">
                        📅 {e.date} &bull; 🕒 {e.time} hs &bull; 📍 {e.location}
                      </p>
                      <div className="item-badges mt-1">
                        <span className="badge badge-violet">{t(`categories.${e.category}`)}</span>
                        <span className={`badge ${e.visibility === 'public' ? 'badge-green' : 'badge-private-dark'}`}>
                          {e.visibility === 'public' ? t('home.visibilityPublic') : t('home.visibilityMembers')}
                        </span>
                        {e.status === 'cancelled' && (
                          <span className="badge badge-red font-bold">{t('home.cancelledBadge').toUpperCase()}</span>
                        )}
                      </div>
                    </div>

                    <div className="event-item-actions">
                      {e.status !== 'cancelled' && (
                        <>
                          <button onClick={() => handleEditEvent(e)} className="btn btn-outline btn-sm">
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleCancelEvent(e.id)} className="btn btn-accent btn-sm">
                            🚫 Cancelar
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDeleteEvent(e.id)} className="btn btn-outline btn-sm delete-event-btn">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Edit Profile */}
        {activeTab === 'profile' && (
          <div className="dashboard-profile-tab card">
            <h2>{t('dashboard.tabProfile')}</h2>
            <hr className="divider" style={{ margin: '16px 0' }} />

            {profileMessage && <div className="alert-success-profile">{profileMessage}</div>}

            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">{t('register.name')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('register.logo')} (URL)</label>
                  <input
                    type="url"
                    className="form-input"
                    value={profLogo}
                    onChange={(e) => setProfLogo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Subir foto desde archivo</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={handleLogoUpload}
                  />
                </div>

                {profLogo && (
                  <div className="logo-preview-box">
                    <img src={profLogo} alt="Logo preview" className="logo-preview-img" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('register.description')} *</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={profDesc}
                  onChange={(e) => setProfDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">{t('register.website')}</label>
                  <input
                    type="url"
                    className="form-input"
                    value={profWeb}
                    onChange={(e) => setProfWeb(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('register.instagram')}</label>
                  <input
                    type="url"
                    className="form-input"
                    value={profInsta}
                    onChange={(e) => setProfInsta(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('register.facebook')}</label>
                  <input
                    type="url"
                    className="form-input"
                    value={profFb}
                    onChange={(e) => setProfFb(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-3" disabled={savingProfile}>
                {savingProfile ? '...' : t('dashboard.submitEdit')}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-header {
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 20px;
        }

        .welcome-text {
          font-size: 1.1rem;
          color: var(--text-muted);
        }

        .dashboard-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          border-bottom: 2px solid var(--border-light);
          padding-bottom: 2px;
        }

        .tab-btn {
          background: none;
          border: none;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--text-muted);
          padding: 12px 16px;
          cursor: pointer;
          transition: var(--transition-smooth);
          position: relative;
        }

        .tab-btn:hover {
          color: var(--color-violet);
        }

        .tab-btn.active {
          color: var(--color-violet);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 4px;
          background-color: var(--color-violet);
          border-radius: 2px;
        }

        .events-tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-events-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dashboard-event-item {
          display: flex;
          align-items: center;
          background-color: var(--bg-white);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 16px;
          gap: 20px;
          transition: var(--transition-smooth);
        }

        .dashboard-event-item:hover {
          box-shadow: var(--shadow-sm);
        }

        .event-item-img {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background-color: #f0ede9;
        }

        .event-item-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .event-item-details {
          flex-grow: 1;
        }

        .event-item-details h3 {
          font-size: 1.15rem;
          color: var(--color-violet);
          margin-bottom: 4px;
        }

        .item-meta {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .item-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .badge-private-dark {
          background-color: #e6e2dc;
          color: var(--text-dark);
        }

        .event-item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-sm {
          padding: 8px 12px;
          font-size: 0.8rem;
        }

        .delete-event-btn {
          border-color: rgba(200, 75, 49, 0.2);
          color: var(--color-red);
        }

        .delete-event-btn:hover {
          background-color: var(--color-red-glow);
          border-color: var(--color-red);
        }

        /* Modal / Form Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(43, 41, 39, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          overflow-y: auto;
          padding: 20px;
        }

        .modal-card {
          width: 100%;
          max-width: 650px;
          padding: 32px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-form {
          margin-top: 20px;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--color-green);
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-dark);
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .flyer-preview-box {
          background-color: var(--bg-cream);
          border: 1px solid var(--border-light);
          padding: 12px;
          border-radius: var(--radius-sm);
        }

        .flyer-preview-img {
          max-width: 120px;
          max-height: 120px;
          object-fit: contain;
          border-radius: 4px;
          margin-top: 8px;
          border: 1px solid var(--border-light);
        }

        /* Profile Tab styling */
        .dashboard-profile-tab {
          padding: 40px;
          background-color: var(--bg-white);
        }

        .alert-success-profile {
          background-color: rgba(44, 94, 67, 0.08);
          color: var(--color-green);
          border: 1px solid rgba(44, 94, 67, 0.2);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .logo-preview-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid var(--border-light);
          margin-top: 24px;
          background-color: var(--bg-cream);
        }

        .logo-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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

        @media (max-width: 768px) {
          .dashboard-event-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .event-item-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .form-grid-2, .form-grid-3 {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
}
