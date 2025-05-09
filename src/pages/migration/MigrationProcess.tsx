import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import { useState, useRef, useEffect } from 'react';
import Header from '../../components/common/header';
import Footer from '../../components/common/footer';
import PdsForm from '../../components/migration/pdsForm';
import AccountDetailsForm from '../../components/migration/accountDetailsForm';
import { ServerDescription } from '../../lib/migration/serverDescription';
import { getServerDescription } from '../../lib/migration/pdsValidation';

interface MigrationProcessProps {
    agent: AtpAgent;
    onLogout: () => void;
}

export default function MigrationProcess({ agent, onLogout }: MigrationProcessProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<'pds' | 'account'>('pds');
    const [pdsDetails, setPdsDetails] = useState<{ pds: string; inviteCode: string; serverDescription: ServerDescription } | null>(null);
    const [currentServerDescription, setCurrentServerDescription] = useState<ServerDescription | null>(null);
    const accountSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentStep === 'account' && accountSectionRef.current) {
            accountSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentStep]);

    // Fetch current PDS server description when component mounts
    useEffect(() => {
        const fetchCurrentServerDescription = async () => {
            try {
                const currentPds = new URL(agent.serviceUrl).hostname;
                
                // If the current PDS is a Bluesky network server, use bsky.social's description
                if (currentPds.endsWith('.bsky.network')) {
                    const description = await getServerDescription('bsky.social');
                    setCurrentServerDescription(description);
                } else {
                    const description = await getServerDescription(currentPds);
                    setCurrentServerDescription(description);
                }
            } catch (e) {
                console.error('Failed to fetch current server description:', e);
            }
        };
        fetchCurrentServerDescription();
    }, [agent.serviceUrl]);

    const handlePdsSubmit = (pds: string, inviteCode: string, serverDescription: ServerDescription) => {
        setPdsDetails({ pds, inviteCode, serverDescription });
        setCurrentStep('account');
    };

    const handleAccountSubmit = (handle: string, email: string, password: string) => {
        // TODO: Handle account creation logic
        console.log('Account details:', { handle, email, password });
    };

    const handleBack = () => {
        if (currentStep === 'account') {
            setCurrentStep('pds');
        } else {
            navigate('/migration');
        }
    };

    return (
        <div className="actions-page">
            <Header agent={agent} onLogout={onLogout} />

            <div className="actions-container">
                <div className="page-content">
                    <h2>Migrate your account</h2>
                    
                    <div className={currentStep === 'account' ? 'form-section completed' : 'form-section'}>
                        <PdsForm 
                            agent={agent}
                            onSubmit={handlePdsSubmit}
                            onBack={handleBack}
                        />
                    </div>

                    {currentStep === 'account' && pdsDetails && currentServerDescription && (
                        <div className="form-section" ref={accountSectionRef}>
                            <AccountDetailsForm
                                currentHandle={agent.session?.handle || ''}
                                pds={pdsDetails.pds}
                                inviteCode={pdsDetails.inviteCode}
                                serverDescription={currentServerDescription}
                                onSubmit={handleAccountSubmit}
                                onBack={handleBack}
                            />
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
