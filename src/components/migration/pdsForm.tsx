import { useState, useCallback, useEffect } from 'react';
import { AtpAgent } from '@atproto/api';
import { validatePDS, getServerDescription, validateInviteCode } from '../../lib/migration/pdsValidation';
import { ServerDescription } from '../../lib/migration/serverDescription';
import { useDebounce } from '../../hooks/useDebounce';

interface PdsFormProps {
    agent: AtpAgent;
    onSubmit: (pds: string, inviteCode: string, serverDescription: ServerDescription) => void;
    onBack: () => void;
}

export default function PdsForm({ agent, onSubmit, onBack }: PdsFormProps) {
    const [pds, setPds] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [pdsError, setPdsError] = useState<string | null>(null);
    const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
    const [isValidatingPds, setIsValidatingPds] = useState(false);
    const [isValidatingInviteCode, setIsValidatingInviteCode] = useState(false);
    const [isPdsValid, setIsPdsValid] = useState(false);
    const [isInviteCodeValid, setIsInviteCodeValid] = useState(false);
    const [serverDescription, setServerDescription] = useState<ServerDescription | null>(null);
    const [lastValidatedPds, setLastValidatedPds] = useState('');
    const [isFormReady, setIsFormReady] = useState(false);

    useEffect(() => {
        const isInviteCodeSectionValid = !serverDescription?.isInviteCodeRequired() ||
            Boolean(inviteCode && !inviteCodeError && !isValidatingInviteCode && isInviteCodeValid);

        setIsFormReady(
            Boolean(isPdsValid &&
                !pdsError &&
                !isValidatingPds &&
                isInviteCodeSectionValid)
        );
    }, [isPdsValid, pdsError, isValidatingPds, serverDescription, inviteCode, inviteCodeError, isValidatingInviteCode, isInviteCodeValid]);

    const validatePdsInput = useCallback(async (value: string) => {
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
            setIsInviteCodeValid(false);
            return;
        }

        setIsValidatingInviteCode(true);
        setInviteCodeError(null);
        setIsInviteCodeValid(false);

        try {
            const inviteCodeValidationResult = await validateInviteCode(pdsValue, inviteCodeValue);
            if (!inviteCodeValidationResult.isValid) {
                setInviteCodeError(inviteCodeValidationResult.error);
                setIsInviteCodeValid(false);
            } else {
                setIsInviteCodeValid(true);
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
            setIsInviteCodeValid(false);
        }

        setIsValidatingInviteCode(false);
    }, []);

    const debouncedValidatePds = useDebounce(validatePdsInput, 1000);
    const debouncedValidateInviteCode = useDebounce(validateInviteCodeInput, 1000);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormReady) return;

        setIsValidatingPds(true);
        setIsValidatingInviteCode(true);

        try {
            await validatePdsInput(pds);

            if (serverDescription?.isInviteCodeRequired()) {
                await validateInviteCodeInput(pds, inviteCode);
            }

            if (!pdsError && !inviteCodeError) {
                onSubmit(pds, inviteCode, serverDescription!);
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
        setIsInviteCodeValid(false);
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
        <form onSubmit={handleSubmit}>
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
                            className={`form-input ${inviteCodeError ? 'error' : ''} ${isInviteCodeValid ? 'success' : ''}`}
                            disabled={isValidatingInviteCode}
                        />
                        {(!isValidatingInviteCode && inviteCodeError && <div className="error-message">{inviteCodeError}</div>) ||
                            (isValidatingInviteCode && <div className="info-message" style={{ marginTop: '0.5rem' }}>Validating invite code...</div>) ||
                            (isInviteCodeValid && <div className="success-message" style={{ marginTop: '0.5rem' }}>✓ Invite code is valid</div>)}
                        <div className="info-message" style={{ marginTop: '0.5rem' }}>
                            This server requires an invite code to register.
                        </div>
                    </div>
                )}

                <div className="button-container">
                    <button
                        type="button"
                        className="back-button"
                        onClick={onBack}
                        disabled={isValidatingPds || isValidatingInviteCode}
                    >
                        ← Go back
                    </button>
                    {isFormReady && (
                        <button
                            type="submit"
                            className="continue-button"
                        >
                            Continue →
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
} 