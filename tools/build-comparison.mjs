import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from '../web/node_modules/vite/dist/node/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const before = path.join(root, 'comparison/before');
const manifest = JSON.parse(readFileSync(path.join(root, 'comparison/before-source-manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
for (const entry of manifest) {
  const bytes = readFileSync(path.join(before, entry.Path));
  if (createHash('sha256').update(bytes).digest('hex').toUpperCase() !== entry.SHA256) {
    throw new Error(`Baseline was modified: ${entry.Path}`);
  }
}
console.log(`Baseline integrity: ${manifest.length} original files match SHA-256.`);
// This process-level value takes precedence over all Vite .env files.
process.env.VITE_API_URL = '';
for (const folder of [path.join(before, 'web'), path.join(root, 'web')]) {
  const compiler = path.join(folder, 'node_modules/typescript/bin/tsc');
  if (!existsSync(compiler)) throw new Error(`Run npm ci in ${folder} first.`);
  execFileSync(process.execPath, [compiler, '-p', path.join(folder, 'tsconfig.json')], { stdio: 'inherit' });
  await build({ root: folder, mode: 'comparison' });
}
console.log('Both production builds use the unchanged browser-storage demo API.');
