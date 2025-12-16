/**
 * Backend Stub Server
 * Simple HTTP server for testing Annabelle.AI integration
 */

import http from 'http';

const PORT = 3000;

// In-memory data store
const dataStore = new Map();

// Request handler
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // Routes
  if (path === '/health') {
    handleHealth(req, res);
  } else if (path === '/data' && req.method === 'GET') {
    handleGetData(req, res);
  } else if (path === '/data' && req.method === 'POST') {
    handlePostData(req, res);
  } else if (path.startsWith('/data/') && req.method === 'DELETE') {
    handleDeleteData(req, res, path);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Health check
function handleHealth(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    service: 'Annabelle.AI Backend Stub',
    timestamp: new Date().toISOString(),
    dataCount: dataStore.size,
  }));
}

// Get all data
function handleGetData(req, res) {
  const data = Array.from(dataStore.values());
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data, count: data.length }));
}

// Post new data
function handlePostData(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const id = data.id || `entry-${Date.now()}`;
      
      dataStore.set(id, { ...data, id });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, id }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

// Delete data
function handleDeleteData(req, res, path) {
  const id = path.split('/').pop();
  
  if (dataStore.has(id)) {
    dataStore.delete(id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`Backend stub server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  GET  /data - Get all data');
  console.log('  POST /data - Add data');
  console.log('  DELETE /data/:id - Delete data');
});
