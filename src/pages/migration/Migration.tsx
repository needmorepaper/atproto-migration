import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import Header from '../../components/common/header';
import Footer from '../../components/common/footer';

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
          <p>The migration process is <i>possible</i>, however it is not recommended if you are unsure about what you are doing. We recommend that you migrate a secondary account to your new PDS to make sure that it is able to migrate successfully <i>before</i> migrating your primary account.</p>
          <p>You will need the following items to begin the migration process:</p>
          <ul>
            <li>A new PDS to migrate to.</li>
            <li>An invite code from the new PDS (if required).</li>
            <li>A PLC operation token to confirm the migration.</li>
            <li>A new password for your account <b>(which will not be stored by this tool.)</b>.</li>
            <li>If you are not using a custom domain, you will need a new handle as the default domain (such as alice.bsky.social or bob.example-pds.com) is non-transferable.</li>
          </ul>

          <div className="warning-section">
            <h3>⚠️ Read Before You Continue ⚠️</h3>
            <ul>
              <li>If you are already on a third-party PDS, it must be able to send emails or you will not be able to get a PLC operation token without direct access to the server.</li>
              <li>Due to performance issues, the main Bluesky data servers have temporarily disabled the ability to import account data. <b>As a result, you cannot migrate back to Bluesky servers for the foreseeable future.</b></li>
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

          <div className="button-container">
            <button
              className="back-button"
              onClick={() => navigate('/actions')}
            >
              ← Go back
            </button>
            <button
              className="continue-button"
              onClick={() => navigate('/migration/process')}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 