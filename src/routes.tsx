import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AtpAgent } from '@atproto/api'
import NetworkWarning from './components/common/networkWarning'
import Login from './pages/login'
import Actions from './pages/actions'
import Migration from './pages/migration/migration'
import MigrationProcess from './pages/migration/MigrationProcess'
import RecoveryKey from './pages/recoveryKey/recovery'
import RecoveryKeyProcess from './pages/recoveryKey/RecoveryKeyProcess'

export function AppRoutes({ agent, onLogout, handleLogin }: { 
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