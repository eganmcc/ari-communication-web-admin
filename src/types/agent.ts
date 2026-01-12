export type AgentStatus = 'available' | 'busy' | 'break_short' | 'break_long' | 'offline';

export interface Agent {
  extension: string;
  name: string;
  status: AgentStatus;
  currentCall: string;
  totalCalls: number;
  registeredAt: string;
  lastStatusChange: string;
  isStressMode?: boolean;
  stressEndTime?: string;
  breakType?: 'short' | 'long';
  breakEndTime?: string;
  breakDuration?: number;
}

export interface StatusChangeEvent {
  extension: string;
  oldStatus: AgentStatus;
  newStatus: AgentStatus;
  timestamp: string;
  breakType?: 'short' | 'long';
  breakEndTime?: string;
  breakDuration?: number;
}

export interface CallEvent {
  extension: string;
  channelId: string;
  timestamp: string;
  isStressMode?: boolean;
  stressDuration?: number;
  callType?: string;
}

export interface CallEndEvent {
  extension: string;
  channelId: string;
  totalCalls: number;
  duration: number;
  timestamp: string;
}

export interface AgentStats {
  total: number;
  available: number;
  busy: number;
  onBreak: number;
  offline: number;
  totalCalls: number;
}
