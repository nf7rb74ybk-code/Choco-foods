/* CHOCO SHIP — FORCE CUSTOMER ORDER v6 */
'use strict';
(function(){
  const CART_KEY='choco_customer_cart_v1';
  const BASE=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const readStored=()=>{try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
  const getCart=()=>{const a=readStored();if(a.length)return a;return Array.isArray(window.cart)?window.cart:[]};
  const getGPS=()=>{const g=window.currentGPS;if(Number.isFinite(Number(g?.lat))&&Number.isFinite(Number(g?.lng)))return{lat:Number(g.lat),lng:Number(g.lng)};const s=String(document.getElementById('selectedGPS')?.textContent||'');const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);return m?{lat:Number(m[1]),lng:Number(m[2])}:null};
  const liveFoods=()=>{const a=Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[];const b=Array.isArray(window.__CHOCO_LIVE_RESTAURANTS__)?window.__CHOCO_LIVE_RESTAURANTS__:[];return(a.length?a:b).flatMap(r=>(r.foods||[]).map(f=>({...f,restaurantId:r.id,restaurant:r.name}))) };
  function domItems(){return[...document.querySelectorAll('#cartItems .cart-item')].map(n=>{const name=String(n.querySelector('b,strong')?.textContent||'').trim();const txt=String(n.textContent||'');const prices=[...txt.matchAll(/([0-9][0-9.]{2,})đ/g)].map(m=>Number(m[1].replace(/\./g,''))).filter(Boolean);const q=Number(n.querySelector('.qty b,.qty span')?.textContent||1)||1;return{name,price:prices[0]||0,qty:q}})}
  async function menuRows(rid,token){const r=await fetch(BASE+'/rest/v1/menu_items?select=id,restaurant_id,name,price,is_available,category_id&restaurant_id=eq.'+encodeURIComponent(rid)+'&is_available=eq.true&order=id.asc&limit=200',{headers:{apikey:KEY,Authorization:'Bearer '+token,Accept:'application/json'}});if(!r.ok)throw Error('MENU_LOOKUP_FAILED');return await r.json()}
  function uniqueBy(rows,key){const m=rows.filter(x=>Number(x.price)===Number(key));return m.length===1?m[0]:null}
  async function resolveItems(cart,rid,token){
    const rows=await menuRows(rid,token),dom=domItems(),out=[],normalized=[];
    const displayedTotal=Number(String(document.getElementById('foodTotal')?.textContent||'').replace(/[^0-9]/g,''))||0;
    for(let i=0;i<cart.length;i++){
      const x=cart[i]||{},d=dom[i]||{},liveAll=liveFoods(),name=String(x.name||d.name||'').trim(),price=Number(x.price||d.price||0),live=liveAll.filter(f=>Number(f.restaurantId)===rid&&(String(f.name||'').trim().toLowerCase()===name.toLowerCase()||Number(f.price)===price))[0]||null;
      const qty=Math.max(1,Math.min(99,Number(x.qty??x.quantity??d.qty??1)||1));
      const rawId=x.foodId??x.food_id??live?.id, parsed=Number(rawId),id=Number.isInteger(parsed)&&parsed>0?parsed:null;
      let exact=id!==null?rows.find(m=>Number(m.id)===id):null;
      if(!exact&&name)exact=rows.find(m=>String(m.name||'').trim().toLowerCase()===name.toLowerCase())||null;
      if(!exact&&price>0)exact=uniqueBy(rows,price);
      if(!exact&&live?.id)exact=rows.find(m=>Number(m.id)===Number(live.id))||null;
      if(!exact&&cart.length===1&&displayedTotal>0)exact=uniqueBy(rows,displayedTotal/qty);
      if(!exact&&cart.length===1&&rows.length===1)exact=rows[0];
      if(!exact)throw Error('ITEM_UNAVAILABLE:'+(name||id||price||'NULL')+' | cart='+JSON.stringify(x));
      normalized.push({...x,restaurantId:Number(exact.restaurant_id||rid),foodId:Number(exact.id),name:String(exact.name||name||'Món ăn'),price:Number(exact.price||price||0),qty});
      out.push({foodId:Number(exact.id),qty});
    }
    window.cart=normalized;try{localStorage.setItem(CART_KEY,JSON.stringify(normalized))}catch{};return out;
  }
  async function run(e){if(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}const cart=getCart();if(!cart.length){alert('🛒 Giỏ hàng đang trống.');return false}const name=String(document.getElementById('name')?.value||'').trim(),phone=String(document.getElementById('phone')?.value||'').trim(),address=String(document.getElementById('address')?.value||'').trim(),note=String(document.getElementById('note')?.value||'').trim(),payment=String(document.getElementById('payment')?.value||'cash').trim()||'cash';if(!name||!phone||!address){alert('⚠️ Vui lòng nhập họ tên, số điện thoại và địa chỉ.');return false}const gps=getGPS();if(!gps){alert('📍 Vui lòng bật GPS để đặt đơn.');return false}let rid=Number(cart[0]?.restaurantId??cart[0]?.restaurant_id);if(!Number.isInteger(rid)||rid<=0){const live=liveFoods();const n=String(cart[0]?.name||'').trim().toLowerCase();const p=Number(cart[0]?.price||0);const z=live.find(f=>(n&&String(f.name||'').trim().toLowerCase()===n)||(p>0&&Number(f.price)===p));rid=Number(z?.restaurantId||0)}if(!Number.isInteger(rid)||rid<=0){alert('❌ Không xác định được quán.');return false}if(cart.some(x=>{const q=Number(x?.restaurantId??x?.restaurant_id);return q>0&&q!==rid})){alert('⚠️ Mỗi đơn chỉ được đặt món từ một quán.');return false}const token=localStorage.getItem('choco_access_token')||'';if(!token){alert('🔐 Vui lòng đăng nhập tài khoản khách hàng.');return false}const btn=document.getElementById('orderButton');if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG KHÔI PHỤC MÓN...'}try{const items=await resolveItems(cart,rid,token);if(btn)btn.textContent='⏳ ĐANG GỬI ĐƠN...';const r=await fetch(BASE+'/rest/v1/rpc/create_customer_order',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_restaurant_id:rid,p_items:items,p_name:name,p_phone:phone,p_address:address,p_note:note,p_payment:payment,p_latitude:gps.lat,p_longitude:gps.lng})});let data=null;try{data=await r.json()}catch{}if(!r.ok)throw Error(String(data?.message||data?.hint||data?.details||('HTTP '+r.status)));const order=Array.isArray(data)?data[0]:data;if(!order?.code)throw Error('Server không trả về mã đơn');localStorage.setItem('choco_ship_last_order',JSON.stringify({code:order.code,order_id:order.id,status:order.status,created_at:new Date().toISOString()}));localStorage.removeItem(CART_KEY);window.cart=[];alert('✅ ĐẶT ĐƠN THÀNH CÔNG!\nMã đơn: '+order.code+'\nTổng tiền: '+Number(order.total||0).toLocaleString('vi-VN')+'đ');if(typeof window.renderCart==='function')try{window.renderCart()}catch{}if(typeof window.closeCart==='function')window.closeCart()}catch(err){console.error('[CHOCO FORCE ORDER v6]',err);alert('❌ KHÔNG GỬI ĐƯỢC ĐƠN.\n\n'+err.message)}finally{if(btn){btn.disabled=false;btn.textContent='🚀 ĐẶT ĐƠN'}}return false}
  window.__CHOCO_FORCE_ORDER__=run;window.createOrder=run;
  function bind(){const b=document.getElementById('orderButton');if(!b)return;b.removeAttribute('onclick');if(b.__chocoForceHandler)b.removeEventListener('click',b.__chocoForceHandler,true);b.__chocoForceHandler=run;b.addEventListener('click',run,true)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();[0,250,500,1000,2000,4000].forEach(t=>setTimeout(bind,t));
})();
