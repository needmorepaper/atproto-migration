import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { AtpAgent } from '@atproto/api';
import Footer from '../layout/Footer';
import Header from '../layout/Header';
import '../../styles/App.css';

interface MigrationProcessProps {
    agent: AtpAgent;
    onLogout: () => void;
}

interface PDSInfo {
    exists: boolean;
    requiresInvite: boolean;
    domain: string;
    availableUserDomains: string[];
}

interface AccountDetails {
    handle: string;
    email: string;
    password: string;
}

export default function MigrationProcess({ agent, onLogout }: MigrationProcessProps) {
    const navigate = useNavigate();
    const [pds, setPds] = useState('');
    const [pdsInfo, setPdsInfo] = useState<PDSInfo | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [isInviteValid, setIsInviteValid] = useState(false);
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountDetails, setAccountDetails] = useState<AccountDetails>({
        handle: '',
        email: '',
        password: ''
    });
    const [isCustomHandle, setIsCustomHandle] = useState(false);
    const [currentHandle, setCurrentHandle] = useState('');

    // Add warning when trying to close or navigate away and clean up expired data
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Clean up expired data
            const savedDetails = localStorage.getItem('migration_details');
            if (savedDetails) {
                const { expiryTime } = JSON.parse(savedDetails);
                if (Date.now() >= expiryTime) {
                    localStorage.removeItem('migration_details');
                }
            }

            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Clean up expired data when component unmounts
            const savedDetails = localStorage.getItem('migration_details');
            if (savedDetails) {
                const { expiryTime } = JSON.parse(savedDetails);
                if (Date.now() >= expiryTime) {
                    localStorage.removeItem('migration_details');
                }
            }
        };
    }, []);

    // Get current user's handle and check if it's a default handle
    useEffect(() => {
        const checkCurrentHandle = async () => {
            try {
                const session = agent.session;
                if (session?.handle) {
                    setCurrentHandle(session.handle);
                }
            } catch (err) {
                console.error('Failed to get current handle:', err);
            }
        };
        checkCurrentHandle();
    }, [agent]);

    // Debounced PDS validation
    const validatePDS = useCallback(async (pdsUrl: string) => {
        if (!pdsUrl) {
            setPdsInfo(null);
            setError('');
            return;
        }

        setIsValidating(true);
        setError('');

        try {
            // Ensure the URL has the correct format
            if (!pdsUrl.startsWith('http://') && !pdsUrl.startsWith('https://')) {
                pdsUrl = 'https://' + pdsUrl;
            }

            // Check if the PDS is a Bluesky PDS
            const hostname = new URL(pdsUrl).hostname;
            if (hostname === 'bsky.social' || hostname === 'bsky.app' || hostname.endsWith('bsky.network')) {
                setPdsInfo({
                    exists: false,
                    requiresInvite: false,
                    domain: hostname,
                    availableUserDomains: []
                });
                setError('Bluesky currently does not support migrating accounts to their data servers.');
                return;
            }

            // Create a temporary agent to check the PDS
            const tempAgent = new AtpAgent({ service: pdsUrl });

            try {
                // Try to get the server info
                const info = await tempAgent.api.com.atproto.server.describeServer();
                const domain = new URL(pdsUrl).hostname;

                setPdsInfo({
                    exists: true,
                    requiresInvite: info.data.inviteCodeRequired || false,
                    domain,
                    availableUserDomains: info.data.availableUserDomains || []
                });
            } catch (err) {
                setPdsInfo({
                    exists: false,
                    requiresInvite: false,
                    domain: '',
                    availableUserDomains: []
                });
                setError('Could not connect to the specified PDS. Please check the URL and try again.');
            }
        } catch (err) {
            setError('Invalid PDS URL format. Please enter a valid URL.');
        } finally {
            setIsValidating(false);
        }
    }, []);

    // Debounce the validation
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (pds) {
                validatePDS(pds);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [pds, validatePDS]);

    // Validate invite code when it changes
    useEffect(() => {
        if (pdsInfo?.requiresInvite && inviteCode) {
            const inviteRegex = /^bsky-noob-quest-[a-zA-Z0-9]{5}-[a-zA-Z0-9]{5}$/;
            setIsInviteValid(inviteRegex.test(inviteCode));
        }
    }, [inviteCode, pdsInfo]);

    // Check if handle is custom
    useEffect(() => {
        if (accountDetails.handle && pdsInfo?.availableUserDomains?.length) {
            const defaultDomain = pdsInfo.availableUserDomains[0];
            const handleRegex = new RegExp(`^[a-zA-Z0-9._-]+@${defaultDomain}$`);
            const isDefaultHandle = handleRegex.test(accountDetails.handle);
            setIsCustomHandle(!isDefaultHandle);
        }
    }, [accountDetails.handle, pdsInfo]);

    // Auto-scroll to latest step
    useEffect(() => {
        const formSection = document.querySelector('.form-section:not(.completed)');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [showAccountForm]);

    // Check if current handle is default
    const isCurrentHandleDefault = useCallback(() => {
        if (!currentHandle || !pdsInfo?.availableUserDomains?.length) return false;
        
        // If migrating from Bluesky PDS (bsky.network), check if handle is from bsky.social
        if (agent.serviceUrl.host.endsWith('.bsky.network')) {
            return currentHandle.endsWith('.bsky.social');
        }

        // For third-party PDS, check if handle ends with any of the available user domains
        return pdsInfo.availableUserDomains.some(domain => 
            currentHandle.endsWith(`${domain}`)
        );
    }, [currentHandle, pdsInfo]);

    const handlePdsBlur = () => {
        if (pds) {
            validatePDS(pds);
        }
    };

    const handleContinue = () => {
        if (pdsInfo?.exists && (!pdsInfo.requiresInvite || isInviteValid)) {
            setShowAccountForm(true);
        }
    };

    const handleStartMigration = () => {
        // Clean up any existing expired data first
        const savedDetails = localStorage.getItem('migration_details');
        if (savedDetails) {
            const { expiryTime } = JSON.parse(savedDetails);
            if (Date.now() >= expiryTime) {
                localStorage.removeItem('migration_details');
            }
        }

        // Save account details to localStorage with 30-minute expiry
        const expiryTime = Date.now() + (30 * 60 * 1000); // 30 minutes in milliseconds
        const migrationDetails = {
            pds: pds,
            inviteCode: inviteCode || null,
            handle: accountDetails.handle + (pdsInfo?.availableUserDomains?.[0] ? `${pdsInfo.availableUserDomains[0]}` : ''),
            email: accountDetails.email,
            password: accountDetails.password,
            expiryTime: expiryTime
        };
        localStorage.setItem('migration_details', JSON.stringify(migrationDetails));
        
        // TODO: Implement migration
    };

    return (
        <div className="actions-page">
            <Header agent={agent} onLogout={onLogout} />

            <div className="actions-container">
                <div className="page-content">
                    <h2>Migrate your account</h2>

                    <div className={`form-section ${showAccountForm ? 'completed' : ''}`}>
                        <h3>Select your new PDS</h3>
                        <div className="form-group">
                            <label htmlFor="pds-input">Personal Data Server (PDS)</label>
                            <input
                                id="pds-input"
                                type="text"
                                className="form-input"
                                placeholder="Example: example-pds.com"
                                value={pds}
                                onChange={(e) => setPds(e.target.value)}
                                onBlur={handlePdsBlur}
                                disabled={isValidating || showAccountForm}
                            />
                            {isValidating && (
                                <div className="loading-message">Checking PDS availability...</div>
                            )}
                            {error && (
                                <div className="error-message">{error}</div>
                            )}
                            {pdsInfo?.exists && !pdsInfo.requiresInvite && (
                                <div className="success-message">✓ This PDS does not require an invite code</div>
                            )}
                        </div>

                        {pdsInfo?.exists && pdsInfo.requiresInvite && (
                            <div className="form-group">
                                <label htmlFor="invite-code">Invite Code</label>
                                <input
                                    id="invite-code"
                                    type="text"
                                    className="form-input"
                                    placeholder="Example: bsky-noob-quest-abcde-12345"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    disabled={showAccountForm}
                                />
                            </div>
                        )}

                        {!showAccountForm && (
                            <div className="button-container">
                                <button
                                    className="back-button"
                                    onClick={() => navigate('/migration')}
                                >
                                    ← Go back
                                </button>
                                {pdsInfo?.exists && (!pdsInfo.requiresInvite || isInviteValid) && (
                                    <button
                                        className="continue-button"
                                        onClick={handleContinue}
                                    >
                                        Continue →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {showAccountForm && (
                        <div className="form-section">
                            <h3>New account details</h3>
                            <div className="form-group">
                                <label htmlFor="handle-input">Handle</label>
                                <div className="handle-input-container">
                                    <input
                                        id="handle-input"
                                        type="text"
                                        className="form-input"
                                        placeholder="username"
                                        value={accountDetails.handle}
                                        onChange={(e) => setAccountDetails(prev => ({ ...prev, handle: e.target.value }))}
                                    />
                                    {pdsInfo?.availableUserDomains?.[0] && (
                                        <span className="handle-domain">{pdsInfo.availableUserDomains[0]}</span>
                                    )}
                                </div>
                                {isCustomHandle && !isCurrentHandleDefault() && (
                                    <div className="info-message">
                                        During the migration, you'll be assigned a temporary handle. After the migration is completed, we will assign your custom handle automatically.
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="email-input">Email</label>
                                <input
                                    id="email-input"
                                    type="email"
                                    className="form-input"
                                    placeholder="Your email address"
                                    value={accountDetails.email}
                                    onChange={(e) => setAccountDetails(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password-input">Password</label>
                                <input
                                    id="password-input"
                                    type="password"
                                    className="form-input"
                                    placeholder="Your new password"
                                    value={accountDetails.password}
                                    onChange={(e) => setAccountDetails(prev => ({ ...prev, password: e.target.value }))}
                                />
                            </div>
                            <small>We recommend using a different password for your new account. Save all of the above details somewhere before continuing.</small>
                            <div className="button-container">
                                <button
                                    className="back-button"
                                    onClick={() => setShowAccountForm(false)}
                                >
                                    ← Go back
                                </button>
                                <button
                                    className="continue-button"
                                    onClick={handleStartMigration}
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
} 