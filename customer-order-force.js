/* CHOCO SHIP — FORCE CUSTOMER ORDER v1
   Capture-phase checkout handler. Blocks legacy inline createOrder() and always reads the persisted cart.
*/
'use strict';
(function(){
  const CART_KEY='choco_customer_cart_v1';
  const getCart=()=>{try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
  const getGPS=()=>{
    const g=window.currentGPS;
    if(Number.isFinite(Number(g?.lat))&&Number.isFinite(Number(g?.lng))) return {lat:Number(g.lat),lng:Number(g.lng)};
    const s=String(document.getElementById('selectedGPS')?.textContent||'');
    const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    return m?{lat:Number(m[1]),lng:Number(m[2])}:null;
  };
  async function run(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    const cart=getCart();
    console.log('[CHOCO FORCE ORDER v1] cart=',cart);
    if(!cart.length){alert('🛒 Giỏ hàng đang trống.');return false;}
    const name=String(document.getElementById('name')?.value||'').trim();
    const phone=String(document.getElementById('phone')?.value||'').trim();
    const address=String(document.getElementById('address')?.value||'').trim();
    const note=String(document.getElementById('note')?.value||'').trim();
    const payment=String(document.getElementById('payment')?.value||'cash').trim()||'cash';
    if(!name||!phone||!address){alert('⚠️ Vui lòng nhập họ tên, số điện thoại và địa chỉ.');return false;}
    const gps=getGPS();
    if(!gps){alert('📍 Vui lòng bật GPS để đặt đơn.');return false;}
    const rid=Number(cart[0]?.restaurantId??cart[0]?.restaurant_id);
    if(!Number.isInteger(rid)||rid<=0){alert('❌ Không xác định được quán.');return false;}
    if(cart.some(x=>Number(x?.restaurantId??x?.restaurant_id)!==rid)){alert('⚠️ Mỗi đơn chỉ được đặt món từ một quán.');return false;}
    const items=cart.map(x=>({foodId:Number(x?.foodId??x?.food_id),qty:Number(x?.qty??x?.quantity??1)}));
    if(items.some(x=>!Number.isInteger(x.foodId)||x.foodId<=0||!Number.isInteger(x.qty)||x.qty<1||x.qty>99)){alert('❌ Dữ liệu món ăn không hợp lệ.');return false;}
    const token=localStorage.getItem('choco_access_token')||'';
    if(!token){alert('🔐 Vui lòng đăng nhập tài khoản khách hàng.');return false;}
    const base=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
    const key=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
    const btn=document.getElementById('orderButton');
    if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG GỬI ĐƠN...';}
    try{
      const r=await fetch(base+'/rest/v1/rpc/create_customer_order',{
        method:'POST',
        headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({p_restaurant_id:rid,p_items:items,p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:gps.lat,p_longitude:gps.lng})
      });
      let data=null;try{data=await r.json()}catch{}
      if(!r.ok)throw Error(String(data?.message||data?.hint||data?.details||('HTTP '+r.status)));
      const order=Array.isArray(data)?data[0]:data;
      if(!order?.code)throw Error('Server không trả về mã đơn');
      localStorage.setItem('choco_ship_last_order',JSON.stringify({code:order.code,order_id:order.id,status:order.status,created_at:order.created_at||new Date().toISOString()}));
      localStorage.removeItem(CART_KEY);
      window.cart=[];
      if(typeof window.renderCart==='function')try{window.renderCart()}catch{}
      alert('✅ ĐẶT ĐƠN THÀNH CÔNG!\nMã đơn: '+order.code+'\nTổng tiền: '+Number(order.total||0).toLocaleString('vi-VN')+'đ');
      if(typeof window.closeCart==='function')window.closeCart();
    }catch(err){console.error('[CHOCO FORCE ORDER v1]',err);alert('❌ KHÔNG GỬI ĐƯỢC ĐƠN.\n\n'+err.message)}
    finally{if(btn){btn.disabled=false;btn.textContent='🚀 ĐẶT ĐƠN'}}
    return false;
  }
  window.__CHOCO_FORCE_ORDER__=run;
  function bind(){
    const b=document.getElementById('orderButton');
    if(!b)return;
    b.addEventListener('click',run,true);
    b.onclick=function(e){if(e){e.preventDefault();e.stopImmediatePropagation();}return run(e)};
    b.removeAttribute('onclick');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  setTimeout(bind,0);setTimeout(bind,500);setTimeout(bind,1500);
})();
