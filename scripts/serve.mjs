// 本地静态服务器
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, normalize } from 'node:path';
const ROOT = resolve('dist'), PORT = 5173;
const MIME = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.ico':'image/x-icon'};
createServer(async (req, res) => {
  try {
    let url = decodeURIComponent(req.url || '/');
    if (url === '/') url = '/index.html';
    const safePath = normalize(join(ROOT, url));
    if (!safePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    const data = await readFile(safePath);
    res.writeHead(200, {'Content-Type': MIME[extname(safePath)] || 'text/plain', 'Cache-Control': 'no-store'});
    res.end(data);
  } catch { res.writeHead(404); res.end('Not Found'); }
}).listen(PORT, () => console.log(`玄机阁运行于 http://localhost:${PORT}/`));
