import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AvatarContextType {
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    const handleClearAvatar = () => {
      setAvatarUrl('');
    };

    const contextElement = document.querySelector('[data-avatar-context]');
    if (contextElement) {
      contextElement.addEventListener('clearAvatar', handleClearAvatar);
      return () => {
        contextElement.removeEventListener('clearAvatar', handleClearAvatar);
      };
    }
  }, []);

  return (
    <div data-avatar-context>
      <AvatarContext.Provider value={{ avatarUrl, setAvatarUrl }}>
        {children}
      </AvatarContext.Provider>
    </div>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
} 