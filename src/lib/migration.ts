import { MIGRATION_STATUS, MigrationProgress } from '../types/migration';

export const updateMigrationProgress = (
    setMigrationProgress: (progress: MigrationProgress) => void,
    status: typeof MIGRATION_STATUS[keyof typeof MIGRATION_STATUS],
    error?: string
) => {
    const progress: MigrationProgress = {
        status,
        error,
        lastUpdated: Date.now()
    };
    setMigrationProgress(progress);
    if (status !== 'failed') {
        localStorage.setItem('migration_progress', JSON.stringify(progress));
    } else {
        localStorage.removeItem('migration_progress');
    }
};