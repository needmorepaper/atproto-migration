import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import Footer from '../layout/Footer';
import Header from '../layout/Header';
import '../../styles/App.css';

interface RecoveryKeyProps {
  agent: AtpAgent;
  onLogout: () => void;
}

export default function RecoveryKey({ agent, onLogout }: RecoveryKeyProps) {
  const navigate = useNavigate();

  return (
    <div className="actions-page">
      <Header agent={agent} onLogout={onLogout} />

      <div className="actions-container">
        <div className="page-content">
          <h2>Add a recovery key</h2>
          <p>A recovery key (known as a <b>rotation key</b> in the AT Protocol) is a cryptographic key associated with your account that allows you to modify your account's core identity.</p>
          
          <h3>How rotation keys work</h3>
          <p>In the AT Protocol, your account is identified using a DID (<b>Decentralized Identifier</b>), with most accounts on the protocol using a variant of it developed specifically for the protocol. The account's core information (such as your handle and data server on the network) is stored in the account's DID document.</p>
          <p>To change this document, you use a rotation key to confirm that you are the owner of the account and that you are authorized to make the changes. For example, when changing your handle, your data server (also known as a PDS) will use its own rotation key to change it without asking you to manually sign the operation.</p>
          <h3>Why should I add another key?</h3>
          <p>Adding a rotation key allows you to regain control of your account if it is compromised. It also allows you to move your account to a new data server, even if the current server is down.</p>
          <div className="warning-section">
            <h3>⚠️ Read Before Continuing ⚠️</h3>
            <ul>
              <li>You will need a PLC operation token to add a recovery key. Tokens are sent to the email address associated with your account.</li>
              <li>While we do generate a key for you, we will not store it. Please save it in a secure location.</li>
              <li>Keep your recovery key private. Anyone with access to it could potentially take control of your account.</li>
              <li>If you're using a third-party PDS, it must be able to send emails or you will not be able to use this tool to add a recovery key.</li>
            </ul>
          </div>
          <div className="docs-section">
            <h3>Additional Resources</h3>
            <p>For the technically inclined, here are some additional resources for how rotation keys work:</p>
            <ul>
              <li><a href="https://atproto.com/guides/identity" target="_blank" rel="noopener noreferrer">AT Protocol's developer documentation on identity</a></li>
              <li><a href="https://whtwnd.com/did:plc:xz3euvkhf44iadavovbsmqoo/3laimapx6ks2b" target="_blank" rel="noopener noreferrer">Guide to adding a recovery key using the command line</a></li>
              <li><a href="https://whtwnd.com/did:plc:44ybard66vv44zksje25o7dz/3lj7jmt2ct72r" target="_blank" rel="noopener noreferrer">More in-depth guide to adding a recovery key</a></li>
            </ul>
          </div>

          <button 
            className="back-button"
            onClick={() => navigate('/actions')}
          >
            ← Go back
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
} 