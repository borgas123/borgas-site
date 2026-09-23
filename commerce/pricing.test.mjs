import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,discountFor,items,normalizeAddress,validCapture} from './pricing.mjs';
import worker from './worker.mjs';
const lines=[{sku:'brc-02',quantity:1},{sku:'bfd-01-generic',quantity:1}];
test('confirmed USD catalog prices, integer cents and tax/shipping',()=>{assert.equal(calculate(lines,null,{shipping:1200,tax:4800}).total,65998);});
test('never trusts a browser-supplied unit price',()=>{assert.equal(calculate([{sku:'brc-02',quantity:2,price:1}],null,{shipping:0,tax:0}).total,29998);});
test('rejects unknown, duplicate, fractional, negative and excessive quantities',()=>{for(const input of [[{sku:'fake',quantity:1}],[lines[0],lines[0]],[{sku:'brc-02',quantity:1.2}],[{sku:'brc-02',quantity:-1}],[{sku:'brc-02',quantity:11}],[]])assert.throws(()=>items(input));});
test('percentage rounding and fixed discount cap',()=>{assert.equal(discountFor(14999,{enabled:1,kind:'percent',value:1000,minimum:0}),1500);assert.equal(discountFor(14999,{enabled:1,kind:'fixed',value:20000,minimum:0}),14999);});
test('rejects expired, disabled, future and minimum-not-met codes',()=>{for(const changes of [{enabled:0},{expires_at:'2020-01-01T00:00:00Z'},{starts_at:'2099-01-01T00:00:00Z'},{minimum:20000}])assert.throws(()=>discountFor(14999,{enabled:1,kind:'percent',value:1000,minimum:0,...changes}));});
test('missing shipping or tax fails closed',()=>{for(const delivery of [null,{}, {shipping:0}, {shipping:0,tax:-1}])assert.throws(()=>calculate(lines,null,delivery));});
test('validates address and normalizes state',()=>{assert.equal(normalizeAddress({fullName:'Test Person',addressLine1:'1 Main St',city:'Albany',state:'ny',postalCode:'12207'}).state,'NY');assert.throws(()=>normalizeAddress({}));assert.throws(()=>normalizeAddress({fullName:'Test Person',addressLine1:'1 Main St',city:'Nowhere',state:'XX',postalCode:'00000'}));});
const order={id:'local-id',paypal_id:'PAYPAL123',total:14999};
function capture(){return {id:'PAYPAL123',status:'COMPLETED',purchase_units:[{custom_id:'local-id',payee:{merchant_id:'merchant'},payments:{captures:[{id:'CAPTURE1',status:'COMPLETED',amount:{currency_code:'USD',value:'149.99'}}]}}]};}
test('verifies payment ownership, merchant, currency, amount and completion',()=>{assert.equal(validCapture(order,capture(),'merchant'),true);for(const mutate of [p=>p.id='OTHER',p=>p.status='APPROVED',p=>p.purchase_units[0].custom_id='other',p=>p.purchase_units[0].payee.merchant_id='other',p=>p.purchase_units[0].payments.captures[0].amount.value='1.00',p=>p.purchase_units[0].payments.captures[0].amount.currency_code='EUR',p=>p.purchase_units[0].payments.captures[0].status='PENDING']){const p=capture();mutate(p);assert.equal(validCapture(order,p,'merchant'),false);}});
test('unconfigured service advertises checkout disabled',async()=>{const response=await worker.fetch(new Request('https://api.example/config'),{});assert.deepEqual(await response.json(),{checkoutEnabled:false,clientId:null,prices:{},licensing:false});});
test('rejects foreign origins',async()=>{const response=await worker.fetch(new Request('https://api.example/config',{headers:{Origin:'https://evil.example'}}),{SITE_ORIGIN:'https://borgas.us'});assert.equal(response.status,403);});
test('order history requires authentication',async()=>{const response=await worker.fetch(new Request('https://api.example/orders'),{DB:{}});assert.equal(response.status,401);});
