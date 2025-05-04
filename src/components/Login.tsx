import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import Footer from './Footer';
import '../styles/App.css';

interface LoginProps {
  onLogin: (agent: AtpAgent) => void;
}

interface DidDocument {
  service: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
  }>;
}

export default function Login({ onLogin }: LoginProps) {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [appPasswordAttempts, setAppPasswordAttempts] = useState(0);
  const navigate = useNavigate();

  const isAppPassword = (password: string) => {
    // App passwords are typically in the format xxxx-xxxx-xxxx-xxxx
    return /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAppPassword(password)) {
      if (appPasswordAttempts < 3) {
        setAppPasswordAttempts(appPasswordAttempts + 1);
        setError(`Warning: You have entered an app password, which does not allow you to migrate your account.`);
        return;
      }
    }

    try {
      // Create temporary agent to resolve DID
      const tempAgent = new AtpAgent({ service: 'https://bsky.social' });

      // Get DID document from handle
      const didResponse = await tempAgent.com.atproto.identity.resolveHandle({
        handle: handle
      });

      // Get PDS endpoint from DID document
      let didDocResponse;
      const did = didResponse.data.did;

      if (did.startsWith('did:plc:')) {
        // For PLC DIDs, resolve from plc.directory
        const plcResponse = await fetch(`https://plc.directory/${did}`);
        didDocResponse = { data: await plcResponse.json() };
      } else if (did.startsWith('did:web:')) {
        // For Web DIDs, get from .well-known/did.json
        const domain = did.split(':')[2];
        const webResponse = await fetch(`https://${domain}/.well-known/did.json`);
        didDocResponse = { data: await webResponse.json() };
      } else {
        // Fallback to ATP resolver for other DID types
        didDocResponse = await tempAgent.com.atproto.identity.resolveDid({
          did: did
        });
      }

      const pds = ((didDocResponse.data as unknown) as DidDocument).service.find((s) => s.id === '#atproto_pds')?.serviceEndpoint || 'https://bsky.social';

      const agent = new AtpAgent({ service: pds });
      await agent.login({ identifier: handle, password });
      onLogin(agent);
      navigate('/actions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div>
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Sign in to your account</h2>
          <div className="warning-message">
            ⚠️ Please use your main account password, not an app password. All operations are performed locally in your browser.
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                required
                className="form-input"
                placeholder="Handle (e.g., example.bsky.social)"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                required
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-button">
              Sign in
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
} 