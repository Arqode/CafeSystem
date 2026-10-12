// Creates (or updates) the admin account: npm run seed
import bcrypt from 'bcryptjs';
import { pool } from './db';

(async () => {
  const u = process.env.ADMIN_USERNAME || 'admin';
  const p = process.env.ADMIN_PASSWORD;
  if (!p || p.length < 8) throw new Error('Set ADMIN_PASSWORD (min 8 characters) in .env');
  const hash = await bcrypt.hash(p, 10);
  await pool.query(
    `INSERT INTO users (username, password_hash) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [u, hash]);
  console.log(`Admin "${u}" is ready`);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
