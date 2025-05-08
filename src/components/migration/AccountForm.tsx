import React from 'react';
import { PDSInfo, AccountDetails } from '../../types/migration';

interface AccountFormProps {
    pdsInfo: PDSInfo | null;
    accountDetails: AccountDetails;
    setAccountDetails: (details: AccountDetails) => void;
    isCustomHandle: boolean;
    isCurrentHandleDefault: () => boolean;
    onBack: () => void;
    onContinue: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({
    pdsInfo,
    accountDetails,
    setAccountDetails,
    isCustomHandle,
    isCurrentHandleDefault,
    onBack,
    onContinue
}) => {
    return (
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
                        onChange={(e) => setAccountDetails({ ...accountDetails, handle: e.target.value })}
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
                    onChange={(e) => setAccountDetails({ ...accountDetails, email: e.target.value })}
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
                    onChange={(e) => setAccountDetails({ ...accountDetails, password: e.target.value })}
                />
            </div>
            <small>We recommend using a different password for your new account. Save all of the above details somewhere before continuing.</small>
            <div className="button-container">
                <button
                    className="back-button"
                    onClick={onBack}
                >
                    ← Go back
                </button>
                <button
                    className="continue-button"
                    onClick={onContinue}
                >
                    Continue →
                </button>
            </div>
        </div>
    );
}; 