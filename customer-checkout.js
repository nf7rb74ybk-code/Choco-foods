/* CHOCO SHIP — Customer Checkout v7
   Fixes checkout script parse error so createOrder can load.
   Canonicalizes cart item IDs against the live menu before RPC checkout.
   FIX v7: reject invalid GPS (including 0,0) at the final checkout boundary.
*/
'use strict';
(function(){
  const CART_KEY='choco_customer_cart_v1';
  const U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  function readCart(){try{const c=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(c)?c:[]}catch{return[]}}
  function jwt(t){try{const p=String(t||'').split('.')[1];if(!p)return null;return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-p.length%4)%4)))}catch{return null}}
  function gps(){const valid=(a,b)=>{const lat=Number(a),lng=Number(b);return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180&&!(lat===0&&lng===0)};const g=window.currentGPS;if(valid(g?.lat,g?.lng))return{lat:Number(g.lat),lng:Number(g.lng)};const s=String(document.getElementById('selectedGPS')?.textContent||'');const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);return m&&valid(m[1],m[2])?{lat:Number(m[1]),lng:Number(m[2])}:null}
  async function token(){let t=localStorage.getItem('choco_access_token')||'';const p=jwt(t),now=Math.floor(Date.now()/1000);if(t&&p?.exp&&p.exp>now+60)return t;const rt=localStorage.getItem('choco_refresh_token')||'';if(!rt)return t;const r=await fetch(U+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json',apikey:K},body:JSON.stringify({refresh_token:rt})});const j=await r.json().catch(()=>({}));if(!r.ok||!j.access_token)throw Error('SESSION_EXPIRED_LOGIN_REQUIRED');localStorage.setItem('choco_access_token',j.access_token);if(j.refresh_token)localStorage.setItem('choco_refresh_token',j.refresh_token);if(j.user?.id)localStorage.setItem('choco_user_id',j.user.id);return j.access_token}
  function liveFood(restaurantId,item){
    const rows=Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[];
    const r=rows.find(x=>String(x.id)===String(restaurantId));
    if(!r)return null;
    const id=Number(item?.foodId??item?.food_id);
    if(Number.isInteger(id)&&id>0){const f=r.foods?.find(x=>Number(x.id)===id);if(f)return f}
    const name=String(item?.name??item?.foodName??item?.food_name??'').trim().toLowerCase();
    if(name)return (r.foods||[]).find(x=>String(x.name||'').trim().toLowerCase()===name)||null;
    return null;
  }
  async function checkout(e){
    if(e?.preventDefault)e.preventDefault();
    const c=readCart();
    if(!c.length){alert('🛒 Giỏ hàng đang trống.');return}
    const name=String(document.getElementById('name')?.value||'').trim();
    const phone=String(document.getElementById('phone')?.value||'').trim();
    const address=String(document.getElementById('address')?.value||'').trim();
    const note=String(document.getElementById('note')?.value||'').trim();
    const payment=String(document.getElementById('payment')?.value||'cash').trim()||'cash';
    if(!name||!phone||!address){alert('⚠️ Vui lòng nhập họ tên, số điện thoại và địa chỉ.');return}
    const g=gps();if(!g){alert('📍 GPS chưa hợp lệ. Vui lòng bật GPS/chọn lại vị trí giao hàng.');return}
    const restaurantId=Number(c[0]?.restaurantId??c[0]?.restaurant_id);
    if(!Number.isInteger(restaurantId)||restaurantId<=0){alert('❌ Không xác định được quán.');return}
    if(c.some(x=>Number(x?.restaurantId??x?.restaurant_id)!==restaurantId)){alert('⚠️ Mỗi đơn chỉ được đặt món từ một quán.');return}
    const items=c.map(x=>{const f=liveFood(restaurantId,x);return{foodId:f?Number(f.id):Number(x?.foodId??x?.food_id),name:f?.name||String(x?.name||''),qty:Number(x?.qty??x?.quantity??1)}});
    if(items.some(x=>!Number.isInteger(x.foodId)||x.foodId<=0||!Number.isInteger(x.qty)||x.qty<1||x.qty>99)){
      alert('❌ Món trong giỏ không còn hợp lệ. Vui lòng xóa món lỗi và thêm lại từ menu.');return
    }
    try{localStorage.setItem(CART_KEY,JSON.stringify(c.map((x,i)=>({...x,foodId:items[i].foodId,name:items[i].name,qty:items[i].qty}))))}catch{}
    const btn=document.getElementById('orderButton');if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG GỬI ĐƠN...'}
    try{
      let t=await token();if(!t)throw Error('AUTH_REQUIRED');
      const body={p_restaurant_id:restaurantId,p_items:items.map(x=>({foodId:x.foodId,qty:x.qty,name:x.name})),p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:g.lat,p_longitude:g.lng};
      let r=await fetch(U+'/rest/v1/rpc/create_customer_order',{method:'POST',headers:{apikey:K,Authorization:'Bearer '+t,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
      let data=await r.json().catch(()=>null);
      if((r.status===401||r.status===403)&&localStorage.getItem('choco_refresh_token')){t=await token();r=await fetch(U+'/rest/v1/rpc/create_customer_order',{method:'POST',headers:{apikey:K,Authorization:'Bearer '+t,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});data=await r.json().catch(()=>null)}
      if(!r.ok)throw Error(String(data?.message||data?.hint||data?.details||data?.code||('HTTP '+r.status)));
      const order=Array.isArray(data)?data[0]:data;if(!order?.code)throw Error('Server không trả về mã đơn');
      localStorage.setItem('choco_ship_last_order',JSON.stringify({code:order.code,order_id:order.id,status:order.status,created_at:order.created_at||new Date().toISOString()}));
      localStorage.removeItem(CART_KEY);window.cart=[];
      if(typeof window.renderCart==='function')try{window.renderCart()}catch{};if(typeof window.updateCart==='function')try{window.updateCart([])}catch{}
      alert('✅ ĐẶT ĐƠN THÀNH CÔNG!\nMã đơn: '+order.code+'\nTổng tiền: '+Number(order.total||0).toLocaleString('vi-VN')+'đ');
      if(typeof window.closeCart==='function')window.closeCart();
    }catch(err){console.error('[CHOCO CHECKOUT v7]',err);alert('❌ KHÔNG GỬI ĐƯỢC ĐƠN.\n\n'+err.message)}
    finally{if(btn){btn.disabled=false;btn.textContent='🚀 ĐẶT ĐƠN'}}
  }
  window.createOrder=checkout;
  function bind(){const b=document.getElementById('orderButton');if(!b)return;b.onclick=checkout;b.removeAttribute('onclick')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
