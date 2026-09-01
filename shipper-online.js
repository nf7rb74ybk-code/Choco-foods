/* CHOCO SHIP - Shipper online + GPS heartbeat + history */
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

  function gpsStatus(text,ok=false){
    const el=document.getElementById('shipperGpsStatus');
    const btn=document.getElementById('shipperGpsButton');
    if(el){el.textContent=text;el.style.color=ok?'#166534':'#64748b'}
    if(btn){btn.disabled=false;btn.textContent=ok?'✅ GPS ĐANG HOẠT ĐỘNG':'📍 BẬT GPS SHIPPER'}
  }

  async function recordHistory(){
    if(!coords||Date.now()-lastHistoryAt<25000) return;
    lastHistoryAt=Date.now();
    try{
      const r=await fetch(SB+'/rest/v1/shipper_gps_history',{method:'POST',headers,body:JSON.stringify({shipper_id:UID,latitude:coords.lat,longitude:coords.lng})});
      if(!r.ok) console.warn('SHIPPER GPS HISTORY',r.status,await r.text());
    }catch(e){console.warn('SHIPPER GPS HISTORY',e)}
  }

  async function save(extra={}){
    try{
      const body={last_seen:new Date().toISOString(),is_online:true,...extra};
      const r=await fetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(UID),{method:'PATCH',headers,body:JSON.stringify(body)});
      if(!r.ok) console.warn('SHIPPER ONLINE/GPS',r.status,await r.text());
      else await recordHistory();
    }catch(e){console.warn('SHIPPER ONLINE/GPS',e)}
  }

  function updateGPS(position){
    coords={lat:Number(position.coords.latitude),lng:Number(position.coords.longitude)};
    gpsStatus('🟢 GPS đã bật • '+coords.lat.toFixed(6)+', '+coords.lng.toFixed(6),true);
    save({latitude:coords.lat,longitude:coords.lng});
  }

  function startGPS(){
    const btn=document.getElementById('shipperGpsButton');
    if(btn){btn.disabled=true;btn.textContent='⏳ ĐANG XIN QUYỀN GPS...'}
    if(!navigator.geolocation){gpsStatus('❌ Thiết bị không hỗ trợ GPS.');return}
    if(watchId!==null){gpsStatus('🟢 GPS đã hoạt động.',true);return}
    navigator.geolocation.getCurrentPosition(updateGPS,err=>{
      console.warn('SHIPPER GPS permission',err);
      const msg=err.code===1?'❌ Bạn đã từ chối quyền vị trí. Hãy vào Cài đặt → Quyền riêng tư & Bảo mật → Dịch vụ định vị và cho phép Safari.':err.code===2?'❌ Không xác định được vị trí. Hãy bật Dịch vụ định vị.':'❌ GPS hết thời gian chờ. Hãy thử lại.';
      gpsStatus(msg);
    },{enableHighAccuracy:true,maximumAge:0,timeout:20000});
    watchId=navigator.geolocation.watchPosition(updateGPS,err=>{
      console.warn('SHIPPER GPS',err);
      if(err.code===1) gpsStatus('❌ Quyền vị trí đang bị chặn. Hãy cho phép Safari dùng vị trí.');
      save();
    },{enableHighAccuracy:true,maximumAge:15000,timeout:20000});
  }

  window.chocoStartShipperGPS=startGPS;
  gpsUI();
  save();

  setInterval(()=>{
    if(coords) save({latitude:coords.lat,longitude:coords.lng});
    else save();
  },30000);

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      save(coords?{latitude:coords.lat,longitude:coords.lng}:{});
      if(watchId===null) gpsStatus('Chưa bật GPS. Bấm "BẬT GPS SHIPPER" để cấp quyền vị trí.');
    }
  });

  window.addEventListener('pagehide',()=>{
    if(watchId!==null){try{navigator.geolocation.clearWatch(watchId)}catch{}}
    fetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(UID),{method:'PATCH',keepalive:true,headers,body:JSON.stringify({last_seen:new Date().toISOString(),is_online:false})}).catch(()=>{});
  });
})();