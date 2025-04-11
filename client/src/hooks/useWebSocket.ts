import { useState, useEffect, useRef, useCallback } from "react";
import type { WebSocketMessage, CounterUser } from "@shared/schema";

type WebSocketStatus = "connecting" | "connected" | "disconnected";

export interface WebSocketInfo {
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
  toggleConnection: () => void;
  updateDisplayName: (newName: string) => void;
  connectToServer: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState<CounterUser[]>([]);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [websocketInfo, setWebsocketInfo] = useState<WebSocketInfo>({
    status: "disconnected",
    server: "",
    latency: 0,
  });

  // Local storage keys
  const USER_ID_KEY = 'websocket_user_id';
  const USER_NAME_KEY = 'websocket_user_name';

  // Use refs to keep track of values inside event listeners
  const socketRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef<string | null>(localStorage.getItem(USER_ID_KEY));
  const autoReconnectRef = useRef(autoReconnect);
  const lastPingTime = useRef<number | null>(null);

  // Initialize userId from local storage if available
  useEffect(() => {
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    if (storedUserId && !userId) {
      setUserId(storedUserId);
    }
  }, []);

  // Update ref and local storage when state changes
  useEffect(() => {
    console.log("updating the userIdRef");
    userIdRef.current = userId;
    autoReconnectRef.current = autoReconnect;
    
    if (userId) {
      localStorage.setItem(USER_ID_KEY, userId);
    }
  }, [userId, autoReconnect]);

  const connectToServer = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Set status to connecting
    setWebsocketInfo((prev) => ({ ...prev, status: "connecting" }));

    // Get WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    // Create new WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
      setWebsocketInfo((prev) => ({
        ...prev,
        status: "connected",
        server: wsUrl,
      }));

      // Delay ping to ensure connection is stable
      setTimeout(() => {
        sendPing();
      }, 500);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setWebsocketInfo((prev) => ({
        ...prev,
        status: "disconnected",
        server: "",
        latency: 0,
      }));

      // Auto reconnect if enabled
      if (autoReconnectRef.current) {
        setTimeout(() => {
          connectToServer();
        }, 2000);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      socket.close();
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case "user_joined":
            console.log({ userId, userIdRef });
            // Store the user ID when we join
            if (!userIdRef?.current && message.userId) {
              setUserId(message.userId);
              userIdRef.current = message.userId;
              console.log("Updating user id to", message.userId);

              // Initial default counter value
              setUserCount(0);
            }
            break;

          case "user_list":
            if (message.users) {
              setConnectedUsers(message.users);

              // Update our own counter if we're in the list
              if (userIdRef.current) {
                const currentUser = message.users.find(
                  (user) => user.id === userIdRef.current,
                );
                if (currentUser) {
                  setUserCount(currentUser.count);
                }
              }
            }
            break;

          case "counter_update":
            if (message.userId && message.count !== undefined) {
              // Update the user's counter in the connected users list
              setConnectedUsers((prevUsers) => {
                return prevUsers.map((user) => {
                  if (user.id === message.userId) {
                    return { ...user, count: message.count || 0 };
                  }
                  return user;
                });
              });

              // If it's our counter, update the userCount state
              if (message.userId === userIdRef.current) {
                setUserCount(message.count);
              }
            }
            break;

          case "name_change":
            if (message.userId && message.name) {
              console.log(
                "Name change for user:",
                message.userId,
                "to",
                message.name,
              );

              // Update the user's name in the connected users list
              setConnectedUsers((prevUsers) => {
                return prevUsers.map((user) => {
                  if (user.id === message.userId) {
                    return { ...user, name: message.name || user.name };
                  }
                  return user;
                });
              });

              // Log the operation
              console.log(
                "Current user ID:",
                userIdRef.current,
                "Changed user ID:",
                message.userId,
              );
            }
            break;

          case "pong":
            if (lastPingTime.current) {
              const latency = Date.now() - lastPingTime.current;
              setWebsocketInfo((prev) => ({ ...prev, latency }));
            }
            break;

          default:
            console.log("Unknown message type:", message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }, []);

  useEffect(() => {
    // Connect to WebSocket server when the component mounts
    connectToServer();

    // Clean up when the component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connectToServer]);

  // Setup ping interval to measure latency
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (isConnected) {
        sendPing();
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(pingInterval);
    };
  }, [isConnected]);

  // Function to send a ping message
  const sendPing = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      lastPingTime.current = Date.now();
      const pingMessage: WebSocketMessage = {
        type: "ping",
      };
      socketRef.current.send(JSON.stringify(pingMessage));
    }
  };

  // Function to increment the counter
  const incrementCounter = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const incrementMessage: WebSocketMessage = {
          type: "increment_counter",
        };
        socketRef.current.send(JSON.stringify(incrementMessage));
        console.log("Sent increment counter message");
      } catch (error) {
        console.error("Error sending increment message:", error);
      }
    } else {
      console.warn("Cannot increment counter: WebSocket not open");
    }
  }, []);

  // Function to update display name
  const updateDisplayName = useCallback((newName: string) => {
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      userIdRef.current
    ) {
      try {
        const nameChangeMessage: WebSocketMessage = {
          type: "change_name",
          name: newName,
        };
        socketRef.current.send(JSON.stringify(nameChangeMessage));
        localStorage.setItem(USER_NAME_KEY, newName);
        console.log(
          "Sent name change message for user:",
          userIdRef.current,
          "new name:",
          newName,
        );
      } catch (error) {
        console.error("Error sending name change message:", error);
      }
    } else {
      console.warn("Cannot update name: WebSocket not open or user ID not set");
    }
  }, []);

  // Toggle connection status
  const toggleConnection = useCallback(() => {
    if (isConnected) {
      // Disconnect
      if (socketRef.current) {
        setAutoReconnect(false); // Disable auto reconnect
        socketRef.current.close();
        socketRef.current = null;
      }
    } else {
      // Connect
      setAutoReconnect(true);
      connectToServer();
    }
  }, [isConnected, connectToServer]);

  return {
    isConnected,
    userId,
    userCount,
    connectedUsers,
    websocketInfo,
    incrementCounter,
    toggleConnection,
    updateDisplayName,
    connectToServer,
  };
}
