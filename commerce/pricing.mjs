import catalog from '../shared/catalog.json' with {type:'json'};
export class PublicError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export const dollars=cents=>(cents/100).toFixed(2);
export function items(lines){
 if(!Array.isArray(lines)||!lines.length||lines.length>catalog.length)throw new PublicError('Choose at least one product.');
 const seen=new Set();return lines.map(line=>{const p=catalog.find(p=>p.sku===line?.sku);if(!p||seen.has(p.sku)||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>10)throw new PublicError('Invalid product or quantity.');seen.add(p.sku);return {sku:p.sku,name:p.name+' '+p.subtitle,quantity:line.quantity,price:p.price};});
}
export function discountFor(subtotal,coupon,now=Date.now()){
 if(!coupon)return 0;
 if([coupon.starts_at,coupon.expires_at].some(date=>date&&!Number.isFinite(Date.parse(date))))throw new PublicError('This code is unavailable.');
 if(coupon.enabled!==1||(coupon.starts_at&&Date.parse(coupon.starts_at)>now)||(coupon.expires_at&&Date.parse(coupon.expires_at)<=now)||subtotal<coupon.minimum)throw new PublicError('This code is unavailable or its minimum purchase has not been met.');
 if(!Number.isSafeInteger(coupon.value)||coupon.value<=0||!Number.isSafeInteger(coupon.minimum)||coupon.minimum<0||!['percent','fixed'].includes(coupon.kind)||coupon.kind==='percent'&&coupon.value>10000)throw new PublicError('This code is unavailable.');
 return Math.min(subtotal,coupon.kind==='percent'?Math.round(subtotal*coupon.value/10000):coupon.value);
}
export function normalizeAddress(a){
 if(!a||typeof a!=='object')throw new PublicError('Enter your delivery address.');
 const result={};for(const [key,max] of Object.entries({fullName:100,addressLine1:200,addressLine2:200,city:100,state:2,postalCode:10})){const value=typeof a[key]==='string'?a[key].trim():'';if((key!=='addressLine2'&&!value)||value.length>max||/[\x00-\x1f]/.test(value))throw new PublicError('Check your delivery address.');result[key]=value;}
 result.state=result.state.toUpperCase();if(!/^[A-Z]{2}$/.test(result.state)||!/^\d{5}(-\d{4})?$/.test(result.postalCode))throw new PublicError('Use a US state code and valid ZIP code.');return result;
}
export function calculate(lines,coupon,delivery){
 const normalized=items(lines);const subtotal=normalized.reduce((s,l)=>s+l.quantity*l.price,0);const discount=discountFor(subtotal,coupon);
 if(!delivery||!Number.isSafeInteger(delivery.shipping)||delivery.shipping<0||!Number.isSafeInteger(delivery.tax)||delivery.tax<0)throw new PublicError('Delivery and tax could not be confirmed. Please contact BORGAS.',503);
 const total=subtotal-discount+delivery.shipping+delivery.tax;if(total<=0||!Number.isSafeInteger(total))throw new PublicError('This order cannot be processed.');
 return {items:normalized,subtotal,discount,shipping:delivery.shipping,tax:delivery.tax,total,currency:'USD'};
}
export function validCapture(order,paypal,merchantId){
 const units=paypal.purchase_units;if(paypal.id!==order.paypal_id||paypal.status!=='COMPLETED'||!Array.isArray(units)||units.length!==1)return false;
 const unit=units[0];const captures=unit.payments?.captures;
 return unit.custom_id===order.id&&unit.payee?.merchant_id===merchantId&&captures?.length===1&&captures[0].status==='COMPLETED'&&captures[0].amount?.currency_code==='USD'&&captures[0].amount.value===dollars(order.total);
}
