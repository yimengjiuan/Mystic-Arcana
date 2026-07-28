// 本地静态服务器
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, normalize } from 'node:path';
import { networkInterfaces } from 'node:os';
const ROOT = resolve('dist_ui'), PORT = 5173, HOST = '0.0.0.0';
const MIME = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png','.ico':'image/x-icon'};
createServer(async (req, res) => {
  try {
    let url = decodeURIComponent(req.url || '/');
    if (url === '/') url = '/index.html';
    const safePath = normalize(join(ROOT, url));
    if (!safePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    const data = await readFile(safePath);
    res.writeHead(200, {'Content-Type': MIME[extname(safePath)] || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end(data);
  } catch { res.writeHead(404); res.end('Not Found'); }
}).listen(PORT, HOST, () => {
  console.log(`玄机阁运行于 http://localhost:${PORT}/`);
  // 打印局域网 IP，方便其他设备访问
  const lans = Object.values(networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .map(i => i.address);
  if (lans.length) {
    console.log('局域网访问地址：');
    lans.forEach(ip => console.log(`  http://${ip}:${PORT}/`));
  } else {
    console.log('未检测到局域网 IPv4 地址');
  }
});
