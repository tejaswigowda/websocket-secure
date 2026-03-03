/* Self-Validating SSL WebSocket Server with Let's Encrypt */

const path = require('path');
const os = require('os');
const { app, setupWebSocket } = require('./app.js');

function start(options = {}) {
  const email = options.email || process.env.PEM_EMAIL;
  const domain = options.domain || process.env.PEM_DOMAIN;
  const httpPort = options.httpPort || parseInt(process.env.HTTP_PORT) || 8080;
  const httpsPort = options.httpsPort || parseInt(process.env.HTTPS_PORT) || 8443;
  const username = options.username || process.env.WS_USERNAME || null;
  const password = options.password || process.env.WS_PASSWORD || null;
  const staging = options.staging || process.env.PRODUCTION === 'false' || false;

  // Validate required parameters
  if (!email || !domain) {
    console.error('\n❌ Error: HTTPS mode requires email and domain\n');
    console.error('Usage: wss-server --email <email> --domain <domain> [options]\n');
    process.exit(1);
  }

  const homeDir = path.join(os.homedir());
  const acmeServer = staging
    ? 'https://acme-staging-v02.api.letsencrypt.org/directory'
    : 'https://acme-v02.api.letsencrypt.org/directory';

  const server = require('greenlock-express').create({
    version: 'draft-11',
    server: acmeServer,
    email: email,
    agreeTos: true,
    approveDomains: [domain],
    store: require('greenlock-store-fs'),
    configDir: homeDir,
    app: app,
  }).listen(httpPort, httpsPort);

  // Setup WebSocket server after short delay
  setTimeout(() => {
    try {
      setupWebSocket(server, { username: username, password: password });
      console.log(`📡 HTTPS WebSocket Server ready!`);
      if (username && password) {
        console.log(`   🔐 Authentication enabled (username: ${username})`);
      }
      console.log(`   🔒 Mode: ${staging ? 'STAGING' : 'PRODUCTION'}`);
      console.log(`   wss://${domain}:${httpsPort}/server - for sending apps`);
      console.log(`   wss://${domain}:${httpsPort}/ - for web browsers`);
      console.log(`   https://${domain}:${httpsPort}/ - browser client (auto-redirects to HTTPS)`);
    } catch (err) {
      console.error('Error setting up WebSocket:', err.message);
      process.exit(1);
    }
  }, 1000);

  return server;
}

// If run directly (for backward compatibility)
if (require.main === module) {
  const args = process.argv.slice(2);
  const email = args[0] || process.env.PEM_EMAIL;
  const domain = args[1] || process.env.PEM_DOMAIN;
  const httpPort = (args[2] && !isNaN(args[2])) ? parseInt(args[2]) : null;
  const httpsPort = (args[3] && !isNaN(args[3])) ? parseInt(args[3]) : null;
  const username = args[4] && args[4] !== 'staging' ? args[4] : null;
  const password = args[5] && args[5] !== 'staging' ? args[5] : null;
  const staging = args[4] === 'staging' || args[6] === 'staging' || process.env.PRODUCTION === 'false';

  start({
    email: email,
    domain: domain,
    httpPort: httpPort,
    httpsPort: httpsPort,
    username: username,
    password: password,
    staging: staging,
  });
}

module.exports = { start };
