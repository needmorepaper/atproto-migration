export const validateHandle = (handle: string, availableUserDomains: string[]): { 
    isUsingDefaultDomain: boolean;
    customHandle: string | null;
  } => {
    // Check if handle ends with any of the available user domains
    const isUsingDefaultDomain = availableUserDomains.some(domain => 
      handle.endsWith(domain)
    );
  
    if (!isUsingDefaultDomain) {
      return {
        isUsingDefaultDomain: false,
        customHandle: null
      };
    }
  
    // Extract the custom part of the handle (everything before the domain)
    const customHandle = handle.split('.').slice(0, -1).join('.');
    
    return {
      isUsingDefaultDomain: true,
      customHandle
    };
  };