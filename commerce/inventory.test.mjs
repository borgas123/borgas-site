import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from './worker.mjs';

function database(){
 const sqlite=new DatabaseSync(':memory:');
 for(const name of ['0001_shop.sql','0002_payment_environment.sql','0003_inventory_reservations.sql'])sqlite.exec(readFileSync(new URL('./migrations/'+name,import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...values){const stmt=sqlite.prepare(sql);return {_sql:sql,_values:values,first:async()=>stmt.get(...values),all:async()=>({results:stmt.all(...values)}),run:async()=>stmt.run(...values)};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(item=>sqlite.prepare(item._sql).run(...item._values));sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 return {sqlite,DB};
}

test('inventory constraints prevent reserving more units than are on hand',()=>{
 const {sqlite}=database();
 try{
  sqlite.prepare("UPDATE inventory SET on_hand = 2 WHERE sku = 'brc-02'").run();
  sqlite.prepare("UPDATE inventory SET reserved = reserved + 2 WHERE sku = 'brc-02'").run();assert.deepEqual({...sqlite.prepare("SELECT on_hand,reserved FROM inventory WHERE sku='brc-02'").get()},{on_hand:2,reserved:2});
  assert.throws(()=>sqlite.prepare("UPDATE inventory SET reserved = reserved + 1 WHERE sku = 'brc-02'").run(),/CHECK constraint failed/);
  sqlite.prepare("UPDATE inventory SET reserved = reserved - 2 WHERE sku = 'brc-02'").run();assert.equal(sqlite.prepare("SELECT reserved FROM inventory WHERE sku='brc-02'").get().reserved,0);
  sqlite.prepare("UPDATE inventory SET reserved = reserved + 1 WHERE sku = 'brc-02'").run();sqlite.prepare("UPDATE inventory SET on_hand = on_hand - 1, reserved = reserved - 1 WHERE sku = 'brc-02'").run();assert.deepEqual({...sqlite.prepare("SELECT on_hand,reserved FROM inventory WHERE sku='brc-02'").get()},{on_hand:1,reserved:0});
 }finally{sqlite.close();}
});

test('production checkout reserves stock and consumes it after verified capture',async t=>{
 const {sqlite,DB}=database();sqlite.prepare("UPDATE inventory SET on_hand = 1 WHERE sku = 'brc-02'").run();
 const env={DB,SITE_ORIGIN:'https://borgas.us',CHECKOUT_ENABLED:'true',PAYPAL_ENV:'live',PAYPAL_CLIENT_ID:'live-client',PAYPAL_SECRET:'live-secret',PAYPAL_MERCHANT_ID:'merchant',PAYPAL_WEBHOOK_ID:'webhook',SUPABASE_URL:'https://auth.test',SUPABASE_PUBLISHABLE_KEY:'test-key',DELIVERY_QUOTE_URL:'https://delivery.test/quote',DELIVERY_QUOTE_TOKEN:'delivery-secret',POLICIES_APPROVED:'true',AUTH_EMAIL_READY:'true'};
 const originalFetch=globalThis.fetch;let createdPayload,paypalOrder;
 globalThis.fetch=async(url,options={})=>{
  if(url==='https://auth.test/auth/v1/user')return Response.json({id:'owner',email:'owner@example.test',email_confirmed_at:'2026-01-01T00:00:00Z'});
  if(url==='https://delivery.test/quote')return Response.json({available:true,shipping:1000,tax:1200});
  if(url==='https://api-m.paypal.com/v1/oauth2/token')return Response.json({access_token:'live-token'});
  if(url==='https://api-m.paypal.com/v2/checkout/orders'&&options.method==='POST'){createdPayload=JSON.parse(options.body);paypalOrder={id:'LIVEPAY123',status:'APPROVED',purchase_units:createdPayload.purchase_units};return Response.json({id:paypalOrder.id});}
  if(url.endsWith('/LIVEPAY123/capture')){paypalOrder.status='COMPLETED';paypalOrder.purchase_units[0].payments={captures:[{id:'CAPTURELIVE',status:'COMPLETED',amount:{currency_code:'USD',value:'171.99'}}]};return Response.json(paypalOrder);}
  if(url.endsWith('/LIVEPAY123'))return Response.json(paypalOrder);
  throw new Error('Unexpected network request: '+url);
 };
 t.after(()=>{globalThis.fetch=originalFetch;sqlite.close();});
 const call=(path,payload)=>worker.fetch(new Request('https://api.test'+path,{method:payload===undefined?'GET':'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json',Origin:'https://borgas.us'},...(payload===undefined?{}:{body:JSON.stringify(payload)})}),env);
 const input={lines:[{sku:'brc-02',quantity:1}],address:{fullName:'Test Person',addressLine1:'1 Test Street',city:'Test City',state:'NY',postalCode:'12207'}};
 assert.equal((await call('/quote',input)).status,200);
 const created=await call('/orders',{...input,expectedTotal:17199});assert.equal(created.status,201);const {paypalId}=await created.json();assert.equal(paypalId,'LIVEPAY123');
 assert.deepEqual({...sqlite.prepare("SELECT on_hand,reserved FROM inventory WHERE sku='brc-02'").get()},{on_hand:1,reserved:1});
 assert.equal((await call('/quote',input)).status,409);
 const captured=await call('/capture',{paypalId});assert.equal((await captured.json()).status,'paid');
 assert.deepEqual({...sqlite.prepare("SELECT on_hand,reserved FROM inventory WHERE sku='brc-02'").get()},{on_hand:0,reserved:0});assert.equal(sqlite.prepare("SELECT status FROM inventory_reservations").get().status,'consumed');
});
