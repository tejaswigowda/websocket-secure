/* WebSocket Server - HTTP for testing */

const http = require('http');
const { app, setupWebSocket } = require('./app.js');

function start(options = {}) {
  const port = options.port || process.env.PORT || 3000;
  const ws_username = options.username || process.env.WS_USERNAME || null;
  const ws_password = options.password || process.env.WS_PASSWORD || null;

  const server = http.createServer(app);

  // Setup WebSocket server with authentication
  setupWebSocket(server, { username: ws_username, password: ws_password });

  server.listen(port, () => {
    console.log(`📡 HTTP WebSocket Server running on port ${port}`);
    if (ws_username && ws_password) {
      console.log(`   🔐 Authentication enabled (username: ${ws_username})`);
    }
    console.log(`   ws://localhost:${port}/server - for sending apps`);
    console.log(`   ws://localhost:${port}/ - for web browsers`);
    console.log(`   http://localhost:${port}/ - browser client`);
  });

  return server;
}

// If run directly (not imported), start the server
if (require.main === module) {
  // Parse positional arguments for backward compatibility
  const args = process.argv.slice(2);
  const port = (args[0] && !isNaN(args[0])) ? parseInt(args[0]) : null;
  const username = args[1] && args[1] !== 'staging' ? args[1] : null;
  const password = args[2] && args[2] !== 'staging' ? args[2] : null;

  start({
    port: port,
    username: username,
    password: password,
  });
}

module.exports = { start };
