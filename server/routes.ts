import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { messageSchema, WebSocketMessage, CounterUser } from "@shared/schema";
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
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Set up connection handling
  wss.on("connection", async (ws: ExtendedWebSocket) => {
    ws.isAlive = true;

    // Initial message handler to set up user ID
    ws.once("message", async (message: string) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        const validatedMessage = messageSchema.parse(parsedMessage);

        if (
          validatedMessage.type === "user_joined" &&
          validatedMessage.userId
        ) {
          ws.userId = validatedMessage.userId;

          // Create user if they don't exist
          const existingUser = await storage.getCounterUser(ws.userId);
          if (!existingUser) {
            console.log("no existingUser, setting count to 0");
            await storage.createCounterUser({
              id: ws.userId,
              name: `User ${ws.userId.substring(0, 4)}`,
              count: 0,
            });
          }
        }
      } finally {
        console.log("once message");
      }
    });

    log(`WebSocket client connected: ${ws.userId}`);

    // Send initial user data to the new client
    const userList = await storage.getCounterUsers();
    const userJoinedMessage: WebSocketMessage = {
      type: "user_joined",
      userId: ws.userId,
      name: ws.userId,
    };

    const userListMessage: WebSocketMessage = {
      type: "user_list",
      users: userList,
    };

    // Send the user's ID first to the new user
    ws.send(JSON.stringify(userJoinedMessage));

    // Then send the full user list to the new user
    ws.send(JSON.stringify(userListMessage));

    // Broadcast to all other clients that a new user has joined
    broadcastMessage(wss, ws, userJoinedMessage);

    // Also broadcast the updated user list to all other clients
    broadcastMessage(wss, ws, userListMessage);

    // Handle messages from client
    ws.on("message", async (message: string) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        const validatedMessage = messageSchema.parse(parsedMessage);

        switch (validatedMessage.type) {
          case "increment_counter": {
            // Update user's counter in storage
            const currentCount =
              (await storage.getCounterUser(ws.userId))?.count || 0;
            const newCount = currentCount + 1;
            await storage.updateCounterUserCount(ws.userId, newCount);

            // Broadcast updated user list to all clients
            const updatedUserList = await storage.getCounterUsers();
            const updateMessage: WebSocketMessage = {
              type: "user_list",
              users: updatedUserList,
            };

            // Also send a counter update message
            const counterUpdateMessage: WebSocketMessage = {
              type: "counter_update",
              userId: ws.userId,
              count: newCount,
            };

            // First send direct confirmation to the current user
            ws.send(JSON.stringify(counterUpdateMessage));

            // Broadcast the user list to all clients
            broadcastMessage(wss, null, updateMessage);

            // Broadcast the counter update to other clients only
            broadcastMessage(wss, ws, counterUpdateMessage);
            break;
          }
          case "ping": {
            // Record ping timestamp and respond with pong
            ws.lastPing = Date.now();
            const pongMessage: WebSocketMessage = {
              type: "pong",
            };
            ws.send(JSON.stringify(pongMessage));
            break;
          }
          case "change_name": {
            // Update user's display name
            const newName = validatedMessage.name;

            // Update user in storage
            const user = await storage.getCounterUser(ws.userId);
            if (user && newName) {
              await storage.updateCounterUserName(ws.userId, newName);

              // Broadcast updated user list to all clients
              const updatedUserList = await storage.getCounterUsers();
              const updateMessage: WebSocketMessage = {
                type: "user_list",
                users: updatedUserList,
              };

              // Also send a name change message
              const nameChangeMessage: WebSocketMessage = {
                type: "name_change",
                userId: ws.userId,
                name: newName,
              };

              // Send immediate confirmation to the current user
              ws.send(JSON.stringify(nameChangeMessage));

              // Broadcast the updated user list to everyone
              broadcastMessage(wss, null, updateMessage);

              // Only broadcast the name change to other clients
              broadcastMessage(wss, ws, nameChangeMessage);
            }
            break;
          }
          default:
            // Ignore other message types
            break;
        }
      } catch (err) {
        console.error("Invalid message received:", err);
      }
    });

    // Handle disconnection
    ws.on("close", async () => {
      log(`WebSocket client disconnected: ${ws.userId}`);

      try {
        // Actually delete the user from storage when they disconnect
        const userList = await storage.getCounterUsers();

        // Remove this user from storage
        await storage.removeCounterUser(ws.userId);

        // Get the updated list (after removal)
        const updatedUserList = await storage.getCounterUsers();

        // Broadcast the updated user list
        const updateMessage: WebSocketMessage = {
          type: "user_list",
          users: updatedUserList,
        };
        broadcastMessage(wss, null, updateMessage);
      } catch (error) {
        console.error("Error handling disconnection:", error);
      }
    });

    // Handle pings for connection health checks
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  // Set up a heartbeat interval to check for dead connections
  const interval = setInterval(() => {
    // Type-safe way to iterate through clients
    wss.clients.forEach(function (client: WebSocket) {
      // Cast the generic WebSocket to our ExtendedWebSocket type
      const ws = client as ExtendedWebSocket;

      if (ws.isAlive === false) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return httpServer;
}

// Helper function to broadcast messages to all clients except the sender
function broadcastMessage(
  wss: WebSocketServer,
  sender: ExtendedWebSocket | null,
  message: WebSocketMessage,
): void {
  const messageString = JSON.stringify(message);

  wss.clients.forEach(function (client: WebSocket) {
    if (
      client.readyState === WebSocket.OPEN &&
      (!sender || client !== sender)
    ) {
      client.send(messageString);
    }
  });
}
