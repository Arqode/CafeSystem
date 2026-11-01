import {createRequire} from 'node:module';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('C:/Users/sirga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const dir='output/PartB_review';mkdirSync(`${dir}/screenshots`,{recursive:true});
const env=Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:375,height:812}});
const page=await context.newPage();const evidence=[];
try{
 await page.goto('http://localhost:4000');await page.locator('.product-card').first().waitFor();
 const navigation=await page.locator('nav.tabs').evaluate(nav=>({clientWidth:nav.clientWidth,scrollWidth:nav.scrollWidth,items:[...nav.querySelectorAll('button')].map(b=>({label:b.textContent,left:b.getBoundingClientRect().left,right:b.getBoundingClientRect().right})),viewport:innerWidth}));
 assert.ok(navigation.scrollWidth>navigation.clientWidth);
 await page.screenshot({path:`${dir}/screenshots/F01-mobile-navigation.png`});
 evidence.push({id:'F01',observation:'At 375px some navigation destinations are outside the visible tab strip. They require horizontal scrolling without an explicit instruction.',heuristic:'Recognition rather than recall; visibility of system status',measurement:navigation,plan:'Add a clearly labelled mobile navigation control or a visible scroll hint.'});
 const search=page.getByRole('searchbox',{name:'Search menu'});
 await search.fill('Cheeseburger');await page.locator('.product-card').first().waitFor();assert.equal(await page.locator('.product-card').count(),1);
 await search.fill(' Cheeseburger ');await page.getByText('Nothing found. Try another category or word.').waitFor();assert.equal(await page.locator('.product-card').count(),0);
 await page.getByText('Nothing found. Try another category or word.').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/screenshots/F02-search-spaces.png`});
 evidence.push({id:'F02',observation:'Cheeseburger returns one product, but the same name with leading and trailing spaces returns zero products.',heuristic:'Error prevention; flexibility and efficiency of use',measurement:{query:' Cheeseburger ',expectedMatches:1,actualMatches:0},plan:'Trim whitespace before matching search input; repeat both queries.'});
 await page.goto('http://localhost:4000/#manage');await page.getByLabel('Username',{exact:true}).fill('admin');await page.getByLabel('Password',{exact:true}).fill(env.ADMIN_PASSWORD);await page.getByRole('button',{name:'Sign in',exact:true}).click();
 const edit=page.getByRole('button',{name:'Edit',exact:true}).last();await edit.waitFor();await edit.scrollIntoViewIfNeeded();await edit.click();await page.getByRole('heading',{name:'Edit product',exact:true}).waitFor();
 const bounds=await page.locator('form.card').evaluate(form=>({top:form.getBoundingClientRect().top,bottom:form.getBoundingClientRect().bottom,viewport:innerHeight,activeElement:document.activeElement?.textContent}));
 await page.screenshot({path:`${dir}/screenshots/F03-edit-after-click.png`});
 const hidden=bounds.bottom<0||bounds.top>=bounds.viewport;assert.ok(hidden,'Edit form should reproduce as outside viewport');
 await page.locator('form.card').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/screenshots/F03-edit-form-above.png`});
 evidence.push({id:'F03',observation:'Editing the last product opens a form above the current scroll position. The form is outside the viewport and focus remains on Edit.',heuristic:'Visibility of system status',measurement:bounds,plan:'After opening edit, scroll to the form and focus its Name field. Retest the last product on mobile.'});
 writeFileSync(`${dir}/review-results.json`,JSON.stringify({reviewedAt:new Date().toISOString(),reviewer:'Codex automated browser-assisted review; not external human participants',browser:browser.version(),viewport:'375x812',evidence},null,2));
 console.log('Confirmed and captured',evidence.length,'reproducible observations. No product changes or orders were submitted.');
}finally{await browser.close();}
