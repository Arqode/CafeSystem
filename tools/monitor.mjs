import {writeFileSync,mkdirSync,readFileSync,existsSync,renameSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
const base=process.env.TEST_URL||'http://localhost:4000';
const count=Number(process.env.MONITOR_SAMPLES||60),interval=Number(process.env.MONITOR_INTERVAL_MS||60000);
if(!Number.isInteger(count)||count<2||!Number.isFinite(interval)||interval<10) throw new Error('Use >=2 samples and interval >=10ms');
const file=process.env.MONITOR_FILE||'output/evidence/availability.json';
mkdirSync('output/evidence',{recursive:true});
let state;
if(existsSync(file)&&process.env.MONITOR_NEW_RUN!=='1'){
 state=JSON.parse(readFileSync(file,'utf8'));
 if(!state.startedAt||state.base!==base||state.plannedSamples!==count||state.intervalMs!==interval) throw new Error('Saved schedule differs. Use MONITOR_NEW_RUN=1 to start a separate run.');
}else state={base,startedAt:new Date().toISOString(),intervalMs:interval,plannedSamples:count,results:[]};
function save(){
 const successful=state.results.filter(r=>r.ok).length;
 Object.assign(state,{recordedSamples:state.results.length,missedSamples:state.results.filter(r=>r.missed).length,successfulSamples:successful,observedAvailabilityPercent:100*successful/state.results.length,complete:state.results.length===count,limitation:'Scheduled sample availability, not continuous uptime. Missed slots during monitor interruption count as unavailable. No long-term guarantee.'});
 writeFileSync(file+'.tmp',JSON.stringify(state,null,2));renameSync(file+'.tmp',file);
}
const start=Date.parse(state.startedAt);
while(state.results.length<count){
 const index=state.results.length,due=start+index*interval,now=Date.now();
 if(now>=due+interval){state.results.push({scheduledAt:new Date(due).toISOString(),ok:false,missed:true});save();continue;}
 if(due>now) await delay(due-now);
 const at=new Date().toISOString(),t=performance.now();let ok=false;
 try{const r=await fetch(base+'/api/health',{signal:AbortSignal.timeout(Math.min(5000,interval))});ok=r.ok&&(await r.json()).database==='connected';}catch{}
 state.results.push({scheduledAt:new Date(due).toISOString(),at,ok,missed:false,latencyMs:Math.round(performance.now()-t)});save();console.log(index+1,ok?'UP':'DOWN');
}
