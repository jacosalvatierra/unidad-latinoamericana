import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Directory from './pages/Directory';
import InitiativeProfile from './pages/InitiativeProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { apiFetch, user } = useApp();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState(null);

  // Check URL query parameters on mount for deep linking (e.g., share links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    const initId = params.get('initiative');

    if (eventId) {
      const loadSharedEvent = async () => {
        try {
          const allEvents = await apiFetch('events.php');
          const found = allEvents.find(e => e.id === parseInt(eventId));
          if (found) {
            setSelectedEvent(found);
            setCurrentPage('event_detail');
          }
        } catch (e) {
          console.error('Failed to load shared event:', e);
        }
      };
      loadSharedEvent();
    } else if (initId) {
      setSelectedInitiativeId(parseInt(initId));
      setCurrentPage('initiative_profile');
    }
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setCurrentPage('event_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectInitiative = (id) => {
    setSelectedInitiativeId(id);
    setCurrentPage('initiative_profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home 
            onSelectEvent={handleSelectEvent}
            onJoinClick={() => setCurrentPage('register')}
          />
        );
      case 'event_detail':
        return (
          <EventDetail
            event={selectedEvent}
            onBack={() => setCurrentPage('home')}
            onSelectInitiative={handleSelectInitiative}
          />
        );
      case 'directory':
        return (
          <Directory 
            onSelectInitiative={handleSelectInitiative}
          />
        );
      case 'initiative_profile':
        return (
          <InitiativeProfile
            initiativeId={selectedInitiativeId}
            onBack={() => setCurrentPage('directory')}
            onSelectEvent={handleSelectEvent}
          />
        );
      case 'login':
        return (
          <Login 
            onRegisterClick={() => setCurrentPage('register')}
            onLoginSuccess={handleLoginSuccess}
          />
        );
      case 'register':
        return (
          <Register 
            onLoginClick={() => setCurrentPage('login')}
          />
        );
      case 'dashboard':
        return user ? (
          <Dashboard />
        ) : (
          <Login 
            onRegisterClick={() => setCurrentPage('register')}
            onLoginSuccess={handleLoginSuccess}
          />
        );
      default:
        return <Home onSelectEvent={handleSelectEvent} />;
    }
  };

  return (
    <div className="site-layout">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <main className="main-content">
        {renderPage()}
      </main>

      <Footer />

      <style>{`
        .site-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .main-content {
          flex-grow: 1;
        }
      `}</style>
    </div>
  );
}
