import {auth,api,apiBase,money} from '../lib/commerce';
const el=(id:string)=>document.getElementById(id)!;
const status=(s:string)=>{el('account-status').textContent=s;};
let email='';
async function render(){
 if(!auth)return;
 const {data,error}=await auth.auth.getUser();const user=error?null:data.user;
 el('account-notice').hidden=true;el('email-form').hidden=!!user;el('code-form').hidden=true;el('signed-in').hidden=!user;el('order-history').hidden=!user;
 el('sandbox-controls').hidden=true;if(!user)return;
 if(apiBase)void api('/config').then(config=>{el('sandbox-controls').hidden=!config.sandbox;}).catch(()=>{});
 el('account-email').textContent=user.email||'';el('orders').textContent='Loading your orders…';
 if(!apiBase){el('orders').textContent='Order history will be available when checkout opens.';return;}
 try{const result=await api('/orders');el('orders').replaceChildren();if(!result.orders.length)el('orders').textContent='No orders yet. Your completed purchases will appear here.';
 for(const order of result.orders){const row=document.createElement('article');row.className='order-row';const title=document.createElement('h3');title.textContent='Order '+order.id.slice(0,8).toUpperCase();const detail=document.createElement('p');detail.textContent=new Date(order.created_at).toLocaleDateString()+' · '+money(order.total)+' · '+(order.payment_env==='sandbox'?'Sandbox test · ':'')+order.status;row.append(title,detail);
for(const lic of order.licenses||[]){const box=document.createElement('div');box.className='license-box';
const label=document.createElement('p');label.textContent='BORGAS Asset Creator license key';
const key=document.createElement('code');key.textContent=lic.key;key.className='license-key';
const copy=document.createElement('button');copy.type='button';copy.className='shop-btn secondary';copy.textContent='Copy key';
copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(lic.key);copy.textContent='Copied';}catch{copy.textContent='Select the key and copy it';}});
const how=document.createElement('p');how.className='small';how.textContent='In BAC, open Settings > License, paste the whole key (including BAC1-) and click Activate. Download BAC from the product page if you have not installed it yet.';
box.append(label,key,copy,how);row.append(box);}
el('orders').append(row);}}
 catch(e){el('orders').textContent=e instanceof Error?e.message:'Could not load orders.';}
}
async function submit(form:HTMLFormElement,fn:()=>Promise<void>){const button=form.querySelector<HTMLButtonElement>('button[type=submit]')!;button.disabled=true;status('');try{await fn();}catch(e){status(e instanceof Error?e.message:'Please try again.');}finally{button.disabled=false;}}
el('email-form').addEventListener('submit',e=>{e.preventDefault();void submit(e.currentTarget as HTMLFormElement,async()=>{email=(el('email') as HTMLInputElement).value.trim();const {error}=await auth!.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/account/'}});if(error)throw error;status('Check your email and open the sign-in link in this same browser. The link can be used once.');});});
el('code-form').addEventListener('submit',e=>{e.preventDefault();void submit(e.currentTarget as HTMLFormElement,async()=>{const {error}=await auth!.auth.verifyOtp({email,token:(el('code') as HTMLInputElement).value.trim(),type:'email'});if(error)throw error;await render();status('You are signed in.');if(new URLSearchParams(location.search).get('next')==='cart')location.assign('/cart/');});});
el('change-email').addEventListener('click',()=>{el('code-form').hidden=true;el('email-form').hidden=false;status('');el('email').focus();});
el('sign-out').addEventListener('click',async()=>{const {error}=await auth!.auth.signOut();if(error){status(error.message);return;}el('orders').replaceChildren();await render();status('You are signed out.');});
auth?.auth.onAuthStateChange(()=>{window.setTimeout(()=>{void render();},0);});
void render();

el('sandbox-check').addEventListener('click',async()=>{const button=el('sandbox-check') as HTMLButtonElement;button.disabled=true;status('Checking PayPal Sandbox credentials and webhook…');try{await api('/sandbox/check');status('PayPal Sandbox credentials and webhook verified. Ready for a test checkout.');}catch(error){status(error instanceof Error?error.message:'Connection check failed.');}finally{button.disabled=false;}});
