/* CHOCO SHIP — CUSTOMER GPS HARD LOCK v4
 * Fail-safe iPhone GPS. GPS callback can never keep the UI locked.
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
  const finish=(msg)=>{busy=false;cleanup();reset();if(msg)text(msg)};
  function apply(lat,lng){
    lat=Number(lat);lng=Number(lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return false;
    try{window.currentGPS={lat,lng}}catch(e){}
    try{localStorage.setItem('choco_customer_gps_v4',JSON.stringify({lat,lng,updated_at:new Date().toISOString()}))}catch(e){}
    try{if(typeof window.setDeliveryLocation==='function')window.setDeliveryLocation(lat,lng,'📍 GPS giao hàng hiện tại')}catch(e){console.warn('CHOCO GPS UI',e)}
    text('🟢 GPS: '+lat.toFixed(6)+', '+lng.toFixed(6));
    try{if(typeof window.updateShippingDisplay==='function')window.updateShippingDisplay()}catch(e){}
    return true;
  }
  function accept(p){if(!busy||!p||!p.coords)return;const c=p.coords;if(apply(c.latitude,c.longitude))finish('🟢 Đã lấy GPS giao hàng');}
  function startWatch(){
    if(!busy||watchId!==null)return;
    text('📍 Đang lấy GPS từ iPhone...');
    try{watchId=navigator.geolocation.watchPosition(accept,e=>{console.warn('CHOCO GPS',e?.code,e?.message||e);if(e&&e.code===1)finish('⚠️ Safari chưa được cấp quyền vị trí. Hãy bật Vị trí chính xác.')},{enableHighAccuracy:true,timeout:7000,maximumAge:30000})}
    catch(e){finish('⚠️ Không thể khởi động GPS trên iPhone.')}
  }
  function run(){
    if(busy)return;
    busy=true;els().forEach(b=>{b.disabled=true;b.textContent='⏳ ĐANG LẤY GPS...'});text('📍 Đang xác định vị trí iPhone...');
    if(!window.isSecureContext||!navigator.geolocation){finish('⚠️ GPS không khả dụng trên trang này.');return}
    navigator.geolocation.getCurrentPosition(accept,e=>{console.warn('CHOCO GPS',e?.code,e?.message||e);if(busy)startWatch()},{enableHighAccuracy:false,timeout:3000,maximumAge:120000});
    timers.push(setTimeout(()=>{if(busy)startWatch()},3200));
    timers.push(setTimeout(()=>{if(busy)finish('⚠️ iPhone chưa trả GPS. Kiểm tra Dịch vụ định vị + Vị trí chính xác cho Safari.')},9000));
  }
  window.__CHOCO_HARD_GPS__=run;window.getGPS=run;
  function bind(){els().forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();run()},true));reset()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();