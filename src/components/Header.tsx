import { ConnectionStatus } from './ConnectionStatus';

interface HeaderProps {
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function Header({ isConnected, lastUpdate }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/lightning.svg" alt="Lightning" className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-gray-900">Live Wire Agent Monitor</h1>
        </div>
        <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} />
      </div>
    </header>
  );
}
