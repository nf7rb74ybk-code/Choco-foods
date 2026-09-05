/* CHOCO SHIP — CUSTOMER GPS HARD LOCK v3
 * iPhone-safe GPS with getCurrentPosition + watchPosition fallback.
 * Never leaves the UI stuck on "ĐANG LẤY GPS".
 */
'use strict';
(function(){
  const IDS=['gpsButton','cartGpsButton'];
  const NORMAL='📍 LẤY / CẬP NHẬT GPS GIAO HÀNG';
  let busy=false,watchId=null,timers=[];
  const els=()=>IDS.map(id=>document.getElementById(id)).filter(Boolean);
  const text=t=>['locationText','cartGpsText'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=t});
  const reset=()=>els().forEach(b=>{b.disabled=false;b.textContent=NORMAL});
  const cleanup=()=>{timers.forEach(clearTimeout);timers=[];if(watchId!==null){try{navigator.geolocation.clearWatch(watchId)}catch(e){}watchId=null}};
  const finish=(msg)=>{if(!busy)return;busy=false;cleanup();reset();if(msg)text(msg)};
  function apply(lat,lng){
    lat=Number(lat);lng=Number(lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return false;
    if(typeof window.setDeliveryLocation==='function'){
      try{window.setDeliveryLocation(lat,lng,'📍 GPS giao hàng hiện tại')}catch(e){console.error(e);return false}
    }else return false;
    try{localStorage.setItem('choco_customer_gps_v3',JSON.stringify({lat,lng,updated_at:new Date().toISOString()}))}catch(e){}
    text('🟢 GPS: '+lat.toFixed(6)+', '+lng.toFixed(6));
    return true;
  }
  function accept(p){if(!busy||!p||!p.coords)return;const c=p.coords;if(apply(c.latitude,c.longitude))finish()}
  function run(){
    if(busy)return;
    busy=true;
    els().forEach(b=>{b.disabled=true;b.textContent='⏳ ĐANG LẤY GPS...'});
    text('📍 Đang xác định vị trí iPhone...');
    if(!window.isSecureContext||!navigator.geolocation){finish('⚠️ GPS không khả dụng trên trang này.');return}
    const err=e=>console.warn('CHOCO GPS',e?.code,e?.message||e);
    // Fast path: ask for a recent cached/network location first.
    navigator.geolocation.getCurrentPosition(accept,e=>{
      err(e);
      if(!busy)return;
      text(e&&e.code===1?'⚠️ Safari chưa cho phép vị trí. Đang kiểm tra lại...':'📍 iPhone chưa trả vị trí, đang dùng GPS theo dõi...');
      startWatch();
    },{enableHighAccuracy:false,timeout:5000,maximumAge:120000});
    // Independent fallback: watchPosition often returns on iPhone when a one-shot request stalls.
    timers.push(setTimeout(()=>{if(busy)startWatch()},5500));
    // Final hard stop. UI is always restored.
    timers.push(setTimeout(()=>{if(busy)finish('⚠️ iPhone không trả vị trí. Bật Dịch vụ định vị + Vị trí chính xác cho Safari rồi bấm lại.')},21000));
  }
  function startWatch(){
    if(!busy||watchId!==null)return;
    text('📍 Đang lấy GPS từ iPhone...');
    try{
      watchId=navigator.geolocation.watchPosition(accept,e=>{
        err(e);
        if(!busy)return;
        if(e&&e.code===1)finish('⚠️ Safari chưa được cấp quyền vị trí. Hãy bật Vị trí chính xác.');
      },{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
    }catch(e){finish('⚠️ Không thể khởi động GPS trên iPhone.');}
  }
  window.__CHOCO_HARD_GPS__=run;
  window.getGPS=run;
  function bind(){els().forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();run()},true));reset()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();