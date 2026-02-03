import clsx from 'clsx';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdate: Date | null;
  dialerState: 'stopped' | 'starting' | 'idle' | 'dialing' | 'unknown';
  dialerVersion: string;
  dialerLastUpdate: Date | null;
}

export function ConnectionStatus({ isConnected, dialerState }: ConnectionStatusProps) {
  const getDialerStateColor = () => {
    switch (dialerState) {
      case 'stopped': return 'text-red-600';
      case 'starting': return 'text-yellow-600';
      case 'idle': return 'text-green-600';
      case 'dialing': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  const getDialerEmoji = () => {
    switch (dialerState) {
      case 'stopped': return '🔴';
      case 'starting': return '🟡';
      case 'idle': return '🟢';
      case 'dialing': return '🔵';
      default: return '⚪';
    }
  };

  const getDialerStateDisplay = () => {
    return dialerState.charAt(0).toUpperCase() + dialerState.slice(1);
  };

  return (
    <div className="flex flex-col items-end gap-1 text-sm">
      {/* Row 1 - ARI Bridge */}
      <div className="grid grid-cols-[110px_15px_60px] gap-x-3 items-center">
        <span className="text-gray-600 text-right">ARI Bridge</span>
        <div
          className={clsx(
            'w-3 h-3 rounded-full transition-colors justify-self-center',
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          )}
        />
        <span className="font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      {/* Row 2 - Dialer Engine */}
      <div className="grid grid-cols-[110px_15px_60px] gap-x-3 items-center">
        <span className="text-gray-600 text-right">Dialer Engine</span>
        <span className="text-xs flex items-center justify-center">{getDialerEmoji()}</span>
        <span className={clsx('font-medium', getDialerStateColor())}>
          {getDialerStateDisplay()}
        </span>
      </div>
    </div>
  );
}
