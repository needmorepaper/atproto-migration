import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { AtpAgent } from '@atproto/api';
import { Secp256k1Keypair } from '@atproto/crypto';
import * as ui8 from 'uint8arrays';
import confetti from 'canvas-confetti';
import Footer from '../../components/common/Footer';
import Header from '../../components/common/Header';
import { VerificationUI } from '../../components/migration/VerificationUI';
import { AccountForm } from '../../components/migration/AccountForm';
import { IdentityUpdate } from '../../components/migration/IdentityUpdate';
import {
    MigrationProcessProps,
    PDSInfo,
    AccountDetails,
    DidCredentials,
    MIGRATION_STATUS,
    MigrationProgress,
    IdentityUpdateMethod,
    VerificationState,
    VERIFICATION_STEPS,
    RepoStatus
} from '../../types/migration';

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
    const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
    const [didCredentials, setDidCredentials] = useState<DidCredentials | null>(null);
    const [identityUpdateMethod, setIdentityUpdateMethod] = useState<IdentityUpdateMethod | null>(null);
    const [rotationKey, setRotationKey] = useState('');
    const [plcToken, setPlcToken] = useState('');
    const [isPlcTokenRequested, setIsPlcTokenRequested] = useState(false);
    const [isPlcTokenValid, setIsPlcTokenValid] = useState(false);
    const [isWebDid, setIsWebDid] = useState(false);
    const [didDocument, setDidDocument] = useState<string>('');
    const [verificationState, setVerificationState] = useState<VerificationState>({
        step: VERIFICATION_STEPS.CHECKING
    });
    const [lastTokenRequest, setLastTokenRequest] = useState<number>(0);
    const TOKEN_COOLDOWN = 60000; // 1 minute cooldown

    // Reset state when component mounts
    useEffect(() => {
        setShowAccountForm(false);
        setPds('');
        setPdsInfo(null);
        setError('');
        setInviteCode('');
        setIsInviteValid(false);
        setAccountDetails({
            handle: '',
            email: '',
            password: ''
        });
        localStorage.removeItem('migration_details');
        localStorage.removeItem('migration_progress');
    }, []);

    // Helper function to ensure proper PDS URL format
    const getPdsUrl = (pdsDomain: string) => {
        if (!pdsDomain) return '';
        if (pdsDomain.startsWith('http://') || pdsDomain.startsWith('https://')) {
            return pdsDomain;
        }
        return `https://${pdsDomain}`;
    };

    // Add warning when trying to close or navigate away and clean up expired data
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
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

    // Load migration progress on component mount
    useEffect(() => {
        const savedProgress = localStorage.getItem('migration_progress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress) as MigrationProgress;
            if (Date.now() - progress.lastUpdated < 30 * 60 * 1000) {
                setMigrationProgress(progress);
                if (progress.status !== 'not_started' && progress.status !== 'failed') {
                    setShowAccountForm(true);
                }
            } else {
                localStorage.removeItem('migration_progress');
                setMigrationProgress(null);
            }
        }
    }, []);

    // Update migration progress
    const updateMigrationProgress = (status: typeof MIGRATION_STATUS[keyof typeof MIGRATION_STATUS], error?: string) => {
        const progress: MigrationProgress = {
            status,
            error,
            lastUpdated: Date.now()
        };
        setMigrationProgress(progress);
        if (status !== 'failed') {
            localStorage.setItem('migration_progress', JSON.stringify(progress));
        } else {
            localStorage.removeItem('migration_progress');
        }
    };

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
            if (!pdsUrl.startsWith('http://') && !pdsUrl.startsWith('https://')) {
                pdsUrl = 'https://' + pdsUrl;
            }

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

            const tempAgent = new AtpAgent({ service: pdsUrl });

            try {
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
                validatePDS(getPdsUrl(pds));
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
        if (formSection && showAccountForm) {
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [showAccountForm]);

    // Add a separate effect for verification state changes
    useEffect(() => {
        if (verificationState.step !== 'checking') {
            const verificationSection = document.querySelector('.verification-section');
            if (verificationSection) {
                verificationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [verificationState.step]);

    // Check if current handle is default
    const isCurrentHandleDefault = useCallback(() => {
        if (!currentHandle || !pdsInfo?.availableUserDomains?.length) return false;

        if (agent.serviceUrl.host.endsWith('.bsky.network')) {
            return currentHandle.endsWith('.bsky.social');
        }

        return pdsInfo.availableUserDomains.some(domain =>
            currentHandle.endsWith(`${domain}`)
        );
    }, [currentHandle, pdsInfo, agent.serviceUrl.host]);

    const handlePdsBlur = () => {
        if (pds) {
            validatePDS(getPdsUrl(pds));
        }
    };

    const handleContinue = () => {
        if (pdsInfo?.exists && (!pdsInfo.requiresInvite || isInviteValid)) {
            setShowAccountForm(true);
        }
    };

    // Add this new function after the handleStartMigration function
    const migrateBlobs = async (tempAgent: AtpAgent, agent: AtpAgent) => {
        try {
            console.log('Starting blob migration process...');
            let passCount = 0;
            let startTime = Date.now();
            
            const getAllMissingBlobs = async () => {
                let allMissingBlobs: string[] = [];
                let cursor: string | undefined = undefined;
                let hasMore = true;
                
                while (hasMore) {
                    console.log('Fetching missing blobs list from new PDS...');
                    const missingBlobsRes = await tempAgent.com.atproto.repo.listMissingBlobs({
                        cursor
                    }, {
                        headers: { authorization: `Bearer ${tempAgent.session?.accessJwt}` }
                    });
                    
                    const response = missingBlobsRes.data as unknown as { cids: string[], cursor?: string };
                    
                    if (!response || !Array.isArray(response.cids)) {
                        console.error('Invalid response from listMissingBlobs:', response);
                        throw new Error('Invalid response when getting missing blobs');
                    }
                    
                    allMissingBlobs = [...allMissingBlobs, ...response.cids];
                    console.log(`Retrieved ${response.cids.length} missing blobs, total so far: ${allMissingBlobs.length}`);
                    
                    // If we got exactly 1000 blobs, there might be more
                    hasMore = response.cids.length === 1000;
                    cursor = response.cursor;
                }
                
                return allMissingBlobs;
            };

            const migrateBlobList = async (blobsToMigrate: string[]) => {
                const totalBlobs = blobsToMigrate.length;
                let processedBlobs = 0;
                const CONCURRENCY_LIMIT = 5;
                const startTime = Date.now();

                for (let i = 0; i < blobsToMigrate.length; i += CONCURRENCY_LIMIT) {
                    const batch = blobsToMigrate.slice(i, i + CONCURRENCY_LIMIT);
                    console.log(`Processing batch of ${batch.length} blobs (${i + 1} to ${i + batch.length} of ${totalBlobs})`);
                    
                    await Promise.all(batch.map(async (cid) => {
                        try {
                            console.log(`Downloading blob ${cid} from old PDS...`);
                            const blobRes = await agent.com.atproto.sync.getBlob({
                                did: agent.session!.did,
                                cid
                            }, {
                                headers: { authorization: `Bearer ${agent.session?.accessJwt}` }
                            });

                            console.log(`Uploading blob ${cid} to new PDS...`);
                            await tempAgent.com.atproto.repo.uploadBlob(blobRes.data, {
                                encoding: blobRes.headers['content-type'],
                                headers: { authorization: `Bearer ${tempAgent.session?.accessJwt}` }
                            });

                            processedBlobs++;
                            
                            // Calculate progress and estimated time
                            const progress = Math.round((processedBlobs / totalBlobs) * 100);
                            const elapsedTime = Date.now() - startTime;
                            const averageTimePerBlob = elapsedTime / processedBlobs;
                            const remainingBlobs = totalBlobs - processedBlobs;
                            const estimatedTimeRemaining = Math.round((averageTimePerBlob * remainingBlobs) / 1000); // in seconds
                            
                            const progressMessage = `Migrated ${processedBlobs}/${totalBlobs} (${progress}%) - Estimated time remaining: ${estimatedTimeRemaining} seconds`;
                            console.log(progressMessage);
                            updateMigrationProgress('data_migrating', progressMessage);
                            
                        } catch (err) {
                            console.error(`Failed to migrate blob ${cid}:`, err);
                            processedBlobs++;
                            const progress = Math.round((processedBlobs / totalBlobs) * 100);
                            updateMigrationProgress('data_migrating', `Migrating blobs: ${progress}% (${processedBlobs}/${totalBlobs}) - Some blobs failed to migrate`);
                        }
                    }));
                }
            };

            do {
                passCount++;
                if (passCount > 1) {
                    console.log(`Starting pass ${passCount} of blob migration...`);
                    updateMigrationProgress('data_migrating', `Starting pass ${passCount} of blob migration...`);
                }

                // Get all missing blobs
                const missingBlobs = await getAllMissingBlobs();
                console.log(`Found ${missingBlobs.length} missing blobs to migrate`);
                
                if (missingBlobs.length === 0) {
                    console.log('No blobs to migrate');
                    break;
                }

                // Migrate the blobs
                await migrateBlobList(missingBlobs);
                
                // Check if there are still missing blobs
                const remainingMissingBlobs = await getAllMissingBlobs();
                if (remainingMissingBlobs.length === 0) {
                    console.log('All blobs have been successfully migrated');
                    break;
                } else {
                    console.log(`Still have ${remainingMissingBlobs.length} missing blobs after pass ${passCount}`);
                }
            } while (passCount < 3); // Limit to 3 passes to prevent infinite loops

            const totalTime = Math.round((Date.now() - startTime) / 1000);
            console.log(`Blob migration completed in ${totalTime} seconds after ${passCount} passes`);
            updateMigrationProgress('data_migrating', `Blob migration completed in ${totalTime} seconds`);
            
        } catch (err) {
            console.error('Failed to migrate blobs:', err);
            throw err;
        }
    };

    // Add this helper function after the migrateBlobs function
    const updateMigrationStatus = async (tempAgent: AtpAgent, agent: AtpAgent) => {
        try {
            // Deactivate old account
            await agent.com.atproto.server.deactivateAccount({
                deleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            }, {
                headers: { authorization: `Bearer ${agent.session?.accessJwt}` }
            });

            // Activate new account
            await tempAgent.com.atproto.server.activateAccount(undefined, {
                headers: { authorization: `Bearer ${tempAgent.session?.accessJwt}` }
            });

            setVerificationState({ step: VERIFICATION_STEPS.VERIFYING });
        } catch (err) {
            console.error('Failed during cleanup:', err);
            setVerificationState({
                step: VERIFICATION_STEPS.CHECKING,
                error: err instanceof Error ? err.message : 'Failed during cleanup'
            });
        }
    };

    // Replace the handleCleanup function with this simplified version
    const handleCleanup = async () => {
        const tempAgent = new AtpAgent({ service: getPdsUrl(pds) });
        await updateMigrationStatus(tempAgent, agent);
    };

    // Remove the old checkAndHandleRepositoryStatus function and update checkAndHandleRepoStatus
    const checkAndHandleRepoStatus = async (agent: AtpAgent, did: string) => {
        try {
            const statusRes = await agent.com.atproto.sync.getRepoStatus({ did });
            const status = statusRes.data as RepoStatus;

            // If repo doesn't exist or is deleted, we need to create it
            if (status.status === 'deleted') {
                return false;
            }

            // If repo is active, we can proceed
            if (status.status === 'active') {
                return true;
            }

            // If repo is deactivated, try to reactivate it
            if (status.status === 'deactivated') {
                try {
                    // Try to log in with the credentials we have
                    const fullHandle = accountDetails.handle + (pdsInfo?.availableUserDomains?.[0] ? `${pdsInfo.availableUserDomains[0]}` : '');
                    await agent.login({
                        identifier: fullHandle,
                        password: accountDetails.password
                    });

                    // Try to reactivate the account
                    await agent.com.atproto.server.activateAccount();
                    return true;
                } catch (err) {
                    console.error('Failed to reactivate account:', err);
                    // If we can't reactivate, try to delete the account
                    try {
                        await agent.com.atproto.server.requestAccountDelete();
                        const deleteToken = prompt('Please enter the deletion token for the new PDS account that was sent to your email:');
                        if (!deleteToken) {
                            throw new Error('Deletion token is required');
                        }
                        await agent.com.atproto.server.deleteAccount({
                            did: did,
                            password: accountDetails.password,
                            token: deleteToken
                        });
                        // Reset migration progress to start fresh
                        updateMigrationProgress(MIGRATION_STATUS.NOT_STARTED);
                        localStorage.removeItem('migration_details');
                        localStorage.removeItem('migration_progress');
                        return false;
                    } catch (deleteErr) {
                        console.error('Failed to delete account:', deleteErr);
                        throw new Error('Failed to handle deactivated account. Please try again later.');
                    }
                }
            }

            // For any other status, throw an error
            throw new Error(`Repository is ${status.status} on new PDS`);
        } catch (err) {
            // If repo not found, that's expected - we need to create it
            if ((err as any)?.error === 'RepoNotFound') {
                return false;
            }
            throw err;
        }
    };

    // Update the handleStartMigration function to use the merged function
    const handleStartMigration = async () => {
        // Clean up any existing expired data first
        const savedDetails = localStorage.getItem('migration_details');
        if (savedDetails) {
            const { expiryTime } = JSON.parse(savedDetails);
            if (Date.now() >= expiryTime) {
                localStorage.removeItem('migration_details');
            }
        }

        try {
            updateMigrationProgress(MIGRATION_STATUS.ACCOUNT_CREATED);

            // Get the new PDS's DID
            const pdsUrl = getPdsUrl(pds);
            const tempAgent = new AtpAgent({ service: pdsUrl });
            const describeRes = await tempAgent.com.atproto.server.describeServer();
            const newServerDid = describeRes.data.did;

            try {
                if (!agent.session?.did) {
                    throw new Error('No valid DID found for the current session');
                }

                // Check repository status on new PDS
                const newPdsStatus = await checkAndHandleRepoStatus(
                    tempAgent,
                    agent.session.did
                );

                if (newPdsStatus === true) {
                    // If we get here, the repo exists and is active, so we can skip account creation
                    console.log('Repository exists on new PDS, resuming migration...');

                    // Update progress to data migration
                    updateMigrationProgress(MIGRATION_STATUS.DATA_MIGRATING);

                    // Migrate blobs
                    await migrateBlobs(tempAgent, agent);

                    // Migrate preferences
                    updateMigrationProgress(MIGRATION_STATUS.DATA_MIGRATING, 'Migrating preferences...');
                    const prefs = await agent.app.bsky.actor.getPreferences();
                    await tempAgent.app.bsky.actor.putPreferences(prefs.data);
                    console.log('Preferences migrated successfully');

                    // Update progress to data migrated
                    updateMigrationProgress(MIGRATION_STATUS.DATA_MIGRATED);

                    // Proceed with identity update
                    await handleIdentityUpdate();
                } else {
                    // Repository doesn't exist, proceed with account creation
                    console.log('Repository does not exist, proceeding with account creation...');

                    // Get service auth token from old PDS
                    const serviceJwtRes = await agent.api.com.atproto.server.getServiceAuth({
                        aud: newServerDid,
                        lxm: 'com.atproto.server.createAccount',
                        exp: Math.floor(Date.now() / 1000) + 3600 // Current time + 3600 seconds
                    });
                    const serviceJwt = serviceJwtRes.data.token;

                    // Create account on new PDS
                    const fullHandle = accountDetails.handle + (pdsInfo?.availableUserDomains?.[0] ? `${pdsInfo.availableUserDomains[0]}` : '');
                    await tempAgent.com.atproto.server.createAccount(
                        {
                            handle: fullHandle,
                            email: accountDetails.email,
                            password: accountDetails.password,
                            did: agent.session.did,
                            inviteCode: inviteCode || undefined
                        },
                        {
                            headers: { authorization: `Bearer ${serviceJwt}` },
                            encoding: 'application/json'
                        }
                    );

                    // Log in to the new account
                    await tempAgent.login({
                        identifier: fullHandle,
                        password: accountDetails.password
                    });

                    // Check account status
                    const statusRes = await tempAgent.com.atproto.server.checkAccountStatus();
                    console.log('Account status:', statusRes.data);

                    // Update progress to data migration
                    updateMigrationProgress(MIGRATION_STATUS.DATA_MIGRATING);

                    // Download repository CAR file from old PDS
                    const repoRes = await agent.com.atproto.sync.getRepo({
                        did: agent.session.did
                    });

                    // Import repository to new PDS
                    await tempAgent.com.atproto.repo.importRepo(repoRes.data, {
                        encoding: 'application/vnd.ipld.car'
                    });

                    // Update progress to data migrated
                    updateMigrationProgress(MIGRATION_STATUS.DATA_MIGRATED);

                    // Get updated account status to check blob counts
                    const updatedStatusRes = await tempAgent.com.atproto.server.checkAccountStatus();
                    const expectedBlobCount = (updatedStatusRes.data as any).expectedBlobs || 0;
                    console.log('Expected blob count:', expectedBlobCount);

                    // Migrate blobs
                    await migrateBlobs(tempAgent, agent);

                    // Migrate preferences
                    updateMigrationProgress(MIGRATION_STATUS.DATA_MIGRATING, 'Migrating preferences...');
                    const prefs = await agent.app.bsky.actor.getPreferences();
                    await tempAgent.app.bsky.actor.putPreferences(prefs.data);
                    console.log('Preferences migrated successfully');

                    // Proceed with identity update
                    await handleIdentityUpdate();
                }
            } catch (err) {
                // Handle repository status errors
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error('Repository status error:', errorMessage);
                setError(`Repository error: ${errorMessage}`);
                updateMigrationProgress(MIGRATION_STATUS.FAILED, errorMessage);
                return;
            }
        } catch (err) {
            console.error('Failed to start migration:', err);
            setError('Failed to start migration. Please try again.');
            updateMigrationProgress(MIGRATION_STATUS.FAILED, 'Failed to create account on new PDS');
        }
    };

    // Validate PLC token format
    useEffect(() => {
        if (plcToken) {
            const tokenRegex = /^[a-zA-Z0-9]{5}-[a-zA-Z0-9]{5}$/;
            setIsPlcTokenValid(tokenRegex.test(plcToken));
        } else {
            setIsPlcTokenValid(false);
        }
    }, [plcToken]);

    // Check if current DID is did:web
    useEffect(() => {
        if (agent.session?.did) {
            setIsWebDid(agent.session.did.startsWith('did:web:'));
        }
    }, [agent.session?.did]);

    const handleSelfSignedPlcOperation = async () => {
        if (!didCredentials || !rotationKey) return;

        try {
            // Try to parse the rotation key
            let privateKeyBytes: Uint8Array;
            try {
                if (rotationKey.startsWith('z')) {
                    // Multikey format
                    privateKeyBytes = ui8.fromString(rotationKey.slice(1), 'base58btc');
                } else {
                    // Hex format
                    privateKeyBytes = ui8.fromString(rotationKey, 'hex');
                }
            } catch (err) {
                throw new Error('Invalid rotation key format. Please provide a valid hex or multikey format.');
            }

            // Create keypair from private key
            const keypair = await Secp256k1Keypair.import(privateKeyBytes);

            // Create PLC operation
            const operation = {
                type: 'plc_operation',
                rotationKeys: [keypair.did(), ...didCredentials.rotationKeys],
                verificationMethods: {
                    atproto: didCredentials.signingKey
                },
                alsoKnownAs: [didCredentials.handle],
                services: {
                    atproto_pds: {
                        type: 'AtpPersonalDataServer',
                        endpoint: getPdsUrl(pds)
                    }
                }
            };

            // Serialize operation to bytes
            const operationBytes = ui8.fromString(JSON.stringify(operation), 'utf8');

            // Sign the operation
            const signedOp = await keypair.sign(operationBytes);

            // Submit the operation through the new PDS
            const tempAgent = new AtpAgent({ service: getPdsUrl(pds) });
            await tempAgent.com.atproto.identity.submitPlcOperation({
                operation: JSON.parse(ui8.toString(signedOp, 'utf8'))
            });

            updateMigrationProgress(MIGRATION_STATUS.IDENTITY_UPDATED);
            await handleCleanup();
        } catch (err) {
            console.error('Failed to create self-signed PLC operation:', err);
            updateMigrationProgress(MIGRATION_STATUS.FAILED, err instanceof Error ? err.message : 'Failed to create self-signed PLC operation');
        }
    };

    // Update the handleIdentityUpdate function to use the new status constants
    const handleIdentityUpdate = async () => {
        try {
            updateMigrationProgress(MIGRATION_STATUS.IDENTITY_UPDATING);

            // Get recommended DID credentials from new PDS
            const tempAgent = new AtpAgent({ service: getPdsUrl(pds) });
            await tempAgent.login({
                identifier: accountDetails.handle + (pdsInfo?.availableUserDomains?.[0] || ''),
                password: accountDetails.password
            });
            const credentialsRes = await tempAgent.com.atproto.identity.getRecommendedDidCredentials();
            setDidCredentials(credentialsRes.data as DidCredentials);

            if (isWebDid) {
                // For did:web, show the recommended DID document
                const recommendedDoc = {
                    "@context": ["https://www.w3.org/ns/did/v1"],
                    "id": agent.session?.did,
                    "service": [{
                        "id": "#atproto_pds",
                        "type": "AtpPersonalDataServer",
                        "serviceEndpoint": getPdsUrl(pds)
                    }],
                    "verificationMethod": [{
                        "id": "#atproto",
                        "type": "EcdsaSecp256k1VerificationKey2019",
                        "controller": agent.session?.did,
                        "publicKeyMultibase": (credentialsRes.data as any).signingKey
                    }]
                };
                setDidDocument(JSON.stringify(recommendedDoc, null, 2));
                return;
            }

            // For did:plc, proceed with the chosen update method
            if (identityUpdateMethod === 'pds') {
                // Reset token state when showing the prompt
                setPlcToken('');
                setIsPlcTokenValid(false);
                setIsPlcTokenRequested(false);
                return;
            } else if (identityUpdateMethod === 'self_signed') {
                if (!rotationKey) {
                    throw new Error('Rotation key is required for self-signed updates');
                }
                await handleSelfSignedPlcOperation();
            }
        } catch (err) {
            console.error('Failed to update identity:', err);
            updateMigrationProgress(MIGRATION_STATUS.FAILED, 'Failed to update identity');
        }
    };

    const handleRequestPlcToken = async () => {
        const now = Date.now();
        if (now - lastTokenRequest < TOKEN_COOLDOWN) {
            const remainingTime = Math.ceil((TOKEN_COOLDOWN - (now - lastTokenRequest)) / 1000);
            alert(`Please wait ${remainingTime} seconds before requesting another token.`);
            return;
        }

        try {
            await agent.com.atproto.identity.requestPlcOperationSignature();
            setIsPlcTokenRequested(true);
            setLastTokenRequest(now);
        } catch (err) {
            console.error('Failed to request PLC token:', err);
            alert('Failed to request token. Please try again.');
        }
    };

    const handlePlcTokenSubmit = async () => {
        if (!isPlcTokenValid || !didCredentials) return;

        try {
            // Sign the PLC operation on the old PDS
            console.log('Signing PLC operation with credentials:', didCredentials);
            const plcOp = await agent.com.atproto.identity.signPlcOperation({
                token: plcToken,
                ...didCredentials
            });
            console.log('Signed PLC operation:', plcOp.data);

            // Create new agent and get credentials for new PDS
            const tempAgent = new AtpAgent({ service: getPdsUrl(pds) });
            const fullHandle = accountDetails.handle + (pdsInfo?.availableUserDomains?.[0] ? `${pdsInfo.availableUserDomains[0]}` : '');
            const loginRes = await tempAgent.login({
                identifier: fullHandle,
                password: accountDetails.password
            });
            console.log('New PDS credentials:', loginRes.data);

            // Submit the signed operation through the new PDS
            await tempAgent.com.atproto.identity.submitPlcOperation({
                operation: plcOp.data.operation
            }, {
                headers: { authorization: `Bearer ${tempAgent.session?.accessJwt}` }
            });

            updateMigrationProgress(MIGRATION_STATUS.IDENTITY_UPDATED);
            await handleCleanup();
        } catch (err) {
            console.error('Failed to submit PLC operation:', err);
            updateMigrationProgress(MIGRATION_STATUS.FAILED, 'Failed to submit PLC operation');
        }
    };

    const handleDidDocumentCheck = async () => {
        try {
            // Fetch the current DID document
            const response = await fetch(`https://${agent.session?.did.split(':')[2]}/.well-known/did.json`);
            const currentDoc = await response.json();

            // Check if it contains the recommended parameters
            if (!didCredentials) return;

            const hasCorrectPds = currentDoc.service?.some((s: any) =>
                s.type === 'AtpPersonalDataServer' && s.serviceEndpoint === pds
            );
            const hasCorrectSigningKey = currentDoc.verificationMethod?.some((vm: any) =>
                vm.type === 'EcdsaSecp256k1VerificationKey2019' &&
                vm.publicKeyMultibase === didCredentials.signingKey
            );

            if (hasCorrectPds && hasCorrectSigningKey) {
                updateMigrationProgress(MIGRATION_STATUS.IDENTITY_UPDATED);
            } else {
                setError('DID document does not contain the recommended parameters');
            }
        } catch (err) {
            console.error('Failed to check DID document:', err);
            setError('Failed to verify DID document');
        }
    };

    const handleDeleteOldAccount = async () => {
        try {
            await agent.com.atproto.server.deleteAccount();
            setVerificationState({ step: VERIFICATION_STEPS.COMPLETE });
            // Trigger confetti animation
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } catch (err) {
            console.error('Failed to delete old account:', err);
            setVerificationState({
                step: VERIFICATION_STEPS.CLEANUP,
                error: 'Failed to delete old account. You can try again later.'
            });
        }
    };

    return (
        <div className="actions-page">
            <Header agent={agent} onLogout={onLogout} />

            <div className="actions-container">
                <div className="page-content">
                    <h2>Migrate your account</h2>

                    <div className={`form-section ${showAccountForm && migrationProgress?.status && migrationProgress.status !== 'failed' ? 'completed' : ''}`}>
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
                        <AccountForm
                            pdsInfo={pdsInfo}
                            accountDetails={accountDetails}
                            setAccountDetails={setAccountDetails}
                            isCustomHandle={isCustomHandle}
                            isCurrentHandleDefault={isCurrentHandleDefault}
                            onBack={() => setShowAccountForm(false)}
                            onContinue={handleStartMigration}
                        />
                    )}

                    {migrationProgress?.status === 'identity_updating' && (
                        <IdentityUpdate
                            isWebDid={isWebDid}
                            didDocument={didDocument}
                            didCredentials={didCredentials}
                            identityUpdateMethod={identityUpdateMethod}
                            setIdentityUpdateMethod={setIdentityUpdateMethod}
                            rotationKey={rotationKey}
                            setRotationKey={setRotationKey}
                            plcToken={plcToken}
                            setPlcToken={setPlcToken}
                            isPlcTokenValid={isPlcTokenValid}
                            isPlcTokenRequested={isPlcTokenRequested}
                            lastTokenRequest={lastTokenRequest}
                            TOKEN_COOLDOWN={TOKEN_COOLDOWN}
                            onRequestPlcToken={handleRequestPlcToken}
                            onPlcTokenSubmit={handlePlcTokenSubmit}
                            onDidDocumentCheck={handleDidDocumentCheck}
                            onIdentityUpdate={handleIdentityUpdate}
                        />
                    )}

                    {migrationProgress && (
                        <div className="migration-progress">
                            <h3>Migration Progress</h3>
                            <div className="progress-steps">
                                <div className={`progress-step ${migrationProgress.status === 'account_created' ? 'active' : ''}`}>
                                    <span className="step-number">1</span>
                                    <span className="step-text">Account Created</span>
                                </div>
                                <div className={`progress-step ${migrationProgress.status === 'data_migrating' || migrationProgress.status === 'data_migrated' ? 'active' : ''}`}>
                                    <span className="step-number">2</span>
                                    <span className="step-text">Data Migration</span>
                                </div>
                                <div className={`progress-step ${migrationProgress.status === 'identity_updating' || migrationProgress.status === 'identity_updated' ? 'active' : ''}`}>
                                    <span className="step-number">3</span>
                                    <span className="step-text">Identity Update</span>
                                </div>
                                <div className={`progress-step ${migrationProgress.status === 'finalizing' || migrationProgress.status === 'completed' ? 'active' : ''}`}>
                                    <span className="step-number">4</span>
                                    <span className="step-text">Finalization</span>
                                </div>
                            </div>
                            {migrationProgress.error && (
                                <div className="error-message">
                                    {migrationProgress.error}
                                </div>
                            )}
                        </div>
                    )}

                    {verificationState.step !== 'checking' && (
                        <VerificationUI
                            verificationState={verificationState}
                            setVerificationState={setVerificationState}
                            pds={pds}
                            onLogout={onLogout}
                            onDeleteOldAccount={handleDeleteOldAccount}
                        />
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
} 