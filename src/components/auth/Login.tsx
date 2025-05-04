import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import Footer from '../layout/Footer';
import '../../styles/App.css';

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

type LoginStep = 'idle' | 'resolving-handle' | 'resolving-did' | 'connecting-pds' | 'authenticating' | 'success';

export default function Login({ onLogin }: LoginProps) {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [appPasswordAttempts, setAppPasswordAttempts] = useState(0);
  const [loginStep, setLoginStep] = useState<LoginStep>('idle');
  const navigate = useNavigate();

  const isAppPassword = (password: string) => {
    // App passwords are typically in the format xxxx-xxxx-xxxx-xxxx
    return /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(password);
  };

  const getStepMessage = (step: LoginStep) => {
    switch (step) {
      case 'resolving-handle':
        return 'Resolving your handle...';
      case 'resolving-did':
        return 'Resolving your DID...';
      case 'connecting-pds':
        return 'Connecting to your Personal Data Server...';
      case 'authenticating':
        return 'Authenticating your credentials...';
      case 'success':
        return 'Login successful! Redirecting...';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginStep('resolving-handle');

    // app password check and debug method
    if (isAppPassword(password)) {
      if (appPasswordAttempts < 3) {
        setAppPasswordAttempts(appPasswordAttempts + 1);
        setError(`You have entered an app password, which does not allow for you to migrate your account. Please enter your main account password instead.`);
        setLoginStep('idle');
        return;
      }
    }

    setHandle(handle.trim());

    try {
      // Create temporary agent to resolve DID
      const tempAgent = new AtpAgent({ service: 'https://public.api.bsky.app' });

      // Get DID document from handle
      setLoginStep('resolving-handle');
      const didResponse = await tempAgent.com.atproto.identity.resolveHandle({
        handle: handle
      });

      if (!didResponse.success) {
        // Try did:web resolution first
        const domain = handle.split('.').join(':');
        const webDid = `did:web:${domain}`;
        try {
          const webResponse = await fetch(`https://${handle}/.well-known/did.json`);
          if (webResponse.ok) {
            // If successful, continue with the did:web
            didResponse.data.did = webDid;
          } else {
            throw new Error('Invalid handle');
          }
        } catch {
          throw new Error('Invalid handle');
        }
      }

      // Get PDS endpoint from DID document
      setLoginStep('resolving-did');
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

      setLoginStep('connecting-pds');
      const pds = ((didDocResponse.data as unknown) as DidDocument).service.find((s) => s.id === '#atproto_pds')?.serviceEndpoint || 'https://bsky.social';

      const agent = new AtpAgent({ service: pds });
      
      setLoginStep('authenticating');
      await agent.login({ identifier: handle, password });
      
      setLoginStep('success');
      onLogin(agent);
      navigate('/actions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoginStep('idle');
    }
  };

  return (
    <div>
      <h1 className="login-title">ATproto Migrator</h1>
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
                disabled={loginStep !== 'idle'}
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
                disabled={loginStep !== 'idle'}
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {loginStep !== 'idle' && (
              <div className="loading-message">
                {getStepMessage(loginStep)}
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={loginStep !== 'idle'}
            >
              {loginStep === 'idle' ? 'Sign in' : 'Signing in...'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
} 