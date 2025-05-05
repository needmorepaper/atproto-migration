import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AtpAgent } from '@atproto/api'
import { AvatarProvider } from './contexts/AvatarContext'
import { NetworkProvider } from './contexts/NetworkContext'
import NetworkWarning from './components/common/NetworkWarning'
import Login from './components/auth/Login'
import Actions from './components/common/Actions'
import Migration from './components/common/Migration'
import MigrationProcess from './components/common/MigrationProcess'
import RecoveryKey from './components/common/RecoveryKey'
import RecoveryKeyProcess from './components/common/RecoveryKeyProcess'
import './styles/App.css'

const SESSION_KEY = 'atproto_session';
const SESSION_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

function AppRoutes({ agent, onLogout, handleLogin }: { 
  agent: AtpAgent | null;
  onLogout: () => void;
  handleLogin: (agent: AtpAgent) => void;
}) {
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      if (agent) {
        try {
          // Try to make a simple API call to verify the session
          await agent.getProfile({ actor: agent.session?.handle || '' });
        } catch (err) {
          // If the API call fails, the session is likely invalid
          onLogout();
          alert('Your session has expired. Please log in again.');
        }
      }
    };

    checkSession();
  }, [location.pathname, agent, onLogout]);

  return (
    <>
      <NetworkWarning />
      <Routes>
        <Route
          path="/"
          element={
            agent ? (
              <Navigate to="/actions" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/actions"
          element={
            agent ? (
              <Actions agent={agent} onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/migration"
          element={
            agent ? (
              <Migration agent={agent} onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/migration/process"
          element={
            agent ? (
              <MigrationProcess agent={agent} onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/recovery-key"
          element={
            agent ? (
              <RecoveryKey agent={agent} onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/recovery-key/process"
          element={
            agent ? (
              <RecoveryKeyProcess agent={agent} onLogout={onLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </>
  );
}

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

export default App
