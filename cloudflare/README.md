# Counter WebSocket Server for CloudFlare Workers

This project implements a real-time counter application using CloudFlare Workers and Durable Objects to handle WebSocket connections and persistent state.

## Features

- Real-time counters updated across all clients
- Name changing functionality for users
- Connection/disconnection handling
- Persistent storage of user data in Durable Objects

## Requirements

- CloudFlare account with Workers and Durable Objects access
- Node.js and npm/yarn installed

## Deployment Instructions

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with CloudFlare:
   ```bash
   wrangler login
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Deploy to CloudFlare:
   ```bash
   npm run deploy
   ```

## Local Development

1. Start local development server:
   ```bash
   npm run dev
   ```

2. Access your Worker at the URL shown in the console (usually http://localhost:8787)

## Client Integration

Update your client's WebSocket connection to point to your deployed Worker URL:

```javascript
// Example client-side connection code
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${CLOUDFLARE_WORKER_URL}/ws`;
const socket = new WebSocket(wsUrl);
```

## WebSocket Protocol

The WebSocket server accepts and sends the following message types:

- `user_joined`: When a new user connects
- `user_list`: List of all connected users
- `counter_update`: When a user's counter is incremented
- `name_change`: When a user changes their display name
- `ping/pong`: For connection health monitoring

Each message is a JSON string with the following structure:

```typescript
{
  type: string;
  userId?: string;
  name?: string;
  count?: number;
  users?: Array<{id: string, name: string, count: number}>;
}
```