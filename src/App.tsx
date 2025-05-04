import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AtpAgent } from '@atproto/api'
import Login from './components/auth/Login'
import Actions from './components/common/Actions'
import './styles/App.css'

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
  };

  return (
    <Router>
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
              <Actions agent={agent} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
