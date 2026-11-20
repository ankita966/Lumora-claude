/**
 * Production HTTP Server for Lumora World on Google Cloud Run.
 * Serves Vite production build assets from ./dist and handles API endpoints.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import insightsHandler from './api/insights.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function sendFile(res, filePath, statusCode = 200, isHead = false) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isHashedAsset = filePath.includes(`${path.sep}assets${path.sep}`);

  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': isHashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  };

  try {
    const stat = fs.statSync(filePath);
    headers['Content-Length'] = stat.size;
    res.writeHead(statusCode, headers);
    if (isHead) {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
}

const server = http.createServer(async (req, res) => {
  const urlStr = req.url || '/';
  const pathname = urlStr.split('?')[0];

  // 1. Health check probes for Google Cloud Run
  if (pathname === '/healthz' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // 2. Secure Backend API routing
  if (pathname === '/api/insights' || pathname.startsWith('/api/insights/')) {
    try {
      await insightsHandler(req, res);
    } catch {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    }
    return;
  }

  // 3. Static asset delivery & SPA fallback from ./dist
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const isHead = req.method === 'HEAD';

  // Sanitize requested path to avoid directory traversal
  const safeRelativePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(DIST_DIR, safeRelativePath);

  // If path is a directory or points to root, target index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If static file exists, serve it (supporting HEAD without body)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath, 200, isHead);
    return;
  }

  // Determine if request targets a static asset (by extension or /assets/ path)
  const isAssetPath = pathname.startsWith('/assets/') || path.extname(pathname) !== '';

  // 404 for missing static assets (never fallback to index.html for assets)
  if (isAssetPath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Asset Not Found');
    return;
  }

  // Single-Page Application (SPA) fallback to index.html only for clean client-side routes
  const spaIndex = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(spaIndex)) {
    sendFile(res, spaIndex, 200, isHead);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Application build not found. Run npm run build first.');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[Lumora Server] Listening on http://${HOST}:${PORT} (PID ${process.pid})`);
});

// Graceful shutdown handling for Google Cloud Run container termination
function gracefulShutdown(signal) {
  console.log(`[Lumora Server] Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('[Lumora Server] Closed all connections.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Lumora Server] Forced exit after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

