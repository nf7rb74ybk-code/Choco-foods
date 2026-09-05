/* CHOCO SHIP — CUSTOMER GPS HARD LOCK v2
 * iPhone-safe GPS: cached/low-accuracy first, high-accuracy fallback, never hangs.
 */
'use strict';
(function(){
  const IDS=['gpsButton','cartGpsButton'];
  const NORMAL='📍 LẤY / CẬP NHẬT GPS GIAO HÀNG';
  let busy=false;
  const els=()=>IDS.map(id=>document.getElementById(id)).filter(Boolean);
  const text=t=>['locationText','cartGpsText'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=t});
  const reset=()=>els().forEach(b=>{b.disabled=false;b.textContent=NORMAL});
  function apply(lat,lng){
    lat=Number(lat);lng=Number(lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return false;
    if(typeof window.setDeliveryLocation==='function'){
      try{window.setDeliveryLocation(lat,lng,'📍 GPS giao hàng hiện tại')}catch(e){console.error(e);return false}
    }else{return false}
    try{localStorage.setItem('choco_customer_gps_v2',JSON.stringify({lat,lng,updated_at:new Date().toISOString()}))}catch(e){}
    text('🟢 GPS: '+lat.toFixed(6)+', '+lng.toFixed(6));
    return true;
  }
  function run(){
    if(busy)return;
    busy=true;
    els().forEach(b=>{b.disabled=true;b.textContent='⏳ ĐANG LẤY GPS...'});
    text('📍 Đang xác định vị trí iPhone...');
    if(!window.isSecureContext||!navigator.geolocation){busy=false;reset();text('⚠️ GPS không khả dụng trên trang này.');return}
    let done=false;
    const finish=(msg)=>{if(done)return;done=true;busy=false;reset();if(msg)text(msg)};
    const hard=setTimeout(()=>finish('⚠️ GPS quá chậm. Hãy bật Wi‑Fi/4G + Dịch vụ định vị rồi bấm lại.'),21000);
    const success=p=>{if(done)return;clearTimeout(hard);if(apply(p.coords.latitude,p.coords.longitude))finish();else finish('⚠️ GPS lấy được nhưng chưa cập nhật được bản đồ.')};
    const high=()=>{
      if(done)return;
      text('📍 Đang lấy GPS chính xác hơn...');
      navigator.geolocation.getCurrentPosition(success,err=>{clearTimeout(hard);if(err&&err.code===1)finish('⚠️ Safari đã từ chối quyền vị trí. Hãy bật Vị trí chính xác.');else finish('⚠️ Không xác định được vị trí. Hãy thử lại gần cửa sổ/ngoài trời.')},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
    };
    navigator.geolocation.getCurrentPosition(success,err=>{
      if(done)return;
      if(err&&err.code===1){clearTimeout(hard);finish('⚠️ Safari chưa cho phép vị trí. Hãy bật Vị trí chính xác.');return}
      high();
    },{enableHighAccuracy:false,timeout:7000,maximumAge:60000});
  }
  window.__CHOCO_HARD_GPS__=run;
  window.getGPS=run;
  function bind(){els().forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();run()},true));reset()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();