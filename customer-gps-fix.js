/* CHOCO SHIP — CUSTOMER GPS FIX v5 */
'use strict';
(function(){
  let busy=false,seq=0,timer=null;
  const buttons=()=>[document.getElementById('gpsButton'),document.getElementById('cartGpsButton')].filter(Boolean);
  const label='📍 LẤY / CẬP NHẬT GPS GIAO HÀNG';
  function setBusy(v){busy=v;buttons().forEach(b=>{b.disabled=v;b.innerText=v?'⏳ ĐANG LẤY GPS...':label;});}
  function fail(msg){setBusy(false);const a=document.getElementById('locationText'),c=document.getElementById('cartGpsText');if(a)a.textContent='⚠️ '+msg;if(c)c.textContent='⚠️ '+msg;}
  function cached(){try{const x=JSON.parse(localStorage.getItem('choco_customer_gps_v1')||'null'),lat=Number(x?.lat),lng=Number(x?.lng);return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null}catch{return null}}
  function apply(lat,lng,msg){lat=Number(lat);lng=Number(lng);if(!Number.isFinite(lat)||!Number.isFinite(lng))return fail('Tọa độ GPS không hợp lệ.');try{if(typeof window.setDeliveryLocation!=='function')return fail('Bản đồ chưa sẵn sàng.');window.setDeliveryLocation(lat,lng,msg||'📍 Vị trí GPS hiện tại');try{localStorage.setItem('choco_customer_gps_v1',JSON.stringify({lat,lng,updated_at:new Date().toISOString()}));}catch{}if(typeof window.__CHOCO_PERSIST_DELIVERY__==='function')window.__CHOCO_PERSIST_DELIVERY__();setBusy(false);}catch(e){console.error('[CHOCO GPS APPLY]',e);fail('Không thể cập nhật vị trí lên bản đồ.');}}
  function run(){
    if(busy)return;
    if(!window.isSecureContext)return fail('GPS cần HTTPS. Hãy mở CHOCO SHIP bằng GitHub Pages.');
    if(!navigator.geolocation)return fail('Thiết bị không hỗ trợ GPS.');
    const my=++seq;setBusy(true);if(timer)clearTimeout(timer);let done=false;
    const finish=fn=>{if(done||my!==seq)return;done=true;if(timer)clearTimeout(timer);try{fn();}catch(e){console.error('[CHOCO GPS]',e);setBusy(false);}};
    const ok=p=>{const lat=p?.coords?.latitude,lng=p?.coords?.longitude;if(lat==null||lng==null)return;finish(()=>apply(lat,lng,'📍 Vị trí GPS hiện tại'));};
    const bad=e=>{console.warn('[CHOCO GPS ERROR]',e?.code,e?.message);const c=cached();if(c)return finish(()=>apply(c.lat,c.lng,'📍 Vị trí GPS gần nhất đã lưu'));if(e?.code===1)return finish(()=>fail('Bạn đã chặn quyền vị trí. Hãy bật Dịch vụ định vị cho Safari và Vị trí chính xác.'));if(e?.code===2)return finish(()=>fail('Không xác định được vị trí. Hãy bật Wi‑Fi/4G và Định vị chính xác.'));if(e?.code===3)return finish(()=>fail('GPS phản hồi quá lâu. Hãy thử lại ở nơi có sóng tốt.'));finish(()=>fail('Không lấy được GPS. Hãy thử lại.'));};
    try{navigator.geolocation.getCurrentPosition(ok,bad,{enableHighAccuracy:true,timeout:6000,maximumAge:0});}catch(e){finish(()=>fail('Không thể khởi động GPS trên thiết bị này.'));return;}
    timer=setTimeout(()=>{const c=cached();finish(()=>c?apply(c.lat,c.lng,'📍 Vị trí GPS gần nhất đã lưu'):fail('GPS chưa phản hồi sau 6 giây. Hãy bật Định vị chính xác rồi thử lại.'));},6500);
  }
  window.getGPS=run;
  function ready(){setBusy(false);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();