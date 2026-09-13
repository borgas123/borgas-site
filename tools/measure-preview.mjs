import {chromium} from '@playwright/test';
import fs from 'node:fs';
import zlib from 'node:zlib';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.addInitScript(()=>{window.metrics={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.metrics.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.metrics.cls+=e.value}).observe({type:'layout-shift',buffered:true});});
await page.goto('http://127.0.0.1:4322/',{waitUntil:'networkidle'});
const perf=await page.evaluate(()=>({metrics:window.metrics,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize})),navigation:performance.getEntriesByType('navigation')[0].encodedBodySize}));
const metrics={context:'Local headless Chrome, 390x844, unthrottled; lab observation only, not field Web Vitals.',lcpMs:perf.metrics.lcp,cls:perf.metrics.cls,initialEncodedBodyBytes:perf.navigation+perf.resources.reduce((n,r)=>n+r.bytes,0),firstPartyGzipJavaScriptBytes:zlib.gzipSync((fs.readFileSync('dist/index.html','utf8').match(/<script[^>]*>[\s\S]*?<\/script>/g)||[]).join('')).length+fs.readdirSync('dist/_astro').filter(f=>f.endsWith('.js')).reduce((n,f)=>n+zlib.gzipSync(fs.readFileSync('dist/_astro/'+f)).length,0)};
for(const width of [390,1440]){await page.setViewportSize({width,height:900});for(const route of ['/','/products/brc-02']){await page.goto('http://127.0.0.1:4322'+route);await page.locator('img').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode().catch(()=>{});}});await page.screenshot({path:'qa-artifacts/'+(route==='/'?'home':'brc-02')+'-'+width+'.png',fullPage:true});if(route==='/')await page.screenshot({path:'qa-artifacts/home-top-'+width+'.png'});}}
await page.setViewportSize({width:320,height:800});await page.goto('http://127.0.0.1:4322/');await page.addStyleTag({content:'html{font-size:200%}'});metrics.textZoomReflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
fs.writeFileSync('qa-artifacts/performance.json',JSON.stringify(metrics,null,2));
console.log(JSON.stringify(metrics,null,2));await browser.close();
