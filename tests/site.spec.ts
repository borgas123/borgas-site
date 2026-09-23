import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
const routes=['/','/products/','/racing/','/diagnostics/','/software/','/products/asset-creator/','/products/brc-02/','/products/brc-fl/','/products/bfd-01/','/products/bps-01/','/support/','/about/','/contact/','/privacy/','/bac/license/','/bac/refunds/','/404.html'];
test('every page: responsive reflow, accessibility, headings and local destinations',async({page})=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of routes){
  await page.goto(route);await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',/.+/);
  for(const width of [320,390,768,1024,1440]){
   await page.setViewportSize({width,height:900});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow at '+width).toBeTruthy();
   if((route==='/'||route==='/products/brc-02/')&&(width===390||width===1440))await page.screenshot({path:'qa-artifacts/'+(route==='/'?'home':'brc-02')+'-'+width+'.png',fullPage:true});
  }
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),route).toEqual([]);
  const refs=await page.locator('a[href],img[src],link[rel="icon"]').evaluateAll(els=>els.map(el=>el.getAttribute('href')||el.getAttribute('src')||'').filter(s=>s.startsWith('/')));
  for(const ref of refs){const url=new URL(ref,'http://localhost');let target=path.join('dist',decodeURIComponent(url.pathname));if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');if(!fs.existsSync(target))target=path.join('dist',url.pathname,'index.html');expect(fs.existsSync(target),route+' broken link '+ref).toBeTruthy();}
 }
 expect(errors).toEqual([]);
});
test('mobile menu keyboard and filter history',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('button',{name:/Menu/}).focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('navigation',{name:'Primary'})).toBeVisible();await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:/Menu/})).toBeFocused();await expect(page.getByRole('navigation',{name:'Primary'})).toBeHidden();
 await page.goto('/products/?family=racing');await expect(page.locator('[data-family]:visible')).toHaveCount(2);
 await page.getByRole('link',{name:'Diagnostic Systems',exact:true}).first().click();await expect(page.locator('[data-family]:visible')).toHaveCount(2);await expect(page).toHaveURL(/family=diagnostics/);await page.goBack();await expect(page).toHaveURL(/family=racing/);
 await page.getByRole('link',{name:'All products',exact:true}).first().click();await expect(page.locator('[data-family]:visible')).toHaveCount(5);
});
test('no scripts: mobile navigation and inquiry links remain usable',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:800}});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4322/products/brc-02/');await expect(page.getByRole('navigation',{name:'Primary'})).toBeVisible();const link=page.getByRole('link',{name:'Ask about BRC-02',exact:true}).first();await expect(link).toHaveAttribute('href',/product=BRC-02.*Purchase%20inquiry/);await context.close();
});
test('public output excludes draft records and private assets',async()=>{
 const files=fs.readdirSync('dist',{recursive:true}).map(String);
 expect(files.some(f=>/private|guided-test|main-menu|content-register/.test(f))).toBeFalsy();
 for(const f of files.filter(f=>/\.(html|js|json|xml)$/.test(f))){const content=fs.readFileSync(path.join('dist',f),'utf8');expect(content,'internal content in '+f).not.toMatch(/BML-01|BVA-01|BEP-01|BST-01|BORGAS-Master|OneDrive|HP Indigo|guided-test\.png/);}
});
