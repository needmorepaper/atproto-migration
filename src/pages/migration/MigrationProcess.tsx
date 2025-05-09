import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import Header from '../../components/common/header';
import Footer from '../../components/common/footer';
import { useState, useCallback } from 'react';
import { validatePDS, getServerDescription, validateInviteCode } from '../../lib/migration/pdsValidation';
import { ServerDescription } from '../../lib/migration/serverDescription';
import { useDebounce } from '../../hooks/useDebounce';

interface MigrationProcessProps {
    agent: AtpAgent;
    onLogout: () => void;
}

export default function MigrationProcess({ agent, onLogout }: MigrationProcessProps) {
    const navigate = useNavigate();
    const [pds, setPds] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [pdsError, setPdsError] = useState<string | null>(null);
    const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
    const [isValidatingPds, setIsValidatingPds] = useState(false);
    const [isValidatingInviteCode, setIsValidatingInviteCode] = useState(false);
    const [isPdsValid, setIsPdsValid] = useState(false);
    const [serverDescription, setServerDescription] = useState<ServerDescription | null>(null);
    const [lastValidatedPds, setLastValidatedPds] = useState('');

    const validatePdsInput = useCallback(async (value: string) => {
        // Skip validation if we've already validated this PDS and it's still valid
        if (value === lastValidatedPds && isPdsValid && !pdsError) {
            return;
        }

        setIsValidatingPds(true);
        setIsPdsValid(false);
        setServerDescription(null);
        setPdsError(null);
        
        try {
            const validationResult = await validatePDS(value, agent);
            if (!validationResult.isValid) {
                console.error('PDS validation failed:', {
                    pds: value,
                    error: validationResult.error
                });
                setPdsError(validationResult.error);
                setIsValidatingPds(false);
                return;
            }

            try {
                const description = await getServerDescription(value);
                setServerDescription(description);
                setPdsError(null);
                setIsPdsValid(true);
                setLastValidatedPds(value);
            } catch (e) {
                console.error('Error getting server description:', {
                    pds: value,
                    error: e instanceof Error ? {
                        name: e.name,
                        message: e.message,
                        stack: e.stack
                    } : e
                });
                setPdsError('Failed to get server information');
            }
        } catch (e) {
            console.error('Error validating PDS:', {
                pds: value,
                error: e instanceof Error ? {
                    name: e.name,
                    message: e.message,
                    stack: e.stack
                } : e
            });
            setPdsError('An unexpected error occurred');
        }
        
        setIsValidatingPds(false);
    }, [agent, lastValidatedPds, isPdsValid, pdsError]);

    const validateInviteCodeInput = useCallback(async (pdsValue: string, inviteCodeValue: string) => {
        if (!pdsValue || !inviteCodeValue) {
            return;
        }

        setIsValidatingInviteCode(true);
        setInviteCodeError(null);

        try {
            const inviteCodeValidationResult = await validateInviteCode(pdsValue, inviteCodeValue);
            if (!inviteCodeValidationResult.isValid) {
                setInviteCodeError(inviteCodeValidationResult.error);
            }
        } catch (e) {
            console.error('Error validating invite code:', {
                pds: pdsValue,
                inviteCode: inviteCodeValue,
                error: e instanceof Error ? {
                    name: e.name,
                    message: e.message,
                    stack: e.stack
                } : e
            });
            setInviteCodeError('Failed to validate invite code');
        }

        setIsValidatingInviteCode(false);
    }, []);

    const debouncedValidatePds = useDebounce(validatePdsInput, 1000);
    const debouncedValidateInviteCode = useDebounce(validateInviteCodeInput, 1000);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsValidatingPds(true);
        setIsValidatingInviteCode(true);

        try {
            await validatePdsInput(pds);
            
            if (serverDescription?.isInviteCodeRequired()) {
                await validateInviteCodeInput(pds, inviteCode);
            }
            
            if (!pdsError && !inviteCodeError) {
                // TODO: Handle PDS migration logic
                console.log('PDS to migrate to:', pds);
                if (serverDescription?.isInviteCodeRequired()) {
                    console.log('Invite code:', inviteCode);
                }
            }
        } catch (e) {
            console.error('Error during form submission:', {
                pds,
                inviteCode,
                error: e instanceof Error ? {
                    name: e.name,
                    message: e.message,
                    stack: e.stack
                } : e
            });
            setPdsError('An unexpected error occurred');
        }

        setIsValidatingPds(false);
        setIsValidatingInviteCode(false);
    };

    const handlePdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPds(value);
        setIsPdsValid(false);
        setServerDescription(null);
        setLastValidatedPds('');
        setPdsError(null);
        debouncedValidatePds(value);
    };

    const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInviteCode(value);
        setInviteCodeError(null);
        if (pds) {
            debouncedValidateInviteCode(pds, value);
        }
    };

    const handlePdsBlur = () => {
        validatePdsInput(pds);
    };

    const handleInviteCodeBlur = () => {
        if (pds && inviteCode) {
            validateInviteCodeInput(pds, inviteCode);
        }
    };

    return (
        <div className="actions-page">
            <Header agent={agent} onLogout={onLogout} />

            <div className="actions-container">
                <div className="page-content">
                    <h2>Migrate your account</h2>
                    <form onSubmit={handleSubmit} className="migration-form">
                        <div className="form-section">
                            <h3>Find your new host</h3>
                            <div className="form-group">
                                <label htmlFor="pds">Personal Data Server (PDS)</label>
                                <input
                                    type="text"
                                    id="pds"
                                    value={pds}
                                    onChange={handlePdsChange}
                                    onBlur={handlePdsBlur}
                                    placeholder="Example: pds.example.com"
                                    required
                                    className={`form-input ${pdsError ? 'error' : ''} ${isPdsValid ? 'success' : ''}`}
                                    disabled={isValidatingPds}
                                />
                                {(!isValidatingPds && pdsError && <div className="error-message">{pdsError}</div>) || 
                                 (isValidatingPds && <div className="info-message" style={{ marginTop: '0.5rem' }}>Checking if the data server is valid...</div>) ||
                                 (isPdsValid && <div className="success-message" style={{ marginTop: '0.5rem' }}>✓ This data server is alive!</div>)}
                                
                                {serverDescription?.isInviteCodeRequired() && (
                                    <div className="form-group" style={{ marginTop: '1rem' }}>
                                        <label htmlFor="inviteCode">Invite Code</label>
                                        <input
                                            type="text"
                                            id="inviteCode"
                                            value={inviteCode}
                                            onChange={handleInviteCodeChange}
                                            onBlur={handleInviteCodeBlur}
                                            placeholder={`Example: ${pds.replace(/\./g, '-')}-XXXXX-XXXXX`}
                                            required
                                            className={`form-input ${inviteCodeError ? 'error' : ''} ${!inviteCodeError && inviteCode ? 'success' : ''}`}
                                            disabled={isValidatingInviteCode}
                                        />
                                        {(!isValidatingInviteCode && inviteCodeError && <div className="error-message">{inviteCodeError}</div>) ||
                                         (isValidatingInviteCode && <div className="info-message" style={{ marginTop: '0.5rem' }}>Validating invite code...</div>) ||
                                         (!inviteCodeError && inviteCode && <div className="success-message" style={{ marginTop: '0.5rem' }}>✓ Invite code format is valid</div>)}
                                        <div className="info-message" style={{ marginTop: '0.5rem' }}>
                                            This server requires an invite code to register.
                                        </div>
                                    </div>
                                )}
                                
                                <div className="button-container">
                                    <button
                                        type="button"
                                        className="back-button"
                                        onClick={() => navigate('/migration')}
                                        disabled={isValidatingPds || isValidatingInviteCode}
                                    >
                                        ← Go back
                                    </button>
                                    <button
                                        type="submit"
                                        className="continue-button"
                                        disabled={!!pdsError || !!inviteCodeError || isValidatingPds || isValidatingInviteCode || (serverDescription?.isInviteCodeRequired() && !inviteCode)}
                                    >
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}
