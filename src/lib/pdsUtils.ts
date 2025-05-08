import { AtpAgent } from '@atproto/api';
import { RepoStatus } from '../types/migration';

export const getPdsUrl = (pdsDomain: string) => {
    if (!pdsDomain) return '';
    if (pdsDomain.startsWith('http://') || pdsDomain.startsWith('https://')) {
        return pdsDomain;
    }
    return `https://${pdsDomain}`;
};

export const checkAndHandleRepoStatus = async (
    agent: AtpAgent,
    did: string,
    accountDetails: { handle: string; password: string }
) => {
    try {
        const statusRes = await agent.com.atproto.sync.getRepoStatus({ did });
        const status = statusRes.data as RepoStatus;

        switch (status.status) {
            case 'takendown':
                throw new Error(`User's account was taken down`); // bad luck!
            case 'suspended':
                throw new Error(`User's account was suspended`);
            case 'deleted':
                return false;
            case 'active':
                return true;
            case 'deactivated':
                try {
                    const fullHandle = accountDetails.handle;
                    await agent.login({
                        identifier: fullHandle,
                        password: accountDetails.password
                    });

                    await agent.com.atproto.server.activateAccount();
                    return true;
                } catch (err) { // Legacy cruft from attempting to restart the migration process that NO USER should ever see (still not done yet btw!)
                    console.error('Failed to reactivate account:', err);
                    try {
                        await agent.com.atproto.server.requestAccountDelete();
                        const deleteToken = prompt('Please enter the deletion token for the new PDS account that was sent to your email:');
                        if (!deleteToken) {
                            throw new Error('Deletion token is required');
                        }
                        await agent.com.atproto.server.deleteAccount({
                            did: did,
                            password: accountDetails.password,
                            token: deleteToken
                        });
                        return false;
                    } catch (deleteErr) { // shrug :/
                        console.error('Failed to delete account:', deleteErr);
                        throw new Error('Failed to handle deactivated account. Please try again later.');
                    }
                }
            default:
                return true;
        }
    } catch (err) {
        if ((err as any)?.error === 'RepoNotFound') {
            return false;
        }
        throw err;
    }
}; 