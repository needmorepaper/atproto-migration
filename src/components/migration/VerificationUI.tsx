import React from 'react';
import confetti from 'canvas-confetti';
import { VerificationState, VERIFICATION_STEPS } from '../../types/migration';

interface VerificationUIProps {
    verificationState: VerificationState;
    setVerificationState: (state: VerificationState) => void;
    pds: string;
    onLogout: () => void;
    onDeleteOldAccount: () => Promise<void>;
}

export const VerificationUI: React.FC<VerificationUIProps> = ({
    verificationState,
    setVerificationState,
    pds,
    onLogout,
    onDeleteOldAccount
}) => {
    const { step, error, showDeletePrompt } = verificationState;

    const renderStepContent = () => {
        switch (step) {
            case VERIFICATION_STEPS.CHECKING:
                return (
                    <>
                        <h3>Verifying Migration</h3>
                        <div className="loading-message">Checking account status...</div>
                        {error && <div className="error-message">{error}</div>}
                    </>
                );

            case VERIFICATION_STEPS.VERIFYING:
                return (
                    <>
                        <h3>Migration Complete!</h3>
                        <p>Your account has been successfully migrated to {pds}.</p>
                        <div className="verification-steps">
                            <h4>Next Steps:</h4>
                            <ol>
                                <li>Log out of your current account</li>
                                <li>Log in to your new account at {pds} in Bluesky using your new handle and password</li>
                                <li>Verify that all your data (posts, follows, media, preferences, etc.) has been migrated correctly</li>
                            </ol>
                        </div>
                        <div className="button-container">
                            <button onClick={() => setVerificationState({ step: VERIFICATION_STEPS.CLEANUP, showDeletePrompt: true })}>
                                Everything Works!
                            </button>
                            <button onClick={() => setVerificationState({ step: VERIFICATION_STEPS.CLEANUP, showDeletePrompt: false })}>
                                I Need Help
                            </button>
                        </div>
                    </>
                );

            case VERIFICATION_STEPS.CLEANUP:
                return showDeletePrompt ? (
                    <>
                        <h3>Clean Up Old Account</h3>
                        <p>Would you like to delete your old account? This will:</p>
                        <ul>
                            <li>Remove your old account completely</li>
                            <li>Help older third-party apps resolve your handle correctly</li>
                            <li>Make the migration process cleaner</li>
                        </ul>
                        <div className="button-container">
                            <button onClick={onDeleteOldAccount}>
                                Yes, Delete Old Account
                            </button>
                            <button onClick={() => setVerificationState({ step: VERIFICATION_STEPS.COMPLETE })}>
                                No, Keep It
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3>Need Help?</h3>
                        <p>If you're experiencing issues with your migrated account:</p>
                        <ul>
                            <li>Try logging out and back in</li>
                            <li>Check if your handle is resolving correctly</li>
                            <li>Contact the support team of your new PDS</li>
                        </ul>
                        <button onClick={() => setVerificationState({ step: VERIFICATION_STEPS.COMPLETE })}>
                            Continue
                        </button>
                    </>
                );

            case VERIFICATION_STEPS.COMPLETE:
                return (
                    <>
                        <h3>🎉 Migration Complete! 🎉</h3>
                        <p>Your account has been successfully migrated to {pds}.</p>
                        {!showDeletePrompt && (
                            <p className="note">
                                Note: You can still delete your old account later if you change your mind.
                            </p>
                        )}
                        <button onClick={onLogout}>
                            Log Out
                        </button>
                    </>
                );
        }
    };

    return (
        <div className={`verification-section ${step === VERIFICATION_STEPS.COMPLETE ? 'success' : ''}`}>
            {renderStepContent()}
        </div>
    );
}; 