import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import { useState, useRef, useEffect } from 'react';
import Header from '../../components/common/header';
import Footer from '../../components/common/footer';
import PdsForm from '../../components/migration/pdsForm';
import AccountDetailsForm from '../../components/migration/accountDetailsForm';
import { ServerDescription } from '../../lib/migration/serverDescription';

interface MigrationProcessProps {
    agent: AtpAgent;
    onLogout: () => void;
}

export default function MigrationProcess({ agent, onLogout }: MigrationProcessProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<'pds' | 'account'>('pds');
    const [pdsDetails, setPdsDetails] = useState<{ pds: string; inviteCode: string; serverDescription: ServerDescription } | null>(null);
    const accountSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentStep === 'account' && accountSectionRef.current) {
            accountSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentStep]);

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

                    {currentStep === 'account' && pdsDetails && (
                        <div className="form-section" ref={accountSectionRef}>
                            <AccountDetailsForm
                                currentHandle={agent.session?.handle || ''}
                                pds={pdsDetails.pds}
                                inviteCode={pdsDetails.inviteCode}
                                serverDescription={pdsDetails.serverDescription}
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
