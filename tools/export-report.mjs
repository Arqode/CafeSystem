import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const runtime='C:/Users/sirga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
let chromium,marked;try{({chromium}=require('playwright'));}catch{({chromium}=require(runtime+'playwright'));}
try{({marked}=require('marked'));}catch{({marked}=require(runtime+'marked'));}
mkdirSync('output/pdf',{recursive:true});
let body=marked.parse(readFileSync('docs/ENDTERM_REPORT.md','utf8'));
body=body.replace(/<img src="([^"]+)" alt="([^"]*)">/g,(_m,src,alt)=>`<img src="data:image/png;base64,${readFileSync(path.resolve('docs',src)).toString('base64')}" alt="${alt}"><span class="caption">${alt}</span>`);
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>DashFood Endterm Draft</title><style>
@page{size:A4;margin:17mm 15mm 20mm}*{box-sizing:border-box}body{font:10pt/1.45 Arial,sans-serif;color:#152344}h1{font-size:27pt;color:#1854ed;line-height:1.15;margin:0 0 15pt}h2{break-before:page;font-size:20pt;color:#1854ed;margin:0 0 15pt}h3{font-size:13pt;margin:17pt 0 7pt;break-after:avoid}p{margin:7pt 0;widows:3;orphans:3}table{width:100%;border-collapse:collapse;font-size:8pt;margin:12pt 0}thead{display:table-header-group}tr{break-inside:avoid}th,td{border:1px solid #d8e0ef;padding:6pt;text-align:left;vertical-align:top}th{background:#eaf0ff}a{color:#1854ed;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:8pt/1.5 Consolas,monospace;background:#f1f5fc;padding:12pt;break-inside:avoid}code{font-family:Consolas,monospace;font-size:9pt}img{display:block;max-width:100%;max-height:135mm;object-fit:contain;margin:12pt auto 3pt}.caption{display:block;text-align:center;font-size:9pt;color:#526174;margin:3pt 0 14pt}p:has(img){break-inside:avoid}li{margin:5pt 0}strong{font-weight:700}
</style><body>${body}</body></html>`;
writeFileSync('output/pdf/DashFood_Endterm_DRAFT.html',html);
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage();await page.goto(pathToFileURL(path.resolve('output/pdf/DashFood_Endterm_DRAFT.html')).href);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.pdf({path:'output/pdf/DashFood_Endterm_DRAFT.pdf',format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;font:9px Arial;color:#64748b;padding:0 50px;display:flex;justify-content:space-between"><span>DashFood · Stage 2 · Draft pending external testing</span><span class="pageNumber"></span></div>',margin:{top:'17mm',bottom:'20mm',left:'15mm',right:'15mm'}});console.log('Exported output/pdf/DashFood_Endterm_DRAFT.pdf');}finally{await browser.close();}
