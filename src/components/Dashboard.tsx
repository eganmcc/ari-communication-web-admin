import { useMemo, useState } from 'react';
import { useAgentSocket } from '../hooks/useAgentSocket';
import { Header } from './Header';
import { SummaryStats } from './SummaryStats';
import { AgentGrid } from './AgentGrid';
import { QueuePlaceholder } from './QueuePlaceholder';
import { NotificationContainer } from './Notification';
import { AgentStats } from '../types/agent';

export function Dashboard() {
  const { agents, isConnected, lastUpdate, notifications } = useAgentSocket();
  const [closedNotifications, setClosedNotifications] = useState<Set<string>>(new Set());

  const stats: AgentStats = useMemo(() => {
    let available = 0;
    let busy = 0;
    let onBreak = 0;
    let offline = 0;
    let totalCalls = 0;

    agents.forEach(agent => {
      totalCalls += agent.totalCalls || 0;
      switch (agent.status) {
        case 'available':
          available++;
          break;
        case 'busy':
          busy++;
          break;
        case 'break_short':
        case 'break_long':
          onBreak++;
          break;
        case 'offline':
          offline++;
          break;
      }
    });

    return {
      total: agents.size,
      available,
      busy,
      onBreak,
      offline,
      totalCalls,
    };
  }, [agents]);

  const visibleNotifications = notifications.filter(n => !closedNotifications.has(n.id));

  const handleCloseNotification = (id: string) => {
    setClosedNotifications(prev => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isConnected={isConnected} lastUpdate={lastUpdate} />
      <SummaryStats stats={stats} />
      <AgentGrid agents={agents} />
      <QueuePlaceholder />
      <NotificationContainer 
        notifications={visibleNotifications} 
        onClose={handleCloseNotification}
      />
    </div>
  );
}
