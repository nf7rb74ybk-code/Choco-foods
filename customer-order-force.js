/* CHOCO SHIP — FORCE CUSTOMER ORDER v5 */
'use strict';
(function(){
  const CART_KEY='choco_customer_cart_v1';
  const BASE=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const readStored=()=>{try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
  const getCart=()=>{const a=Array.isArray(window.cart)&&window.cart.length?window.cart:readStored();return a};
  const getGPS=()=>{const g=window.currentGPS;if(Number.isFinite(Number(g?.lat))&&Number.isFinite(Number(g?.lng)))return{lat:Number(g.lat),lng:Number(g.lng)};const s=String(document.getElementById('selectedGPS')?.textContent||'');const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);return m?{lat:Number(m[1]),lng:Number(m[2])}:null};
  const liveFoods=()=>{const a=Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[];const b=Array.isArray(window.__CHOCO_LIVE_RESTAURANTS__)?window.__CHOCO_LIVE_RESTAURANTS__:[];return (a.length?a:b).flatMap(r=>(r.foods||[]).map(f=>({...f,restaurantId:r.id,restaurant:r.name})));};
  function domItem(i){const nodes=document.querySelectorAll('#cartItems .cart-item');const n=nodes[i];if(!n)return{};const name=String(n.querySelector('b,strong')?.textContent||'').trim();const txt=String(n.textContent||'');const prices=[...txt.matchAll(/([0-9][0-9.]{2,})đ/g)].map(m=>Number(m[1].replace(/\./g,''))).filter(Boolean);return{name,price:prices[0]||0};}
  async function menuRows(rid,token){const r=await fetch(BASE+'/rest/v1/menu_items?select=id,restaurant_id,name,price,is_available,category_id&restaurant_id=eq.'+encodeURIComponent(rid)+'&is_available=eq.true&order=id.asc&limit=200',{headers:{apikey:KEY,Authorization:'Bearer '+token,Accept:'application/json'}});if(!r.ok)throw Error('MENU_LOOKUP_FAILED');return await r.json()}
  function findLive(cand,rid){const foods=liveFoods();const name=String(cand?.name||'').trim().toLowerCase();const price=Number(cand?.price||0);let z=foods.filter(f=>rid&&Number(f.restaurantId)===rid);if(name){const byName=z.filter(f=>String(f.name||'').trim().toLowerCase()===name);if(byName.length===1)return byName[0]}if(price>0){const byPrice=z.filter(f=>Number(f.price)===price);if(byPrice.length===1)return byPrice[0]}if(!rid){if(name){const byName=foods.filter(f=>String(f.name||'').trim().toLowerCase()===name);if(byName.length===1)return byName[0]}if(price>0){const byPrice=foods.filter(f=>Number(f.price)===price);if(byPrice.length===1)return byPrice[0]}}return null}
  async function resolveItems(cart,rid,token){
    const rows=await menuRows(rid,token),out=[],normalized=[];
    for(let i=0;i<cart.length;i++){
      const x=cart[i]||{},dom=domItem(i),live=findLive({...x,name:String(x.name||dom.name||''),price:Number(x.price||dom.price||0)},rid);
      const qty=Math.max(1,Math.min(99,Number(x?.qty??x?.quantity??1)||1));
      const rawId=x?.foodId??x?.food_id??live?.id;
      const parsed=Number(rawId),id=Number.isInteger(parsed)&&parsed>0?parsed:null;
      const name=String(x?.name||dom.name||live?.name||'').trim();
      const price=Number(x?.price||dom.price||live?.price||0);
      let exact=id!==null?rows.find(m=>Number(m.id)===id):null;
      if(!exact&&name)exact=rows.find(m=>String(m.name||'').trim().toLowerCase()===name.toLowerCase())||null;
      if(!exact&&price>0){const same=rows.filter(m=>Number(m.price)===price);if(same.length===1)exact=same[0]}
      if(!exact&&live?.id)exact=rows.find(m=>Number(m.id)===Number(live.id))||null;
      if(!exact&&rows.length===1)exact=rows[0];
      if(!exact)throw Error('ITEM_UNAVAILABLE:'+(name||id||price||'NULL'));
      normalized.push({...x,restaurantId:Number(exact.restaurant_id||rid),foodId:Number(exact.id),name:String(exact.name||name||'Món ăn'),price:Number(exact.price||price||0),qty});
      out.push({foodId:Number(exact.id),qty});
    }
    try{window.cart=normalized;localStorage.setItem(CART_KEY,JSON.stringify(normalized));if(typeof window.updateCart==='function')window.updateCart()}catch{}
    return out;
  }
  async function run(e){if(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}const cart=getCart();if(!cart.length){alert('🛒 Giỏ hàng đang trống.');return false}const name=String(document.getElementById('name')?.value||'').trim(),phone=String(document.getElementById('phone')?.value||'').trim(),address=String(document.getElementById('address')?.value||'').trim(),note=String(document.getElementById('note')?.value||'').trim(),payment=String(document.getElementById('payment')?.value||'cash').trim()||'cash';if(!name||!phone||!address){alert('⚠️ Vui lòng nhập họ tên, số điện thoại và địa chỉ.');return false}const gps=getGPS();if(!gps){alert('📍 Vui lòng bật GPS để đặt đơn.');return false}let rid=Number(cart[0]?.restaurantId??cart[0]?.restaurant_id);if(!Number.isInteger(rid)||rid<=0){const first=findLive(cart[0],null);rid=Number(first?.restaurantId||0)}if(!Number.isInteger(rid)||rid<=0){alert('❌ Không xác định được quán.');return false}if(cart.some(x=>Number(x?.restaurantId??x?.restaurant_id||rid)!==rid)){alert('⚠️ Mỗi đơn chỉ được đặt món từ một quán.');return false}const token=localStorage.getItem('choco_access_token')||'';if(!token){alert('🔐 Vui lòng đăng nhập tài khoản khách hàng.');return false}const btn=document.getElementById('orderButton');if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG KHÔI PHỤC MÓN...'}try{const items=await resolveItems(cart,rid,token);if(btn)btn.textContent='⏳ ĐANG GỬI ĐƠN...';const r=await fetch(BASE+'/rest/v1/rpc/create_customer_order',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_restaurant_id:rid,p_items:items,p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:gps.lat,p_longitude:gps.lng})});let data=null;try{data=await r.json()}catch{}if(!r.ok)throw Error(String(data?.message||data?.hint||data?.details||('HTTP '+r.status)));const order=Array.isArray(data)?data[0]:data;if(!order?.code)throw Error('Server không trả về mã đơn');localStorage.setItem('choco_ship_last_order',JSON.stringify({code:order.code,order_id:order.id,status:order.status,created_at:new Date().toISOString()}));localStorage.removeItem(CART_KEY);window.cart=[];if(typeof window.renderCart==='function')try{window.renderCart()}catch{}alert('✅ ĐẶT ĐƠN THÀNH CÔNG!\nMã đơn: '+order.code+'\nTổng tiền: '+Number(order.total||0).toLocaleString('vi-VN')+'đ');if(typeof window.closeCart==='function')window.closeCart()}catch(err){console.error('[CHOCO FORCE ORDER v5]',err);alert('❌ KHÔNG GỬI ĐƯỢC ĐƠN.\n\n'+err.message)}finally{if(btn){btn.disabled=false;btn.textContent='🚀 ĐẶT ĐƠN'}}return false}
  window.__CHOCO_FORCE_ORDER__=run;window.createOrder=run;
  function bind(){const b=document.getElementById('orderButton');if(!b)return;b.removeAttribute('onclick');if(b.__chocoForceHandler)b.removeEventListener('click',b.__chocoForceHandler,true);b.__chocoForceHandler=run;b.addEventListener('click',run,true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();[0,250,500,1000,2000,4000].forEach(t=>setTimeout(bind,t));
})();
