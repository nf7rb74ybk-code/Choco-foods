/* CHOCO SHIP — CUSTOMER CART/ADD FIX v7 */
'use strict';
(function(){
  const KEY='choco_customer_cart_v1';
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const qty=v=>Math.max(1,Math.min(99,Number(v)||1));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  function rawRead(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  function liveFoods(){
    const a=Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[];
    const b=Array.isArray(window.__CHOCO_LIVE_RESTAURANTS__)?window.__CHOCO_LIVE_RESTAURANTS__:[];
    const rows=(a.length?a:b);
    return rows.flatMap(r=>(r.foods||[]).map(f=>({...f,restaurantId:r.id,restaurant:r.name})));
  }
  function normalize(c){
    const arr=Array.isArray(c)?c:[], foods=liveFoods();
    return arr.map(x=>{
      const item=x||{};
      const rid=Number(item.restaurantId??item.restaurant_id);
      const fid=Number(item.foodId??item.food_id);
      const name=String(item.name||'').trim();
      const price=Number(item.price||0);
      let f=null;
      if(Number.isInteger(fid)&&fid>0) f=foods.find(z=>Number(z.id)===fid) || null;
      if(!f&&name) f=foods.find(z=>String(z.name||'').trim().toLowerCase()===name.toLowerCase() && (!Number.isInteger(rid)||rid<=0||Number(z.restaurantId)===rid)) || null;
      if(!f&&price>0) f=foods.find(z=>Number(z.price)===price && (!Number.isInteger(rid)||rid<=0||Number(z.restaurantId)===rid)) || null;
      const nrid=Number(f?.restaurantId||rid||0);
      const nfid=Number(f?.id||fid||0);
      const nname=String(f?.name||name||'Món ăn');
      const nprice=Number(f?.price??price??0);
      return {...item,
        restaurantId:Number.isInteger(nrid)&&nrid>0?nrid:item.restaurantId,
        restaurant:String(f?.restaurant||item.restaurant||''),
        foodId:Number.isInteger(nfid)&&nfid>0?nfid:item.foodId,
        name:nname,
        price:nprice,
        qty:qty(item.qty??item.quantity)
      };
    });
  }
  function read(){return normalize(rawRead())}
  function persist(c){try{localStorage.setItem(KEY,JSON.stringify(c))}catch{};window.cart=c}
  function syncCount(c=read()){const e=document.getElementById('count');if(e)e.textContent=c.reduce((s,x)=>s+qty(x.qty),0)}
  function shipping(){const t=document.getElementById('shippingFee')?.textContent||'20.000đ';return Number(t.replace(/[^0-9]/g,''))||20000}
  function syncTotals(c=read()){
    const n=normalize(c),food=n.reduce((s,x)=>s+Number(x?.price||0)*qty(x?.qty),0),ship=shipping(),total=food+ship;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=money(v)};
    set('foodTotal',food);set('shippingTotal',ship);set('total',total);
    const inlineGps=window.currentGPS;
    if(inlineGps&&Number.isFinite(Number(inlineGps.lat))&&Number.isFinite(Number(inlineGps.lng))){
      const e=document.getElementById('selectedGPS');if(e)e.textContent=Number(inlineGps.lat).toFixed(6)+', '+Number(inlineGps.lng).toFixed(6);
    }
    return {food,ship,total};
  }
  function write(c){const clean=normalize(c);persist(clean);syncCount(clean);syncTotals(clean);return clean}
  window.updateShippingDisplay=function(){
    const c=read(),t=syncTotals(c),gps=window.currentGPS;
    const distEl=document.getElementById('shippingDistance');
    if(distEl&&gps&&Number.isFinite(Number(gps.lat))&&Number.isFinite(Number(gps.lng))&&typeof window.distance==='function'){
      try{distEl.textContent=window.distance(10.2899,103.984,Number(gps.lat),Number(gps.lng)).toFixed(1)+' km'}catch{distEl.textContent='Chưa chọn'}
    }else if(distEl)distEl.textContent='Chưa chọn';
    const gpsText=document.getElementById('cartGpsText');
    if(gpsText)gpsText.textContent=gps&&Number.isFinite(Number(gps.lat))&&Number.isFinite(Number(gps.lng))?'📍 GPS: '+Number(gps.lat).toFixed(6)+', '+Number(gps.lng).toFixed(6):'Chưa chọn GPS giao hàng.';
    return t;
  };
  function find(rid,fid){const r=(Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[]).find(x=>String(x.id)===String(rid));const f=r?.foods?.find(x=>String(x.id)===String(fid));return r&&f?{r,f}:null}
  function render(){
    const box=document.getElementById('cartItems'),c=write(read());
    if(!box){syncTotals(c);return}
    if(!c.length){box.innerHTML='<div class="empty">🛒 Chưa có món.</div>';syncTotals(c);return}
    box.innerHTML=c.map((x,i)=>'<div class="cart-item"><div><b>'+esc(x.name)+'</b><div style="color:#ff5a00;font-weight:bold">'+money(x.price)+' × '+qty(x.qty)+'</div></div><div class="qty"><button type="button" data-i="'+i+'" data-d="-1">−</button><b>'+qty(x.qty)+'</b><button type="button" data-i="'+i+'" data-d="1">+</button><button type="button" data-i="'+i+'" data-r="1">🗑️</button></div></div>').join('');
    box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.i),n=read();if(!n[i])return;if(b.dataset.r)n.splice(i,1);else n[i].qty=qty(Number(n[i].qty)+Number(b.dataset.d||0));write(n);render()});
    syncTotals(c);
  }
  window.add=function(rid,fid){
    const z=find(rid,fid);if(!z){alert('❌ Không tìm thấy món đang bán. Vui lòng tải lại trang.');return}
    let c=read();
    if(c.length&&c.some(x=>String(x.restaurantId)!==String(z.r.id))){if(!confirm('Giỏ hàng đang có món của quán khác. Xóa giỏ và thêm món này?'))return;c=[]}
    const old=c.find(x=>String(x.foodId)===String(z.f.id));
    if(old)old.qty=qty(Number(old.qty)+1);else c.push({restaurantId:z.r.id,restaurant:z.r.name,foodId:z.f.id,name:z.f.name,price:Number(z.f.price||0),qty:1});
    write(c);render();syncTotals(c);alert('✅ Đã thêm '+z.f.name+' vào giỏ hàng');
  };
  window.renderCart=render;
  window.updateCart=function(){const c=read();write(c);syncTotals(c)};
  window.openCart=function(){render();const m=document.getElementById('modal');if(m)m.style.display='flex'};
  window.closeCart=function(){const m=document.getElementById('modal');if(m)m.style.display='none'};
  function gps(){const s=String(document.getElementById('selectedGPS')?.textContent||''),m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);if(m)return{lat:Number(m[1]),lng:Number(m[2])};const g=window.currentGPS;return g&&Number.isFinite(Number(g.lat))&&Number.isFinite(Number(g.lng))?{lat:Number(g.lat),lng:Number(g.lng)}:null}
  async function fallbackCreateOrder(){const c=read();if(!c.length){alert('🛒 Giỏ hàng đang trống.');return}const name=String(document.getElementById('name')?.value||'').trim(),phone=String(document.getElementById('phone')?.value||'').trim(),address=String(document.getElementById('address')?.value||'').trim(),note=String(document.getElementById('note')?.value||'').trim(),payment=String(document.getElementById('payment')?.value||'cash');if(!name||!phone||!address){alert('⚠️ Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.');return}const g=gps();if(!g){alert('📍 Vui lòng bật GPS để đặt đơn.');return}const rid=Number(c[0].restaurantId);if(!Number.isInteger(rid)){alert('❌ Không xác định được quán.');return}if(c.some(x=>Number(x.restaurantId)!==rid)){alert('⚠️ Mỗi đơn chỉ được đặt món từ một quán.');return}const token=localStorage.getItem('choco_access_token');if(!token){alert('🔐 Vui lòng đăng nhập tài khoản khách hàng.');return}const btn=document.getElementById('orderButton');if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG ĐẶT ĐƠN...'}try{const r=await fetch('https://guwdswqaqnhzqapflvey.supabase.co/rest/v1/rpc/create_customer_order',{method:'POST',headers:{apikey:'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9',Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_restaurant_id:rid,p_items:c.map(x=>({foodId:Number(x.foodId),qty:qty(x.qty)})),p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:g.lat,p_longitude:g.lng})});let d=null;try{d=await r.json()}catch{}if(!r.ok)throw Error(String(d?.message||d?.hint||d?.details||('HTTP '+r.status)));const o=Array.isArray(d)?d[0]:d;if(!o?.code)throw Error('Server không trả về mã đơn');localStorage.setItem('choco_ship_last_order',JSON.stringify({code:o.code,order_id:o.id,status:o.status,created_at:new Date().toISOString()}));localStorage.removeItem(KEY);write([]);render();alert('✅ Đặt đơn thành công!\nMã đơn: '+o.code+'\nTổng tiền: '+Number(o.total||0).toLocaleString('vi-VN')+'đ');window.closeCart()}catch(e){console.error('[CHOCO CHECKOUT FALLBACK]',e);alert('❌ Không thể tạo đơn: '+e.message)}finally{if(btn){btn.disabled=false;btn.textContent='🚀 ĐẶT ĐƠN'}}}
  window.createOrder=window.__CHOCO_FORCE_ORDER__||fallbackCreateOrder;
  function bind(){syncCount();syncTotals(read());const b=document.getElementById('orderButton');if(b)b.onclick=function(e){if(e)e.preventDefault();window.createOrder()};render();setTimeout(()=>{const x=document.getElementById('orderButton');if(x)x.onclick=function(e){if(e)e.preventDefault();window.createOrder()}},0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();