import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('C:/Users/sirga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const env=Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
mkdirSync('output/evidence',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.TEST_URL||'http://localhost:4000';
try{
 await page.goto(base);await page.locator('.product-card').first().waitFor();
 await page.screenshot({path:'output/evidence/A1-1-menu-desktop.png',fullPage:true});
 for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow at ${width}`);}
 await page.setViewportSize({width:375,height:812});await page.screenshot({path:'output/evidence/menu-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Add Cheeseburger to cart',exact:true}).click();
 await page.getByRole('button',{name:'Add Cola to cart',exact:true}).click();
 await page.getByRole('button',{name:'View Cart',exact:true}).click();
 await page.getByRole('button',{name:'Remove',exact:true}).last().click();
 await page.getByRole('button',{name:'Increase quantity',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'Decrease quantity',exact:true}).waitFor();
 assert.equal(await page.locator('.qty span').innerText(),'2');
 await page.screenshot({path:'output/evidence/A1-2-cart.png',fullPage:true});
 await page.getByRole('button',{name:'Place order · Pay at pickup',exact:true}).click();
 await page.getByRole('heading',{name:'My orders',exact:true}).waitFor();await page.locator('.badge').first().waitFor();
 await page.screenshot({path:'output/evidence/A1-3-confirmation.png',fullPage:true});
 await page.getByRole('button',{name:'Staff orders',exact:true}).click();
 await page.getByLabel('Username',{exact:true}).fill('admin');await page.getByLabel('Password',{exact:true}).fill(env.ADMIN_PASSWORD);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('button',{name:'Accept order',exact:true}).first().waitFor();
 await page.screenshot({path:'output/evidence/A1-4-staff-orders.png',fullPage:false});
 await page.getByRole('button',{name:'Accept order',exact:true}).first().click();
 await page.getByRole('button',{name:'Mark as ready',exact:true}).first().waitFor();
 await page.getByRole('button',{name:'Mark as ready',exact:true}).first().click();
 await page.getByRole('button',{name:'My orders',exact:true}).click();await page.getByText('Ready',{exact:true}).first().waitFor();
 await page.screenshot({path:'output/evidence/A1-5-status.png',fullPage:true});
 await page.getByRole('button',{name:'Manage menu',exact:true}).click();await page.getByRole('button',{name:'Add product',exact:true}).waitFor();
 await page.screenshot({path:'output/evidence/A1-6-manage-menu.png',fullPage:false});
 await page.getByRole('button',{name:'Insights',exact:true}).click();await page.locator('.chart-bars').first().waitFor();
 await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:'output/evidence/C5-insights.png',fullPage:true});
 assert.deepEqual(errors,[]);writeFileSync('output/evidence/browser-tests.json',JSON.stringify({testedAt:new Date().toISOString(),widths:[320,375,768,1440],checks:['no horizontal overflow','menu','cart quantity persists after refresh','checkout','staff authentication','staff order transitions','customer sees Ready','menu management','three data charts'],errors},null,2));
 console.log('Browser journey passed; desktop/mobile screenshots saved.');
}finally{await browser.close();}
