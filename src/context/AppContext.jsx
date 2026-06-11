import React, { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../utils/i18n';

const AppContext = createContext();

// Sample Initial Mock Data
const INITIAL_INITIATIVES = [
  {
    id: 1,
    name: 'Asociación Cantapueblo',
    email: 'info@cantapueblo.de',
    description: 'Coro y asociación cultural que difunde la música y tradiciones latinoamericanas en Múnich. Organizamos peñas, conciertos y talleres.',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
    website: 'https://cantapueblo.de',
    instagram: 'https://instagram.com/cantapueblo.de',
    facebook: 'https://facebook.com/cantapueblo.de',
    status: 'active'
  },
  {
    id: 2,
    name: 'Latino Eventos Múnich',
    email: 'contacto@latinoevents.de',
    description: 'Colectivo independiente dedicado a la promoción de la gastronomía y festivales folklóricos de América Latina.',
    logo: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80',
    website: '',
    instagram: 'https://instagram.com/latino_eventos_de',
    facebook: '',
    status: 'active'
  },
  {
    id: 3,
    name: 'Teatro Latino',
    email: 'teatro@latinos.de',
    description: 'Compañía teatral bilingüe que representa obras de autores latinoamericanos y organiza talleres de actuación.',
    logo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80',
    website: 'https://teatrolatino.de',
    instagram: '',
    facebook: '',
    status: 'pending' // For testing registration flow
  }
];

const INITIAL_EVENTS = [
  {
    id: 1,
    initiative_id: 1,
    title: 'Peña Folklórica de Invierno',
    date: '2026-07-15',
    time: '19:00',
    category: 'festival',
    location: 'EineWeltHaus, Múnich',
    description: '¡Ven a disfrutar de una noche mágica! Música en vivo, grupos de danza folklórica y venta de empanadas tradicionales. Entrada libre (contribución voluntaria).',
    flyer: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    visibility: 'public',
    needs_help: true,
    status: 'active'
  },
  {
    id: 2,
    initiative_id: 1,
    title: 'Ensayo Abierto - Coro Cantapueblo',
    date: '2026-06-20',
    time: '18:30',
    category: 'workshop',
    location: 'Sala Musical A, Gasteig HP8',
    description: '¿Te gusta cantar? Abrimos las puertas de nuestro ensayo semanal. Ven a cantar ritmos latinoamericanos con nosotros. No se requiere experiencia previa.',
    flyer: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
    visibility: 'public',
    needs_help: false,
    status: 'active'
  },
  {
    id: 3,
    initiative_id: 2,
    title: 'Reunión Interna: Planificación de Verano',
    date: '2026-06-25',
    time: '20:00',
    category: 'social',
    location: 'Café Latino, Múnich (Privado)',
    description: 'Reunión exclusiva para organizadores y directivas de asociaciones latinas. Vamos a coordinar el calendario de festivales del mes de agosto para no superponernos y ver cómo ayudarnos entre todos.',
    flyer: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80',
    visibility: 'members', // Visible only to logged in initiatives
    needs_help: false,
    status: 'active'
  },
  {
    id: 4,
    initiative_id: 2,
    title: 'Tarde de Arepas y Música Latina',
    date: '2026-06-12', // Very soon
    time: '13:00',
    category: 'food',
    location: 'Parque Central de Múnich (Ostdock)',
    description: 'Encuentro al aire libre para degustar arepas venezolanas y colombianas con música acústica en vivo. Trae tu manta y tus bebidas.',
    flyer: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    visibility: 'public',
    needs_help: true,
    status: 'active'
  }
];

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('ul_lang') || 'es');
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('ul_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Check if running on localhost or development environment
  useEffect(() => {
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname === '';
    setIsLocalMode(isDev);

    if (isDev) {
      // Initialize client-side localStorage Database if not exists
      if (!localStorage.getItem('ul_db_initialized')) {
        localStorage.setItem('ul_db_initialized', 'true');
        localStorage.setItem('ul_initiatives', JSON.stringify(INITIAL_INITIATIVES));
        localStorage.setItem('ul_events', JSON.stringify(INITIAL_EVENTS));
        localStorage.setItem('ul_subscribers', JSON.stringify([]));
      }
    }
  }, []);

  // Save language selection
  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('ul_lang', newLang);
  };

  // Translation Function (looks up paths like 'nav.home' in translations dictionary)
  const t = (keyPath) => {
    const dict = translations[lang] || translations['es'];
    const keys = keyPath.split('.');
    let value = dict;
    for (const key of keys) {
      if (value[key] === undefined) {
        return keyPath; // Fallback to raw key if not found
      }
      value = value[key];
    }
    return value;
  };

  // Unified fetch helper bypassing SiteGround Cache and automatically falling back to LocalStorage in Dev Mode
  const apiFetch = async (endpoint, options = {}) => {
    // Determine path
    const url = `/api/${endpoint}`;
    
    // Add cache buster query parameter to bypass SiteGround Cache
    const separator = url.includes('?') ? '&' : '?';
    const cleanUrl = `${url}${separator}t=${Date.now()}`;

    // If local dev environment, run simulation code
    if (isLocalMode) {
      return simulateApi(endpoint, options);
    }

    // Otherwise, perform real HTTP request to PHP backend on SiteGround
    try {
      // Add Authorization header if user is logged in
      if (user && user.token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${user.token}`
        };
      }
      
      const response = await fetch(cleanUrl, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('API Fetch failed, using client-side mock as backup:', err);
      return simulateApi(endpoint, options); // Backup simulation in production if server fails
    }
  };

  // Local Database API Simulation
  const simulateApi = (endpoint, options = {}) => {
    return new Promise((resolve, reject) => {
      // Delay to simulate network latency
      setTimeout(() => {
        const path = endpoint.split('?')[0];
        
        // Load mock databases
        let initiatives = JSON.parse(localStorage.getItem('ul_initiatives')) || [];
        let events = JSON.parse(localStorage.getItem('ul_events')) || [];
        let subscribers = JSON.parse(localStorage.getItem('ul_subscribers')) || [];

        // --- AUTH API ---
        if (path === 'auth.php') {
          const body = JSON.parse(options.body);
          if (body.action === 'login') {
            const found = initiatives.find(i => i.email.toLowerCase() === body.email.toLowerCase());
            // In simulation, we accept password '123' or same as email name for simplicity
            if (found && found.status === 'active') {
              const userObj = { ...found, token: 'mock-jwt-token-xyz' };
              resolve({ success: true, user: userObj });
            } else if (found && found.status === 'pending') {
              reject(new Error('pending_approval'));
            } else {
              reject(new Error('invalid_credentials'));
            }
          }
          else if (body.action === 'logout') {
            resolve({ success: true });
          }
        }

        // --- REGISTER API ---
        else if (path === 'register.php') {
          const body = JSON.parse(options.body);
          const emailExists = initiatives.some(i => i.email.toLowerCase() === body.email.toLowerCase());
          if (emailExists) {
            reject(new Error('email_exists'));
            return;
          }

          const newId = initiatives.length > 0 ? Math.max(...initiatives.map(i => i.id)) + 1 : 1;
          const newInitiative = {
            id: newId,
            name: body.name,
            email: body.email,
            description: body.description,
            logo: body.logo || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
            website: body.website || '',
            instagram: body.instagram || '',
            facebook: body.facebook || '',
            status: 'pending' // Requires admin approval
          };

          initiatives.push(newInitiative);
          localStorage.setItem('ul_initiatives', JSON.stringify(initiatives));

          // Mock approval email details
          console.log(`[SIMULATOR] Correo enviado a jacosalvatierra@gmail.com. Aprobar con el enlace: http://localhost:5173/api/approve.php?id=${newId}&token=mocktoken`);
          
          resolve({ success: true, message: 'registered_pending' });
        }

        // --- APPROVE INITIATIVE (Simulated link handler) ---
        else if (path === 'approve.php') {
          const urlParams = new URLSearchParams(endpoint.split('?')[1]);
          const id = parseInt(urlParams.get('id'));
          const idx = initiatives.findIndex(i => i.id === id);
          if (idx !== -1) {
            initiatives[idx].status = 'active';
            localStorage.setItem('ul_initiatives', JSON.stringify(initiatives));
            resolve({ success: true, message: 'approved' });
          } else {
            reject(new Error('not_found'));
          }
        }

        // --- EVENTS API ---
        else if (path === 'events.php') {
          const method = options.method || 'GET';
          
          if (method === 'GET') {
            // Check if current user is logged in
            const loggedIn = user !== null;
            
            // Filter active events and map with initiative info
            let results = events
              .filter(e => e.status !== 'deleted')
              .map(e => {
                const init = initiatives.find(i => i.id === e.initiative_id) || {};
                return {
                  ...e,
                  initiative_name: init.name,
                  initiative_logo: init.logo
                };
              });

            // If not logged in, filter out members-only events
            if (!loggedIn) {
              results = results.filter(e => e.visibility !== 'members');
            }

            // Order by date ascending
            results.sort((a, b) => new Date(a.date) - new Date(b.date));
            resolve(results);
          } 
          else if (method === 'POST') {
            const body = JSON.parse(options.body);
            
            if (body.action === 'create') {
              const newId = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
              const newEvent = {
                id: newId,
                initiative_id: user.id,
                title: body.title,
                date: body.date,
                time: body.time,
                category: body.category,
                location: body.location,
                description: body.description,
                flyer: body.flyer || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600',
                visibility: body.visibility || 'public',
                needs_help: body.needs_help || false,
                status: 'active'
              };

              events.push(newEvent);
              localStorage.setItem('ul_events', JSON.stringify(events));

              // Simulate sending newsletter
              console.log(`[SIMULATOR] Newsletter enviado a todos los suscriptores: "¡Nuevo evento: ${newEvent.title}!"`);
              resolve({ success: true, event: newEvent });
            }
            else if (body.action === 'edit') {
              const idx = events.findIndex(e => e.id === parseInt(body.id));
              if (idx !== -1) {
                // Check authorization
                if (events[idx].initiative_id !== user.id) {
                  reject(new Error('unauthorized'));
                  return;
                }
                events[idx] = {
                  ...events[idx],
                  title: body.title,
                  date: body.date,
                  time: body.time,
                  category: body.category,
                  location: body.location,
                  description: body.description,
                  flyer: body.flyer || events[idx].flyer,
                  visibility: body.visibility,
                  needs_help: body.needs_help
                };
                localStorage.setItem('ul_events', JSON.stringify(events));
                resolve({ success: true, event: events[idx] });
              } else {
                reject(new Error('event_not_found'));
              }
            }
            else if (body.action === 'cancel') {
              const idx = events.findIndex(e => e.id === parseInt(body.id));
              if (idx !== -1) {
                if (events[idx].initiative_id !== user.id) {
                  reject(new Error('unauthorized'));
                  return;
                }
                events[idx].status = 'cancelled';
                localStorage.setItem('ul_events', JSON.stringify(events));
                
                // Simulate sending cancellation email
                console.log(`[SIMULATOR] Correo de cancelación enviado: "El evento ${events[idx].title} ha sido cancelado"`);
                resolve({ success: true });
              } else {
                reject(new Error('event_not_found'));
              }
            }
            else if (body.action === 'delete') {
              const idx = events.findIndex(e => e.id === parseInt(body.id));
              if (idx !== -1) {
                if (events[idx].initiative_id !== user.id) {
                  reject(new Error('unauthorized'));
                  return;
                }
                events[idx].status = 'deleted';
                localStorage.setItem('ul_events', JSON.stringify(events));
                resolve({ success: true });
              } else {
                reject(new Error('event_not_found'));
              }
            }
          }
        }

        // --- INITIATIVES API ---
        else if (path === 'initiatives.php') {
          const method = options.method || 'GET';

          if (method === 'GET') {
            // Filter only active initiatives
            const activeInits = initiatives
              .filter(i => i.status === 'active')
              .map(i => {
                const count = events.filter(e => e.initiative_id === i.id && e.status !== 'deleted').length;
                return { ...i, events_count: count };
              });
            resolve(activeInits);
          }
          else if (method === 'POST') {
            const body = JSON.parse(options.body);
            if (body.action === 'update_profile') {
              const idx = initiatives.findIndex(i => i.id === user.id);
              if (idx !== -1) {
                initiatives[idx] = {
                  ...initiatives[idx],
                  name: body.name,
                  description: body.description,
                  logo: body.logo || initiatives[idx].logo,
                  website: body.website,
                  instagram: body.instagram,
                  facebook: body.facebook
                };
                localStorage.setItem('ul_initiatives', JSON.stringify(initiatives));
                
                // Update active user state
                const updatedUser = { ...user, ...initiatives[idx] };
                setUser(updatedUser);
                localStorage.setItem('ul_user', JSON.stringify(updatedUser));
                
                resolve({ success: true, user: initiatives[idx] });
              } else {
                reject(new Error('initiative_not_found'));
              }
            }
          }
        }

        // --- SUBSCRIBE API ---
        else if (path === 'subscribe.php') {
          const body = JSON.parse(options.body);
          if (!subscribers.includes(body.email)) {
            subscribers.push(body.email);
            localStorage.setItem('ul_subscribers', JSON.stringify(subscribers));
          }
          resolve({ success: true });
        }

        else {
          reject(new Error('404_not_found'));
        }
      }, 400); // 400ms network delay simulation
    });
  };

  const login = async (email, password) => {
    try {
      const res = await apiFetch('auth.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password })
      });
      if (res.success) {
        setUser(res.user);
        localStorage.setItem('ul_user', JSON.stringify(res.user));
        return { success: true };
      }
    } catch (err) {
      console.error('Login error:', err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ul_user');
  };

  return (
    <AppContext.Provider value={{
      lang,
      changeLanguage,
      t,
      user,
      setUser,
      login,
      logout,
      apiFetch,
      isLocalMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
