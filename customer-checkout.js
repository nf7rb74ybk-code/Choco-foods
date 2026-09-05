/* CHOCO SHIP — Customer Checkout v3
   Always reads the persisted customer cart so legacy inline cart state cannot block checkout.
*/
'use strict';
(function(){
  const CART_KEY='choco_customer_cart_v1';
  function readCart(){
    try{
      const raw=localStorage.getItem(CART_KEY)||'[]';
      const c=JSON.parse(raw);
      return Array.isArray(c)?c:[];
    }catch{return[]}
  }
  function gps(){
    const g=window.currentGPS;
    if(Number.isFinite(Number(g?.lat))&&Number.isFinite(Number(g?.lng))) return {lat:Number(g.lat),lng:Number(g.lng)};
    const s=String(document.getElementById('selectedGPS')?.textContent||'');
    const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    return m?{lat:Number(m[1]),lng:Number(m[2])}:null;
  }
  function token(){return localStorage.getItem('choco_access_token')||''}
  async function checkout(e){
    if(e?.preventDefault)e.preventDefault();
    const c=readCart();
    console.log('[CHOCO CHECKOUT v3] persisted cart:',c);
    if(!c.length){alert('🛒 Giỏ hàng đang trống.');return}
    const name=String(document.getElementById('name')?.value||'').trim();
    const phone=String(document.getElementById('phone')?.value||'').trim();
    const address=String(document.getElementById('address')?.value||'').trim();
    const note=String(document.getElementById('note')?.value||'').trim();
    const payment=String(document.getElementById('payment')?.value||'cash').trim()||'cash';
    if(!name||!phone||!address){alert('⚠️ Vui lòng nhập họ tên, số điện thoại và địa chỉ.');return}
    const g=gps();
    if(!g){alert('📍 Vui lòng bật GPS để đặt đơn.');return}
    const restaurantId=Number(c[0]?.restaurantId??c[0]?.restaurant_id);
    if(!Number.isInteger(restaurantId)||restaurantId<=0){alert('❌ Không xác định được quán.');return}
    if(c.some(x=>Number(x?.restaurantId??x?.restaurant_id)!==restaurantId)){alert('⚠️ Mỗi đơn chỉ được đặt món từ một quán.');return}
    const items=c.map(x=>({foodId:Number(x?.foodId??x?.food_id),qty:Number(x?.qty??x?.quantity??1)}));
    if(items.some(x=>!Number.isInteger(x.foodId)||x.foodId<=0||!Number.isInteger(x.qty)||x.qty<1||x.qty>99)){alert('❌ Dữ liệu món ăn không hợp lệ.');return}
    const t=token();
    if(!t){alert('🔐 Vui lòng đăng nhập tài khoản khách hàng.');return}
    const base=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
    const key=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
    const btn=document.getElementById('orderButton');
    if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG GỬI ĐƠN...'}
    try{
      const r=await fetch(base+'/rest/v1/rpc/create_customer_order',{
        method:'POST',
        headers:{apikey:key,Authorization:'Bearer '+t,'Content-Type':'application/json',Accept:'application/json'},
        body:JSON.stringify({p_restaurant_id:restaurantId,p_items:items,p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:g.lat,p_longitude:g.lng})
      });
      let data=null;try{data=await r.json()}catch{}
      if(!r.ok)throw Error(String(data?.message||data?.hint||data?.details||('HTTP '+r.status)));
      const order=Array.isArray(data)?data[0]:data;
      if(!order?.code)throw Error('Server không trả về mã đơn');
      localStorage.setItem('choco_ship_last_order',JSON.stringify({code:order.code,order_id:order.id,status:order.status,created_at:order.created_at||new Date().toISOString()}));
      localStorage.removeItem(CART_KEY);
      window.cart=[];
      if(typeof window.renderCart==='function')try{window.renderCart()}catch{}
      if(typeof window.updateCart==='function')try{window.updateCart([])}catch{}
      alert('✅ ĐẶT ĐƠN THÀNH CÔNG!\nMã đơn: '+order.code+'\nTổng tiền: '+Number(order.total||0).toLocaleString('vi-VN')+'đ');
      if(typeof window.closeCart==='function')window.closeCart();
    }catch(err){console.error('[CHOCO CHECKOUT v3]',err);alert('❌ KHÔNG GỬI ĐƯỢC ĐƠN.\n\n'+err.message)}
    finally{if(btn){btn.disabled=false;btn.textContent='🚀 ĐẶT ĐƠN'}}
  }
  window.createOrder=checkout;
  function bind(){
    const b=document.getElementById('orderButton');
    if(!b)return;
    b.onclick=checkout;
    b.removeAttribute('onclick');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();