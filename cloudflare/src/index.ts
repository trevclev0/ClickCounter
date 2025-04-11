import { CounterUser, WebSocketMessage } from './types';

// Utility function to generate a random ID
function generateId(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Request handler for CloudFlare Worker
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle WebSocket upgrade
    if (url.pathname === '/ws') {
      // Check if this is a WebSocket request
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      // Get the counter room Durable Object - we use a fixed ID since we only need one room
      const id = env.COUNTER_ROOM.idFromName('default-room');
      const room = env.COUNTER_ROOM.get(id);

      return room.fetch(request);
    }
    
    // Return 404 for non-WebSocket requests
    return new Response('Not found', { status: 404 });
  },
};

// Define the Durable Object class
export class CounterRoom implements DurableObject {
  private storage: DurableObjectStorage;
  private sessions: Map<string, WebSocket>;
  private users: Map<string, CounterUser>;

  constructor(state: DurableObjectState, env: any) {
    this.storage = state.storage;
    this.sessions = new Map();
    this.users = new Map();
    
    // Load existing users from storage when Durable Object is initialized
    this.initializeStorage();
  }

  private async initializeStorage() {
    // Load existing users from storage
    const storedUsers = await this.storage.get('users') as CounterUser[] || [];
    
    // Populate the users map
    for (const user of storedUsers) {
      this.users.set(user.id, user);
    }
  }

  // Save users to persistent storage
  private async saveUsers() {
    await this.storage.put('users', Array.from(this.users.values()));
  }

  // Handler for the WebSocket connection
  async fetch(request: Request): Promise<Response> {
    // Accept the WebSocket connection
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Set up the WebSocket connection
    await this.handleSession(server);

    // Return the client end of the WebSocket
    return new Response(null, { 
      status: 101, 
      webSocket: client 
    });
  }

  // Handle a WebSocket session
  async handleSession(webSocket: WebSocket) {
    // Generate a unique ID for this WebSocket connection
    const userId = generateId(8);
    
    // Add this WebSocket to our sessions map
    this.sessions.set(userId, webSocket);

    // Create a new user with initial data
    const userName = `User ${userId.substring(0, 4)}`;
    const user: CounterUser = {
      id: userId,
      name: userName,
      count: 0
    };

    // Store the new user
    this.users.set(userId, user);
    await this.saveUsers();

    // Set up event handlers for the WebSocket
    webSocket.accept();

    // Send initial messages to the new client
    const userJoinedMessage: WebSocketMessage = {
      type: 'user_joined',
      userId,
      name: userName
    };
    
    const userListMessage: WebSocketMessage = {
      type: 'user_list',
      users: Array.from(this.users.values())
    };
    
    const counterUpdateMessage: WebSocketMessage = {
      type: 'counter_update',
      userId,
      count: 0
    };

    // Send the messages to the client
    webSocket.send(JSON.stringify(userJoinedMessage));
    webSocket.send(JSON.stringify(userListMessage));
    webSocket.send(JSON.stringify(counterUpdateMessage));

    // Broadcast user join to other clients
    this.broadcast(userId, userJoinedMessage);
    this.broadcast(userId, userListMessage);

    // Set up event handlers for the WebSocket
    webSocket.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string) as WebSocketMessage;
        
        // Handle different message types
        switch (message.type) {
          case 'increment_counter': {
            // Update user's counter
            const user = this.users.get(userId);
            if (user) {
              user.count += 1;
              this.users.set(userId, user);
              await this.saveUsers();
              
              // Create update messages
              const userListMessage: WebSocketMessage = {
                type: 'user_list',
                users: Array.from(this.users.values())
              };
              
              const counterUpdateMessage: WebSocketMessage = {
                type: 'counter_update',
                userId,
                count: user.count
              };
              
              // Send direct confirmation to the client
              webSocket.send(JSON.stringify(counterUpdateMessage));
              
              // Broadcast to all clients
              this.broadcast(null, userListMessage);
              this.broadcast(userId, counterUpdateMessage);
            }
            break;
          }
          
          case 'change_name': {
            // Update user's display name
            if (message.name) {
              const user = this.users.get(userId);
              if (user) {
                user.name = message.name;
                this.users.set(userId, user);
                await this.saveUsers();
                
                // Create update messages
                const userListMessage: WebSocketMessage = {
                  type: 'user_list',
                  users: Array.from(this.users.values())
                };
                
                const nameChangeMessage: WebSocketMessage = {
                  type: 'name_change',
                  userId,
                  name: message.name
                };
                
                // Send direct confirmation to the client
                webSocket.send(JSON.stringify(nameChangeMessage));
                
                // Broadcast to all clients
                this.broadcast(null, userListMessage);
                this.broadcast(userId, nameChangeMessage);
              }
            }
            break;
          }
          
          case 'ping': {
            // Respond with pong
            const pongMessage: WebSocketMessage = {
              type: 'pong'
            };
            webSocket.send(JSON.stringify(pongMessage));
            break;
          }
          
          default:
            // Ignore unrecognized message types
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    // Handle WebSocket closure
    webSocket.addEventListener('close', async () => {
      // Remove the session and user
      this.sessions.delete(userId);
      this.users.delete(userId);
      await this.saveUsers();
      
      // Broadcast updated user list
      const userListMessage: WebSocketMessage = {
        type: 'user_list',
        users: Array.from(this.users.values())
      };
      
      this.broadcast(null, userListMessage);
    });

    // Handle WebSocket errors
    webSocket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.sessions.delete(userId);
    });
  }

  // Broadcast a message to all clients except the sender (if specified)
  broadcast(senderId: string | null, message: WebSocketMessage) {
    const messageString = JSON.stringify(message);
    
    for (const [userId, socket] of this.sessions.entries()) {
      if (!senderId || userId !== senderId) {
        try {
          socket.send(messageString);
        } catch (error) {
          console.error(`Error sending message to ${userId}:`, error);
        }
      }
    }
  }
}