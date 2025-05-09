import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { AtpAgent } from '@atproto/api'
import { AvatarProvider } from './contexts/avatarContext'
import { NetworkProvider } from './contexts/networkContext'
import { AppRoutes } from './routes'
import '../public/main.css'

const SESSION_KEY = 'atproto_session';
const SESSION_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

function App() {
  const [agent, setAgent] = useState<AtpAgent | null>(null)

  useEffect(() => {
    // Load session from localStorage on initial load
    const loadSession = async () => {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const { session, service, timestamp } = JSON.parse(savedSession);
        
        // Check if session is expired
        if (Date.now() - timestamp > SESSION_EXPIRY) {
          localStorage.removeItem(SESSION_KEY);
          return;
        }

        const newAgent = new AtpAgent({ service });
        await newAgent.resumeSession(session);
        setAgent(newAgent);
      }
    };

    loadSession();
  }, []);

  const handleLogin = (newAgent: AtpAgent) => {
    setAgent(newAgent);
    // Save session to localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      session: newAgent.session,
      service: newAgent.service.toString(),
      timestamp: Date.now()
    }));
  };

  const handleLogout = () => {
    setAgent(null);
    localStorage.removeItem(SESSION_KEY);
    // Clear avatar URL from context
    const avatarContext = document.querySelector('[data-avatar-context]');
    if (avatarContext) {
      const event = new CustomEvent('clearAvatar');
      avatarContext.dispatchEvent(event);
    }
  };

  return (
    <NetworkProvider>
      <AvatarProvider>
        <Router>
          <AppRoutes 
            agent={agent} 
            onLogout={handleLogout} 
            handleLogin={handleLogin}
          />
        </Router>
      </AvatarProvider>
    </NetworkProvider>
  )
}

// Initialize the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
