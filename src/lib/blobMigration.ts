import { AtpAgent } from '@atproto/api';
import { MIGRATION_STATUS } from '../types/migration';

const getAllMissingBlobs = async (tempAgent: AtpAgent) => {
    let allMissingBlobs: string[] = [];
    let cursor: string | undefined = undefined;
    let hasMore = true;
    
    while (hasMore) {
        console.log('Fetching missing blobs list from new PDS...');
        const missingBlobsRes = await tempAgent.com.atproto.repo.listMissingBlobs({
            cursor
        }, {
            headers: { authorization: `Bearer ${tempAgent.session?.accessJwt}` }
        });
        
        const response = missingBlobsRes.data as unknown as { cids: string[], cursor?: string };
        
        if (!response || !Array.isArray(response.cids)) {
            console.error('Invalid response from listMissingBlobs:', response);
            throw new Error('Invalid response when getting missing blobs');
        }
        
        allMissingBlobs = [...allMissingBlobs, ...response.cids];
        console.log(`Retrieved ${response.cids.length} missing blobs, total so far: ${allMissingBlobs.length}`);
        
        hasMore = response.cids.length === 1000;
        cursor = response.cursor;
    }
    
    return allMissingBlobs;
};

const migrateSingleBlob = async (
    cid: string,
    agent: AtpAgent,
    tempAgent: AtpAgent,
    processedBlobs: number,
    totalBlobs: number,
    startTime: number,
    updateMigrationProgress: (status: typeof MIGRATION_STATUS[keyof typeof MIGRATION_STATUS], error?: string) => void
) => {
    try {
        console.log(`Downloading blob ${cid} from old PDS...`);
        const blobRes = await agent.com.atproto.sync.getBlob({
            did: agent.session!.did,
            cid
        }, {
            headers: { authorization: `Bearer ${agent.session?.accessJwt}` }
        });

        console.log(`Uploading blob ${cid} to new PDS...`);
        await tempAgent.com.atproto.repo.uploadBlob(blobRes.data, {
            encoding: blobRes.headers['content-type'],
            headers: { authorization: `Bearer ${tempAgent.session?.accessJwt}` }
        });
        
        const progress = Math.round((processedBlobs / totalBlobs) * 100);
        const elapsedTime = Date.now() - startTime;
        const averageTimePerBlob = elapsedTime / processedBlobs;
        const remainingBlobs = totalBlobs - processedBlobs;
        const estimatedTimeRemaining = Math.round((averageTimePerBlob * remainingBlobs) / 1000);
        
        const progressMessage = `Migrated ${processedBlobs}/${totalBlobs} (${progress}%) - Estimated time remaining: ${estimatedTimeRemaining} seconds`;
        console.log(progressMessage);
        updateMigrationProgress('data_migrating', progressMessage);
        
    } catch (err) {
        console.error(`Failed to migrate blob ${cid}:`, err);
        const progress = Math.round((processedBlobs / totalBlobs) * 100);
        updateMigrationProgress('data_migrating', `Migrating blobs: ${progress}% (${processedBlobs}/${totalBlobs}) - Some blobs failed to migrate`);
    }
};

const migrateBlobList = async (
    blobsToMigrate: string[],
    agent: AtpAgent,
    tempAgent: AtpAgent,
    updateMigrationProgress: (status: typeof MIGRATION_STATUS[keyof typeof MIGRATION_STATUS], error?: string) => void
) => {
    const totalBlobs = blobsToMigrate.length;
    let processedBlobs = 0;
    const CONCURRENCY_LIMIT = 5;
    const startTime = Date.now();

    for (let i = 0; i < blobsToMigrate.length; i += CONCURRENCY_LIMIT) {
        const batch = blobsToMigrate.slice(i, i + CONCURRENCY_LIMIT);
        console.log(`Processing batch of ${batch.length} blobs (${i + 1} to ${i + batch.length} of ${totalBlobs})`);
        
        await Promise.all(batch.map(async (cid) => {
            processedBlobs++;
            await migrateSingleBlob(cid, agent, tempAgent, processedBlobs, totalBlobs, startTime, updateMigrationProgress);
        }));
    }
};

export const migrateBlobs = async (
    tempAgent: AtpAgent,
    agent: AtpAgent,
    updateMigrationProgress: (status: typeof MIGRATION_STATUS[keyof typeof MIGRATION_STATUS], error?: string) => void
) => {
    try {
        console.log('Starting blob migration process...');
        let passCount = 0;
        let startTime = Date.now();

        do {
            passCount++;
            if (passCount > 1) {
                console.log(`Starting pass ${passCount} of blob migration...`);
                updateMigrationProgress('data_migrating', `Starting pass ${passCount} of blob migration...`);
            }

            const missingBlobs = await getAllMissingBlobs(tempAgent);
            console.log(`Found ${missingBlobs.length} missing blobs to migrate`);
            
            if (missingBlobs.length === 0) {
                console.log('No blobs to migrate');
                break;
            }

            await migrateBlobList(missingBlobs, agent, tempAgent, updateMigrationProgress);
            
            const remainingMissingBlobs = await getAllMissingBlobs(tempAgent);
            if (remainingMissingBlobs.length === 0) {
                console.log('All blobs have been successfully migrated');
                break;
            } else {
                console.log(`Still have ${remainingMissingBlobs.length} missing blobs after pass ${passCount}`);
            }
        } while (passCount < 3);

        const totalTime = Math.round((Date.now() - startTime) / 1000);
        console.log(`Blob migration completed in ${totalTime} seconds after ${passCount} passes`);
        updateMigrationProgress('data_migrating', `Blob migration completed in ${totalTime} seconds`);
        
    } catch (err) {
        console.error('Failed to migrate blobs:', err);
        throw err;
    }
};