// Patch ESM imports in compiled .js files to add .js extension for browser compatibility.
import fs from 'node:fs';
import path from 'node:path';

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
  const fixed = code.replace(
    /from\s+['"](\.\.?\/[^'"]*?)['"]/g,
    (m, p) => p.endsWith('.js') ? m : `from '${p}.js'`
  );
  if (fixed !== code) {
    fs.writeFileSync(file, fixed);
    count++;
  }
}
console.log('imports patched: ' + count + ' files in dist_ui');
