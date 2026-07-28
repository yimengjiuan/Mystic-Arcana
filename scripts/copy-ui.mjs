/**
 * UI 静态资源拷贝脚本
 * ------------------------------------------------------------------
 * 将 src/ui 下的 HTML/CSS 及 SVG 资源拷贝到 dist 目录，
 * 使 serve.mjs 能直接托管编译后的前端产物。
 */
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const DIST = resolve('dist');
await mkdir(DIST, { recursive: true });
await mkdir(resolve(DIST, 'ui', 'assets'), { recursive: true });

// 拷贝 HTML 与 CSS
const files = [
  ['src/ui/index.html', 'dist/index.html'],
  ['src/ui/style.css', 'dist/style.css'],
];
for (const [from, to] of files) {
  await copyFile(resolve(from), resolve(to));
  console.log(`copied: ${from} -> ${to}`);
}

// 拷贝 SVG 资源（若存在）
const svgDir = resolve('src/ui/assets');
try {
  for (const name of await readdir(svgDir)) {
    if (!name.endsWith('.svg')) continue;
    await copyFile(join(svgDir, name), resolve(DIST, 'ui', 'assets', name));
    console.log(`copied: src/ui/assets/${name} -> dist/ui/assets/${name}`);
  }
} catch {
  /* 无 assets 目录则跳过 */
}
