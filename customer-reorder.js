/* CHOCO SHIP — Customer reorder UX v1 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_REORDER__)return;
  window.__CHOCO_CUSTOMER_REORDER__=true;
  const U='https://guwdswqaqnhzqapflvey.supabase.co',K='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const H=()=>({apikey:K,Authorization:'Bearer '+(localStorage.getItem('choco_access_token')||''),Accept:'application/json'});
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  function parse(v){try{const x=Array.isArray(v)?v:JSON.parse(v||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  async function reorder(code){
    const uid=String(localStorage.getItem('choco_user_id')||'').trim(),token=String(localStorage.getItem('choco_access_token')||'').trim();
    if(!uid||!token)return alert('🔐 Vui lòng đăng nhập lại.');
    try{
      const r=await fetch(U+'/rest/v1/orders?customer_id=eq.'+encodeURIComponent(uid)+'&code=eq.'+encodeURIComponent(code)+'&select=items&limit=1',{headers:H()});
      if(!r.ok)throw Error('HTTP '+r.status);const rows=await r.json(),items=parse(rows[0]?.items);if(!items.length)throw Error('EMPTY');
      const cart=items.map(x=>({restaurantId:Number(x?.restaurantId??x?.restaurant_id),foodId:Number(x?.foodId??x?.food_id),name:String(x?.name??x?.foodName??x?.food_name??'').trim(),price:Number(x?.price??x?.unit_price??0),qty:Math.min(99,Math.max(1,Number(x?.qty??x?.quantity??1)))}));
      if(cart.some(x=>!Number.isInteger(x.restaurantId)||!Number.isInteger(x.foodId)||x.restaurantId<=0||x.foodId<=0||!Number.isFinite(x.price)||x.price<0))throw Error('INVALID');
      if(new Set(cart.map(x=>x.restaurantId)).size!==1)throw Error('MULTI');
      localStorage.setItem('choco_customer_cart_v1',JSON.stringify(cart));
      location.href='./customer.html?openCart=1';
    }catch(e){console.error('CHOCO REORDER',e);alert(e.message==='MULTI'?'⚠️ Đơn có nhiều quán, chưa thể đặt lại trong một giỏ.':'❌ Không thể đặt lại đơn này.');}
  }
  function attach(){
    const modal=document.getElementById('chocoOrderDetail');if(!modal||document.getElementById('codReorderExtra'))return;
    const code=new URLSearchParams(location.search).get('order');if(!code)return;
    const panel=document.getElementById('codPanel');if(!panel)return;
    const b=document.createElement('button');b.id='codReorderExtra';b.textContent='🔁 ĐẶT LẠI ĐƠN';b.style.cssText='width:100%;margin-top:8px;border:0;background:#ff6b00;color:#fff;padding:13px;border-radius:10px;font-weight:800';b.onclick=()=>reorder(code);panel.appendChild(b);
  }
  const mo=new MutationObserver(attach);mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();
