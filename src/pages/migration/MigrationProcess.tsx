import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import Header from '../../components/common/header';
import Footer from '../../components/common/footer';
import { useState, useCallback } from 'react';
import { validatePDS } from '../../lib/migration/migrationValidation';
import { useDebounce } from '../../hooks/useDebounce';

interface MigrationProcessProps {
    agent: AtpAgent;
    onLogout: () => void;
}

export default function MigrationProcess({ agent, onLogout }: MigrationProcessProps) {
    const navigate = useNavigate();
    const [pds, setPds] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isValid, setIsValid] = useState(false);

    const validateInput = useCallback(async (value: string) => {
        setIsValidating(true);
        setIsValid(false);
        const validationResult = await validatePDS(value, agent);
        setError(validationResult.error);
        setIsValid(validationResult.isValid);
        setIsValidating(false);
    }, [agent]);

    const debouncedValidate = useDebounce(validateInput, 1000);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsValidating(true);
        await validateInput(pds);
        setIsValidating(false);
        
        if (!error) {
            // TODO: Handle PDS migration logic
            console.log('PDS to migrate to:', pds);
        }
    };

    const handlePdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPds(value);
        setIsValid(false);
        debouncedValidate(value);
    };

    const handlePdsBlur = () => {
        validateInput(pds);
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
                                    className={`form-input ${error ? 'error' : ''} ${isValid ? 'success' : ''}`}
                                    disabled={isValidating}
                                />
                                {(!isValidating && error && <div className="error-message">{error}</div>) || 
                                 (isValidating && <div className="info-message" style={{ marginTop: '0.5rem' }}>Checking if the data server is valid...</div>) ||
                                 (isValid && <div className="success-message" style={{ marginTop: '0.5rem' }}>✓ This data server is alive!</div>)}
                                <div className="button-container">
                                    <button
                                        type="button"
                                        className="back-button"
                                        onClick={() => navigate('/migration')}
                                        disabled={isValidating}
                                    >
                                        ← Go back
                                    </button>
                                    <button
                                        type="submit"
                                        className="continue-button"
                                        disabled={!!error || isValidating}
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
