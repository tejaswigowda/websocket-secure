/* Self-Validating SSL WebSocket Server */
/* using LetsEncrypt Certs */

// Parse command-line arguments
const args = process.argv.slice(2);
const pem_email = args[0] || process.env.PEM_EMAIL;
const pem_domain = args[1] || process.env.PEM_DOMAIN;
const http_port = (args[2] && !isNaN(args[2])) ? parseInt(args[2]) : (process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 8080);
const https_port = (args[3] && !isNaN(args[3])) ? parseInt(args[3]) : (process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : 8443);
const ws_username = args[4] && args[4] !== 'staging' ? args[4] : (process.env.WS_USERNAME || null);
const ws_password = args[5] && args[5] !== 'staging' ? args[5] : (process.env.WS_PASSWORD || null);
const useStaging = (args[4] === 'staging' || args[6] === 'staging') || process.env.PRODUCTION === 'false';
const debug = useStaging;
const production = !useStaging;

if (!pem_email || !pem_domain) { 
  console.log('Missing required parameters!');
  console.log('');
  console.log('Usage: node https.js <email> <domain> [http_port] [https_port] [username] [password] [staging]');
  console.log('');
  console.log('Arguments:');
  console.log('  email      - Email for Let\\'s Encrypt certificate (required)');
  console.log('  domain     - Domain name for certificate (required)');
  console.log('  http_port  - HTTP port (default: 8080)');
  console.log('  https_port - HTTPS port (default: 8443)');  console.log('  username   - WebSocket username (optional)');
  console.log('  password   - WebSocket password (optional)');  console.log('  staging    - Use staging certs if set to "staging" (default: production)');
  console.log('');
  console.log('Examples:');
  console.log('  node https.js user@example.com example.com');
  console.log('  node https.js user@example.com example.com 3000 3443');
  console.log('  node https.js user@example.com example.com 3000 3443 myuser mypass');
  console.log('  node https.js user@example.com example.com 3000 3443 myuser mypass staging');
  console.log('');
  console.log('Or use environment variables:');
  console.log('  PEM_EMAIL=user@example.com PEM_DOMAIN=example.com node https.js');
  console.log('  HTTP_PORT=3000 HTTPS_PORT=3443 WS_USERNAME=myuser WS_PASSWORD=mypass PEM_EMAIL=user@example.com PEM_DOMAIN=example.com node https.js');
  console.log('  PEM_EMAIL=user@example.com PEM_DOMAIN=example.com PRODUCTION=false node https.js');
  process.exit(1); 
}

if (debug) console.log('Debug Mode! Using staging certificates!');
else console.log('Production Mode! Using real certificates!');

const { app, setupWebSocket } = require('./app.js');
var homeDir = require('path').join(require('os').homedir());

var server = require('greenlock-express').create({
  version: 'draft-11',
  server: debug ? 'https://acme-staging-v02.api.letsencrypt.org/directory' : 'https://acme-v02.api.letsencrypt.org/directory',
  email: pem_email,
  agreeTos: true,
  approveDomains: [pem_domain],
  store: require('greenlock-store-fs'),
  configDir: homeDir,
  app: app
}).listen(http_port, https_port);

// Setup WebSocket server with 2 endpoints
setTimeout(function() {
  try {
    setupWebSocket(server, { username: ws_username, password: ws_password });
    console.log("WebSocket server is ready!");
    if (ws_username && ws_password) {
      console.log("  Authentication enabled (username: " + ws_username + ")");
    }
    console.log("  wss://" + pem_domain + ":" + https_port + "/server - for sending apps");
    console.log("  wss://" + pem_domain + ":" + https_port + "/ - for web browsers");
  } catch (e) {
    console.error('Error setting up WebSocket:', e.message);
  }
}, 1000);
