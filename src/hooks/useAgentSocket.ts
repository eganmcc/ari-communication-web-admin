import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Agent, StatusChangeEvent, CallEvent, CallEndEvent } from '../types/agent';

interface UseAgentSocketReturn {
  agents: Map<string, Agent>;
  isConnected: boolean;
  lastUpdate: Date | null;
  notifications: Notification[];
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

const SERVER_URL = 'http://10.0.3.230:3100';

export function useAgentSocket(): UseAgentSocketReturn {
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const highlightTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date(),
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  useEffect(() => {
    console.log('🔌 Connecting to server:', SERVER_URL);
    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    
    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      addNotification('Connected to server', 'success');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      setIsConnected(false);
      addNotification('Disconnected from server', 'error');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      addNotification('Connection error', 'error');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      addNotification('Reconnected to server', 'success');
    });

    // Agent events
    socket.on('agents:initial', (agentsList: Agent[]) => {
      console.log('📋 Received initial agents:', agentsList);
      const agentsMap = new Map<string, Agent>();
      agentsList.forEach(agent => agentsMap.set(agent.extension, agent));
      setAgents(agentsMap);
      setLastUpdate(new Date());
    });

    socket.on('agent:registered', (agent: Agent) => {
      console.log('➕ Agent registered:', agent);
      setAgents(prev => new Map(prev).set(agent.extension, agent));
      setLastUpdate(new Date());
      addNotification(`${agent.name} logged in`, 'success');
    });

    socket.on('agent:status-changed', (data: StatusChangeEvent) => {
      console.log('🔄 Agent status changed:', data);
      setAgents(prev => {
        const newMap = new Map(prev);
        const agent = newMap.get(data.extension);
        if (agent) {
          agent.status = data.newStatus;
          agent.lastStatusChange = data.timestamp;
          newMap.set(data.extension, { ...agent });
        }
        return newMap;
      });
      setLastUpdate(new Date());
    });

    socket.on('agent:call-started', (data: CallEvent) => {
      console.log('📞 Call started:', data);
      setAgents(prev => {
        const newMap = new Map(prev);
        const agent = newMap.get(data.extension);
        if (agent) {
          agent.status = 'busy';
          agent.currentCall = data.channelId;
          agent.lastStatusChange = data.timestamp;
          newMap.set(data.extension, { ...agent });
        }
        return newMap;
      });
      setLastUpdate(new Date());
    });

    socket.on('agent:call-ended', (data: CallEndEvent) => {
      console.log('✅ Call ended:', data);
      setAgents(prev => {
        const newMap = new Map(prev);
        const agent = newMap.get(data.extension);
        if (agent) {
          agent.status = 'available';
          agent.currentCall = '';
          agent.totalCalls = data.totalCalls;
          agent.lastStatusChange = data.timestamp;
          newMap.set(data.extension, { ...agent });
        }
        return newMap;
      });
      setLastUpdate(new Date());
      
      // Trigger animation for call increment
      const element = document.querySelector(`[data-extension="${data.extension}"]`);
      if (element) {
        element.classList.add('animate-bounce-in');
        setTimeout(() => {
          element.classList.remove('animate-bounce-in');
        }, 500);
      }
    });

    return () => {
      console.log('🔌 Disconnecting socket');
      socket.disconnect();
      highlightTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return {
    agents,
    isConnected,
    lastUpdate,
    notifications,
  };
}
