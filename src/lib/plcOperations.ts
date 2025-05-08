import { AtpAgent } from '@atproto/api';
import { Secp256k1Keypair } from '@atproto/crypto';
import * as ui8 from 'uint8arrays';
import { DidCredentials, MIGRATION_STATUS } from '../types/migration';
import { getPdsUrl } from './pdsUtils';

export const handleSelfSignedPlcOperation = async (
    didCredentials: DidCredentials,
    rotationKey: string,
    pds: string,
    updateMigrationProgress: (status: typeof MIGRATION_STATUS[keyof typeof MIGRATION_STATUS], error?: string) => void
) => {
    try {
        let privateKeyBytes: Uint8Array;
        try {
            if (rotationKey.startsWith('z')) {
                privateKeyBytes = ui8.fromString(rotationKey.slice(1), 'base58btc');
            } else {
                privateKeyBytes = ui8.fromString(rotationKey, 'hex');
            }
        } catch (err) {
            throw new Error('Invalid rotation key format. Please provide a valid hex or multikey format.');
        }

        const keypair = await Secp256k1Keypair.import(privateKeyBytes);

        const operation = {
            type: 'plc_operation',
            rotationKeys: [keypair.did(), ...didCredentials.rotationKeys],
            verificationMethods: {
                atproto: didCredentials.signingKey
            },
            alsoKnownAs: [didCredentials.handle],
            services: {
                atproto_pds: {
                    type: 'AtpPersonalDataServer',
                    endpoint: getPdsUrl(pds)
                }
            }
        };

        const operationBytes = ui8.fromString(JSON.stringify(operation), 'utf8');
        const signedOp = await keypair.sign(operationBytes);

        const tempAgent = new AtpAgent({ service: getPdsUrl(pds) });
        await tempAgent.com.atproto.identity.submitPlcOperation({
            operation: JSON.parse(ui8.toString(signedOp, 'utf8'))
        });

        updateMigrationProgress(MIGRATION_STATUS.IDENTITY_UPDATED);
    } catch (err) {
        console.error('Failed to create self-signed PLC operation:', err);
        updateMigrationProgress(MIGRATION_STATUS.FAILED, err instanceof Error ? err.message : 'Failed to create self-signed PLC operation');
        throw err;
    }
};