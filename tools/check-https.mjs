import https from 'node:https';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const ca=readFileSync(new URL('../.local-certs/root.crt',import.meta.url));
const checks=[];
async function get(path){
 return new Promise((resolve,reject)=>{
  const req=https.get({hostname:'localhost',port:443,path,ca,rejectUnauthorized:true},res=>{
   const tls={authorized:res.socket.authorized,protocol:res.socket.getProtocol(),cipher:res.socket.getCipher().standardName};
   let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body,...tls}));
  });req.setTimeout(5000,()=>req.destroy(new Error('HTTPS check timed out')));req.on('error',reject);
 });
}
const health=await get('/api/health');
assert.equal(health.status,200);assert.equal(JSON.parse(health.body).database,'connected');checks.push('HTTPS health connects to PostgreSQL');
assert.equal(health.authorized,true);checks.push('Certificate and hostname verified against exported local CA; no insecure bypass');
assert.ok(['TLSv1.2','TLSv1.3'].includes(health.protocol));checks.push('TLS encryption negotiated');
assert.match(health.headers['strict-transport-security'],/max-age=31536000/);checks.push('HSTS header present');
assert.equal((await get('/')).status,200);checks.push('Frontend served through Caddy');
assert.equal((await get('/media/cheeseburger-400.webp')).status,200);checks.push('Product image served through HTTPS');
assert.equal((await get('/api/orders')).status,401);checks.push('Staff endpoint still requires authentication through HTTPS');
mkdirSync('output/evidence',{recursive:true});
writeFileSync('output/evidence/https-tests.json',JSON.stringify({testedAt:new Date().toISOString(),base:'https://localhost',checks,protocol:health.protocol,cipher:health.cipher,certificateVerified:true,systemTrustChanged:false,scope:'Local Caddy deployment. Browser certificate trust and public hosting are separate.'},null,2));
console.log(`${checks.length} verified HTTPS checks passed (${health.protocol}).`);
