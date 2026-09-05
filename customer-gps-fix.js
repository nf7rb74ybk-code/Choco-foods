/* CHOCO SHIP — CUSTOMER GPS FIX v2 */
'use strict';
(function(){
  const WAIT=10000;
  let busy=false;
  const buttons=()=>[document.getElementById('gpsButton'),document.getElementById('cartGpsButton')].filter(Boolean);
  function setBusy(v){busy=v;buttons().forEach(b=>{b.disabled=v;b.innerText=v?'⏳ ĐANG LẤY GPS...':'📍 CẬP NHẬT VỊ TRÍ'})}
  function fail(msg){setBusy(false);const t=document.getElementById('locationText');if(t)t.textContent='⚠️ '+msg;const c=document.getElementById('cartGpsText');if(c)c.textContent='⚠️ '+msg;}
  function cached(){try{const x=JSON.parse(localStorage.getItem('choco_customer_gps_v1')||'null');if(x&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lng)))return x}catch{}return null}
  function apply(lat,lng,msg){
    const la=Number(lat),lo=Number(lng);
    if(!Number.isFinite(la)||!Number.isFinite(lo))return fail('Tọa độ GPS không hợp lệ.');
    try{
      if(typeof window.setDeliveryLocation!=='function')return fail('Bản đồ chưa sẵn sàng. Hãy thử lại.');
      window.setDeliveryLocation(la,lo,msg||'📍 Vị trí GPS hiện tại');
      try{localStorage.setItem('choco_customer_gps_v1',JSON.stringify({lat:la,lng:lo,updated_at:new Date().toISOString()}))}catch{}
      if(typeof window.__CHOCO_PERSIST_DELIVERY__==='function')window.__CHOCO_PERSIST_DELIVERY__();
      setBusy(false);
    }catch(e){console.error('[CHOCO GPS]',e);fail('Không thể cập nhật vị trí lên bản đồ.');}
  }
  function run(){
    if(busy)return;
    if(!window.isSecureContext)return fail('GPS cần HTTPS. Hãy mở CHOCO SHIP từ GitHub Pages.');
    if(!navigator.geolocation)return fail('Thiết bị không hỗ trợ GPS.');
    setBusy(true);
    let settled=false,timer=null,watch=null;
    const finish=fn=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);if(watch!==null){try{navigator.geolocation.clearWatch(watch)}catch{}};fn()};
    const success=p=>finish(()=>apply(p?.coords?.latitude,p?.coords?.longitude,'📍 Vị trí GPS hiện tại'));
    const failure=e=>{
      if(settled)return;
      console.warn('[CHOCO GPS ERROR]',e?.code,e?.message);
      const c=cached();
      if(c)return finish(()=>apply(c.lat,c.lng,'📍 Vị trí GPS gần nhất đã lưu'));
      if(e?.code===1)return finish(()=>fail('Bạn đã chặn quyền vị trí. Vào Cài đặt iPhone → Quyền riêng tư & Bảo mật → Dịch vụ định vị → Safari → Khi dùng ứng dụng.'));
      if(e?.code===2)return finish(()=>fail('Không xác định được vị trí. Hãy bật Dịch vụ định vị và Định vị chính xác rồi thử lại.'));
      if(e?.code===3)return finish(()=>fail('GPS phản hồi quá lâu. Hãy bật Định vị chính xác rồi thử lại.'));
      return finish(()=>fail('Không lấy được GPS. Hãy thử lại.'));
    };
    try{navigator.geolocation.getCurrentPosition(success,failure,{enableHighAccuracy:true,timeout:WAIT,maximumAge:0});}catch(e){return finish(()=>fail('Không thể khởi động GPS trên thiết bị này.'));}
    try{watch=navigator.geolocation.watchPosition(success,failure,{enableHighAccuracy:true,timeout:WAIT,maximumAge:0});}catch(e){}
    timer=setTimeout(()=>{if(settled)return;const c=cached();if(c)finish(()=>apply(c.lat,c.lng,'📍 Vị trí GPS gần nhất đã lưu'));else finish(()=>fail('Không lấy được GPS sau 10 giây. Hãy bật GPS/Định vị chính xác rồi thử lại.'));},WAIT+1500);
  }
  window.getGPS=run;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>buttons().forEach(b=>b.disabled=false));else buttons().forEach(b=>b.disabled=false);
})();