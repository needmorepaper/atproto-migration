import { useState } from 'react';
import { ServerDescription } from '../../lib/migration/serverDescription';

interface AccountDetailsFormProps {
    currentHandle: string;
    pds: string;
    inviteCode: string;
    serverDescription: ServerDescription;
    onBack: () => void;
    onSubmit: (handle: string, email: string, password: string) => void;
}

export default function AccountDetailsForm({ currentHandle, serverDescription, onBack, onSubmit }: AccountDetailsFormProps) {
    const [handle, setHandle] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(handle, email, password);
    };

    // Get the first available domain from the server description
    const availableDomains = serverDescription.getAvailableUserDomains();
    const firstAvailableDomain = Object.values(availableDomains)[0];

    return (
        <form onSubmit={handleSubmit}>
            <h3>Create your new account's credentials</h3>

            <div className="form-group">
                <div className="info-message">
                    <h3>Default handle detected!</h3>
                    We have detected that your current handle is <strong>@{currentHandle}</strong>, which is a default handle provided by your data server. Because of this, we are unable to migrate your current handle to your new data server. We have automatically filled in your previous handle for you, however you can change it to something different if you wish.
                </div>
                <label htmlFor="handle">Handle</label>
                <div className="handle-input-container">
                    <input
                        type="text"
                        id="handle"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="alice"
                        className="form-input"
                    />
                    <span className="handle-domain">{firstAvailableDomain}</span>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="form-input"
                />
            </div>

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