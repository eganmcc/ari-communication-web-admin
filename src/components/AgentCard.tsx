import { Agent } from '../types/agent';
import { useCallTimer } from '../hooks/useCallTimer';
import { useTimeAgo } from '../hooks/useTimeAgo';
import { useStressCountdown } from '../hooks/useStressCountdown';
import { getStatusColor, getStatusLabel } from '../utils/formatters';
import clsx from 'clsx';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const callDuration = useCallTimer(agent.lastStatusChange || '', agent.status);
  const lastActivity = useTimeAgo(agent.lastStatusChange || '');
  const stressCountdown = useStressCountdown(agent.stressEndTime);
  
  // Determine if countdown is in warning zone (under 30 seconds)
  const isCountdownWarning = stressCountdown && stressCountdown.startsWith('00:') && 
    parseInt(stressCountdown.split(':')[1]) <= 30;
  
  // Check if agent is on break
  const isOnBreak = agent.status === 'break_short' || agent.status === 'break_long';

  return (
    <div
      data-extension={agent.extension}
      data-status={agent.status}
      className={clsx(
        'rounded-lg shadow-sm p-3 border-2 transition-all duration-200 hover:shadow-md',
        agent.isStressMode ? 'bg-orange-50 border-orange-400' : isOnBreak ? 'bg-amber-50 border-amber-400' : 'bg-white',
        !agent.isStressMode && !isOnBreak && agent.status === 'available' && 'border-green-200',
        !agent.isStressMode && !isOnBreak && agent.status === 'busy' && 'border-red-200',
        !agent.isStressMode && !isOnBreak && agent.status === 'offline' && 'border-gray-200'
      )}
    >
      {/* Status Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className={clsx('w-2 h-2 rounded-full', getStatusColor(agent.status))} />
        <span className={clsx(
          'font-semibold text-xs uppercase tracking-wide',
          agent.status === 'available' && 'text-green-600',
          agent.status === 'busy' && 'text-red-600',
          isOnBreak && 'text-amber-600',
          agent.status === 'offline' && 'text-gray-600'
        )}>
          {getStatusLabel(agent.status)}
        </span>
      </div>

      {/* Break Status Indicator */}
      {isOnBreak && (
        <div className="mb-2 p-2 bg-amber-100 rounded border border-amber-300">
          <div className="text-xs font-bold text-amber-700">
            {agent.status === 'break_short' ? '☕ SHORT BREAK' : '🍽️ LUNCH BREAK'}
          </div>
        </div>
      )}

      {/* Stress Mode Indicator */}
      {agent.isStressMode && stressCountdown && (
        <div className="mb-2 p-2 bg-orange-100 rounded border border-orange-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-700">🎪 STRESS TEST</span>
            <span className={clsx(
              'text-sm font-mono font-bold',
              isCountdownWarning ? 'text-red-600 animate-pulse' : 'text-orange-700'
            )}>
              {stressCountdown}
            </span>
          </div>
        </div>
      )}

      {/* Agent Photo */}
      <div className="flex justify-center mb-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow">
          {agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      </div>

      {/* Agent Name & Extension */}
      <div className="text-center mb-2">
        <div className="text-sm font-bold text-gray-900 truncate">{agent.name}</div>
        <div className="text-xs text-gray-500">Ext. {agent.extension}</div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-2"></div>

      {/* Stats */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Calls Today</span>
          <span className="font-bold text-blue-600">{agent.totalCalls}</span>
        </div>
        
        {agent.status === 'busy' && callDuration && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Call Time</span>
            <span className="font-bold text-red-600 font-mono">{callDuration}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Last Active</span>
          <span className="font-medium text-gray-700">{lastActivity}</span>
        </div>
      </div>

      {/* Current Call Info */}
      {agent.currentCall && (
        <div className="text-xs text-gray-400 border-t pt-1.5 mt-1.5 truncate">
          {agent.currentCall}
        </div>
      )}
    </div>
  );
}
