const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // Résolution de chemin en O(1) spatial
  const safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath === '/' ? 'index.html' : safePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404: Not Found');
      } else {
        res.writeHead(500);
        res.end('500: Internal Server Error');
      }
    } else {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur de test actif : http://0.0.0.0:${PORT}`);
  console.log(`O(1) mapping MIME, E/S asynchrones non bloquantes.`);
});
