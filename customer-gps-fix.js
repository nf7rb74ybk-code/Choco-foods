/* CHOCO SHIP — CUSTOMER GPS CORE v9
 * Single owner of window.getGPS(). Never leaves customer UI locked.
 */
'use strict';
(function(){
  const BUTTON_IDS=['gpsButton','cartGpsButton'];
  const NORMAL='📍 LẤY / CẬP NHẬT GPS GIAO HÀNG';
  const KEY='choco_customer_gps_v1';
  let requestId=0, watchdog=null;
  const buttons=()=>BUTTON_IDS.map(id=>document.getElementById(id)).filter(Boolean);
  const setButtons=(text,disabled)=>buttons().forEach(b=>{b.disabled=!!disabled;b.textContent=text;});
  const setMessage=text=>['locationText','cartGpsText'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=text;});
  const valid=(lat,lng)=>Number.isFinite(Number(lat))&&Number.isFinite(Number(lng));
  const readCache=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return valid(x?.lat,x?.lng)?{lat:Number(x.lat),lng:Number(x.lng)}:null}catch{return null}};
  const save=(lat,lng)=>{try{localStorage.setItem(KEY,JSON.stringify({lat,lng,updated_at:new Date().toISOString()}));}catch{}};
  function apply(lat,lng,label){lat=Number(lat);lng=Number(lng);if(!valid(lat,lng))return false;try{if(typeof window.setDeliveryLocation!=='function')return false;window.setDeliveryLocation(lat,lng,label||'📍 Vị trí GPS hiện tại');save(lat,lng);if(typeof window.__CHOCO_PERSIST_DELIVERY__==='function')window.__CHOCO_PERSIST_DELIVERY__();setMessage('🟢 GPS: '+lat.toFixed(6)+', '+lng.toFixed(6));return true}catch(e){console.error('[CHOCO GPS APPLY]',e);return false}}
  function reset(){if(watchdog){clearTimeout(watchdog);watchdog=null}setButtons(NORMAL,false)}
  function run(){
    const id=++requestId;
    if(watchdog){clearTimeout(watchdog);watchdog=null}
    if(!window.isSecureContext){reset();setMessage('⚠️ GPS cần HTTPS. Hãy mở CHOCO SHIP bằng GitHub Pages.');return}
    if(!navigator.geolocation){reset();setMessage('⚠️ iPhone/Safari không hỗ trợ GPS.');return}
    setButtons('⏳ ĐANG LẤY GPS...',true);setMessage('📍 Đang xin vị trí hiện tại...');
    let done=false;
    const finish=(fn)=>{if(done||id!==requestId)return;done=true;reset();try{fn()}catch(e){console.error('[CHOCO GPS]',e);setMessage('⚠️ GPS gặp lỗi. Hãy thử lại.')}};
    const ok=p=>finish(()=>{const lat=p?.coords?.latitude,lng=p?.coords?.longitude;if(!apply(lat,lng,'📍 Vị trí GPS hiện tại'))setMessage('⚠️ GPS có tọa độ nhưng bản đồ chưa nhận được.');});
    const fail=e=>finish(()=>{console.warn('[CHOCO GPS]',e?.code,e?.message||'');const c=readCache();if(c&&apply(c.lat,c.lng,'📍 Vị trí gần nhất đã lưu'))return;const code=e?.code;setMessage(code===1?'⚠️ Safari chưa được cấp quyền vị trí. Bật Cài đặt → Quyền riêng tư & Bảo mật → Dịch vụ định vị → Safari → Khi dùng ứng dụng + Vị trí chính xác.':code===2?'⚠️ iPhone chưa xác định được vị trí. Bật Wi‑Fi/4G rồi thử lại.':'⚠️ GPS không phản hồi. Bạn có thể chạm trực tiếp lên bản đồ để chọn vị trí.');});
    try{navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:false,timeout:8000,maximumAge:30000})}catch(e){finish(()=>setMessage('⚠️ Không thể khởi động GPS trên thiết bị này.'))}
    watchdog=setTimeout(()=>finish(()=>{const c=readCache();if(c&&apply(c.lat,c.lng,'📍 Vị trí gần nhất đã lưu'))return;setMessage('⚠️ GPS quá lâu — đã tự hủy để không treo. Chạm bản đồ để chọn vị trí.')}),9000);
  }
  window.getGPS=run;
  const init=()=>setButtons(NORMAL,false);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
