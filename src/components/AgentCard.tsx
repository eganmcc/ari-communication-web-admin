import { Agent } from '../types/agent';
import { useCallTimer } from '../hooks/useCallTimer';
import { useTimeAgo } from '../hooks/useTimeAgo';
import { getStatusColor, getStatusEmoji, getStatusLabel } from '../utils/formatters';
import clsx from 'clsx';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const callDuration = useCallTimer(agent.lastStatusChange || '', agent.status);
  const lastActivity = useTimeAgo(agent.lastStatusChange || '');

  return (
    <div
      data-extension={agent.extension}
      data-status={agent.status}
      className={clsx(
        'bg-white rounded-lg shadow-md p-6 border-2 transition-all duration-200 hover:shadow-lg',
        agent.status === 'available' && 'border-green-200',
        agent.status === 'busy' && 'border-red-200',
        agent.status === 'break' && 'border-amber-200',
        agent.status === 'offline' && 'border-gray-200'
      )}
    >
      {/* Header with Photo and Extension */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div className="flex-1 flex flex-col items-end">
          <div className="text-sm text-gray-500 mb-1">Extension</div>
          <div className="text-2xl font-bold text-gray-900">{agent.extension}</div>
          <div className={clsx('w-4 h-4 rounded-full mt-2', getStatusColor(agent.status))} />
        </div>
      </div>

      {/* Agent Name */}
      <div className="mb-4">
        <div className="text-lg font-semibold text-gray-800">{agent.name}</div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{getStatusEmoji(agent.status)}</span>
        <span className={clsx(
          'font-medium text-sm uppercase tracking-wide',
          agent.status === 'available' && 'text-green-600',
          agent.status === 'busy' && 'text-red-600',
          agent.status === 'break' && 'text-amber-600',
          agent.status === 'offline' && 'text-gray-600'
        )}>
          {getStatusLabel(agent.status)}
        </span>
      </div>

      {/* Call Duration (if busy) */}
      {agent.status === 'busy' && callDuration && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-700 font-medium">On Call</div>
          <div className="text-2xl font-bold text-red-600 font-mono">{callDuration}</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Total Calls</div>
          <div className="text-xl font-bold text-blue-600">{agent.totalCalls}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Last Activity</div>
          <div className="text-sm font-medium text-gray-700">{lastActivity}</div>
        </div>
      </div>

      {/* Current Call Info */}
      {agent.currentCall && (
        <div className="text-xs text-gray-400 border-t pt-2 mt-2">
          Channel: {agent.currentCall}
        </div>
      )}
    </div>
  );
}
