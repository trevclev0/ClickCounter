export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

export interface CounterUser {
  id: string;
  name: string;
  count: number;
}

export type WebSocketMessage = {
  type: string;
  userId?: string;
  name?: string;
  count?: number;
  users?: CounterUser[];
};