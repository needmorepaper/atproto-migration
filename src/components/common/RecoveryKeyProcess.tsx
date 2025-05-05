import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AtpAgent } from '@atproto/api';
import Footer from '../layout/Footer';
import Header from '../layout/Header';
import '../../styles/App.css';

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
      e.returnValue = '';
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