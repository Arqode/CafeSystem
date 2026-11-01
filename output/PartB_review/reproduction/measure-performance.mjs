import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require('C:/Users/sirga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
 for(const screen of ['menu','cart'])for(let run=1;run<=3;run++){
  const ctx=await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:1});
  await ctx.addInitScript(()=>localStorage.setItem('dashfood-cart-v1',JSON.stringify([{productId:1,qty:2}])));
  const page=await ctx.newPage();const session=await ctx.newCDPSession(page);
  await session.send('Network.enable');await session.send('Network.setCacheDisabled',{cacheDisabled:true});
  // Chrome DevTools Fast 4G conditions: 9Mbps*.9 down, 1.5Mbps*.9 up, 60ms*2.75 latency.
  await session.send('Network.emulateNetworkConditions',{offline:false,downloadThroughput:1012500,uploadThroughput:168750,latency:165,connectionType:'cellular4g'});
  await page.goto(`http://localhost:4000/#${screen}`,{waitUntil:'load'});
  await page.locator(screen==='menu'?'.product-card':'.qty').first().waitFor();
  const measurement=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoadedMs:Math.round(n.domContentLoadedEventEnd),loadMs:Math.round(n.loadEventEnd),interactiveMs:Math.round(performance.now())};});
  results.push({screen,run,...measurement});console.log(screen,run,measurement);
  await page.screenshot({path:`output/evidence/B3-${screen}-${run}.png`});await ctx.close();
 }
 const averages=Object.fromEntries(['menu','cart'].map(screen=>{const r=results.filter(x=>x.screen===screen);return [screen,{loadMs:Math.round(r.reduce((a,x)=>a+x.loadMs,0)/3),interactiveMs:Math.round(r.reduce((a,x)=>a+x.interactiveMs,0)/3)}];}));
 mkdirSync('output/evidence',{recursive:true});writeFileSync('output/evidence/performance.json',JSON.stringify({testedAt:new Date().toISOString(),browser:browser.version(),method:'Chrome DevTools Protocol, cache disabled, Fast 4G conditions; automated equivalent, not a screenshot of the Network panel',source:'https://chromium.googlesource.com/devtools/devtools-frontend/+/HEAD/front_end/core/sdk/NetworkManager.ts',viewport:'375x812 DPR1',conditions:{downloadBytesPerSecond:1012500,uploadBytesPerSecond:168750,latencyMs:165},results,averages},null,2));
}finally{await browser.close();}
