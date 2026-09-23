import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from './worker.mjs';
import {verifyLicense} from './licenses.mjs';

// BORGAS Asset Creator: a digital product sold through the same checkout.
function database(){
 const sqlite=new DatabaseSync(':memory:');
 for(const name of ['0001_shop.sql','0002_payment_environment.sql','0003_inventory_reservations.sql','0004_licenses.sql'])sqlite.exec(readFileSync(new URL('./migrations/'+name,import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...values){const stmt=sqlite.prepare(sql);return {_sql:sql,_values:values,first:async()=>stmt.get(...values),all:async()=>({results:stmt.all(...values)}),run:async()=>stmt.run(...values)};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(item=>sqlite.prepare(item._sql).run(...item._values));sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 return {sqlite,DB};
}
const seed=Buffer.from([...Array(32).keys()]).toString('base64');
async function publicFor(seedB64){const priv=await crypto.subtle.importKey('pkcs8',Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(seedB64,'base64')]),{name:'Ed25519'},true,['sign']);return Buffer.from((await crypto.subtle.exportKey('jwk',priv)).x,'base64url').toString('base64');}

async function setup(t,extra={}){
 const {sqlite,DB}=database();
 const env={DB,SITE_ORIGIN:'https://borgas.us',CHECKOUT_ENABLED:'true',PAYPAL_ENV:'live',PAYPAL_CLIENT_ID:'live-client',PAYPAL_SECRET:'live-secret',PAYPAL_MERCHANT_ID:'merchant',PAYPAL_WEBHOOK_ID:'webhook',SUPABASE_URL:'https://auth.test',SUPABASE_PUBLISHABLE_KEY:'test-key',FREE_US_SHIPPING:'true',SALES_TAX_STATE:'MA',SALES_TAX_BPS:'625',POLICIES_APPROVED:'true',AUTH_EMAIL_READY:'true',LICENSE_SIGNING_KEY:seed,LICENSE_PUBLIC_KEY:await publicFor(seed),...extra};
 const originalFetch=globalThis.fetch;const state={created:null,order:null,captureValue:null,emails:[]};
 globalThis.fetch=async(url,options={})=>{
  if(url==='https://auth.test/auth/v1/user')return Response.json({id:'buyer',email:'buyer@example.test',email_confirmed_at:'2026-01-01T00:00:00Z'});
  if(url==='https://api-m.paypal.com/v1/oauth2/token')return Response.json({access_token:'live-token'});
  if(url==='https://api-m.paypal.com/v2/checkout/orders'&&options.method==='POST'){state.created=JSON.parse(options.body);state.order={id:'BACPAY001',status:'APPROVED',purchase_units:state.created.purchase_units};return Response.json({id:state.order.id});}
  if(url.endsWith('/BACPAY001/capture')){state.order.status='COMPLETED';state.order.purchase_units[0].payments={captures:[{id:'BACCAPTURE1',status:'COMPLETED',amount:{currency_code:'USD',value:state.created.purchase_units[0].amount.value}}]};return Response.json(state.order);}
  if(url.endsWith('/BACPAY001'))return Response.json(state.order);
  if(url==='https://api.resend.com/emails'){state.emails.push(JSON.parse(options.body));return Response.json({id:'email1'});}
  throw new Error('Unexpected network request: '+url);
 };
 t.after(()=>{globalThis.fetch=originalFetch;sqlite.close();});
 const call=(path,payload)=>worker.fetch(new Request('https://api.test'+path,{method:payload===undefined?'GET':'POST',headers:{Authorization:'Bearer buyer','Content-Type':'application/json',Origin:'https://borgas.us'},...(payload===undefined?{}:{body:JSON.stringify(payload)})}),env);
 return {sqlite,env,state,call};
}
const billing={fullName:'Zoë Buyer',addressLine1:'1 Test Street',city:'Boston',state:'MA',postalCode:'02108'};

test('buying BAC: MA tax, no stock or shipping, key issued once and shown on the account page',async t=>{
 const {sqlite,env,state,call}=await setup(t,{RESEND_API_KEY:'re_test',LICENSE_EMAIL_FROM:'BORGAS <licenses@borgas.us>'});
 const input={lines:[{sku:'bac',quantity:1}],address:billing};
 const quote=await (await call('/quote',input)).json();
 assert.deepEqual({subtotal:quote.subtotal,shipping:quote.shipping,tax:quote.tax,total:quote.total},{subtotal:10000,shipping:0,tax:625,total:10625});
 const created=await call('/orders',{...input,expectedTotal:10625});assert.equal(created.status,201);
 const unit=state.created.purchase_units[0];
 assert.equal(unit.items[0].category,'DIGITAL_GOODS');assert.equal(unit.shipping,undefined);
 assert.equal(state.created.payment_source.paypal.experience_context.shipping_preference,'NO_SHIPPING');
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM inventory_reservations').get().n,0);   // no stock involved
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM licenses').get().n,0);                 // nothing before payment
 const captured=await (await call('/capture',{paypalId:'BACPAY001'})).json();assert.equal(captured.status,'paid');
 const row=sqlite.prepare('SELECT * FROM licenses').get();
 assert.equal(row.sku,'bac');assert.equal(row.licensee,'Zoë Buyer');assert.equal(row.payment_env,'live');assert.ok(row.emailed_at);
 const doc=JSON.parse(Buffer.from(row.license_key.slice(5),'base64url').toString());
 assert.equal(await verifyLicense(doc,env.LICENSE_PUBLIC_KEY),true);
 assert.equal(doc.orderId,sqlite.prepare('SELECT id FROM orders').get().id);assert.equal(doc.edition,'indie');assert.equal(doc.licenseId,row.license_id);
 assert.equal(state.emails.length,1);assert.equal(state.emails[0].to[0],'buyer@example.test');assert.ok(state.emails[0].text.includes(row.license_key));
 // Repeated confirmations (capture retry, account page visits) never issue or email a second key.
 await call('/capture',{paypalId:'BACPAY001'});
 const history=await (await call('/orders')).json();await call('/orders');
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM licenses').get().n,1);assert.equal(state.emails.length,1);
 assert.deepEqual(history.orders[0].licenses,[{sku:'bac',key:row.license_key}]);
 assert.equal(history.orders[0].details,undefined);                                            // internal order data stays private
});

test('launch price for the first 100 licenses, then the regular price; Sandbox sales do not count',async t=>{
 const {sqlite,call}=await setup(t);
 let seq=0;const add=(n,env)=>{for(let i=0;i<n;i++){const id=env+'-'+(seq++);sqlite.prepare("INSERT INTO orders (id,user_id,email,total,details,status,created_at,payment_env) VALUES (?,?,?,?,?,?,?,?)").run(id,'u','u@x',10000,'{}','paid','2026-09-23',env);sqlite.prepare("INSERT INTO licenses VALUES (?,?,?,?,?,?,?,?,?)").run('L'+id,id,'bac',env,'n','u@x','BAC1-x','2026-09-23',null);}};
 const input={lines:[{sku:'bac',quantity:1}],address:{...billing,state:'NY',postalCode:'12207'}};
 add(99,'live');add(50,'sandbox');
 assert.equal((await (await call('/quote',input)).json()).total,10000);        // 99 sold: launch price
 add(1,'live');
 assert.equal((await (await call('/quote',input)).json()).total,15000);        // 100 sold: regular price
 const config=await (await call('/config')).json();assert.equal(config.prices.bac,15000);assert.equal(config.licensing,true);
});

test('one license per order, and no order is started when signing is not configured',async t=>{
 const {sqlite,call}=await setup(t);
 const two=await call('/quote',{lines:[{sku:'bac',quantity:2}],address:billing});assert.equal(two.status,400);assert.match((await two.json()).error,/Only 1/);
 const unconfigured=await setup(t,{LICENSE_SIGNING_KEY:''});
 const q=await unconfigured.call('/quote',{lines:[{sku:'bac',quantity:1}],address:billing});assert.equal(q.status,503);
 const o=await unconfigured.call('/orders',{lines:[{sku:'bac',quantity:1}],address:billing,expectedTotal:10625});assert.equal(o.status,503);
 assert.equal(unconfigured.sqlite.prepare('SELECT COUNT(*) AS n FROM orders').get().n,0);
 assert.equal(unconfigured.state.created,null);                                              // PayPal never contacted
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM orders').get().n,0);
});

test('mixed cart: hardware keeps its shipping address and stock, BAC does not',async t=>{
 const {sqlite,state,call}=await setup(t);sqlite.prepare("UPDATE inventory SET on_hand = 1 WHERE sku = 'brc-02'").run();
 const input={lines:[{sku:'brc-02',quantity:1},{sku:'bac',quantity:1}],address:billing};
 const quote=await (await call('/quote',input)).json();assert.equal(quote.subtotal,24999);
 assert.equal((await call('/orders',{...input,expectedTotal:quote.total})).status,201);
 const unit=state.created.purchase_units[0];
 assert.ok(unit.shipping);assert.equal(state.created.payment_source.paypal.experience_context.shipping_preference,'SET_PROVIDED_ADDRESS');
 assert.deepEqual(unit.items.map(i=>i.category),['PHYSICAL_GOODS','DIGITAL_GOODS']);
 assert.deepEqual(sqlite.prepare('SELECT sku FROM inventory_reservations').all().map(r=>r.sku),['brc-02']);
 await call('/capture',{paypalId:'BACPAY001'});
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM licenses').get().n,1);
 assert.equal(sqlite.prepare("SELECT on_hand FROM inventory WHERE sku='brc-02'").get().on_hand,0);
});
