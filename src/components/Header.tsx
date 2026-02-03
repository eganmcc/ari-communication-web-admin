import { ConnectionStatus } from './ConnectionStatus';

interface HeaderProps {
  isConnected: boolean;
  lastUpdate: Date | null;
  bridgeVersion: string;
  apiVersion: string;
  dialerState: 'stopped' | 'starting' | 'idle' | 'dialing' | 'unknown';
  dialerVersion: string;
  dialerLastUpdate: Date | null;
}

const VERSION = '1.2.0';

export function Header({ isConnected, lastUpdate, bridgeVersion, apiVersion, dialerState, dialerVersion, dialerLastUpdate }: HeaderProps) {
  const logoPath = import.meta.env.PROD ? '/dashboard/lightning.svg' : '/lightning.svg';
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoPath} alt="Lightning" className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Wire Agent Monitor</h1>
            <div className="text-xs text-gray-500">
              Dashboard: {VERSION} | Bridge: {bridgeVersion} | Voice API: {apiVersion} | Dialer API: {dialerVersion}
            </div>
          </div>
        </div>
        <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} dialerState={dialerState} dialerVersion={dialerVersion} dialerLastUpdate={dialerLastUpdate} />
      </div>
    </header>
  );
}
