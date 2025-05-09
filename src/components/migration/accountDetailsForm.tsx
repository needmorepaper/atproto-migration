import { useState } from 'react';

interface AccountDetailsFormProps {
    pds: string;
    inviteCode: string;
    onBack: () => void;
    onSubmit: (handle: string, email: string, password: string) => void;
}

export default function AccountDetailsForm({ pds, inviteCode, onBack, onSubmit }: AccountDetailsFormProps) {
    const [handle, setHandle] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(handle, email, password);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Account Details</h3>

            <div className="form-group">
                <label htmlFor="handle">Handle</label>
                <input
                    type="text"
                    id="handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="example.bsky.social"
                    className="form-input"
                />
            </div>
            <div className="info-message">
                Your handle will be used to identify your account.
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