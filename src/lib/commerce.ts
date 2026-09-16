import catalog from '../../shared/catalog.json';
import { createClient } from '@supabase/supabase-js';
export { catalog };
export const money = (cents:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export type Line = {sku:string;quantity:number};
const key='borgas-cart-v1';
let fallback:Line[]=[];
export function cart():Line[]{
 try {const parsed:unknown=JSON.parse(localStorage.getItem(key)||'[]');return clean(parsed);}catch{return fallback;}
}
function clean(input:unknown):Line[]{
 if(!Array.isArray(input))return [];
 const result:Line[]=[];
 for(const p of catalog){const line=input.find(x=>x?.sku===p.sku);if(line&&Number.isInteger(line.quantity)&&line.quantity>0)result.push({sku:p.sku,quantity:Math.min(line.quantity,10)});}
 return result;
}
export function saveCart(lines:Line[]){fallback=clean(lines);try{localStorage.setItem(key,JSON.stringify(fallback));}catch{queueMicrotask(()=>document.dispatchEvent(new Event('cart-storage-unavailable')));}document.dispatchEvent(new Event('cart-change'));}
export function add(sku:string){const lines=cart();const line=lines.find(x=>x.sku===sku);if(line){if(line.quantity>=10)return false;line.quantity++;}else lines.push({sku,quantity:1});saveCart(lines);return true;}
export const apiBase=(import.meta.env.PUBLIC_COMMERCE_API_URL||'').replace(/[/]$/,'');
const authUrl=import.meta.env.PUBLIC_SUPABASE_URL;
const authKey=import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const auth=authUrl&&authKey?createClient(authUrl,authKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}}):null;
export async function api(path:string,body?:unknown){
 if(!apiBase)throw new Error('Online checkout is being prepared. Your cart is saved on this device.');
 const {data}=auth?await auth.auth.getSession():{data:{session:null}};
 const response=await fetch(apiBase+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(data.session?{Authorization:'Bearer '+data.session.access_token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'The request could not be completed. Please try again.');return result;
}
