import clsx from 'clsx';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdate: Date | null;
}

export function ConnectionStatus({ isConnected, lastUpdate }: ConnectionStatusProps) {
  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return '--';
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div
          className={clsx(
            'w-3 h-3 rounded-full transition-colors',
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          )}
        />
        <span className="text-sm font-medium">
          {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </span>
      </div>
      <span className="text-sm text-gray-500">
        Last updated: {getTimeSinceUpdate()}
      </span>
    </div>
  );
}
