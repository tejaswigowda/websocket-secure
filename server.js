/* WebSocket Server - HTTP for testing */

const http = require('http');
const { app, setupWebSocket } = require('./app.js');

// Parse command-line arguments
const PORT = process.argv[2] || process.env.PORT || 8080;

const server = http.createServer(app);

// Setup WebSocket server with 2 endpoints: /server and /
setupWebSocket(server);

server.listen(PORT, () => {
  console.log("WebSocket server is ready!");
  console.log("  ws://localhost:" + PORT + "/server - for sending apps");
  console.log("  ws://localhost:" + PORT + "/ - for web browsers (also at http://localhost:" + PORT + "/)");
  console.log("");
  console.log("Usage: node server.js [PORT]");
  console.log("  PORT - Server port (default: 8080)");
});
