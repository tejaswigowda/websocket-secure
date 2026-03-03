/* WebSocket Server App */

const fs = require('fs');
const path = require('path');
const url = require('url');
const { Server: WebSocketServer } = require('ws');

// In-memory data store (persisted to data.json)
const DATA_FILE = path.join(__dirname, 'data.json');
let store = {};

// Load existing data
try {
  if (fs.existsSync(DATA_FILE)) {
    store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
} catch (e) {
  console.log('Could not load data.json, starting fresh');
}

// Save data to file
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

var app = function(req, res) {
  // Serve static files
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(__dirname, filePath);
  
  fs.createReadStream(fullPath).on('error', function() {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }).pipe(res);
};

// Setup WebSocket server with 2 endpoints
function setupWebSocket(server) {
  // Create two separate WebSocket servers with noServer option
  const wss1 = new WebSocketServer({ noServer: true }); // /server endpoint
  const wss2 = new WebSocketServer({ noServer: true }); // /client endpoint

  const clients1 = new Set(); // server endpoint clients
  const clients2 = new Set(); // client endpoint clients

  // Server endpoint - receives data from sending app
  wss1.on('connection', (ws) => {
    clients1.add(ws);
    console.log('[Server] Client connected. Total:', clients1.size);

    ws.on('message', (message) => {
      // Check if message is binary data (Buffer or ArrayBuffer)
      const isBinary = Buffer.isBuffer(message) || message instanceof ArrayBuffer;
      const dataType = Buffer.isBuffer(message) ? 'Buffer' : typeof message;
      
     // console.log('[Server] Received message - type:', dataType, 'size:', Buffer.isBuffer(message) ? message.length : message.length || 'unknown');
      
      if (isBinary || dataType === 'object') {
        // Binary data - forward as-is without parsing
        //console.log('[Server] Treating as binary data, forwarding...');
        // Broadcast to all clients on /server endpoint
        clients1.forEach((client) => {
          if (client.readyState === 1) { // 1 = OPEN
            client.send(message);
          }
        });
        
        // Also forward to /client endpoint
        clients2.forEach((client) => {
          if (client.readyState === 1) {
            client.send(message);
          }
        });
      } else {
        // Text data - try to parse as JSON
        try {
          const msg = JSON.parse(message);
         // console.log('[Server] Received:', msg);
          
          // Broadcast to all clients on /server endpoint
          clients1.forEach((client) => {
            if (client.readyState === 1) { // 1 = OPEN
              client.send(message);
            }
          });
          
          // Also forward to /client endpoint
          clients2.forEach((client) => {
            if (client.readyState === 1) {
              client.send(message);
            }
          });
        } catch (e) {
          console.error('[Server] Error processing message:', e);
        }
      }
    });

    ws.on('close', () => {
      clients1.delete(ws);
      console.log('[Server] Client disconnected. Total:', clients1.size);
    });

    ws.on('error', (err) => {
      console.error('[Server] WebSocket error:', err);
      clients1.delete(ws);
    });
  });

  // Client endpoint - for web browsers
  wss2.on('connection', (ws) => {
    clients2.add(ws);
    console.log('[Client] Browser connected. Total:', clients2.size);

    // Send current store to new client
    ws.send(JSON.stringify({ type: 'sync', data: store }));

    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message);
       // console.log('[Client] Received:', msg);

        if (msg.type === 'put') {
          // Update store
          const { key, value } = msg;
          if (!store[key]) store[key] = {};
          Object.assign(store[key], value);
          saveData();

          // Broadcast to all clients on /client endpoint
          const broadcast = JSON.stringify({ type: 'update', key, value: store[key] });
          clients2.forEach((client) => {
            if (client.readyState === 1) {
              client.send(broadcast);
            }
          });
        } else if (msg.type === 'get') {
          // Send requested data
          const { key } = msg;
          ws.send(JSON.stringify({ type: 'update', key, value: store[key] || null }));
        } else {
          // Broadcast any other JSON message
          clients2.forEach((client) => {
            if (client.readyState === 1) {
              client.send(message);
            }
          });
        }
      } catch (e) {
        console.error('[Client] Error processing message:', e);
      }
    });

    ws.on('close', () => {
      clients2.delete(ws);
      console.log('[Client] Browser disconnected. Total:', clients2.size);
    });

    ws.on('error', (err) => {
      console.error('[Client] WebSocket error:', err);
      clients2.delete(ws);
    });
  });

  // Handle HTTP upgrade requests and route to correct WebSocket server
  server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/server') {
      wss1.handleUpgrade(request, socket, head, function done(ws) {
        wss1.emit('connection', ws, request);
      });
    } else if (pathname === '/') {
      wss2.handleUpgrade(request, socket, head, function done(ws) {
        wss2.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  return { wss1, wss2 };
}

module.exports = { app, setupWebSocket };
