/* Self-Validating SSL WebSocket Server */
/* using LetsEncrypt Certs */

// Parse command-line arguments
const args = process.argv.slice(2);
const pem_email = args[0] || process.env.PEM_EMAIL;
const pem_domain = args[1] || process.env.PEM_DOMAIN;
const useStaging = args[2] === 'staging' || process.env.PRODUCTION === 'false';
const debug = useStaging;
const production = !useStaging;

if (!pem_email || !pem_domain) { 
  console.log('Missing required parameters!');
  console.log('');
  console.log('Usage: node https.js <email> <domain> [staging]');
  console.log('');
  console.log('Arguments:');
  console.log('  email   - Email for Let\\'s Encrypt certificate (required)');
  console.log('  domain  - Domain name for certificate (required)');
  console.log('  staging - Use staging certs if set to "staging" (default: production)');
  console.log('');
  console.log('Examples:');
  console.log('  node https.js user@example.com example.com');
  console.log('  node https.js user@example.com example.com staging');
  console.log('');
  console.log('Or use environment variables:');
  console.log('  PEM_EMAIL=user@example.com PEM_DOMAIN=example.com node https.js');
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
}).listen(8080, 8443);

// Setup WebSocket server with 2 endpoints
setTimeout(function() {
  try {
    setupWebSocket(server);
    console.log("WebSocket server is ready!");
    console.log("  wss://" + pem_domain + ":8443/server - for sending apps");
    console.log("  wss://" + pem_domain + ":8443/ - for web browsers");
  } catch (e) {
    console.error('Error setting up WebSocket:', e.message);
  }
}, 1000);
