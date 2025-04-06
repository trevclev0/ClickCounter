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
  const userIdRef = useRef<string | null>(null); // Reference to store userId for reliable access
  const { toast } = useToast();
  
  // Function to send a ping message to the server
  const sendPing = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      pingTimeRef.current = Date.now();
      socketRef.current.send(JSON.stringify({
        type: 'ping',
        payload: { timestamp: pingTimeRef.current }
      }));
    }
  }, []);
  
  // Start ping interval to measure latency
  const startPingInterval = useCallback(() => {
    // Clear any existing interval
    if (pingTimerRef.current) {
      window.clearInterval(pingTimerRef.current);
    }
    
    // Set up new interval (every 5 seconds)
    const interval = window.setInterval(sendPing, 5000);
    pingTimerRef.current = interval;
  }, [sendPing]);
  
  // Handle counter increment
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
  
  // Handle WebSocket message processing
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'user_joined':
          // Store the user ID in both state and ref for immediate access
          const newUserId = message.payload.id;
          setUserId(newUserId);
          userIdRef.current = newUserId;
          break;
          
        case 'user_list':
          setConnectedUsers(message.payload);
          
          // Use userIdRef to reliably find the current user even if state hasn't updated
          const currentUserId = userIdRef.current || userId;
          
          if (currentUserId) {
            const currentUser = message.payload.find(
              (user: CounterUser) => user.id === currentUserId
            );
            
            if (currentUser) {
              setUserCount(currentUser.count);
            }
          }
          break;
          
        case 'pong':
          // Calculate latency from ping time
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
  }, [userId]);

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
    
    socket.onmessage = handleMessage;
    
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
  }, [toast, startPingInterval, handleMessage]);
  
  return {
    isConnected,
    userId,
    userCount,
    connectedUsers,
    websocketInfo,
    incrementCounter
  };
}
