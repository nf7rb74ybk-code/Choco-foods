/* CHOCO SHIP - Shipper online + GPS heartbeat + history + order status flow */
'use strict';
(function(){
  if(window.__CHOCO_SHIPPER_ONLINE__) return;
  window.__CHOCO_SHIPPER_ONLINE__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=localStorage.getItem('choco_access_token')||'';
  const UID=localStorage.getItem('choco_user_id')||'';
  const ROLE=localStorage.getItem('choco_role')||'';
  if(!TOKEN||!UID||ROLE!=='shipper') return;
  const headers={apikey:KEY,Authorization:'Bearer '+TOKEN,'Content-Type':'application/json',Accept:'application/json'};
  let coords=null,watchId=null,lastHistoryAt=0;

  function gpsUI(){
    if(document.getElementById('shipperGpsBox')) return;
    const box=document.createElement('div');
    box.id='shipperGpsBox';
    box.style.cssText='background:#fff;border:1px solid #bfdbfe;border-radius:15px;padding:14px;margin:0 0 12px;box-shadow:0 2px 8px #ddd';
    box.innerHTML='<b style="font-size:17px;color:#1d4ed8">📍 VỊ TRÍ SHIPPER</b><div id="shipperGpsStatus" style="font-size:13px;color:#64748b;margin:7px 0;line-height:1.5">Chưa bật GPS. Bấm nút bên dưới để cấp quyền vị trí.</div><button id="shipperGpsButton" style="width:100%;padding:13px;border:0;border-radius:10px;background:#1677ff;color:#fff;font-weight:800;font-size:16px">📍 BẬT GPS SHIPPER</button>';
    const main=document.querySelector('main')||document.body;
    main.insertBefore(box,main.firstChild);
    document.getElementById('shipperGpsButton').addEventListener('click',startGPS);
  }
  function gpsStatus(text,ok=false){const el=document.getElementById('shipperGpsStatus'),btn=document.getElementById('shipperGpsButton');if(el){el.textContent=text;el.style.color=ok?'#166534':'#64748b'}if(btn){btn.disabled=false;btn.textContent=ok?'✅ GPS ĐANG HOẠT ĐỘNG':'📍 BẬT GPS SHIPPER'}}
  async function recordHistory(){if(!coords||Date.now()-lastHistoryAt<25000)return;lastHistoryAt=Date.now();try{const r=await fetch(SB+'/rest/v1/shipper_gps_history',{method:'POST',headers,body:JSON.stringify({shipper_id:UID,latitude:coords.lat,longitude:coords.lng})});if(!r.ok)console.warn('SHIPPER GPS HISTORY',r.status,await r.text())}catch(e){console.warn('SHIPPER GPS HISTORY',e)}}
  async function save(extra={}){try{const body={last_seen:new Date().toISOString(),is_online:true,...extra};const r=await fetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(UID),{method:'PATCH',headers,body:JSON.stringify(body)});if(!r.ok)console.warn('SHIPPER ONLINE/GPS',r.status,await r.text());else await recordHistory()}catch(e){console.warn('SHIPPER ONLINE/GPS',e)}}
  function updateGPS(position){coords={lat:Number(position.coords.latitude),lng:Number(position.coords.longitude)};gpsStatus('🟢 GPS đã bật • '+coords.lat.toFixed(6)+', '+coords.lng.toFixed(6),true);save({latitude:coords.lat,longitude:coords.lng})}
  function startGPS(){const btn=document.getElementById('shipperGpsButton');if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG XIN QUYỀN GPS...'}if(!navigator.geolocation){gpsStatus('❌ Thiết bị không hỗ trợ GPS.');return}if(watchId!==null){gpsStatus('🟢 GPS đã hoạt động.',true);return}navigator.geolocation.getCurrentPosition(updateGPS,err=>{console.warn('SHIPPER GPS permission',err);const msg=err.code===1?'❌ Bạn đã từ chối quyền vị trí. Hãy vào Cài đặt → Quyền riêng tư & Bảo mật → Dịch vụ định vị và cho phép Safari.':err.code===2?'❌ Không xác định được vị trí. Hãy bật Dịch vụ định vị.':'❌ GPS hết thời gian chờ. Hãy thử lại.';gpsStatus(msg)},{enableHighAccuracy:true,maximumAge:0,timeout:20000});watchId=navigator.geolocation.watchPosition(updateGPS,err=>{console.warn('SHIPPER GPS',err);if(err.code===1)gpsStatus('❌ Quyền vị trí đang bị chặn. Hãy cho phép Safari dùng vị trí.');save()},{enableHighAccuracy:true,maximumAge:15000,timeout:20000})}

  /* Cache the orders returned by the existing shipper page so status buttons can safely map cards to real DB ids. */
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const response=await nativeFetch(input,init);
    try{
      const u=typeof input==='string'?input:(input?.url||'');
      if(u.includes('/rest/v1/orders?')&&u.includes('select=*')){
        const copy=response.clone();
        copy.json().then(data=>{if(Array.isArray(data))window.__CHOCO_LAST_ORDERS__=data}).catch(()=>{});
      }
    }catch(e){}
    return response;
  };

  /* Shipper owns the delivery lifecycle up to "Đã giao". Admin confirms final "Hoàn thành". */
  const FLOW={'Đã nhận':{next:'Đang lấy hàng',label:'🛵 BẮT ĐẦU LẤY HÀNG'},'Đang lấy hàng':{next:'Đang giao',label:'📦 ĐÃ LẤY HÀNG - BẮT ĐẦU GIAO'},'Đang giao':{next:'Đã giao',label:'🏁 XÁC NHẬN ĐÃ GIAO'}};
  const esc2=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  async function updateOrderStatus(id,current,next){
    const cfg=FLOW[current];if(!id||!cfg||cfg.next!==next)return;
    const wrap=document.querySelector('[data-status-order="'+CSS.escape(String(id))+'"]');
    if(wrap)wrap.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{const qs='/rest/v1/orders?id=eq.'+encodeURIComponent(id)+'&shipper_id=eq.'+encodeURIComponent(UID)+'&status=eq.'+encodeURIComponent(current);const r=await nativeFetch(SB+qs,{method:'PATCH',headers,body:JSON.stringify({status:next})});if(!r.ok)throw Error(await r.text()||('HTTP '+r.status));if(typeof window.loadOrders==='function')await window.loadOrders()}catch(e){alert('❌ Không thể cập nhật trạng thái: '+(e?.message||e));if(wrap)wrap.querySelectorAll('button').forEach(b=>b.disabled=false)}}
  window.chocoUpdateOrderStatus=updateOrderStatus;

  function enhanceOrderCards(){
    document.querySelectorAll('#orders .order').forEach(card=>{
      if(card.dataset.statusFlowReady==='1')return;
      const bold=card.querySelector('b'),code=bold?.textContent?.trim()||'',statusText=card.querySelector('p')?.textContent||'';
      const match=statusText.match(/📌\s*([^\n]+)/),current=(match?.[1]||'').trim();
      if(!FLOW[current])return;
      const found=(window.__CHOCO_LAST_ORDERS__||[]).find(o=>String(o.code||('#'+o.id))===code&&String(o.shipper_id||'')===UID);
      if(!found)return;
      const wrap=document.createElement('div');wrap.dataset.statusOrder=String(found.id);wrap.style.cssText='margin-top:9px;padding-top:9px;border-top:1px solid #e5e7eb';
      wrap.innerHTML='<div style="font-size:12px;color:#64748b;margin-bottom:6px">🔄 Trạng thái tiếp theo: <b>'+esc2(FLOW[current].next)+'</b></div><button style="width:100%;padding:12px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-weight:800;font-size:15px">'+FLOW[current].label+'</button>';
      wrap.querySelector('button').onclick=()=>updateOrderStatus(String(found.id),current,FLOW[current].next);card.appendChild(wrap);card.dataset.statusFlowReady='1';
    });
  }
  const ordersEl=document.getElementById('orders');if(ordersEl)new MutationObserver(()=>enhanceOrderCards()).observe(ordersEl,{childList:true,subtree:true});
  window.chocoStartShipperGPS=startGPS;gpsUI();save();setInterval(()=>{if(coords)save({latitude:coords.lat,longitude:coords.lng});else save()},30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){save(coords?{latitude:coords.lat,longitude:coords.lng}:{});if(watchId===null)gpsStatus('Chưa bật GPS. Bấm "BẬT GPS SHIPPER" để cấp quyền vị trí.')}});
  window.addEventListener('pagehide',()=>{if(watchId!==null){try{navigator.geolocation.clearWatch(watchId)}catch{}}nativeFetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(UID),{method:'PATCH',keepalive:true,headers,body:JSON.stringify({last_seen:new Date().toISOString(),is_online:false})}).catch(()=>{})});
})();
