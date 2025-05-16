import { useNetwork } from '../../contexts/networkContext';

export default function NetworkWarning() {
  const { isOnline } = useNetwork();

  if (isOnline) {
    return null;
  }

  return (
    <div className="network-warning">
      <div className="network-warning-content">
        <span className="network-warning-icon">⚠️</span>
        <span>You are currently offline. Please check your internet connection.</span>
      </div>
    </div>
  );
} 