/* CHOCO SHIP — Customer cart live sync v3 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_CART_SYNC__)return;
  window.__CHOCO_CUSTOMER_CART_SYNC__=true;
  const KEY='choco_customer_cart_v1',U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co',K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>String(localStorage.getItem('choco_access_token')||'').trim();
  const save=c=>{try{localStorage.setItem(KEY,JSON.stringify(c));localStorage.setItem('choco_customer_cart_backup_v1',JSON.stringify(c))}catch{}};
  async function sync(){
    const c=Array.isArray(window.cart)?window.cart:[];
    if(!c.length)return;
    const ids=[...new Set(c.map(x=>Number(x?.foodId??x?.food_id)).filter(Number.isInteger))];
    if(!ids.length)return;
    const t=token();if(!t)return;
    try{
      const q=ids.map(encodeURIComponent).join(',');
      const r=await fetch(U+'/rest/v1/menu_items?id=in.('+q+')&select=id,restaurant_id,name,price,is_available',{headers:{apikey:K,Authorization:'Bearer '+t,Accept:'application/json'}});
      if(!r.ok)return;
      const rows=await r.json();
      // Empty/partial RLS responses must never erase a customer's unsubmitted cart.
      if(!Array.isArray(rows)||rows.length===0){save(c);return;}
      const byId=new Map(rows.map(x=>[String(x.id),x]));
      let changed=false,unavailable=0,priceChanged=0;
      const next=[];
      for(const x of c){
        const id=String(x?.foodId??x?.food_id),m=byId.get(id);
        // If the item is temporarily unavailable or hidden by RLS, KEEP it in the cart.
        if(!m){next.push(x);continue}
        const oldPrice=Number(x.price||0),newPrice=Number(m.price||0);
        if(m.is_available!==true)unavailable++;
        if(oldPrice!==newPrice)priceChanged++;
        const item={...x,foodId:Number(m.id),restaurantId:Number(m.restaurant_id),name:String(m.name||x.name||'Món ăn'),price:newPrice,qty:Math.max(1,Math.min(99,Number(x.qty)||1)),isAvailable:m.is_available===true};
        if(item.restaurantId!==Number(x.restaurantId)||item.name!==String(x.name||'')||item.price!==oldPrice||item.isAvailable!==x.isAvailable)changed=true;
        next.push(item);
      }
      const restaurants=[...new Set(next.map(x=>String(x.restaurantId)))];
      if(restaurants.length>1)return;
      if(!changed){save(c);window.__CHOCO_CART_SYNC_STATUS__={ok:true,unavailable,priceChanged};return}
      window.cart=next;save(next);
      if(typeof window.updateCart==='function')window.updateCart();
      if(typeof window.renderCart==='function')window.renderCart();
      window.__CHOCO_CART_SYNC_STATUS__={ok:true,unavailable,priceChanged};
      if(unavailable||priceChanged){
        const msg=unavailable&&priceChanged?'⚠️ Một số món hiện tạm hết bán và giá món đã thay đổi.':unavailable?'⚠️ Một số món hiện tạm hết bán nhưng vẫn được giữ trong giỏ.':'ℹ️ Giá một số món trong giỏ vừa được cập nhật.';
        const box=document.getElementById('cartItems');
        if(box){const n=document.createElement('div');n.style.cssText='background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:10px;padding:9px;margin-bottom:8px;font-size:13px';n.textContent=msg+(priceChanged?' Giá mới đã được cập nhật.':'');box.prepend(n)}
      }
    }catch(e){console.warn('CHOCO CART SYNC',e);save(c)}
  }
  window.__CHOCO_SYNC_CART__=sync;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,900));
  window.addEventListener('focus',sync);
  window.addEventListener('storage',e=>{if(e.key===KEY)setTimeout(sync,100)});
})();