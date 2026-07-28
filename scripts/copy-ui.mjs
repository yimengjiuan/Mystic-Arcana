// Copy UI static assets (HTML/CSS/SVG) into dist/ so serve can serve them.
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const DIST = resolve('dist');
await mkdir(DIST, { recursive: true });
await mkdir(resolve(DIST, 'ui', 'assets'), { recursive: true });

const files = [
  ['src/ui/index.html', 'dist/index.html'],
  ['src/ui/style.css', 'dist/style.css']
];
for (const [from, to] of files) {
  await copyFile(resolve(from), resolve(to));
  console.log(`copied: ${from} -> ${to}`);
}

const svgDir = resolve('src/ui/assets');
try {
  for (const name of await readdir(svgDir)) {
    if (!name.endsWith('.svg')) continue;
    await copyFile(join(svgDir, name), resolve(DIST, 'ui', 'assets', name));
    console.log(`copied: src/ui/assets/${name} -> dist/ui/assets/${name}`);
  }
} catch { /* no assets dir, skip */ }
