import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const env=Object.fromEntries(readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const base=process.env.TEST_URL||'http://localhost:4000';
const checks=[];
async function request(path,method='GET',body,token){ const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,data:await r.json()}; }
function ok(condition,label){assert.ok(condition,label);checks.push(label);console.log('PASS',label);}
const health=await request('/api/health');ok(health.data.database==='connected','PostgreSQL is connected');
const products=(await request('/api/products')).data;ok(products.length>=8,'Menu contains at least eight products with prices');
ok((await request('/api/orders')).status===401,'Guest cannot read staff orders');
ok((await request('/api/products?all=1')).status===401,'Guest cannot read disabled products');
ok((await request('/api/analytics')).status===401,'Guest cannot read statistics');
ok((await request('/api/products','POST',{})).status===401,'Guest cannot change the menu');
ok((await request('/api/auth/login','POST',{username:'admin',password:'incorrect'})).status===401,'Wrong password is rejected');
const token=(await request('/api/auth/login','POST',{username:'admin',password:env.ADMIN_PASSWORD})).data.token;ok(Boolean(token),'Staff login succeeds');
const stats=(await request('/api/analytics','GET',undefined,token)).data;ok(stats.count>=120,'Database contains at least 120 orders');ok(stats.daily.length>=3&&stats.popular.length>=3&&stats.hours.length>=3,'Three charts are populated from database aggregations');
ok((await request('/api/orders','POST',{items:[]})).status===400,'Empty order is rejected');
ok((await request('/api/orders','POST',{items:[null]})).status===400,'Malformed order line is rejected');
ok((await request('/api/orders','POST',{items:[{productId:products[0].id,qty:51}]})).status===400,'Quantity greater than 50 is rejected');
const response=await request('/api/orders','POST',{items:[{productId:products[0].id,qty:2}],total:1});const order=response.data;
ok(response.status===201&&order.total===products[0].price*2,'Order is saved with the price calculated by the server');
ok((await request(`/api/orders/${order.id}`)).data.id===order.id,'Created order is read from the database');
ok((await request('/api/orders','GET',undefined,token)).data.some(o=>o.id===order.id),'Customer order appears in staff panel');
ok((await request(`/api/orders/${order.id}/status`,'PATCH',{status:'Completed'},token)).status===409,'Skipping workflow steps is rejected');
for(const status of ['Preparing','Ready','Completed']){ok((await request(`/api/orders/${order.id}/status`,'PATCH',{status},token)).status===200,`Staff changes status to ${status}`);ok((await request(`/api/orders/${order.id}`)).data.status===status,`Customer sees ${status} from database`);}
const testName=`Verification product ${Date.now()}`;const input={name:testName,category:'Drinks',price:1200,description:'Synthetic automated verification item',active:true};
ok((await request('/api/products','POST',input,token)).status===201,'Staff can create product');
const created=(await request('/api/products?all=1','GET',undefined,token)).data.find(p=>p.name===testName);
ok((await request(`/api/products/${created.id}`,'PUT',{...created,price:1400,active:false},token)).status===200,'Staff can edit and disable product');
ok(!(await request('/api/products')).data.some(p=>p.id===created.id),'Disabled product is hidden from customer menu');
ok((await request('/api/orders','POST',{items:[{productId:created.id,qty:1}]})).status===400,'Disabled product cannot be ordered');
mkdirSync(new URL('../output/evidence/',import.meta.url),{recursive:true});writeFileSync(new URL('../output/evidence/api-tests.json',import.meta.url),JSON.stringify({testedAt:new Date().toISOString(),base,checks,syntheticVerificationOrder:order.id},null,2));
console.log(`${checks.length} API checks passed.`);
