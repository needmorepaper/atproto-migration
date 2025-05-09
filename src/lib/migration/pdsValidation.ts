import { AtpAgent } from '@atproto/api';
import { ServerDescription } from './serverDescription';

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

const ensureProtocol = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const checkPDSHealth = async (pdsUrl: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${pdsUrl}/xrpc/_health`, {
      signal: controller.signal
    });
    if (!response.ok) return false;

    const data = await response.json();
    // Check if response is just a version number
    return typeof data === 'string' || (typeof data === 'object' && Object.keys(data).length === 1 && typeof data.version === 'string');
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getServerDescription = async (pdsUrl: string): Promise<ServerDescription> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`https://${pdsUrl}/xrpc/com.atproto.server.describeServer`, {
      signal: controller.signal
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server description request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: pdsUrl,
        response: errorData
      });
      throw new Error('Failed to get server description');
    }

    const data = await response.json();
    console.log('Server description response:', {
      url: pdsUrl,
      data
    });

    return new ServerDescription({
      did: data.did,
      availableUserDomains: data.availableUserDomains ?? {},
      inviteCodeRequired: data.inviteCodeRequired ?? false,
      links: data.links ?? {},
      contact: data.contact ?? {}
    });
  } catch (e) {
    console.error('Error getting server description:', {
      url: pdsUrl,
      error: e instanceof Error ? {
        name: e.name,
        message: e.message,
        stack: e.stack
      } : e
    });
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const validateInviteCode = async (pdsUrl: string, inviteCode: string): Promise<ValidationResult> => {
  inviteCode = inviteCode.trim();
  
  try {
    if (!inviteCode) {
      return {
        isValid: false,
        error: 'This server requires an invite code'
      };
    }

    const pdsPart = pdsUrl.replace(/\./g, '-');
    const inviteCodeRegex = new RegExp(`^${pdsPart}-[a-zA-Z0-9]{5}-[a-zA-Z0-9]{5}$`);
    const isValid = inviteCodeRegex.test(inviteCode);

    if (!isValid) {
      console.error('Invalid invite code format:', {
        pds: pdsUrl,
        inviteCode,
        expectedFormat: `${pdsUrl.replace(/\./g, '-')}-XXXXX-XXXXX`
      });
      return {
        isValid: false,
        error: 'Incorrect invite code format'
      };
    }

    return {
      isValid: true,
      error: null
    };
  } catch (e) {
    console.error('Error validating invite code:', {
      pds: pdsUrl,
      inviteCode,
      error: e instanceof Error ? {
        name: e.name,
        message: e.message,
        stack: e.stack
      } : e
    });
    return {
      isValid: false,
      error: 'Failed to validate invite code'
    };
  }
};

export const validatePDS = async (pdsUrl: string, agent: AtpAgent): Promise<ValidationResult> => {
  if (!pdsUrl.trim()) {
    return {
      isValid: false,
      error: null
    };
  }

  const urlWithProtocol = ensureProtocol(pdsUrl);

  if (!isValidUrl(urlWithProtocol)) {
    return {
      isValid: false,
      error: 'Please enter a valid URL'
    };
  }

  try {
    const url = new URL(urlWithProtocol);
    const hostname = url.hostname;

    // Check for Bluesky domains
    if (hostname.endsWith('.bsky.network') ||
      hostname === 'bsky.social' ||
      hostname === 'bsky.app') {
      return {
        isValid: false,
        error: 'You cannot migrate to Bluesky data servers at this time.'
      };
    }

    // Check if trying to migrate to current PDS
    const currentPDS = agent.serviceUrl;
    if (hostname === new URL(currentPDS).hostname) {
      return {
        isValid: false,
        error: 'You cannot migrate to the same PDS that you are currently using.'
      };
    }

    // Check if PDS is alive and valid
    try {
      const isHealthy = await checkPDSHealth(urlWithProtocol);
      if (!isHealthy) {
        return {
          isValid: false,
          error: 'This PDS is either offline or not a valid server.'
        };
      }
    } catch (e) {
      console.error('Error checking PDS health:', {
        url: urlWithProtocol,
        error: e instanceof Error ? {
          name: e.name,
          message: e.message,
          stack: e.stack
        } : e
      });
      if (e instanceof Error && e.message === 'Request timed out') {
        return {
          isValid: false,
          error: 'The server took too long to respond. Please try again later.'
        };
      }
      return {
        isValid: false,
        error: 'This PDS is either offline or not a valid server.'
      };
    }

    return {
      isValid: true,
      error: null
    };
  } catch (e) {
    console.error('Error validating PDS:', {
      url: pdsUrl,
      error: e instanceof Error ? {
        name: e.name,
        message: e.message,
        stack: e.stack
      } : e
    });
    return {
      isValid: false,
      error: 'Please enter a valid URL'
    };
  }
};

export { getServerDescription }; 