import { AtpAgent } from '@atproto/api';

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
    return {
      isValid: false,
      error: 'Please enter a valid URL'
    };
  }
}; 