import { preview } from '../web/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2];
if (!['before', 'after'].includes(version)) throw new Error('Usage: node tools/serve-comparison.mjs before|after');
const folder = version === 'before' ? path.join(root, 'comparison/before/web') : path.join(root, 'web');
const port = version === 'before' ? 4173 : 4174;
const server = await preview({ root: folder, mode: 'comparison', preview: { host: '127.0.0.1', port, strictPort: true } });
server.printUrls();
console.log(`${version.toUpperCase()} production build; use the same viewport and DevTools settings for both.`);
