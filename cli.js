#!/usr/bin/env node

/* 
 * WSS LetsEncrypt - CLI Entry Point
 * Handles flag-based arguments and server selection
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  // Check for help flag early
  if (args.includes('--help') || args.includes('-h')) {
    return { help: true };
  }

  const parsed = {
    mode: 'http',
    port: 3000,
    email: null,
    domain: null,
    httpPort: 8080,
    httpsPort: 8443,
    username: null,
    password: null,
    production: process.env.NODE_ENV === 'production',
    staging: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--mode':
        parsed.mode = next;
        i++;
        break;
      case '--port':
      case '-p':
        parsed.port = parseInt(next) || 3000;
        i++;
        break;
      case '--email':
      case '-e':
        parsed.email = next;
        i++;
        break;
      case '--domain':
      case '-d':
        parsed.domain = next;
        i++;
        break;
      case '--http-port':
        parsed.httpPort = parseInt(next) || 8080;
        i++;
        break;
      case '--https-port':
        parsed.httpsPort = parseInt(next) || 8443;
        i++;
        break;
      case '--username':
      case '-u':
        parsed.username = next;
        i++;
        break;
      case '--password':
        parsed.password = next;
        i++;
        break;
      case '--production':
        parsed.production = true;
        parsed.staging = false;
        break;
      case '--staging':
        parsed.staging = true;
        parsed.production = false;
        break;
      case '--dev':
        parsed.production = false;
        parsed.staging = false;
        break;
    }
  }

  // Auto-detect mode based on email/domain
  if (parsed.email && parsed.domain) {
    parsed.mode = 'https';
  }

  // If production mode, enforce HTTPS
  if (parsed.production === true) {
    if (!parsed.email || !parsed.domain) {
      console.error('\n❌ Error: Production mode requires --email and --domain for HTTPS\n');
      showHelp();
      process.exit(1);
    }
    parsed.mode = 'https';
  }

  return parsed;
}

function showHelp() {
  const help = `
WSS LetsEncrypt - Secure WebSocket Server

USAGE:
  wss-server [options]

OPTIONS:
  -h, --help                Show this help message
  
  --mode <http|https>       Server mode (auto-detected from email/domain)
  -p, --port <PORT>         HTTP port (default: 3000)
  -e, --email <EMAIL>       Email for Let's Encrypt (enables HTTPS)
  -d, --domain <DOMAIN>     Domain for Let's Encrypt (enables HTTPS)
  --http-port <PORT>        HTTP port for HTTPS server (default: 8080)
  --https-port <PORT>       HTTPS port (default: 8443)
  -u, --username <USER>     WebSocket username (optional)
  --password <PASS>         WebSocket password (optional)
  --production              Production mode (HTTPS only, requires email/domain)
  --staging                 Use Let's Encrypt staging certificates
  --dev                     Development mode (no HTTPS requirement)

EXAMPLES:
  # HTTP server (testing)
  wss-server --port 3000

  # HTTPS server with Let's Encrypt
  wss-server --email user@example.com --domain example.com --production

  # HTTPS with authentication
  wss-server -e user@example.com -d example.com -u admin --password secret

  # HTTP with authentication
  wss-server --port 3000 -u admin --password secret

  # Staging Let's Encrypt certificates
  wss-server -e user@example.com -d example.com --staging

  # Development (no HTTPS or auth)
  wss-server --dev --port 3000

ENVIRONMENT VARIABLES:
  NODE_ENV=production      Forces production mode (HTTPS required)
  PORT                     Default port for HTTP server
  HTTPS_PORT               Default HTTPS port (default: 8443)
  WS_USERNAME              WebSocket username
  WS_PASSWORD              WebSocket password
  PEM_EMAIL                Let's Encrypt email
  PEM_DOMAIN               Let's Encrypt domain
  PRODUCTION               Set to 'false' for staging certificates
`;
  console.log(help);
}

// Main execution
const args = parseArgs();

if (args.help) {
  showHelp();
  process.exit(0);
}

console.log(`\n🚀 Starting WSS LetsEncrypt Server`);
console.log(`   Mode: ${args.mode.toUpperCase()}`);
console.log(`   Environment: ${args.production ? 'PRODUCTION' : args.staging ? 'STAGING' : 'DEVELOPMENT'}`);

if (args.mode === 'https') {
  // HTTPS Server
  if (!args.email || !args.domain) {
    console.error('\n❌ HTTPS mode requires --email and --domain\n');
    showHelp();
    process.exit(1);
  }

  console.log(`   Domain: ${args.domain}`);
  console.log(`   HTTP Port: ${args.httpPort}`);
  console.log(`   HTTPS Port: ${args.httpsPort}`);

  if (args.username) {
    console.log(`   Auth: Enabled (username: ${args.username})`);
  }
  console.log('');

  const httpsServer = require('./https.js');
  httpsServer.start({
    email: args.email,
    domain: args.domain,
    httpPort: args.httpPort,
    httpsPort: args.httpsPort,
    username: args.username,
    password: args.password,
    staging: args.staging,
  });
} else {
  // HTTP Server (development/testing)
  console.log(`   Port: ${args.port}`);
  if (args.username) {
    console.log(`   Auth: Enabled (username: ${args.username})`);
  }
  console.log('');

  const httpServer = require('./server.js');
  httpServer.start({
    port: args.port,
    username: args.username,
    password: args.password,
  });
}
