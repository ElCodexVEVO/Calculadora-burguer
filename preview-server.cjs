// Servidor local opcional. Sin dependencias, sin modificar la configuración de Supabase.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.cjs':'text/plain; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.glb':'model/gltf-binary'};
const server = http.createServer((req, res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  const target = path.resolve(root, '.' + name, name.endsWith('/') ? 'index.html' : '');
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.stat(target, (error, st) => {
    if (error || !st.isFile()) { res.writeHead(404).end('Archivo no encontrado'); return; }
    res.writeHead(200, {'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    fs.createReadStream(target).pipe(res);
  });
});
server.listen(4173, '127.0.0.1', () => console.log('Vista previa: http://127.0.0.1:4173/DEMO_V6.html\nAcceso: http://127.0.0.1:4173/DEMO_ACCESO.html\nAplicación: http://127.0.0.1:4173/index.html'));
