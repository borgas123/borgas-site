import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from './worker.mjs';

test('order API: server totals, account isolation, idempotent capture, verified webhook recovery',async t=>{
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('./migrations/0001_shop.sql',import.meta.url),'utf8'));
 sqlite.exec(readFileSync(new URL('./migrations/0002_payment_environment.sql',import.meta.url),'utf8'));
 sqlite.exec(readFileSync(new URL('./migrations/0003_inventory_reservations.sql',import.meta.url),'utf8'));sqlite.exec(readFileSync(new URL('./migrations/0004_licenses.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...values){const stmt=sqlite.prepare(sql);return {_sql:sql,_values:values,first:async()=>stmt.get(...values),all:async()=>({results:stmt.all(...values)}),run:async()=>stmt.run(...values)};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(item=>sqlite.prepare(item._sql).run(...item._values));sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 const env={DB,SITE_ORIGIN:'https://borgas.us',CHECKOUT_ENABLED:'true',PAYPAL_ENV:'sandbox',SANDBOX_TEST_MODE:'true',SANDBOX_TEST_EMAIL:'test@example.test',PAYPAL_CLIENT_ID:'test-client',PAYPAL_SECRET:'test-secret',PAYPAL_MERCHANT_ID:'merchant',PAYPAL_WEBHOOK_ID:'webhook',SUPABASE_URL:'https://auth.test',SUPABASE_PUBLISHABLE_KEY:'test-key',DELIVERY_QUOTE_URL:'https://delivery.test/quote',DELIVERY_QUOTE_TOKEN:'test-delivery'};
 const originalFetch=globalThis.fetch;let paypalOrder,createdPayload,captures=0,webhookValid=true,wrongAmount=false;
 globalThis.fetch=async(url,options={})=>{
  if(url==='https://auth.test/auth/v1/user')return Response.json({id:options.headers.Authorization==='Bearer other'?'other-user':'owner',email:'test@example.test',email_confirmed_at:'2026-01-01T00:00:00Z'});
  if(url==='https://delivery.test/quote')return Response.json({available:true,shipping:1000,tax:1200});
  if(url.endsWith('/v1/oauth2/token'))return Response.json({access_token:'sandbox-token'});
  if(url.endsWith('/v1/notifications/verify-webhook-signature'))return Response.json({verification_status:webhookValid?'SUCCESS':'FAILURE'});
  if(url.endsWith('/v2/checkout/orders')&&options.method==='POST'){createdPayload=JSON.parse(options.body);paypalOrder={id:'PAYPAL12345',status:'APPROVED',purchase_units:createdPayload.purchase_units,links:[{rel:'approve',href:'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL12345'}]};return Response.json({id:paypalOrder.id});}
  if(url.endsWith('/PAYPAL12345/capture')){captures++;assert.match(options.headers['PayPal-Request-Id'],/-c$/);paypalOrder.status='COMPLETED';paypalOrder.purchase_units[0].payments={captures:[{id:'CAPTURE123',status:'COMPLETED',amount:{currency_code:'USD',value:wrongAmount?'0.01':createdPayload.purchase_units[0].amount.value}}]};return Response.json(paypalOrder);}
  if(url.endsWith('/PAYPAL12345'))return Response.json(paypalOrder);
  throw new Error('Unexpected network request: '+url);
 };
 t.after(()=>{globalThis.fetch=originalFetch;sqlite.close();});
 const call=(path,body,token='owner')=>worker.fetch(new Request('https://api.test'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 const input={lines:[{sku:'brc-02',quantity:1,price:1}],code:'',address:{fullName:'Test Person',addressLine1:'1 Test Street',city:'Test City',state:'NY',postalCode:'12207'}};
 await t.test('price tampering cannot lower an order total',async()=>{const q=await (await call('/quote',input)).json();assert.equal(q.total,17199);assert.equal((await call('/orders',{...input,expectedTotal:1})).status,409);});
 await t.test('creates payment with server amount and specified shipping address',async()=>{const response=await call('/orders',{...input,expectedTotal:17199});assert.equal(response.status,201);assert.equal(createdPayload.purchase_units[0].amount.value,'171.99');assert.equal(createdPayload.payment_source.paypal.experience_context.shipping_preference,'SET_PROVIDED_ADDRESS');});
 await t.test('returns the approval URL only for the matching reviewed Sandbox total',async()=>{const response=await call('/sandbox/approval',{expectedTotal:17199});assert.equal(response.status,200);assert.equal((await response.json()).approval,'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL12345');assert.equal((await call('/sandbox/approval',{expectedTotal:1})).status,409);});
 await t.test('another account cannot capture or see this order',async()=>{assert.equal((await call('/capture',{paypalId:'PAYPAL12345'},'other')).status,404);assert.deepEqual((await(await call('/orders',undefined,'other')).json()).orders,[]);assert.equal(captures,0);});
 await t.test('mismatched capture amount never marks order paid',async()=>{wrongAmount=true;const response=await call('/capture',{paypalId:'PAYPAL12345'});assert.equal(response.status,409);assert.notEqual(sqlite.prepare('SELECT status FROM orders').get().status,'paid');});
 await t.test('unverified webhook cannot mark order paid',async()=>{webhookValid=false;const response=await call('/webhook',{event_type:'PAYMENT.CAPTURE.COMPLETED',resource:{supplementary_data:{related_ids:{order_id:'PAYPAL12345'}}}});assert.equal(response.status,401);assert.notEqual(sqlite.prepare('SELECT status FROM orders').get().status,'paid');});
 await t.test('verified webhook reconciles completed payment without browser callback',async()=>{webhookValid=true;paypalOrder.purchase_units[0].payments.captures[0].amount.value='171.99';const response=await call('/webhook',{event_type:'PAYMENT.CAPTURE.COMPLETED',resource:{supplementary_data:{related_ids:{order_id:'PAYPAL12345'}}}});assert.equal(response.status,200);assert.equal(sqlite.prepare('SELECT status FROM orders').get().status,'paid');});
 await t.test('capture retries do not charge again',async()=>{const before=captures;assert.equal((await(await call('/capture',{paypalId:'PAYPAL12345'})).json()).status,'paid');assert.equal(captures,before);});
 await t.test('owner sees confirmed order in history',async()=>{const history=(await(await call('/orders')).json()).orders;assert.equal(history.length,1);assert.equal(history[0].status,'paid');assert.equal(history[0].total,17199);assert.equal('email' in history[0],false);});
 await t.test('Sandbox completion is idempotent after reconciliation',async()=>{const before=captures;const result=await(await call('/sandbox/complete',{expectedTotal:17199})).json();assert.equal(result.status,'paid');assert.equal(captures,before);});
});
