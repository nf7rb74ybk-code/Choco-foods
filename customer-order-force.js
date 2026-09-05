/* CHOCO SHIP — FORCE CUSTOMER ORDER v3 */
'use strict';
(function(){
  const CART_KEY='choco_customer_cart_v1';
  const BASE=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const getCart=()=>{try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
  const getGPS=()=>{
    const g=window.currentGPS;
    if(Number.isFinite(Number(g?.lat))&&Number.isFinite(Number(g?.lng))) return {lat:Number(g.lat),lng:Number(g.lng)};
    const s=String(document.getElementById('selectedGPS')?.textContent||'');
    const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    return m?{lat:Number(m[1]),lng:Number(m[2])}:null;
  };
  async function menuRows(rid,token){
    const url=BASE+'/rest/v1/menu_items?select=id,name,price,is_available,category_id&restaurant_id=eq.'+encodeURIComponent(rid)+'&is_available=eq.true&limit=200';
    const r=await fetch(url,{headers:{apikey:KEY,Authorization:'Bearer '+token,Accept:'application/json'}});
    if(!r.ok) throw Error('MENU_LOOKUP_FAILED');
    return await r.json();
  }
  async function resolveItems(cart,rid,token){
    const rows=await menuRows(rid,token);
    const out=[];
    for(const x of cart){
      const qty=Number(x?.qty??x?.quantity??1);
      if(!Number.isInteger(qty)||qty<1||qty>99) throw Error('INVALID_QUANTITY');
      const rawId=x?.foodId??x?.food_id;
      const parsedId=Number(rawId);
      const id=Number.isInteger(parsedId)&&parsedId>0?parsedId:null;
      const name=String(x?.name||'').trim();
      const price=Number(x?.price||0);
      let exact=null;
      if(id!==null) exact=rows.find(m=>Number(m.id)===id)||null;
      if(!exact&&name) exact=rows.find(m=>String(m.name||'').trim().toLowerCase()===name.toLowerCase())||null;
      if(!exact&&price>0){
        const samePrice=rows.filter(m=>Number(m.price)===price);
        if(samePrice.length===1) exact=samePrice[0];
      }
      if(!exact) throw Error('ITEM_UNAVAILABLE:'+(name||id||price||'UNKNOWN'));
      out.push({foodId:Number(exact.id),qty});
    }
    return out;
  }
  async function run(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    const cart=getCart();
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
    const token=localStorage.getItem('choco_access_token')||'';
    if(!token){alert('🔐 Vui lòng đăng nhập tài khoản khách hàng.');return false;}
    const btn=document.getElementById('orderButton');
    if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG KIỂM TRA MÓN...';}
    try{
      const items=await resolveItems(cart,rid,token);
      if(btn)btn.textContent='⏳ ĐANG GỬI ĐƠN...';
      const r=await fetch(BASE+'/rest/v1/rpc/create_customer_order',{
        method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({p_restaurant_id:rid,p_items:items,p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:gps.lat,p_longitude:gps.lng})
      });
      let data=null;try{data=await r.json()}catch{}
      if(!r.ok)throw Error(String(data?.message||data?.hint||data?.details||('HTTP '+r.status)));
      const order=Array.isArray(data)?data[0]:data;
      if(!order?.code)throw Error('Server không trả về mã đơn');
      localStorage.setItem('choco_ship_last_order',JSON.stringify({code:order.code,order_id:order.id,status:order.status,created_at:new Date().toISOString()}));
      localStorage.removeItem(CART_KEY);window.cart=[];
      if(typeof window.renderCart==='function')try{window.renderCart()}catch{}
      alert('✅ ĐẶT ĐƠN THÀNH CÔNG!\nMã đơn: '+order.code+'\nTổng tiền: '+Number(order.total||0).toLocaleString('vi-VN')+'đ');
      if(typeof window.closeCart==='function')window.closeCart();
    }catch(err){console.error('[CHOCO FORCE ORDER v3]',err);alert('❌ KHÔNG GỬI ĐƯỢC ĐƠN.\n\n'+err.message)}
    finally{if(btn){btn.disabled=false;btn.textContent='🚀 ĐẶT ĐƠN'}}
    return false;
  }
  window.__CHOCO_FORCE_ORDER__=run;
  function bind(){
    const b=document.getElementById('orderButton');if(!b)return;
    b.onclick=function(e){if(e){e.preventDefault();e.stopImmediatePropagation();}return run(e)};
    b.removeAttribute('onclick');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  setTimeout(bind,0);setTimeout(bind,500);setTimeout(bind,1500);setTimeout(bind,3000);
})();
