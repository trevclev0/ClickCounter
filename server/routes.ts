import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { messageSchema, WebSocketMessage } from "@shared/schema";
import { nanoid } from "nanoid";
import { log } from "./vite";

interface ExtendedWebSocket extends WebSocket {
  userId: string;
  isAlive: boolean;
  lastPing?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize WebSocket server on a different path than Vite HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Set up connection handling
  wss.on('connection', async (ws: ExtendedWebSocket) => {
    // Generate a unique ID for this connection
    ws.userId = nanoid(8);
    ws.isAlive = true;

    // Create a new user in storage
    const userName = `User ${ws.userId.substring(0, 4)}`;
    await storage.createCounterUser({
      id: ws.userId,
      name: userName,
      count: 0
    });

    log(`WebSocket client connected: ${ws.userId}`);

    // Send initial user data to the new client
    const userList = await storage.getCounterUsers();
    const userJoinedMessage: WebSocketMessage = {
      type: 'user_joined',
      payload: {
        id: ws.userId,
        name: userName
      }
    };

    const userListMessage: WebSocketMessage = {
      type: 'user_list',
      payload: userList
    };

    // Send the user's ID first
    ws.send(JSON.stringify(userJoinedMessage));
    // Then send the full user list
    ws.send(JSON.stringify(userListMessage));

    // Broadcast to all other clients that a new user has joined
    broadcastMessage(wss, ws, userJoinedMessage);

    // Handle messages from client
    ws.on('message', async (message: string) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        const validatedMessage = messageSchema.parse(parsedMessage);

        switch (validatedMessage.type) {
          case 'increment': {
            // Update user's counter in storage
            const currentCount = (await storage.getCounterUser(ws.userId))?.count || 0;
            const newCount = currentCount + 1;
            await storage.updateCounterUserCount(ws.userId, newCount);

            // Broadcast updated user list to all clients
            const updatedUserList = await storage.getCounterUsers();
            const updateMessage: WebSocketMessage = {
              type: 'user_list',
              payload: updatedUserList
            };
            broadcastMessage(wss, null, updateMessage);
            break;
          }
          case 'ping': {
            // Record ping timestamp and respond with pong
            ws.lastPing = Date.now();
            const pongMessage: WebSocketMessage = {
              type: 'pong',
              payload: { timestamp: ws.lastPing }
            };
            ws.send(JSON.stringify(pongMessage));
            break;
          }
          default:
            // Ignore other message types
            break;
        }
      } catch (err) {
        console.error('Invalid message received:', err);
      }
    });

    // Handle disconnection
    ws.on('close', async () => {
      log(`WebSocket client disconnected: ${ws.userId}`);

      // Remove user from storage when they disconnect
      const userList = await storage.getCounterUsers();
      const updatedUserList = userList.filter(user => user.id !== ws.userId);
      
      // Broadcast the updated user list
      const updateMessage: WebSocketMessage = {
        type: 'user_list',
        payload: updatedUserList
      };
      broadcastMessage(wss, null, updateMessage);
    });

    // Handle pings for connection health checks
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Set up a heartbeat interval to check for dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return httpServer;
}

// Helper function to broadcast messages to all clients except the sender
function broadcastMessage(
  wss: WebSocketServer,
  sender: ExtendedWebSocket | null,
  message: WebSocketMessage
): void {
  const messageString = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && (!sender || client !== sender)) {
      client.send(messageString);
    }
  });
}
