import { spawn } from 'node:child_process';
const children = [];
for (const dir of ['server', 'web']) {
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--prefix', dir, 'run', 'dev'], { stdio: 'inherit', shell: process.platform === 'win32' });
  children.push(child);
  child.on('exit', code => { if (code) { children.forEach(c => c.kill()); process.exit(code); } });
}
process.on('SIGINT', () => { children.forEach(c => c.kill()); process.exit(); });
