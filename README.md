# WSS LetsEncrypt - WebSocket Server with SSL

A self-validating SSL WebSocket server using Let's Encrypt certificates. Features dual WebSocket endpoints for server-to-client communication with automatic HTTPS certificate management.

## Features

- 🔒 **Automatic SSL/TLS** - Auto-renews Let's Encrypt certificates
- 🔄 **Dual WebSocket Endpoints** - Separate endpoints for server and client
- 💾 **Data Persistence** - In-memory store with JSON persistence
- 🌐 **HTTP & HTTPS Support** - HTTP for testing, HTTPS for production
- 📊 **Real-time Broadcasting** - Messages broadcast to all connected clients

## Architecture

### WebSocket Endpoints

- **`/server`** - For sending applications to push messages
  - Receives JSON messages from external apps
  - Broadcasts to all `/server` endpoint clients
  - Forwards messages to `/` (browser) endpoint

- **`/`** - For web browsers (client endpoint)
  - Receives synced data and updates
  - Displays all messages in real-time UI
  - Supports Gun-like `put`/`get` API

### Files

- **`app.js`** - Core WebSocket logic and HTTP request handler
- **`server.js`** - HTTP server for local testing
- **`https.js`** - HTTPS server with Let's Encrypt (production)
- **`index.html`** - Web UI for viewing messages
- **`data.json`** - Persistent data store (auto-created)

## Installation

```bash
npm install
```

## Usage

### Local Testing (HTTP)

```bash
node server.js [PORT]
```

Server runs on `http://localhost:PORT`

- **Browser client:** http://localhost:3000
- **Sending app:** Connect to `ws://localhost:3000/server`

**Examples:**
```bash
node server.js              # Use default port 3000
node server.js 8000         # Use custom port 8000
PORT=4000 node server.js    # Or set via environment variable
```

### Production (HTTPS)

```bash
node https.js <email> <domain> [staging]
```

Server runs on HTTPS with Let's Encrypt certificates (production by default)

**Arguments:**
- `email` - Email for Let's Encrypt certificate (required)
- `domain` - Domain name for certificate (required)  
- `staging` - Use staging certificates if set to "staging" (default: production)

**Examples:**
```bash
# Production certificates (default)
node https.js user@example.com example.com

# Staging certificates (for testing)
node https.js user@example.com example.com staging

# Or use environment variables
PEM_EMAIL=user@example.com PEM_DOMAIN=example.com node https.js
PEM_EMAIL=user@example.com PEM_DOMAIN=example.com PRODUCTION=false node https.js
```

Server endpoints:
- **Browser client:** https://yourdomain.com
- **Sending app:** Connect to `wss://yourdomain.com/server`

## Configuration

### Command-Line Arguments (Preferred)

**server.js:**
```bash
node server.js [PORT]
```

**https.js:**
```bash
node https.js <email> <domain> [staging]
```

### Environment Variables (Fallback)

- `PORT` - HTTP port for local testing (default: 3000)
- `PEM_EMAIL` - Email for Let's Encrypt certificate (required for HTTPS)
- `PEM_DOMAIN` - Domain name for certificate (required for HTTPS)
- `PRODUCTION` - Set to `false` to use staging certificates (default: true/production)

## Message Format

### Server Endpoint (`/server`)

Send raw JSON messages; they'll be broadcast to all connected clients:

```json
{
  "type": "data",
  "value": "any content here"
}
```

### Client Endpoint (`/`)

**Sync Message** (received on connection):
```json
{
  "type": "sync",
  "data": { }
}
```

**Update Message** (real-time updates):
```json
{
  "type": "update",
  "key": "storeKey",
  "value": { }
}
```

**Put Message** (update store):
```json
{
  "type": "put",
  "key": "storeKey",
  "value": { }
}
```

**Get Message** (request data):
```json
{
  "type": "get",
  "key": "storeKey"
}
```

## API Reference

### Browser Console API

Connected browsers expose these globals:

- `window.ws` - WebSocket connection object
- `window.store` - Current data store
- `window.data` - Gun-like API
  - `data.put(value)` - Update store
  - `data.get(prop).on(callback)` - Listen for changes
- `window.addMessage(text, type)` - Add message to UI

### Example: Send from Browser Console

```javascript
// Update store
window.data.put({ message: 'Hello!' });

// Listen for changes
window.data.get('message').on(function(msg) {
  console.log('Message:', msg);
});
```

## Example: Send from Another App

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/server');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'sensor',
    value: 42,
    timestamp: Date.now()
  }));
});
```

## License

MIT
