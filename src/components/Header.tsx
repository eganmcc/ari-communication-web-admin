import { ConnectionStatus } from './ConnectionStatus';

interface HeaderProps {
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function Header({ isConnected, lastUpdate }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
        <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} />
      </div>
    </header>
  );
}
