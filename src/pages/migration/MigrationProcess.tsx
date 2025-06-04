import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtpAgent } from '@atproto/api';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import { MigrationData } from '../../lib/migration/migrationData';
import '../../css/migration.css';

interface MigrationProcessProps {
    agent: AtpAgent;
    onLogout: () => void;
}

type MigrationStep = 'account-creation' | 'data-transfer' | 'identity-update' | 'finalization';

export default function MigrationProcess({ agent, onLogout }: MigrationProcessProps) {
    let navigate = useNavigate();
    const [migrationData, setMigrationData] = useState<MigrationData | null>(null);
    const [currentStep, setCurrentStep] = useState<MigrationStep>('account-creation');

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        if (localStorage.getItem('migrationData') == null) {
            navigate('/actions');
        }

        const migrationData = JSON.parse(localStorage.getItem('migrationData') || '{}');
        setMigrationData(new MigrationData(migrationData.oldPds, migrationData.newPds, migrationData.inviteCode, migrationData.handle, migrationData.email, migrationData.password));
    }, []);

    return (
        <div className="actions-page">
            <Header agent={agent} onLogout={onLogout} />
            <div className="page-content">
                <h2>Account migration in progress...</h2>
                <div className="progress-steps">
                    <div className={`progress-step ${currentStep === 'account-creation' ? 'active' : ''}`}>
                        <div className="step-number">1</div>
                        <div className="step-text">Creating your new account</div>
                    </div>
                    <div className={`progress-step ${currentStep === 'data-transfer' ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-text">Moving your data</div>
                    </div>
                    <div className={`progress-step ${currentStep === 'identity-update' ? 'active' : ''}`}>
                        <div className="step-number">3</div>
                        <div className="step-text">Declaring your new host</div>
                    </div>
                    <div className={`progress-step ${currentStep === 'finalization' ? 'active' : ''}`}>
                        <div className="step-number">4</div>
                        <div className="step-text">Finalizing migration</div>
                    </div>
                </div><br />
                <div className="info-message">
                    <h3>Details</h3>
                    <strong>example</strong>
                </div>
                <div className="warning-section">
                    <h3>Important!</h3>
                    <ul>
                        <li>Do not close this window or navigate away</li>
                        <li>Keep your browser open until the process is complete</li>
                        <li>You will be notified when the migration is finished</li>
                    </ul>
                </div>
            </div>
            <Footer />
        </div>
    );
} 