import { useEffect, useState } from 'react';
import { AtpAgent } from '@atproto/api';
import { useNavigate } from 'react-router-dom';
import Footer from '../layout/Footer';
import '../../styles/App.css';

interface ActionsProps {
  agent: AtpAgent;
  onLogout: () => void;
}

export default function Actions({ agent, onLogout }: ActionsProps) {
  const [didDoc, setDidDoc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const did = agent.session?.did;
        if (!did) {
          throw new Error('No DID found in session');
        }

        // Fetch profile using authenticated agent
        const profile = await agent.getProfile({ actor: agent.session?.handle || '' });
        if (profile.data.avatar) {
          setAvatarUrl(profile.data.avatar);
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
        console.error('Error fetching profile or DID document:', err);
        setDidDoc(`Error fetching DID document: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [agent]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="actions-page">
      <header className="app-header">
        <h1 className="app-title">ATproto Migrator</h1>
        <div className="user-info">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="Profile"
              className="user-avatar"
            />
          )}
          <span className="user-handle">{agent.session?.handle}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="actions-container">
        <div className="actions-list">
          <div className="action-item">
            <div className="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="action-content">
              <div className="action-title">Migrate account</div>
              <div className="action-subtitle">Move your account to a new host</div>
            </div>
          </div>

          <div className="action-item">
            <div className="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="action-content">
              <div className="action-title">Add recovery key</div>
              <div className="action-subtitle">Create a new recovery method for your account</div>
            </div>
          </div>
        </div>

        <details className="user-info-section">
          <summary className="user-info-summary">User Information</summary>
          <div className="user-info-content">
            <section>
              <h2>Account Details</h2>
              <dl>
                <dt>Handle</dt>
                <dd>{agent.session?.handle || 'N/A'}</dd>
                
                <dt>PDS Host</dt>
                <dd>{agent.serviceUrl.toString() || 'N/A'}</dd>
                
                <dt>DID</dt>
                <dd>{agent.session?.did || 'N/A'}</dd>
              </dl>
            </section>
            
            <section>
              <h2>DID Document</h2>
              <pre className="did-document">
                <code>{didDoc}</code>
              </pre>
            </section>
          </div>
        </details>
      </div>
      <Footer />
    </div>
  );
} 