/**
 * ESM 导入路径修补脚本
 * ------------------------------------------------------------------
 * TypeScript 编译后的 .js 文件中相对导入缺少 .js 扩展名，
 * 在浏览器中无法直接加载。本脚本遍历 dist_ui 下所有 .js 文件，
 * 为相对导入路径自动补全 .js 扩展名。
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * 递归遍历目录，收集所有 .js 文件路径。
 * @param d - 起始目录
 * @returns .js 文件绝对路径数组
 */
function walk(d) {
  const items = fs.readdirSync(d, { withFileTypes: true });
  let files = [];
  for (const it of items) {
    const fp = path.join(d, it.name);
    if (it.isDirectory()) files = files.concat(walk(fp));
    else if (it.name.endsWith('.js')) files.push(fp);
  }
  return files;
}

const files = walk('dist_ui');
let count = 0;

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  // 为相对导入路径补全 .js 扩展名
  const fixed = code.replace(
    /from\s+['"](\.\.?\/[^'"]*?)['"]/g,
    (m, p) => (p.endsWith('.js') ? m : `from '${p}.js'`),
  );
  if (fixed !== code) {
    fs.writeFileSync(file, fixed);
    count++;
  }
}

console.log('imports patched: ' + count + ' files in dist_ui');
