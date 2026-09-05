/* CHOCO SHIP — Customer cart live sync v1 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_CART_SYNC__)return;
  window.__CHOCO_CUSTOMER_CART_SYNC__=true;
  const KEY='choco_customer_cart_v1',U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co',K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>String(localStorage.getItem('choco_access_token')||'').trim();
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const save=c=>{try{localStorage.setItem(KEY,JSON.stringify(c))}catch{}};
  async function sync(){
    const c=Array.isArray(window.cart)?window.cart:[];
    if(!c.length)return;
    const ids=[...new Set(c.map(x=>Number(x?.foodId??x?.food_id)).filter(Number.isInteger))];
    if(!ids.length)return;
    const t=token(); if(!t)return;
    try{
      const q=ids.map(encodeURIComponent).join(',');
      const r=await fetch(U+'/rest/v1/menu_items?id=in.('+q+')&select=id,restaurant_id,name,price,is_available',{headers:{apikey:K,Authorization:'Bearer '+t,Accept:'application/json'}});
      if(!r.ok)return;
      const rows=await r.json(),byId=new Map(rows.map(x=>[String(x.id),x]));
      let changed=false,removed=0,priceChanged=0;
      const next=[];
      for(const x of c){
        const id=String(x?.foodId??x?.food_id),m=byId.get(id);
        if(!m||m.is_available!==true){removed++;changed=true;continue}
        const oldPrice=Number(x.price||0),newPrice=Number(m.price||0);
        if(oldPrice!==newPrice)priceChanged++;
        const item={...x,foodId:Number(m.id),restaurantId:Number(m.restaurant_id),name:String(m.name||x.name||'Món ăn'),price:newPrice,qty:Math.max(1,Math.min(99,Number(x.qty)||1))};
        if(item.restaurantId!==Number(x.restaurantId)){changed=true}
        if(item.name!==String(x.name||'')||item.price!==oldPrice)changed=true;
        next.push(item);
      }
      if(!changed){window.__CHOCO_CART_SYNC_STATUS__={ok:true,removed:0,priceChanged:0};return}
      const restaurants=[...new Set(next.map(x=>String(x.restaurantId)))];
      if(restaurants.length>1){next.length=0;removed=c.length;}
      window.cart=next;save(next);
      if(typeof window.updateCart==='function')window.updateCart();
      if(typeof window.renderCart==='function')window.renderCart();
      window.__CHOCO_CART_SYNC_STATUS__={ok:true,removed,priceChanged};
      if(removed||priceChanged){
        const msg=removed&&priceChanged?'⚠️ Một số món trong giỏ đã hết bán và giá món đã thay đổi.':removed?'⚠️ Một số món trong giỏ đã hết bán nên đã được xóa.':'ℹ️ Giá một số món trong giỏ vừa được cập nhật.';
        const box=document.getElementById('cartItems');
        if(box){const n=document.createElement('div');n.style.cssText='background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:10px;padding:9px;margin-bottom:8px;font-size:13px';n.textContent=msg+(priceChanged?' Giá mới đã được cập nhật.':'');box.prepend(n);}
      }
    }catch(e){console.warn('CHOCO CART SYNC',e)}
  }
  window.__CHOCO_SYNC_CART__=sync;
  document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,900));
  window.addEventListener('focus',sync);
  window.addEventListener('storage',e=>{if(e.key===KEY)setTimeout(sync,100)});
})();
