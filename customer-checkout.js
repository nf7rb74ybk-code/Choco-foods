/* CHOCO SHIP - Customer checkout UX v1 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_CHECKOUT__) return;
  window.__CHOCO_CUSTOMER_CHECKOUT__=true;
  const KEY='choco_ship_last_order';
  const $=id=>document.getElementById(id);
  const val=id=>String($(id)?.value||'').trim();
  const setBusy=b=>{const x=$('orderButton');if(x){x.disabled=b;x.textContent=b?'⏳ ĐANG ĐẶT ĐƠN...':'🚀 ĐẶT ĐƠN';}};
  const msg=(text,ok=false)=>{const b=$('successBox');if(!b)return;b.style.display='block';b.style.background=ok?'#ecfdf5':'#fef2f2';b.style.borderColor=ok?'#86efac':'#fecaca';b.textContent=text;};
  async function checkout(){
    const c=Array.isArray(window.cart)?window.cart:[];
    if(!c.length)return alert('⚠️ Bạn chưa chọn món.');
    const name=val('name'),phone=val('phone'),address=val('address'),note=val('note'),payment=val('payment')||'cash';
    if(name.length<2)return alert('⚠️ Vui lòng nhập họ tên.');
    if(!/^0\d{9,10}$/.test(phone.replace(/\s/g,'')))return alert('⚠️ Số điện thoại chưa đúng.');
    if(address.length<5)return alert('⚠️ Vui lòng nhập địa chỉ giao hàng.');
    const lat=Number(window.currentGPS?.lat),lng=Number(window.currentGPS?.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return alert('📍 Vui lòng lấy GPS giao hàng trước khi đặt đơn.');
    const restaurantId=Number(c[0]?.restaurantId??c[0]?.restaurant_id);
    if(!Number.isInteger(restaurantId)||restaurantId<1)return alert('⚠️ Không xác định được quán. Hãy chọn lại món từ menu.');
    if(c.some(x=>Number(x.restaurantId??x.restaurant_id)!==restaurantId))return alert('⚠️ Giỏ hàng có món từ nhiều quán. Vui lòng chỉ đặt món của một quán.');
    const items=c.map(x=>({foodId:Number(x.foodId??x.food_id),name:String(x.name||''),qty:Math.max(1,Math.min(99,Number(x.qty)||1))}));
    if(items.some(x=>!Number.isInteger(x.foodId)||x.foodId<1))return alert('⚠️ Giỏ hàng có món không hợp lệ. Hãy xóa món lỗi và thêm lại.');
    if(!localStorage.getItem('choco_access_token'))return alert('🔐 Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.');
    setBusy(true);msg('Đang kiểm tra món và tạo đơn...');
    try{
      const payload={restaurant_id:restaurantId,items,name,phone:phone.replace(/\s/g,''),address,note,payment,latitude:lat,longitude:lng};
      const r=await fetch(window.SUPABASE_URL+'/rest/v1/orders',{method:'POST',headers:{...window.headers(), 'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(payload)});
      const raw=await r.text();let j=null;try{j=raw?JSON.parse(raw):null}catch(_){}
      if(!r.ok){const detail=j?.message||j?.hint||j?.details||'Không thể tạo đơn';throw new Error(detail);}
      const row=Array.isArray(j)?j[0]:j;
      const code=String(row?.code||row?.order_code||'').trim();
      localStorage.setItem(KEY,JSON.stringify({code,order_id:row?.id||null,status:row?.status||'Chờ xác nhận',created_at:new Date().toISOString()}));
      localStorage.removeItem('choco_customer_cart_v1');window.cart=[];
      if(typeof window.updateCart==='function')window.updateCart();
      if(typeof window.renderCart==='function')window.renderCart();
      const b=$('successBox');if(b){b.style.display='block';b.style.background='#ecfdf5';b.style.borderColor='#86efac';b.innerHTML='✅ <b>Đặt đơn thành công!</b><br>'+ (code?'Mã đơn: <b>'+code+'</b><br>':'') +'Đơn đang chờ quán xác nhận.';}
      if($('orderButton'))$('orderButton').style.display='none';
      setTimeout(()=>{if(typeof window.closeCart==='function')window.closeCart();},900);
    }catch(e){console.error('CHOCO CHECKOUT',e);msg('❌ '+(e?.message||'Đặt đơn thất bại')+'\nVui lòng kiểm tra lại giỏ hàng và thử lại.');}
    finally{setBusy(false);}
  }
  window.createOrder=checkout;
})();
