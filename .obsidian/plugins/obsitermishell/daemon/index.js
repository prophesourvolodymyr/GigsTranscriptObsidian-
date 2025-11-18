#!/usr/bin/env node
/**
 * Obsitermishell PTY Daemon
 *
 * This daemon runs as a separate Node.js process and provides real PTY
 * capabilities via WebSocket. It exists because Obsidian's Electron renderer
 * blocks native modules like node-pty for security reasons.
 *
 * Protocol:
 * - Client -> Server: { type: 'auth', token } (required if auth enabled)
 * - Server -> Client: { type: 'auth_ok' } or { type: 'auth_failed' }
 * - Client -> Server: { type: 'create', cwd, shellPath?, shellArgs?, env? }
 * - Server -> Client: { type: 'created', id }
 * - Client -> Server: { type: 'data', id, data }
 * - Server -> Client: { type: 'output', id, data }
 * - Client -> Server: { type: 'resize', id, cols, rows }
 * - Client -> Server: { type: 'kill', id }
 * - Server -> Client: { type: 'exit', id, code, signal }
 *
 * Arguments:
 * --bind-host <host>  Bind to specific host (default: 127.0.0.1)
 * --auth-token <token> Require authentication token (optional)
 * --port <port>        Use specific port (default: 37492)
 */

const pty = require('node-pty');
const WebSocket = require('ws');
const os = require('os');

// Parse command line arguments
const args = process.argv.slice(2);
let BIND_HOST = '127.0.0.1'; // Default to localhost only
let AUTH_TOKEN = null; // No auth by default
let PORT = 37492;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--bind-host' && args[i + 1]) {
    BIND_HOST = args[i + 1];
    i++;
  } else if (args[i] === '--auth-token' && args[i + 1]) {
    AUTH_TOKEN = args[i + 1];
    i++;
  } else if (args[i] === '--port' && args[i + 1]) {
    PORT = parseInt(args[i + 1], 10);
    i++;
  }
}

const sessions = new Map();
const authenticatedClients = new WeakSet();

// Detect default shell
function getDefaultShell() {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'powershell.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

// Get default shell args
function getDefaultShellArgs(shell) {
  if (process.platform === 'win32') {
    return [];
  }
  // Login shell for POSIX
  return ['-l'];
}

// Create WebSocket server
const wss = new WebSocket.Server({
  port: PORT,
  host: BIND_HOST
});

console.log(`[PTY Daemon] Started on ws://${BIND_HOST}:${PORT}`);
console.log(`[PTY Daemon] Platform: ${process.platform}`);
console.log(`[PTY Daemon] Default shell: ${getDefaultShell()}`);
if (AUTH_TOKEN) {
  console.log(`[PTY Daemon] Authentication: ENABLED`);
  console.log(`[PTY Daemon] WARNING: Remote connections enabled. Ensure firewall is configured!`);
} else {
  console.log(`[PTY Daemon] Authentication: DISABLED (local only)`);
}

wss.on('connection', (ws) => {
  console.log('[PTY Daemon] Client connected');

  // If auth is required, client must authenticate first
  if (AUTH_TOKEN) {
    // Client needs to authenticate
    ws.send(JSON.stringify({ type: 'auth_required' }));
  } else {
    // No auth needed, mark as authenticated
    authenticatedClients.add(ws);
    ws.send(JSON.stringify({ type: 'ready' }));
  }

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());
      handleMessage(ws, msg);
    } catch (error) {
      console.error('[PTY Daemon] Message parse error:', error);
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('[PTY Daemon] Client disconnected');
    // Clean up sessions for this client
    for (const [id, session] of sessions.entries()) {
      if (session.ws === ws) {
        try {
          session.pty.kill();
          sessions.delete(id);
        } catch (e) {
          // Ignore
        }
      }
    }
  });

  ws.on('error', (error) => {
    console.error('[PTY Daemon] WebSocket error:', error);
  });
});

function handleMessage(ws, msg) {
  // Handle authentication message
  if (msg.type === 'auth') {
    handleAuth(ws, msg);
    return;
  }

  // Check if client is authenticated (if auth is required)
  if (AUTH_TOKEN && !authenticatedClients.has(ws)) {
    ws.send(JSON.stringify({ type: 'error', error: 'Authentication required' }));
    return;
  }

  // Process authenticated messages
  switch (msg.type) {
    case 'create':
      handleCreate(ws, msg);
      break;
    case 'data':
      handleData(ws, msg);
      break;
    case 'resize':
      handleResize(ws, msg);
      break;
    case 'kill':
      handleKill(ws, msg);
      break;
    default:
      console.warn('[PTY Daemon] Unknown message type:', msg.type);
  }
}

function handleAuth(ws, msg) {
  if (!AUTH_TOKEN) {
    // Auth not required
    authenticatedClients.add(ws);
    ws.send(JSON.stringify({ type: 'auth_ok' }));
    ws.send(JSON.stringify({ type: 'ready' }));
    return;
  }

  if (msg.token === AUTH_TOKEN) {
    console.log('[PTY Daemon] Client authenticated successfully');
    authenticatedClients.add(ws);
    ws.send(JSON.stringify({ type: 'auth_ok' }));
    ws.send(JSON.stringify({ type: 'ready' }));
  } else {
    console.warn('[PTY Daemon] Authentication failed - invalid token');
    ws.send(JSON.stringify({ type: 'auth_failed', error: 'Invalid authentication token' }));
    ws.close();
  }
}

function handleCreate(ws, msg) {
  const id = generateId();
  const shell = msg.shellPath || getDefaultShell();
  const args = msg.shellArgs || getDefaultShellArgs(shell);
  const cwd = msg.cwd || process.cwd();
  const env = msg.env || process.env;

  console.log('[PTY Daemon] Creating session:', {
    id,
    shell,
    args,
    cwd: cwd.substring(0, 50) + '...',
  });

  try {
    // Spawn PTY with node-pty
    const ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: msg.cols || 80,
      rows: msg.rows || 24,
      cwd,
      env: {
        ...env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    });

    // Store session
    sessions.set(id, {
      pty: ptyProcess,
      ws,
      shell,
      cwd,
    });

    // Handle PTY output
    ptyProcess.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          id,
          data,
        }));
      }
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`[PTY Daemon] Session ${id} exited:`, { exitCode, signal });
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'exit',
          id,
          code: exitCode,
          signal,
        }));
      }
      sessions.delete(id);
    });

    // Send created response
    ws.send(JSON.stringify({
      type: 'created',
      id,
      cols: ptyProcess.cols,
      rows: ptyProcess.rows,
    }));

    console.log(`[PTY Daemon] Session ${id} created successfully`);
  } catch (error) {
    console.error('[PTY Daemon] Failed to create session:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error.message,
    }));
  }
}

function handleData(ws, msg) {
  const session = sessions.get(msg.id);
  if (!session) {
    // Session already closed - silently ignore (client should prevent this)
    return;
  }

  try {
    session.pty.write(msg.data);
  } catch (error) {
    console.error(`[PTY Daemon] Failed to write to session ${msg.id}:`, error);
  }
}

function handleResize(ws, msg) {
  const session = sessions.get(msg.id);
  if (!session) {
    // Session already closed - silently ignore (client should prevent this)
    return;
  }

  try {
    session.pty.resize(msg.cols, msg.rows);
    console.log(`[PTY Daemon] Resized session ${msg.id} to ${msg.cols}x${msg.rows}`);
  } catch (error) {
    console.error(`[PTY Daemon] Failed to resize session ${msg.id}:`, error);
  }
}

function handleKill(ws, msg) {
  const session = sessions.get(msg.id);
  if (!session) {
    console.warn(`[PTY Daemon] Session ${msg.id} not found for kill`);
    return;
  }

  try {
    session.pty.kill(msg.signal);
    sessions.delete(msg.id);
    console.log(`[PTY Daemon] Killed session ${msg.id}`);
  } catch (error) {
    console.error(`[PTY Daemon] Failed to kill session ${msg.id}:`, error);
  }
}

function generateId() {
  return `pty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[PTY Daemon] Shutting down...');
  for (const [id, session] of sessions.entries()) {
    try {
      session.pty.kill();
    } catch (e) {
      // Ignore
    }
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[PTY Daemon] Terminating...');
  for (const [id, session] of sessions.entries()) {
    try {
      session.pty.kill();
    } catch (e) {
      // Ignore
    }
  }
  process.exit(0);
});
