import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from './db';

const SECRET = process.env.JWT_SECRET || '';
if (SECRET.length < 16) throw new Error('JWT_SECRET must be set (min 16 characters)');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','DENY'); res.setHeader('Referrer-Policy','same-origin'); next(); });
app.use(express.json({limit:'32kb'}));
app.get('/api/health', wrapHealth);
async function wrapHealth(_req:Request,res:Response) { try { await pool.query('SELECT 1'); res.json({ok:true,database:'connected'}); } catch { res.status(503).json({ok:false}); } }

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap = (f: Handler) => (req: Request, res: Response, next: NextFunction) => { f(req, res).catch(next); };

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const claims = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    if (typeof claims === 'string' || claims.role !== 'admin') throw new Error('Unauthorized');
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
}

const CATS = ['Burgers', 'Drinks', 'Desserts'];
const STATUSES = ['New', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

/* ---- auth ---- */
const attempts = new Map<string,{count:number;until:number}>();
app.use('/api/auth/login', (req,res,next) => {
 const now=Date.now(); for(const [key,value] of attempts) if(value.until<now) attempts.delete(key);
 const key=req.ip || 'local';const entry=attempts.get(key)||{count:0,until:now+60000};entry.count++;attempts.set(key,entry);
 if(entry.count>15){res.status(429).json({error:'Too many login attempts. Try again in one minute.'});return;} next();
});

app.post('/api/auth/login', wrap(async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({error:'Enter username and password.'});
  const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [username || '']);
  const ok = rows[0] && (await bcrypt.compare(password || '', rows[0].password_hash as string));
  if (!ok) return res.status(401).json({ error: 'Wrong username or password.' });
  res.json({ token: jwt.sign({ sub: rows[0].id, role: 'admin' }, SECRET, { expiresIn: '8h' }) });
}));

/* ---- products ---- */
const listProducts = wrap(async (req, res) => {
  const all = Boolean(req.query.all);
  const { rows } = await pool.query(
    'SELECT id, name, category, price, description, active FROM products WHERE active OR $1 ORDER BY id', [all]);
  res.json(rows);
});
app.get('/api/products', (req, res, next) => (req.query.all ? requireAdmin(req, res, next) : next()), listProducts);

function validProduct(b: Record<string, unknown>): string | null {
  if (typeof b.name !== 'string' || !b.name.trim()) return 'Enter a product name.';
  if (!CATS.includes(b.category as string)) return 'Unknown category.';
  if (!Number.isInteger(b.price) || (b.price as number) <= 0 || (b.price as number) > 1000000) return 'Price must be a positive number.';
  if ((b.name as string).length > 100 || (b.description != null && (typeof b.description !== 'string' || b.description.length > 1000)) || (b.active != null && typeof b.active !== 'boolean')) return 'Invalid product details.';
  return null;
}
app.post('/api/products', requireAdmin, wrap(async (req, res) => {
  const b = req.body as Record<string, unknown>; const bad = validProduct(b);
  if (bad) return res.status(400).json({ error: bad });
  await pool.query('INSERT INTO products (name, category, price, description, active) VALUES ($1,$2,$3,$4,$5)',
    [b.name, b.category, b.price, b.description ?? '', b.active !== false]);
  res.status(201).json({ ok: true });
}));
app.put('/api/products/:id', requireAdmin, wrap(async (req, res) => {
  const b = req.body as Record<string, unknown>; const bad = validProduct(b);
  if (bad) return res.status(400).json({ error: bad });
  const updated = await pool.query('UPDATE products SET name=$1, category=$2, price=$3, description=$4, active=$5 WHERE id=$6',
    [b.name, b.category, b.price, b.description ?? '', b.active !== false, Number(req.params.id)]);
  if (!updated.rowCount) return res.status(404).json({error:'Product not found.'});
  res.json({ ok: true });
}));

/* ---- orders ---- */
const ORDERS_SQL = (where: string) => `
  SELECT o.id, o.total, o.status, o.created_at AS "createdAt", o.is_demo AS "isDemo",
         COALESCE(json_agg(json_build_object('name', i.name, 'price', i.price, 'qty', i.qty)) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
  FROM orders o LEFT JOIN order_items i ON i.order_id = o.id ${where}
  GROUP BY o.id ORDER BY o.id DESC`;

app.post('/api/orders', wrap(async (req, res) => {
  const lines = (req.body as { items?: { productId: number; qty: number }[] }).items;
  if (!Array.isArray(lines) || !lines.length || lines.length > 100 || lines.some((l) => !l || !Number.isInteger(l.productId) || !Number.isInteger(l.qty) || l.qty < 1 || l.qty > 50))
    return res.status(400).json({ error: 'Cart is empty or invalid.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, name, price FROM products WHERE active AND id = ANY($1)', [lines.map((l) => l.productId)]);
    // Prices come from the database, never from the browser.
    const items = lines.map((l) => {
      const p = rows.find((r) => r.id === l.productId);
      if (!p) throw Object.assign(new Error('A product is no longer available.'), { status: 400 });
      return { name: p.name as string, price: p.price as number, qty: l.qty };
    });
    const total = items.reduce((a, i) => a + i.price * i.qty, 0);
    const o = await client.query("INSERT INTO orders (total, status) VALUES ($1, 'New') RETURNING id", [total]);
    for (const i of items) await client.query('INSERT INTO order_items (order_id, name, price, qty) VALUES ($1,$2,$3,$4)', [o.rows[0].id, i.name, i.price, i.qty]);
    await client.query('COMMIT');
    res.status(201).json({ id: o.rows[0].id, items, total, status: 'New' });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}));

app.get('/api/orders/:id', wrap(async (req, res) => {
  const { rows } = await pool.query(ORDERS_SQL('WHERE o.id = $1'), [Number(req.params.id)]);
  if (!rows[0]) return res.status(404).json({ error: 'Order not found.' });
  res.json(rows[0]);
}));
app.get('/api/orders', requireAdmin, wrap(async (_req, res) => { res.json((await pool.query(ORDERS_SQL(''))).rows); }));
app.patch('/api/orders/:id/status', requireAdmin, wrap(async (req, res) => {
  const { status } = req.body as { status?: string };
  if (!status || !STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status.' });
  const allowed: Record<string,string[]> = {Preparing:['New'],Ready:['Preparing'],Completed:['Ready'],Cancelled:['New','Preparing']};
  if(!allowed[status]) return res.status(400).json({error:'Invalid status transition.'});
  const updated=await pool.query('UPDATE orders SET status = $1 WHERE id = $2 AND status = ANY($3::text[]) RETURNING id',[status,Number(req.params.id),allowed[status]]);
  if(!updated.rowCount) return res.status(409).json({error:'Order not found or status already changed. Refresh the list.'});
  res.json({ ok: true });
}));

app.get('/api/analytics', requireAdmin, wrap(async (_req,res) => {
 const [summary,popular,daily,hours] = await Promise.all([
 pool.query("SELECT COUNT(*)::int AS count, COUNT(*) FILTER (WHERE is_demo)::int AS demo_count, COALESCE(SUM(total) FILTER (WHERE status='Completed'),0)::float8 AS revenue, COALESCE(AVG(total) FILTER (WHERE status='Completed'),0)::float8 AS average, COUNT(*) FILTER (WHERE status IN ('New','Preparing'))::int AS queue FROM orders"),
 pool.query("SELECT i.name AS label, SUM(i.qty)::int AS value FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.status <> 'Cancelled' GROUP BY i.name ORDER BY value DESC LIMIT 8"),
 pool.query("SELECT to_char(created_at AT TIME ZONE 'Asia/Qyzylorda','YYYY-MM-DD') AS label, SUM(total)::int AS value FROM orders WHERE status='Completed' GROUP BY label ORDER BY label DESC LIMIT 14"),
 pool.query("SELECT to_char(created_at AT TIME ZONE 'Asia/Qyzylorda','HH24:00') AS label, COUNT(*)::int AS value FROM orders GROUP BY label ORDER BY label")]);
 const s=summary.rows[0];res.json({...s,popular:popular.rows,daily:daily.rows.reverse(),hours:hours.rows,wait:Math.min(60,5+s.queue*3)});
}));
const publicDir=path.resolve(__dirname,'../../web/dist');
if(fs.existsSync(publicDir)) { app.use(express.static(publicDir)); app.get(/^(?!\/api(?:\/|$)).*/,(_req,res)=>res.sendFile(path.join(publicDir,'index.html'))); }
app.use('/api',(_req,res)=>res.status(404).json({error:'Endpoint not found.'}));

app.use((e: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if ((e as {type?:string}).type === 'entity.parse.failed') return res.status(400).json({error:'Invalid JSON body.'});
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(e); res.status(500).json({ error: 'Server error' });
});

const server = app.listen(Number(process.env.PORT) || 4000, () => console.log('DashFood: http://localhost:'+(process.env.PORT || 4000)));
process.on('SIGTERM',()=>server.close(()=>{void pool.end();}));
