import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
// Run while no one is placing/editing orders. Briefly stops app + db, never removes volumes.
const base=process.env.TEST_URL||'http://localhost:4000';
function compose(args){return execFileSync('docker',['compose',...args],{encoding:'utf8'}).trim();}
function snapshot(){return JSON.parse(compose(['exec','-T','db','psql','-U','cafe','-d','cafe','-At','-c',`SELECT json_build_object(
 'orders',(SELECT count(*) FROM orders),
 'demoOrders',(SELECT count(*) FROM orders WHERE is_demo),
 'items',(SELECT count(*) FROM order_items),
 'products',(SELECT count(*) FROM products),
 'ordersDigest',(SELECT md5(COALESCE(string_agg(row_to_json(o)::text, '' ORDER BY id),'')) FROM orders o),
 'itemsDigest',(SELECT md5(COALESCE(string_agg(row_to_json(i)::text, '' ORDER BY id),'')) FROM order_items i),
 'productsDigest',(SELECT md5(COALESCE(string_agg(row_to_json(p)::text, '' ORDER BY id),'')) FROM products p)
);`]));}
const before=snapshot();
compose(['stop','app','db']);compose(['up','-d','app']);
let healthy=false;
for(let attempt=0;attempt<30;attempt++){
 try{const r=await fetch(base+'/api/health',{signal:AbortSignal.timeout(2000)});healthy=r.ok&&(await r.json()).database==='connected';if(healthy) break;}catch{}
 await delay(1000);
}
assert.ok(healthy,'App reconnects to PostgreSQL after restart');
const after=snapshot();assert.deepEqual(after,before,'Orders, items and menu survive stop/start; seed does not duplicate data');
writeFileSync('output/evidence/persistence-tests.json',JSON.stringify({testedAt:new Date().toISOString(),base,before,after,checks:['Database and app stop/start without removing volumes','App becomes healthy again','All order/item/product rows unchanged','Seed batch does not duplicate demonstration orders'],personalDataIncluded:false},null,2));
console.log('Persistence verified: database rows survive stop/start unchanged.');
