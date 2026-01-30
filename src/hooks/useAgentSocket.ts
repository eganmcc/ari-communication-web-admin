import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Agent, StatusChangeEvent, CallEvent, CallEndEvent } from '../types/agent';

interface UseAgentSocketReturn {
  agents: Map<string, Agent>;
  isConnected: boolean;
  lastUpdate: Date | null;
  notifications: Notification[];
  bridgeVersion: string;
  apiVersion: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://10.0.3.230:3100';
const API_URL = import.meta.env.PROD ? 'https://livewire.ptdika.local' : 'http://10.0.3.230:3001';

export function useAgentSocket(): UseAgentSocketReturn {
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bridgeVersion, setBridgeVersion] = useState<string>('...');
  const [apiVersion, setApiVersion] = useState<string>('...');
  const socketRef = useRef<Socket | null>(null);
  const apiSocketRef = useRef<Socket | null>(null);
  const highlightTimers = useRef<Map<string, number>>(new Map());
  const isInitialLoadComplete = useRef(false);
  const pendingStatusEvents = useRef<StatusChangeEvent[]>([]);

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
    // Use /ari-socket.io/ path for production server, /socket.io/ for localhost
    const isLocalBackend = SERVER_URL.includes('localhost') || SERVER_URL.includes('127.0.0.1');
    const socket = io(SERVER_URL, {
      path: isLocalBackend ? '/socket.io/' : '/ari-socket.io/',
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

    // Bridge info event
    socket.on('bridge:info', (data: { version: string }) => {
      console.log('📦 Bridge info:', data);
      setBridgeVersion(data.version);
    });

    // Agent events
    socket.on('agents:initial', (agentsList: Agent[]) => {
      console.log('📋 Received initial agents:', agentsList);
      console.log('📋 First agent data:', JSON.stringify(agentsList[0], null, 2));
      const agentsMap = new Map<string, Agent>();
      agentsList.forEach(agent => {
        console.log(`Agent ${agent.extension} lastStatusChange:`, agent.lastStatusChange, 'type:', typeof agent.lastStatusChange);
        // Use current time if lastStatusChange is missing or invalid
        const agentWithTimestamp = {
          ...agent,
          lastStatusChange: agent.lastStatusChange || new Date().toISOString(),
        };
        agentsMap.set(agent.extension, agentWithTimestamp);
      });
      setAgents(agentsMap);
      setLastUpdate(new Date());
      
      // Mark initial load complete and replay any queued status events
      isInitialLoadComplete.current = true;
      if (pendingStatusEvents.current.length > 0) {
        console.log(`🔄 Replaying ${pendingStatusEvents.current.length} queued status events`);
        pendingStatusEvents.current.forEach(event => {
          // Apply each queued event
          setAgents(prev => {
            const newMap = new Map(prev);
            const agent = newMap.get(event.extension);
            if (agent) {
              const updatedAgent = {
                ...agent,
                status: event.newStatus,
                lastStatusChange: event.timestamp || new Date().toISOString(),
              };
              
              if (event.newStatus === 'break_short' || event.newStatus === 'break_long') {
                updatedAgent.breakType = event.breakType;
                updatedAgent.breakEndTime = event.breakEndTime;
                updatedAgent.breakDuration = event.breakDuration;
              } else {
                updatedAgent.breakType = undefined;
                updatedAgent.breakEndTime = undefined;
                updatedAgent.breakDuration = undefined;
              }
              
              newMap.set(event.extension, updatedAgent);
            }
            return newMap;
          });
        });
        pendingStatusEvents.current = [];
      }
    });

    socket.on('agent:registered', (agent: Agent) => {
      console.log('➕ Agent registered:', agent);
      // Ensure lastStatusChange has a valid timestamp
      const agentWithTimestamp = {
        ...agent,
        lastStatusChange: agent.lastStatusChange || new Date().toISOString(),
      };
      setAgents(prev => {
        const newMap = new Map(prev);
        newMap.set(agent.extension, agentWithTimestamp);
        return newMap;
      });
      setLastUpdate(new Date());
      addNotification(`${agent.name} logged in`, 'success');
    });

    socket.on('agent:status-changed', (data: StatusChangeEvent) => {
      console.log('🔄 Agent status changed:', data);
      
      // Log break status with metadata
      if (data.newStatus === 'break_short' || data.newStatus === 'break_long') {
        console.log(`🟡 Agent ${data.extension} on ${data.breakType} break until ${data.breakEndTime}`);
      }
      
      // Queue events until initial load completes to avoid race condition
      if (!isInitialLoadComplete.current) {
        console.log(`⏳ Queuing status change for ${data.extension} (initial load not complete)`);
        pendingStatusEvents.current.push(data);
        return;
      }
      
      setAgents(prev => {
        const newMap = new Map(prev);
        const agent = newMap.get(data.extension);
        if (agent) {
          const updatedAgent = {
            ...agent,
            status: data.newStatus,
            lastStatusChange: data.timestamp || new Date().toISOString(),
          };
          
          // Add break metadata if present
          if (data.newStatus === 'break_short' || data.newStatus === 'break_long') {
            updatedAgent.breakType = data.breakType;
            updatedAgent.breakEndTime = data.breakEndTime;
            updatedAgent.breakDuration = data.breakDuration;
          } else {
            // Clear break metadata when not on break
            updatedAgent.breakType = undefined;
            updatedAgent.breakEndTime = undefined;
            updatedAgent.breakDuration = undefined;
          }
          
          newMap.set(data.extension, updatedAgent);
        } else {
          console.warn(`⚠️ Status change for unknown agent ${data.extension} - agent not in map yet`);
        }
        return newMap;
      });
      setLastUpdate(new Date());
    });

    socket.on('agent:call-started', (data: CallEvent) => {
      console.log('📞 Call started:', data);
      console.log('📞 Call started timestamp:', data.timestamp, 'type:', typeof data.timestamp);
      
      // Log stress mode if present
      if (data.isStressMode) {
        console.log('🎪 STRESS TEST MODE detected - Duration:', data.stressDuration, 'seconds');
      }
      
      const callStartTime = data.timestamp || new Date().toISOString();
      setAgents(prev => {
        const newMap = new Map(prev);
        const agent = newMap.get(data.extension);
        if (agent) {
          const updatedAgent = {
            ...agent,
            status: 'busy' as const,
            currentCall: data.channelId,
            lastStatusChange: callStartTime,
            isStressMode: data.isStressMode || false,
            stressEndTime: data.isStressMode && data.stressDuration
              ? new Date(new Date(callStartTime).getTime() + (data.stressDuration * 1000)).toISOString()
              : undefined,
          };
          console.log('📞 Updated agent with call start time:', callStartTime);
          if (data.isStressMode) {
            console.log('🎪 Stress end time set to:', updatedAgent.stressEndTime);
          }
          newMap.set(data.extension, updatedAgent);
        }
        return newMap;
      });
      setLastUpdate(new Date());
    });
    socket.on('agent:call-ended', (data: CallEndEvent) => {
      console.log('✅ Call ended:', data);
      console.log('✅ Call ended keys:', Object.keys(data));
      setAgents(prev => {
        const newMap = new Map(prev);
        const agent = newMap.get(data.extension);
        if (agent) {
          // Log if it was a stress test
          if (agent.isStressMode) {
            console.log('🎪 Stress test call ended - Duration:', data.duration, 'seconds');
          }
          
          // Increment totalCalls ourselves since server doesn't send it
          const newTotalCalls = (data.totalCalls !== undefined) ? data.totalCalls : (agent.totalCalls + 1);
          
          // Determine status after call ends:
          // - If agent was on break before call, keep break status AND break metadata
          // - Otherwise, return to available
          const wasOnBreak = agent.breakType !== undefined;
          const newStatus = wasOnBreak ? agent.status : 'available';
          
          const updatedAgent: Agent = {
            ...agent,
            status: newStatus,
            currentCall: '',
            totalCalls: newTotalCalls,
            lastStatusChange: wasOnBreak ? agent.lastStatusChange : (data.timestamp || new Date().toISOString()),
            isStressMode: false,
            stressEndTime: undefined,
          };
          
          // Preserve break metadata if agent is on break
          if (!wasOnBreak) {
            updatedAgent.breakType = undefined;
            updatedAgent.breakEndTime = undefined;
            updatedAgent.breakDuration = undefined;
          }
          
          newMap.set(data.extension, updatedAgent);
          console.log('✅ Updated agent totalCalls:', agent.totalCalls, '→', newTotalCalls);
          if (wasOnBreak) {
            console.log('☕ Preserved break status:', newStatus, 'breakType:', agent.breakType);
          }
        }
        return newMap;
      });
      setLastUpdate(new Date());
      
      // Trigger animation for call increment
      setTimeout(() => {
        const element = document.querySelector(`[data-extension="${data.extension}"] .text-blue-600`);
        if (element) {
          element.classList.add('animate-bounce-in');
          setTimeout(() => {
            element.classList.remove('animate-bounce-in');
          }, 500);
        }
      }, 50);
    });

    socket.on('agent:unregistered', (data: { extension: string }) => {
      console.log('➖ Agent unregistered:', data);
      setAgents(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.extension);
        return newMap;
      });
      setLastUpdate(new Date());
      addNotification(`Agent ${data.extension} logged out`, 'info');
    });

    return () => {
      console.log('🔌 Disconnecting socket');
      socket.disconnect();
      highlightTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Voice-API Socket connection
  useEffect(() => {
    const isProduction = import.meta.env.PROD;
    const apiSocket = io(API_URL, {
      path: isProduction ? '/voice-api-socket.io/' : '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    apiSocketRef.current = apiSocket;

    apiSocket.on('connect', () => {
      console.log('✅ Connected to voice-api');
    });

    apiSocket.on('disconnect', () => {
      console.log('❌ Disconnected from voice-api');
    });

    apiSocket.on('api:info', (data: { version: string }) => {
      console.log('📦 Voice-API info:', data);
      setApiVersion(data.version);
    });

    return () => {
      console.log('🔌 Disconnecting voice-api socket');
      apiSocket.disconnect();
    };
  }, []);

  return {
    agents,
    isConnected,
    lastUpdate,
    notifications,
    bridgeVersion,
    apiVersion,
  };
}
