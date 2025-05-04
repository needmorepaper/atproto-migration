import { useEffect, useState } from 'react';
import { AtpAgent } from '@atproto/api';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import '../styles/App.css';

interface ActionsProps {
  agent: AtpAgent;
  onLogout: () => void;
}

export default function Actions({ agent, onLogout }: ActionsProps) {
  const [didDoc, setDidDoc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  useEffect(() => {
    const fetchDidDoc = async () => {
      try {
        const did = agent.session?.did;
        if (!did) {
          throw new Error('No DID found in session');
        }

        let didDocResponse;

        if (did.startsWith('did:plc:')) {
          // For PLC DIDs, resolve from plc.directory
          const response = await fetch(`https://plc.directory/${did}`);
          didDocResponse = await response.json();
        } else if (did.startsWith('did:web:')) {
          // For Web DIDs, get from .well-known/did.json
          const domain = did.split(':')[2];
          const response = await fetch(`https://${domain}/.well-known/did.json`);
          didDocResponse = await response.json();
        } else {
          throw new Error(`Unsupported DID type: ${did}`);
        }

        setDidDoc(JSON.stringify(didDocResponse, null, 2));
      } catch (err) {
        console.error('Error fetching DID document:', err);
        setDidDoc(`Error fetching DID document: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDidDoc();
  }, [agent]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="actions-container">
        <div className="actions-card">
          <div className="actions-header">
            <h1 className="actions-title">User Information</h1>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="info-section">
            <div className="info-label">Handle</div>
            <div className="info-value">{agent.session?.handle}</div>
          </div>

          <div className="info-section">
            <div className="info-label">PDS Host</div>
            <div className="info-value">{agent.service.toString()}</div>
          </div>

          <div className="info-section">
            <div className="info-label">DID</div>
            <div className="info-value">{agent.session?.did}</div>
          </div>

          <div className="info-section">
            <div className="info-label">DID Document</div>
            <pre className="did-document">
              <code>{didDoc}</code>
            </pre>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 