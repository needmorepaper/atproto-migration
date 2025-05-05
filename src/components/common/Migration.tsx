import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import Footer from '../layout/Footer';
import Header from '../layout/Header';
import '../../styles/App.css';

interface MigrationProps {
  agent: AtpAgent;
  onLogout: () => void;
}

export default function Migration({ agent, onLogout }: MigrationProps) {
  const navigate = useNavigate();

  return (
    <div className="actions-page">
      <Header agent={agent} onLogout={onLogout} />

      <div className="actions-container">
        <div className="page-content">
          <h2>Migrate your account</h2>
          <p>This tool allows you to migrate your account to a new Personal Data Server, a data storage service that hosts your account and all of its data.</p>
          <h3>What to expect</h3>
          <p>The migration process is <i>possible</i>, however it is not recommended if you are unsure about what you are doing, especially if you are migrating your primary account.</p>
          <p>You will need the following items to begin the migration process:</p>
          <ul>
            <li>A new PDS to migrate to</li>
            <li>An invite code from the new PDS (if required)</li>
            <li>A PLC operation token to confirm the migration</li>
            <li>A new password for your account <b>(Your password will not be stored by this tool.)</b></li>
            <li>If you are not using a custom domain, you will need a new handle as the default domain (such as alice.bsky.social or bob.example-pds.com) is non-transferable.</li>
          </ul>

          <div className="warning-section">
            <h3>⚠️ Read Before Continuing ⚠️</h3>
            <ul>
              <li>If you are already on a third-party PDS, it must be able to send emails or you will not be able to get a PLC operation token without direct access to the server.</li>
              <li>Due to performance issues, the main Bluesky data servers do not allow for account data to be imported at this time. <b>You will not be able to migrate back to Bluesky servers.</b></li>
              <li>If your PDS goes down and you do not have access to a recovery key, you will be locked out of your account. <b>Bluesky developers will not be able to help you.</b></li>
            </ul>
          </div>

          <div className="docs-section">
            <h3>Additional Resources</h3>
            <p>For the technically inclined, here are some additional resources for how the migration process works:</p>
            <ul>
              <li><a href="https://github.com/bluesky-social/pds/blob/main/ACCOUNT_MIGRATION.md" target="_blank" rel="noopener noreferrer">Detailed document on migration for PDS hosters</a></li>
              <li><a href="https://atproto.com/guides/account-migration" target="_blank" rel="noopener noreferrer">AT Protocol's developer documentation on account migration</a></li>
              <li><a href="https://whtwnd.com/bnewbold.net/3l5ii332pf32u">Guide to migrating an account using the command line</a></li>
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