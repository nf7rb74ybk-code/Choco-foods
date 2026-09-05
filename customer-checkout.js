/* CHOCO SHIP — Customer Checkout v2
   Server-authoritative checkout via create_customer_order RPC.
*/
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_CHECKOUT_VERSION__==='20260905-2') return;
  window.__CHOCO_CUSTOMER_CHECKOUT_VERSION__='20260905-2';

  async function checkout(){
    const c=Array.isArray(window.cart)?window.cart:[];
    if(!c.length) return alert('🛒 Giỏ hàng đang trống.');
    const name=String(document.getElementById('name')?.value||'').trim();
    const phone=String(document.getElementById('phone')?.value||'').trim();
    const address=String(document.getElementById('address')?.value||'').trim();
    const note=String(document.getElementById('note')?.value||'').trim();
    const payment=String(document.getElementById('payment')?.value||'cash').trim()||'cash';
    if(!name||!phone||!address) return alert('⚠️ Vui lòng nhập họ tên, số điện thoại và địa chỉ.');
    const lat=Number(window.currentGPS?.lat), lng=Number(window.currentGPS?.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)) return alert('📍 Vui lòng bật GPS để đặt đơn.');
    const restaurantId=Number(c[0]?.restaurantId??c[0]?.restaurant_id);
    if(!Number.isInteger(restaurantId)||restaurantId<=0) return alert('❌ Không xác định được quán.');
    if(c.some(x=>Number(x?.restaurantId??x?.restaurant_id)!==restaurantId)) return alert('⚠️ Mỗi đơn chỉ được đặt món từ một quán.');
    const items=c.map(x=>({foodId:Number(x?.foodId??x?.food_id),qty:Number(x?.qty??x?.quantity??1)}));
    if(items.some(x=>!Number.isInteger(x.foodId)||x.foodId<=0||!Number.isInteger(x.qty)||x.qty<1||x.qty>99)) return alert('❌ Dữ liệu món ăn không hợp lệ.');
    const token=localStorage.getItem('choco_access_token');
    if(!token) return alert('🔐 Vui lòng đăng nhập tài khoản khách hàng.');
    const url=window.SUPABASE_URL+'/rest/v1/rpc/create_customer_order';
    const headers=typeof window.headers==='function'?window.headers():{'apikey':window.SUPABASE_KEY||'','Authorization':'Bearer '+token};
    const r=await fetch(url,{method:'POST',headers:{...headers,'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({
      p_restaurant_id:restaurantId,p_items:items,p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:lat,p_longitude:lng
    })});
    let data=null; try{data=await r.json()}catch{}
    if(!r.ok){ console.error('CHOCO checkout RPC',r.status,data); return alert('❌ Không thể tạo đơn: '+String(data?.message||data?.hint||data?.details||'Vui lòng thử lại.')); }
    const order=Array.isArray(data)?data[0]:data;
    if(!order?.code) return alert('❌ Server không trả về mã đơn.');
    localStorage.setItem('choco_ship_last_order',JSON.stringify({code:order.code,order_id:order.id,status:order.status,created_at:order.created_at||new Date().toISOString()}));
    localStorage.removeItem('choco_customer_cart_v1');
    window.cart=[];
    try{ if(typeof window.renderCart==='function') window.renderCart(); }catch{}
    alert('✅ Đặt đơn thành công!\nMã đơn: '+order.code+'\nTổng tiền: '+Number(order.total||0).toLocaleString('vi-VN')+'đ');
    setTimeout(()=>{try{if(typeof window.closeCart==='function')window.closeCart()}catch{}},500);
  }
  window.createOrder=checkout;
})();
