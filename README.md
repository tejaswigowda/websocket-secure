# WSS LetsEncrypt - WebSocket Server with SSL

A self-validating SSL WebSocket server using Let's Encrypt certificates. Features dual WebSocket endpoints for server-to-client communication with automatic HTTPS certificate management.

## Features

- 🔒 **Automatic SSL/TLS** - Auto-renews Let's Encrypt certificates
- 🔐 **Secure Token Authentication** - Cryptographically secure temporary tokens, no credential storage
- 🔄 **Dual WebSocket Endpoints** - Separate endpoints for server and client
- 💾 **Data Persistence** - In-memory store with JSON persistence
- 🌐 **HTTP & HTTPS Support** - HTTP for testing, HTTPS for production
- 📊 **Real-time Broadcasting** - Messages broadcast to all connected clients
- 🎥 **Responsive UI** - Fullscreen video streaming with authentication
- 🔄 **Auto-Reconnect** - Automatic token refresh and reconnection on disconnect

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

- **`app.js`** - Core WebSocket logic, HTTP request handler, and authentication
- **`server.js`** - HTTP server for local testing
- **`https.js`** - HTTPS server with Let's Encrypt (production)
- **`index.html`** - Web UI for viewing messages with auth form
- **`webcam.html`** - Webcam streaming interface with auth
- **`data.json`** - Persistent data store (auto-created)

## Installation

```bash
npm install
```

## Usage

### Local Testing (HTTP)

```bash
node server.js [PORT] [USERNAME] [PASSWORD]
```

Server runs on `http://localhost:PORT`

- **Browser client:** http://localhost:3000
- **Sending app:** Connect to `ws://localhost:3000/server`

**Examples:**
```bash
node server.js              # Use default port 3000
node server.js 8000         # Use custom port 8000
node server.js 3000 admin secret  # With auth
PORT=4000 node server.js    # Or set via environment variable
PORT=3000 WS_USERNAME=admin WS_PASSWORD=secret node server.js
```

### Production (HTTPS)

```bash
node https.js <email> <domain> [HTTP_PORT] [HTTPS_PORT] [USERNAME] [PASSWORD]
```

Server runs on HTTPS with Let's Encrypt certificates (production by default)

**Arguments:**
- `email` - Email for Let's Encrypt certificate (required)
- `domain` - Domain name for certificate (required)
- `HTTP_PORT` - HTTP port for Let's Encrypt validation (optional, default: 8080)
- `HTTPS_PORT` - HTTPS port (optional, default: 8443)
- `USERNAME` - WebSocket username (optional)
- `PASSWORD` - WebSocket password (optional)

**Examples:**
```bash
# Production with default ports
node https.js user@example.com example.com

# With custom ports
node https.js user@example.com example.com 8080 8443

# With authentication
node https.js user@example.com example.com 8080 8443 admin secret

# With staging certificates
node https.js user@example.com example.com 8080 8443 staging

# Or use environment variables
PEM_EMAIL=user@example.com \
PEM_DOMAIN=example.com \
WS_USERNAME=admin \
WS_PASSWORD=secret \
node https.js

# Staging environment
PEM_EMAIL=user@example.com PEM_DOMAIN=example.com PRODUCTION=false node https.js
```

Server endpoints:
- **Browser client:** https://yourdomain.com
- **Sending app:** Connect to `wss://yourdomain.com/server`

## Configuration

### Command-Line Arguments (Preferred)

**server.js:**
```bash
node server.js [PORT] [USERNAME] [PASSWORD]
```

**https.js:**
```bash
node https.js <email> <domain> [HTTP_PORT] [HTTPS_PORT] [USERNAME] [PASSWORD]
```

### Environment Variables (Fallback)

### Secure Token-Based Authentication

When `WS_USERNAME` and `WS_PASSWORD` are configured, both index.html and webcam.html use a secure automatic authentication flow:

1. **Client requests auth token** on page load via `/auth` endpoint
2. **Server generates temporary token** (valid for 15 minutes)
3. **Client uses token** to establish WebSocket connection (never stores token)
4. **Token is never persisted** - automatically discarded on page refresh
5. **Browser history never contains credentials** - token is session-only

**Benefits:**
- Zero user interaction required - completely automatic
- Credentials never transmitted multiple times
- Tokens are short-lived (15 minute expiry)
- No localStorage/sessionStorage usage
- Browser history stays clean

### Fallback Authentication (Legacy)

If needed, you can still use username/password directly:
- **HTTP Authorization Header** (for external apps)
- **URL Query Parameters** (fallback only)

These are less secure due to logging/history exposure, but tokens are checked first.

### Environment Variables (Fallback)

- `PORT` - HTTP port for server.js (default: 3000)
- `PEM_EMAIL` - Email for Let's Encrypt certificate (required for HTTPS)
- `PEM_DOMAIN` - Domain name for certificate (required for HTTPS)
- `PRODUCTION` - Set to `false` to use staging certificates (default: true/production)
- `WS_USERNAME` - WebSocket authentication username (optional)
- `WS_PASSWORD` - WebSocket authentication password (optional)

## Security

### Credential Protection Audit

✅ **Verified: Credentials Are NOT Leaked**

#### Storage Protection
- ✅ **No localStorage storage** of username/password
- ✅ **No sessionStorage storage** of credentials
- ✅ **Memory-only tokens** - cleared on page refresh/close
- ✅ **Non-sensitive data only** in persistent storage (FPS preference in webcam.html)

#### Token Security
- ✅ **Cryptographically secure token generation** - `crypto.randomBytes(32).toString('hex')` (256-bit)
- ✅ **Short-lived tokens** - 15-minute expiration, automatically cleaned up
- ✅ **Server-side validation** - tokens stored in memory only, never persisted to disk
- ✅ **No full token logging** - server logs only show `token.substring(0, 16) + '...'`

#### Password Protection  
- ✅ **No password logging** - password values never logged or exposed
- ✅ **Single-use credentials** - username/password only used once at server startup
- ✅ **No repeated transmission** - credentials never sent to client after token creation
- ✅ **No plaintext storage** - passwords only exist in process memory

#### Authentication Flow
1. Server starts with `username` and `password` as command-line arguments
2. Client calls `/auth` endpoint on page load → receives temporary token
3. Token stored in memory (`let authToken = null;`)
4. Token used to establish WebSocket connection (reusable for 15 minutes)
5. Token discarded when page refreshes or closes
6. Process repeats with fresh token on next page load

#### Production Recommendations
- 🔒 **Always use HTTPS/WSS** in production (https.js provides automatic Let's Encrypt SSL/TLS)
- 🔒 **Use strong passwords** - long, random `WS_USERNAME` and `WS_PASSWORD` values
- 🔒 **Rotate credentials regularly** - server restart generates new token validation
- 🔒 **Monitor server logs** - logs show connection attempts but not sensitive data
- 🔒 **HTTPS encrypts tokens** - prevents interception in transit

#### Security Summary Table

| Aspect | Status | Details |
|--------|--------|---------|
| **Stored Credentials** | ✅ SAFE | None in localStorage/sessionStorage |
| **In-Memory Tokens** | ✅ SAFE | Cleared on page refresh/browser close |
| **Server Logs** | ✅ SAFE | Only redacted token previews logged |
| **Password Logging** | ✅ SAFE | No password values logged anywhere |
| **Token Expiry** | ✅ SAFE | 15-minute TTL, auto-cleanup |
| **Token Generation** | ✅ SAFE | Uses cryptographically secure randomness |
| **Repeated Auth** | ✅ SAFE | Username/password never retransmitted |
| **Auto-Reconnect** | ✅ SAFE | Fetches fresh token on reconnection |

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
