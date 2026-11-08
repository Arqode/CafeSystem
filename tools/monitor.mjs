import {writeFileSync,mkdirSync} from 'node:fs';
const base=process.env.TEST_URL||'http://localhost:4000';
const count=Number(process.env.MONITOR_SAMPLES||60),interval=Number(process.env.MONITOR_INTERVAL_MS||60000);
const results=[];mkdirSync('output/evidence',{recursive:true});
for(let i=0;i<count;i++){
 const at=new Date().toISOString(),start=performance.now();let ok=false;
 try{const r=await fetch(base+'/api/health',{signal:AbortSignal.timeout(5000)});ok=r.ok&&(await r.json()).database==='connected';}catch{}
 results.push({at,ok,latencyMs:Math.round(performance.now()-start)});
 writeFileSync('output/evidence/availability.json',JSON.stringify({base,intervalMs:interval,plannedSamples:count,recordedSamples:results.length,observedAvailabilityPercent:100*results.filter(r=>r.ok).length/results.length,limitation:'Only the recorded observation window. This does not establish long-term service availability.',results},null,2));
 console.log(at,ok?'UP':'DOWN');if(i+1<count)await new Promise(resolve=>setTimeout(resolve,interval));
}
