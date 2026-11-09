import { EventEmitter } from 'events';

export const liveEventBus = new EventEmitter();
liveEventBus.setMaxListeners(200);

export type LiveEventType = 
  | 'sync' 
  | 'agent_connected' 
  | 'agent_disconnected' 
  | 'agent_activity' 
  | 'observation_created';

export interface LiveEventPayload {
  [key: string]: unknown;
}

export function broadcastLiveEvent(type: LiveEventType, data: LiveEventPayload = {}): void {
  liveEventBus.emit('event', {
    type,
    data,
    timestamp: new Date().toISOString(),
  });
}

