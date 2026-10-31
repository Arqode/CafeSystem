import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { pool } from './db';
(async()=>{
 const password=process.env.ADMIN_PASSWORD;
 if(!password||password.length<8) throw new Error('Set ADMIN_PASSWORD (at least 8 characters).');
 await pool.query(fs.readFileSync(path.resolve(__dirname,'../schema.sql'),'utf8'));
 const hash=await bcrypt.hash(password,12);
 await pool.query('INSERT INTO users(username,password_hash) VALUES($1,$2) ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash',[process.env.ADMIN_USERNAME||'admin',hash]);
 const client=await pool.connect();
 try { await client.query('BEGIN');
 // One repeatable seed batch, without adding duplicate orders on later launches.
 await client.query('CREATE TABLE IF NOT EXISTS seed_batches (name TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 const batch=await client.query("INSERT INTO seed_batches(name) VALUES('dashfood-endterm-120') ON CONFLICT DO NOTHING RETURNING name");
 if(batch.rowCount){
 const products=(await client.query('SELECT id,name,price FROM products ORDER BY id')).rows;
 for(let n=0;n<120;n++){
 const p=products[n%products.length], qty=1+n%3;
 const q=products[(n+2)%products.length]; const total=p.price*qty+q.price;
 const stamp=new Date(Date.UTC(2026,9,15+n%14,4+(n*7)%12,n%60));
 const status=n%13===0?'Cancelled':'Completed';
 const order=await client.query('INSERT INTO orders(total,status,created_at,is_demo) VALUES($1,$2,$3,TRUE) RETURNING id',[total,status,stamp]);
 await client.query('INSERT INTO order_items(order_id,name,price,qty) VALUES($1,$2,$3,$4),($1,$5,$6,1)',[order.rows[0].id,p.name,p.price,qty,q.name,q.price]);
 }
 }
 await client.query('COMMIT'); console.log('DashFood ready. 120 labelled synthetic orders are available for analysis.');
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 await pool.end();
})().catch(e=>{console.error(e);process.exit(1);});
