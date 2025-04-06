import { useState, useEffect, useRef, useCallback } from 'react';
import { CounterUser } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

interface WebSocketInfo {
  status: WebSocketStatus;
  server: string;
  latency: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  userId: string | null;
  userCount: number;
  connectedUsers: CounterUser[];
  websocketInfo: WebSocketInfo;
  incrementCounter: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState<CounterUser[]>([]);
  const [websocketInfo, setWebsocketInfo] = useState<WebSocketInfo>({
    status: 'connecting',
    server: '',
    latency: 0
  });
  
  const socketRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const pingTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    setWebsocketInfo(prev => ({
      ...prev,
      status: 'connecting',
      server: wsUrl
    }));
    
    socket.onopen = () => {
      setIsConnected(true);
      setWebsocketInfo(prev => ({
        ...prev,
        status: 'connected'
      }));
      
      // Start ping interval when connected
      startPingInterval();
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'user_joined':
            setUserId(message.payload.id);
            break;
            
          case 'user_list':
            setConnectedUsers(message.payload);
            
            // Update current user's count
            const currentUser = message.payload.find((user: CounterUser) => user.id === userId);
            if (currentUser) {
              setUserCount(currentUser.count);
            }
            break;
            
          case 'pong':
            // Calculate latency
            const latency = Date.now() - pingTimeRef.current;
            setWebsocketInfo(prev => ({
              ...prev,
              latency
            }));
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      setIsConnected(false);
      setWebsocketInfo(prev => ({
        ...prev,
        status: 'disconnected'
      }));
      
      // Show toast notification for disconnection
      toast({
        title: 'Disconnected',
        description: 'Lost connection to the server. Trying to reconnect...',
        variant: 'destructive'
      });
      
      // Clear ping interval
      if (pingTimerRef.current) {
        window.clearInterval(pingTimerRef.current);
      }
      
      // Try to reconnect after a delay
      setTimeout(() => {
        // Component might be unmounted, check before reconnecting
        if (socketRef.current?.readyState === WebSocket.CLOSED) {
          window.location.reload();
        }
      }, 3000);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection Error',
        description: 'Error connecting to the server',
        variant: 'destructive'
      });
    };
    
    return () => {
      // Clean up
      if (pingTimerRef.current) {
        window.clearInterval(pingTimerRef.current);
      }
      
      if (socket) {
        socket.close();
      }
    };
  }, [toast]);
  
  // Start ping interval to measure latency
  const startPingInterval = useCallback(() => {
    // Clear any existing interval
    if (pingTimerRef.current) {
      window.clearInterval(pingTimerRef.current);
    }
    
    // Set up new interval (every 5 seconds)
    const interval = window.setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        pingTimeRef.current = Date.now();
        socketRef.current.send(JSON.stringify({
          type: 'ping',
          payload: { timestamp: pingTimeRef.current }
        }));
      }
    }, 5000);
    
    pingTimerRef.current = interval;
  }, []);
  
  // Handle increment counter
  const incrementCounter = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'increment',
        payload: {}
      }));
    } else {
      toast({
        title: 'Not Connected',
        description: 'Cannot increment counter while disconnected',
        variant: 'destructive'
      });
    }
  }, [toast]);
  
  return {
    isConnected,
    userId,
    userCount,
    connectedUsers,
    websocketInfo,
    incrementCounter
  };
}
