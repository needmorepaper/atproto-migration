import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import { useState, useRef, useEffect } from 'react';
import Header from '../../components/common/header';
import Footer from '../../components/common/footer';
import PdsForm from '../../components/migration/pdsForm';
import AccountDetailsForm from '../../components/migration/accountDetailsForm';
import ConfirmationStep from '../../components/migration/confirmationStep';
import { ServerDescription } from '../../lib/migration/serverDescription';
import { getServerDescription } from '../../lib/migration/pdsValidation';

interface MigrationProcessProps {
    agent: AtpAgent;
    onLogout: () => void;
}

export default function MigrationProcess({ agent, onLogout }: MigrationProcessProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<'pds' | 'account' | 'confirmation'>('pds');
    const [pdsDetails, setPdsDetails] = useState<{ pds: string; inviteCode: string; serverDescription: ServerDescription } | null>(null);
    const [accountDetails, setAccountDetails] = useState<{ handle: string; email: string; password: string } | null>(null);
    const [currentServerDescription, setCurrentServerDescription] = useState<ServerDescription | null>(null);
    const accountSectionRef = useRef<HTMLDivElement>(null);
    const confirmationSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentStep === 'account' && accountSectionRef.current) {
            accountSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (currentStep === 'confirmation' && confirmationSectionRef.current) {
            confirmationSectionRef.current.scrollIntoView({ behavior: 'smooth' });
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
        setAccountDetails({ handle, email, password });
        setCurrentStep('confirmation');
    };

    const handleBack = () => {
        if (currentStep === 'confirmation') {
            setCurrentStep('account');
        } else if (currentStep === 'account') {
            setCurrentStep('pds');
        } else {
            navigate('/migration');
        }
    };

    const handleConfirm = () => {
        // TODO: Handle the actual migration process
        console.log('Starting migration with:', { ...pdsDetails, ...accountDetails });
    };

    return (
        <div className="actions-page">
            <Header agent={agent} onLogout={onLogout} />

            <div className="actions-container">
                <div className="page-content">
                    <h2>Migrate your account</h2>
                    
                    <div className={currentStep !== 'pds' ? 'form-section completed' : 'form-section'}>
                        <PdsForm 
                            agent={agent}
                            onSubmit={handlePdsSubmit}
                            onBack={handleBack}
                        />
                    </div>

                    {currentStep !== 'pds' && pdsDetails && currentServerDescription && (
                        <div className={currentStep === 'account' ? 'form-section' : 'form-section completed'} ref={accountSectionRef}>
                            <AccountDetailsForm
                                currentHandle={agent.session?.handle || ''}
                                pds={pdsDetails.pds}
                                inviteCode={pdsDetails.inviteCode}
                                serverDescription={currentServerDescription}
                                newServerDescription={pdsDetails.serverDescription}
                                onSubmit={handleAccountSubmit}
                                onBack={handleBack}
                            />
                        </div>
                    )}

                    {currentStep === 'confirmation' && pdsDetails && accountDetails && (
                        <div className="form-section" ref={confirmationSectionRef}>
                            <ConfirmationStep
                                handle={accountDetails.handle}
                                email={accountDetails.email}
                                password={accountDetails.password}
                                pds={pdsDetails.pds}
                                currentHandle={agent.session?.handle || ''}
                                currentPds={new URL(agent.serviceUrl).hostname}
                                onBack={handleBack}
                                onConfirm={handleConfirm}
                            />
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
