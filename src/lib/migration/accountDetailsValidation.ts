export const validateHandle = (handle: string, availableUserDomains: string[]): { 
    isUsingDefaultDomain: boolean;
    customHandle: string;
  } => {
    // Check if handle ends with any of the available user domains
    const isUsingDefaultDomain = availableUserDomains.some(domain => 
      handle.endsWith(domain)
    );
  
    if (!isUsingDefaultDomain) {
      return {
        isUsingDefaultDomain: false,
        customHandle: handle
      };
    }
  
    // Extract the custom part of the handle (everything before the domain)
    const customHandle = handle.split('.')[0];
    
    return {
      isUsingDefaultDomain: true,
      customHandle: customHandle
    };
  };