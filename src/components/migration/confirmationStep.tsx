import { ServerDescription } from '../../lib/migration/serverDescription';
import { useState } from 'react';
import '../../css/confirmation.css';

interface ConfirmationStepProps {
    handle: string;
    email: string;
    password: string;
    pds: string;
    serverDescription: ServerDescription;
    onBack: () => void;
    onConfirm: () => void;
    currentHandle?: string;
    currentPds?: string;
}

export default function ConfirmationStep({
    handle,
    email,
    password,
    pds,
    serverDescription,
    onBack,
    onConfirm,
    currentHandle = '',
    currentPds = ''
}: ConfirmationStepProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [pdsVerification, setPdsVerification] = useState('');

    const handleConfirmClick = () => {
        setShowWarning(true);
    };

    const handleWarningConfirm = () => {
        setShowWarning(false);
        setPdsVerification('');
        onConfirm();
    };

    const isPdsVerified = pdsVerification.toLowerCase() === pds.toLowerCase();

    return (
        <div>
            <h3>Check your details!</h3>

            <div className="comparison-container">
                <div className="comparison-side">
                    <h3>Before</h3>
                    <div className="detail-group">
                        <label>Handle</label>
                        <div>@{currentHandle}</div>
                    </div>
                    <div className="detail-group">
                        <label>PDS</label>
                        <div>{currentPds}</div>
                    </div>
                </div>

                <div className="comparison-arrow">→</div>

                <div className="comparison-side">
                    <h3>After</h3>
                    <div className="detail-group">
                        <label>Handle</label>
                        <div>@{handle}</div>
                    </div>
                    <div className="detail-group">
                        <label>PDS</label>
                        <div>{pds}</div>
                    </div>
                </div>
            </div>

            <div className="detail-group">
                <label>New Email</label>
                <div className="detail-value">{email}</div>
            </div>

            <div className="detail-group">
                <label>New Password</label>
                <div className="password-container">
                    <div className="detail-value">
                        {showPassword ? (
                            password
                        ) : (
                            <span className="hidden-password">
                                {'•'.repeat(password.length)}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
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
                    type="button"
                    className="confirm-button"
                    onClick={handleConfirmClick}
                >
                    Confirm Migration →
                </button>
            </div>

            {showWarning && (
                <div className="warning-overlay">
                    <div className="warning-dialog">
                        <h3>Last chance to back out!</h3>
                        <div className="warning-content">
                            <p>This tool is currently in beta, as such:</p>
                            <ul>
                                <li>We do not guarantee that the migration will succeed</li>
                                <li>While most errors are recoverable, for the moment we cannot help you recover from them and continue</li>
                                <li>We take no responsibility for any problems that may occur during the process</li>
                            </ul>
                            <p>If you understand the risks and want to proceed, please type your new PDS <b>({pds})</b> below:</p>
                            <div className="pds-verification">
                                <input
                                    type="text"
                                    value={pdsVerification}
                                    onChange={(e) => setPdsVerification(e.target.value)}
                                    placeholder="Type your new PDS here"
                                    className={pdsVerification && !isPdsVerified ? 'error' : ''}
                                />
                            </div>
                        </div>
                        <div className="warning-buttons">
                            <button
                                type="button"
                                className="back-button"
                                onClick={handleWarningConfirm}
                                disabled={!isPdsVerified}
                            >
                                Migrate!
                            </button>
                            <button
                                type="button"
                                className="confirm-button"
                                onClick={() => {
                                    setShowWarning(false);
                                    setPdsVerification('');
                                }}
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 