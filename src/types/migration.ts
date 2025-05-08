import { AtpAgent } from '@atproto/api';

export interface MigrationProcessProps {
    agent: AtpAgent;
    onLogout: () => void;
}

export interface PDSInfo {
    exists: boolean;
    requiresInvite: boolean;
    domain: string;
    availableUserDomains: string[];
}

export interface AccountDetails {
    handle: string;
    email: string;
    password: string;
}

export interface DidCredentials {
    handle: string;
    pds: string;
    signingKey: string;
    rotationKeys: string[];
}

export const VERIFICATION_STEPS = {
    CHECKING: 'checking',
    VERIFYING: 'verifying',
    CLEANUP: 'cleanup',
    COMPLETE: 'complete'
} as const;

export const MIGRATION_STATUS = {
    NOT_STARTED: 'not_started',
    ACCOUNT_CREATED: 'account_created',
    DATA_MIGRATING: 'data_migrating',
    DATA_MIGRATED: 'data_migrated',
    IDENTITY_UPDATING: 'identity_updating',
    IDENTITY_UPDATED: 'identity_updated',
    FINALIZING: 'finalizing',
    COMPLETED: 'completed',
    FAILED: 'failed'
} as const;

export type MigrationStatus = typeof MIGRATION_STATUS[keyof typeof MIGRATION_STATUS];
export type VerificationStep = typeof VERIFICATION_STEPS[keyof typeof VERIFICATION_STEPS];

export interface MigrationProgress {
    status: MigrationStatus;
    error?: string;
    lastUpdated: number;
}

export type IdentityUpdateMethod = 'pds' | 'self_signed';

export interface VerificationState {
    step: VerificationStep;
    error?: string;
    showDeletePrompt?: boolean;
}

export interface RepoStatus {
    status: 'active' | 'deactivated' | 'takendown' | 'suspended' | 'deleted';
    message?: string;
} 