/**
 * LinkedIn MCP Server - Cloud SSE Transport Entrypoint
 * Designed for deployment on Render, Railway, Fly.io, or remote Docker containers.
 */

import http from 'http';
import fs from 'fs';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { LinkedInMCPServer } from './index.mjs';

// Auto-load local .env if present
if (fs.existsSync('.env')) {
  try {
    const envFile = fs.readFileSync('.env', 'utf-8');
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }
}

const PORT = process.env.PORT || 3000;

// Track active sessions by sessionId
const sessions = new Map();

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url, `http://${host}`);
  const pathname = url.pathname;

  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Health-check endpoint for Render / Uptime monitors
  if (pathname === '/health' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'linkedin-automation-mcp',
      version: '1.0.0',
      activeSessions: sessions.size,
      authenticated: Boolean(process.env.LINKEDIN_ACCESS_TOKEN),
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  // 2. SSE handshake endpoint
  if (pathname === '/sse' && req.method === 'GET') {
    try {
      console.log('Incoming SSE connection initiated...');
      const transport = new SSEServerTransport('/messages', res);
      const mcpServer = new LinkedInMCPServer();

      sessions.set(transport.sessionId, transport);
      console.log(`✅ Session opened: ${transport.sessionId} (Active: ${sessions.size})`);

      req.on('close', () => {
        sessions.delete(transport.sessionId);
        console.log(`🔌 Session closed: ${transport.sessionId} (Active: ${sessions.size})`);
      });

      await mcpServer.connect(transport);
    } catch (err) {
      console.error('Failed to establish SSE transport:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    return;
  }

  // 3. Client POST endpoint to dispatch MCP messages
  if (pathname === '/messages' && req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');
    const transport = sessionId ? sessions.get(sessionId) : sessions.values().next().value;

    if (!transport) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Active SSE session not found. Please connect to /sse first.'
      }));
      return;
    }

    try {
      await transport.handlePostMessage(req, res);
    } catch (err) {
      console.error('Error processing post message:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    return;
  }

  // 404 for any other path
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Not found: ${pathname}` }));
});

// Start listening
server.listen(PORT, () => {
  console.log('====================================================');
  console.log('🚀 LinkedIn MCP Server (Cloud SSE Mode)');
  console.log(`📡 Listening on Port: ${PORT}`);
  console.log(`🩺 Health check URL: http://localhost:${PORT}/health`);
  console.log(`⚡ SSE URL:          http://localhost:${PORT}/sse`);
  console.log('====================================================');
});

// Graceful termination
const shutdown = () => {
  console.log('Shutting down HTTP server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
