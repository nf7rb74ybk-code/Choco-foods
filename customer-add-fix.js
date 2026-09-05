/* CHOCO SHIP — CUSTOMER CART/ADD FIX v3
   One shared cart source for live menu + checkout.
*/
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_ADD_FIX_VERSION__==='20260905-3') return;
  window.__CHOCO_CUSTOMER_ADD_FIX_VERSION__='20260905-3';
  const KEY='choco_customer_cart_v1';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const qty=v=>Math.max(1,Math.min(99,Number(v)||1));
  function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  function write(c){window.cart=c;try{localStorage.setItem(KEY,JSON.stringify(c))}catch{};syncCount(c)}
  function syncCount(c=read()){const el=document.getElementById('count');if(el)el.textContent=c.reduce((s,x)=>s+qty(x.qty),0)}
  function live(){
    const a=Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[];
    const b=Array.isArray(window.__CHOCO_LIVE_RESTAURANTS__)?window.__CHOCO_LIVE_RESTAURANTS__:[];
    return a.length?a:b;
  }
  function find(rid,fid){
    const r=live().find(x=>String(x.id)===String(rid));
    const f=r?.foods?.find(x=>String(x.id)===String(fid));
    return r&&f?{r,f}:null;
  }
  function renderShared(){
    const box=document.getElementById('cartItems'); if(!box)return;
    const c=read(); write(c);
    if(!c.length){box.innerHTML='<div class="empty">🛒 Chưa có món.</div>';return}
    box.innerHTML=c.map((x,i)=>'<div class="cart-item"><div><b>'+esc(x.name)+'</b><div style="color:#ff5a00;font-weight:bold">'+money(x.price)+' × '+qty(x.qty)+'</div></div><div class="qty"><button type="button" data-ci="'+i+'" data-d="-1">−</button><b>'+qty(x.qty)+'</b><button type="button" data-ci="'+i+'" data-d="1">+</button><button type="button" data-ci="'+i+'" data-remove="1">🗑️</button></div></div>').join('');
    box.querySelectorAll('[data-ci]').forEach(b=>b.addEventListener('click',()=>{
      const i=Number(b.dataset.ci), c2=read();
      if(!c2[i])return;
      if(b.dataset.remove)c2.splice(i,1); else c2[i].qty=qty(Number(c2[i].qty)+Number(b.dataset.d||0));
      write(c2); renderShared(); updateTotals(c2);
    }));
    updateTotals(c);
  }
  function updateTotals(c=read()){
    const food=c.reduce((s,x)=>s+Number(x.price||0)*qty(x.qty),0);
    const sf=Number(document.getElementById('shippingFee')?.textContent?.replace(/[^0-9]/g,'')||20000);
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=money(v)};
    set('foodTotal',food);set('shippingTotal',sf);set('total',food+sf);
  }
  window.add=function(rid,fid){
    const found=find(rid,fid);
    if(!found){alert('❌ Không tìm thấy món đang bán. Vui lòng tải lại trang.');return}
    const {r,f}=found; let c=read();
    if(c.some(x=>String(x.restaurantId)!==String(r.id))){if(!confirm('Giỏ hàng đang có món của quán khác. Xóa giỏ và thêm món này?'))return;c=[]}
    const old=c.find(x=>String(x.foodId)===String(f.id));
    if(old)old.qty=qty(Number(old.qty)+1); else c.push({restaurantId:r.id,restaurant:r.name,foodId:f.id,name:f.name,price:Number(f.price||0),qty:1});
    write(c); renderShared(); updateTotals(c); alert('✅ Đã thêm '+f.name+' vào giỏ hàng');
  };
  window.renderCart=renderShared;
  window.updateCart=syncCount;
  window.openCart=function(){renderShared();const m=document.getElementById('modal');if(m)m.style.display='flex'};
  window.closeCart=function(){const m=document.getElementById('modal');if(m)m.style.display='none'};
  function parseGPS(){
    const s=String(document.getElementById('selectedGPS')?.textContent||'');
    const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    return m?{lat:Number(m[1]),lng:Number(m[2])}:null;
  }
  window.createOrder=async function(){
    const c=read(); if(!c.length){alert('🛒 Giỏ hàng đang trống.');return}
    const name=String(document.getElementById('name')?.value||'').trim(),phone=String(document.getElementById('phone')?.value||'').trim(),address=String(document.getElementById('address')?.value||'').trim(),note=String(document.getElementById('note')?.value||'').trim(),payment=String(document.getElementById('payment')?.value||'cash').trim()||'cash';
    if(!name||!phone||!address){alert('⚠️ Vui lòng nhập họ tên, số điện thoại và địa chỉ.');return}
    const gps=window.currentGPS&&Number.isFinite(Number(window.currentGPS.lat))?{lat:Number(window.currentGPS.lat),lng:Number(window.currentGPS.lng)}:parseGPS();
    if(!gps||!Number.isFinite(gps.lat)||!Number.isFinite(gps.lng)){alert('📍 Vui lòng bật GPS để đặt đơn.');return}
    const restaurantId=Number(c[0].restaurantId); if(!Number.isInteger(restaurantId)||restaurantId<1){alert('❌ Không xác định được quán.');return}
    if(c.some(x=>Number(x.restaurantId)!==restaurantId)){alert('⚠️ Mỗi đơn chỉ được đặt món từ một quán.');return}
    const token=localStorage.getItem('choco_access_token'); if(!token){alert('🔐 Vui lòng đăng nhập tài khoản khách hàng.');return}
    const base=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co',key=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
    const r=await fetch(base+'/rest/v1/rpc/create_customer_order',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_restaurant_id:restaurantId,p_items:c.map(x=>({foodId:Number(x.foodId),qty:qty(x.qty)})),p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:gps.lat,p_longitude:gps.lng})});
    let data=null;try{data=await r.json()}catch{}
    if(!r.ok){console.error('[CHOCO CHECKOUT]',r.status,data);alert('❌ Không thể tạo đơn: '+String(data?.message||data?.hint||data?.details||'Vui lòng thử lại.'));return}
    const order=Array.isArray(data)?data[0]:data;if(!order?.code){alert('❌ Server không trả về mã đơn.');return}
    localStorage.setItem('choco_ship_last_order',JSON.stringify({code:order.code,order_id:order.id,status:order.status,created_at:new Date().toISOString()}));localStorage.removeItem(KEY);window.cart=[];syncCount([]);renderShared();
    alert('✅ Đặt đơn thành công!\nMã đơn: '+order.code+'\nTổng tiền: '+Number(order.total||0).toLocaleString('vi-VN')+'đ');
    window.closeCart();
  };
  function sync(){const c=read();window.cart=c;syncCount(c)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
})();
