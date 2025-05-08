import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AtpAgent } from '@atproto/api';
import Footer from '../../components/common/Footer';
import Header from '../../components/common/Header';

interface RecoveryKeyProcessProps {
  agent: AtpAgent;
  onLogout: () => void;
}

export default function RecoveryKeyProcess({ agent, onLogout }: RecoveryKeyProcessProps) {
  const navigate = useNavigate();

  // Add warning when trying to close or navigate away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="actions-page">
      <Header agent={agent} onLogout={onLogout} />

      <div className="actions-container">
        <div className="page-content">
          <h2>Add Recovery Key</h2>
          <p>This page will guide you through the process of adding a recovery key to your account.</p>
          <div className="warning-section">
            <h3>This is not implemented yet!</h3>
          </div>
          <div className="button-container">
            <button 
              className="back-button"
              onClick={() => navigate('/recovery-key')}
            >
              ← Go back
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 