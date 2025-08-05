const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Try a range of ports starting from this one
const START_PORT = 40000;
const MAX_PORT_ATTEMPTS = 20;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`Request for ${req.url}`);
  
  // Handle root path
  let filePath = req.url === '/' 
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, req.url);
  
  // Check if the request is for a directory by checking if it ends with '/'
  if (req.url.endsWith('/') && req.url !== '/') {
    filePath = path.join(filePath, 'index.html');
  }

  // Handle /images paths and route them to public/images
  if (req.url.startsWith('/images/')) {
    filePath = path.join(__dirname, 'public', req.url);
  }
  
  // Get file extension
  const ext = path.extname(filePath);
  
  // Default to binary if MIME type is not found
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        console.log(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end(`File not found: ${req.url}`);
      } else {
        // Server error
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close();
        resolve(true);
      })
      .listen(port);
  });
}

// Function to find an available port
async function findAvailablePort(startPort, maxAttempts) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found after ${maxAttempts} attempts`);
}

// Start the server with an available port
(async function startServer() {
  try {
    const port = await findAvailablePort(START_PORT, MAX_PORT_ATTEMPTS);
    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
      console.log(`Current directory: ${__dirname}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();

process.on('SIGINT', () => {
  console.log('Shutting down server');
  process.exit(0);
});
