import { useEffect } from 'react';
import { AtpAgent } from '@atproto/api';
import { useAvatar } from '../../contexts/AvatarContext';
import '../../styles/App.css';

interface HeaderProps {
  agent: AtpAgent;
  onLogout: () => void;
}

export default function Header({ agent, onLogout }: HeaderProps) {
  const { avatarUrl, setAvatarUrl } = useAvatar();

  useEffect(() => {
    const fetchProfile = async () => {
      // Only fetch if we don't already have an avatar
      if (!avatarUrl) {
        try {
          const profile = await agent.getProfile({ actor: agent.session?.handle || '' });
          if (profile.data.avatar) {
            setAvatarUrl(profile.data.avatar);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      }
    };

    fetchProfile();
  }, [agent, avatarUrl, setAvatarUrl]);

  return (
    <header className="app-header">
      <h1 className="app-title">ATproto Migrator</h1>
      <div className="user-info">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="Profile"
            className="user-avatar"
          />
        )}
        <span className="user-handle" title={agent.session?.handle}>{agent.session?.handle}</span>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
} 