import React from 'react';
import { DidCredentials, IdentityUpdateMethod } from '../../types/migration';

interface IdentityUpdateProps {
    isWebDid: boolean;
    didDocument: string;
    didCredentials: DidCredentials | null;
    identityUpdateMethod: IdentityUpdateMethod | null;
    setIdentityUpdateMethod: (method: IdentityUpdateMethod) => void;
    rotationKey: string;
    setRotationKey: (key: string) => void;
    plcToken: string;
    setPlcToken: (token: string) => void;
    isPlcTokenValid: boolean;
    isPlcTokenRequested: boolean;
    lastTokenRequest: number;
    TOKEN_COOLDOWN: number;
    onRequestPlcToken: () => Promise<void>;
    onPlcTokenSubmit: () => Promise<void>;
    onDidDocumentCheck: () => Promise<void>;
    onIdentityUpdate: () => Promise<void>;
}

export const IdentityUpdate: React.FC<IdentityUpdateProps> = ({
    isWebDid,
    didDocument,
    identityUpdateMethod,
    setIdentityUpdateMethod,
    rotationKey,
    setRotationKey,
    plcToken,
    setPlcToken,
    isPlcTokenValid,
    isPlcTokenRequested,
    lastTokenRequest,
    TOKEN_COOLDOWN,
    onRequestPlcToken,
    onPlcTokenSubmit,
    onDidDocumentCheck,
    onIdentityUpdate
}) => {
    return (
        <div className="form-section">
            <h3>Update Identity</h3>

            {isWebDid ? (
                <div className="did-web-card">
                    <h4>Manual DID Document Update Required</h4>
                    <p>Since you're using a did:web account, you'll need to manually update your DID document.</p>
                    <div className="did-document-container">
                        <pre>{didDocument}</pre>
                        <div className="button-container">
                            <button onClick={() => navigator.clipboard.writeText(didDocument)}>
                                Copy to Clipboard
                            </button>
                            <button onClick={() => {
                                const blob = new Blob([didDocument], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'did.json';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}>
                                Download File
                            </button>
                        </div>
                    </div>
                    <p>After updating your DID document, click the button below to verify the changes.</p>
                    <button onClick={onDidDocumentCheck}>
                        Check Document
                    </button>
                </div>
            ) : (
                <div className="did-plc-card">
                    <h4>Choose Update Method</h4>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                value="pds"
                                checked={identityUpdateMethod === 'pds'}
                                onChange={(e) => setIdentityUpdateMethod(e.target.value as IdentityUpdateMethod)}
                            />
                            Use old PDS to sign operation
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="self_signed"
                                checked={identityUpdateMethod === 'self_signed'}
                                onChange={(e) => setIdentityUpdateMethod(e.target.value as IdentityUpdateMethod)}
                            />
                            Use self-provided rotation key
                        </label>
                    </div>

                    {identityUpdateMethod === 'pds' && (
                        <div className="plc-token-section">
                            {!isPlcTokenRequested ? (
                                <div className="token-request-container">
                                    <p>Click the button below to request a token from your old PDS.</p>
                                    <button
                                        className="request-token-button"
                                        onClick={onRequestPlcToken}
                                    >
                                        Request PLC Operation Token
                                    </button>
                                </div>
                            ) : (
                                <div className="token-input-container">
                                    <p>Enter the token that was sent to your email:</p>
                                    <div className="token-input-group">
                                        <input
                                            type="text"
                                            className="token-input"
                                            placeholder="Enter token (e.g., abcde-12345)"
                                            value={plcToken}
                                            onChange={(e) => setPlcToken(e.target.value)}
                                        />
                                        <button
                                            className="submit-token-button"
                                            onClick={onPlcTokenSubmit}
                                            disabled={!isPlcTokenValid}
                                        >
                                            Submit Token
                                        </button>
                                    </div>
                                    <button
                                        className="request-new-token-button"
                                        onClick={onRequestPlcToken}
                                        disabled={Date.now() - lastTokenRequest < TOKEN_COOLDOWN}
                                    >
                                        Request New Token
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {identityUpdateMethod === 'self_signed' && (
                        <div className="rotation-key-section">
                            <input
                                type="text"
                                placeholder="Enter rotation key (hex or multikey format)"
                                value={rotationKey}
                                onChange={(e) => setRotationKey(e.target.value)}
                            />
                            <button onClick={onIdentityUpdate}>
                                Update Identity
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}; 