/* CHOCO SHIP — CUSTOMER GPS HARD LOCK v1
 * Capture button clicks before any legacy inline getGPS().
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
    if(!Number.isFinite(lat)||!Number.isFinite(lng)){text('⚠️ GPS trả về tọa độ không hợp lệ.');return false}
    if(typeof window.setDeliveryLocation==='function'){
      try{window.setDeliveryLocation(lat,lng,'GPS giao hàng');}catch(e){console.error(e);text('⚠️ Không thể cập nhật vị trí lên bản đồ.');return false}
    }else if(window.map&&typeof L!=='undefined'){
      try{window.map.setView([lat,lng],16);if(window.marker)window.map.removeLayer(window.marker);window.marker=L.marker([lat,lng]).addTo(window.map)}catch(e){console.error(e)}
    }else{text('⚠️ Bản đồ chưa sẵn sàng. Hãy thử lại.');return false}
    try{localStorage.setItem('choco_customer_gps_v1',JSON.stringify({lat,lng,updated_at:new Date().toISOString()}))}catch(e){}
    text('🟢 GPS: '+lat.toFixed(6)+', '+lng.toFixed(6));
    return true;
  }
  function run(){
    if(busy)return;
    busy=true;els().forEach(b=>{b.disabled=true;b.textContent='⏳ ĐANG LẤY GPS...'});text('📍 Đang xin vị trí từ iPhone...');
    let done=false;
    const finish=()=>{if(done)return;done=true;busy=false;reset()};
    const timer=setTimeout(()=>{finish();text('⚠️ GPS không phản hồi. Bấm lại hoặc kiểm tra quyền vị trí trên iPhone.');},16000);
    if(!window.isSecureContext){clearTimeout(timer);finish();text('⚠️ GPS cần HTTPS / GitHub Pages.');return}
    if(!navigator.geolocation){clearTimeout(timer);finish();text('⚠️ Trình duyệt không hỗ trợ GPS.');return}
    navigator.geolocation.getCurrentPosition(p=>{clearTimeout(timer);if(done)return;const ok=apply(p.coords.latitude,p.coords.longitude);finish();if(!ok)text('⚠️ GPS lấy được nhưng chưa gắn được vào bản đồ.')},e=>{clearTimeout(timer);if(done)return;finish();let m='⚠️ Không lấy được GPS.';if(e.code===1)m='⚠️ Safari chưa được cấp quyền vị trí. Bật Dịch vụ định vị + Vị trí chính xác.';else if(e.code===2)m='⚠️ iPhone chưa xác định được vị trí. Bật Wi‑Fi/4G rồi thử lại.';else if(e.code===3)m='⚠️ GPS phản hồi quá chậm. Hãy thử lại.';text(m)}, {enableHighAccuracy:true,timeout:15000,maximumAge:0});
  }
  window.__CHOCO_HARD_GPS__=run;
  window.getGPS=run;
  function bind(){els().forEach(b=>{b.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();run()},true)});reset()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();