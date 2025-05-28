import { useState, useEffect } from 'react';
import { ServerDescription } from '../../lib/migration/serverDescription';
import { validateHandle } from '../../lib/migration/accountDetailsValidation';

interface AccountDetailsFormProps {
    currentHandle: string;
    pds: string;
    inviteCode: string;
    serverDescription: ServerDescription;
    newServerDescription: ServerDescription;
    onBack: () => void;
    onSubmit: (handle: string, email: string, password: string) => void;
}

export default function AccountDetailsForm({
    currentHandle,
    serverDescription,
    newServerDescription,
    onBack,
    onSubmit
}: AccountDetailsFormProps) {
    const [handle, setHandle] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isUsingDefaultDomain, setIsUsingDefaultDomain] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [handleError, setHandleError] = useState('');

    useEffect(() => {
        // Check if current handle is using a default domain
        const availableDomains = serverDescription.getAvailableUserDomains();
        const domainNames = Object.values(availableDomains);
        const { isUsingDefaultDomain, customHandle } = validateHandle(currentHandle, domainNames);

        setIsUsingDefaultDomain(isUsingDefaultDomain);
        if (isUsingDefaultDomain) {
            // Set initial handle value from current handle
            setHandle(currentHandle.slice(0, currentHandle.indexOf('.')));
        } else {
            setHandle(customHandle || 'example');
        }
    }, [currentHandle, serverDescription]);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        return password.length >= 8;
    };

    const validateHandleInput = (handle: string) => {
        if (handle.length < 3) {
            return 'Handle must be at least 3 characters long';
        }
        if (!/^[a-zA-Z0-9-]+$/.test(handle)) {
            return 'Handle can only contain letters, numbers, and hyphens';
        }
        return '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Reset errors
        setEmailError('');
        setPasswordError('');
        setHandleError('');

        // Validate handle
        const handleValidationError = validateHandleInput(handle);
        if (handleValidationError) {
            setHandleError(handleValidationError);
            return;
        }

        // Validate email
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        // Validate password
        if (!validatePassword(password)) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }

        onSubmit(handle, email, password);
    };

    // Get the first available domain from the new server description
    const newAvailableDomains = newServerDescription.getAvailableUserDomains();
    const newFirstAvailableDomain = Object.values(newAvailableDomains)[0];

    return (
        <form onSubmit={handleSubmit}>
            <h3>Create your new account's credentials</h3>

            {isUsingDefaultDomain && (
                <div>
                    <div className="info-message">
                        <h3>Default handle detected!</h3>
                        We have detected that your current handle is <strong>@{currentHandle}</strong>, which is a default handle provided by your data server. Because of this, we are unable to migrate your current handle to your new data server. We have automatically filled in your previous handle for you, however you can change it to something different if you wish.
                    </div>

                    <div className="form-group">
                        <label htmlFor="handle">Handle</label>
                        <div className="handle-input-container">
                            <input
                                type="text"
                                id="handle"
                                value={handle}
                                onChange={(e) => {
                                    setHandle(e.target.value);
                                    setHandleError('');
                                }}
                                placeholder="alice"
                                className={`form-input ${handleError ? 'error' : ''}`}
                            />
                            <span className="handle-domain">{newFirstAvailableDomain}</span>
                        </div>
                        {handleError && <div className="error-message">{handleError}</div>}
                    </div>
                </div>
            )}

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                    }}
                    placeholder="popbob@example.com"
                    required
                    className={`form-input ${emailError ? 'error' : ''}`}
                />
                {emailError && <div className="error-message">{emailError}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                    }}
                    placeholder="hunter2"
                    required
                    className={`form-input ${passwordError ? 'error' : ''}`}
                />
                {passwordError && <div className="error-message">{passwordError}</div>}
            </div>
            <small>We recommend using a new, unique password for your new account.</small>
            
            <div className="button-container">
                <button
                    type="button"
                    className="back-button"
                    onClick={onBack}
                >
                    ← Go back
                </button>
                <button
                    type="submit"
                    className="continue-button"
                >
                    Continue →
                </button>
            </div>
        </form>
    );
} 