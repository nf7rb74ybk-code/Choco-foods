/* CHOCO SHIP — CUSTOMER GPS FIX v1 */
'use strict';
(function(){
  const WAIT=12000;
  const money=window.money||((n)=>Number(n||0).toLocaleString('vi-VN')+'đ');
  let busy=false;
  function buttons(){return [document.getElementById('gpsButton'),document.getElementById('cartGpsButton')].filter(Boolean)}
  function setBusy(v){busy=v;buttons().forEach(b=>{b.disabled=v;b.innerText=v?'⏳ ĐANG LẤY GPS...':'📍 CẬP NHẬT VỊ TRÍ'})}
  function fail(msg){setBusy(false);const t=document.getElementById('locationText');if(t)t.textContent='⚠️ '+msg;const c=document.getElementById('cartGpsText');if(c)c.textContent='⚠️ '+msg;alert('⚠️ '+msg)}
  function apply(lat,lng){
    const la=Number(lat),lo=Number(lng);
    if(!Number.isFinite(la)||!Number.isFinite(lo))return fail('Tọa độ GPS không hợp lệ.');
    try{
      if(typeof window.setDeliveryLocation==='function')window.setDeliveryLocation(la,lo,'📍 Vị trí GPS hiện tại');
      else throw Error('setDeliveryLocation chưa sẵn sàng');
      try{localStorage.setItem('choco_customer_gps_v1',JSON.stringify({lat:la,lng:lo,updated_at:new Date().toISOString()}))}catch{}
      if(typeof window.__CHOCO_PERSIST_DELIVERY__==='function')window.__CHOCO_PERSIST_DELIVERY__();
      setBusy(false);
    }catch(e){console.error('[CHOCO GPS]',e);fail('Không thể cập nhật vị trí lên bản đồ.')}
  }
  function cached(){
    try{const x=JSON.parse(localStorage.getItem('choco_customer_gps_v1')||'null');if(x&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lng)))return x}catch{}
    return null;
  }
  function run(){
    if(busy)return;
    if(!window.isSecureContext){return fail('Trang GPS phải chạy bằng HTTPS. Hãy mở CHOCO SHIP từ GitHub Pages.')} 
    if(!navigator.geolocation)return fail('Thiết bị không hỗ trợ GPS.');
    setBusy(true);
    let settled=false,timer=null,watch=null;
    const done=(fn)=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);if(watch!==null)navigator.geolocation.clearWatch(watch);fn()};
    const ok=p=>done(()=>apply(p.coords.latitude,p.coords.longitude));
    const err=e=>{
      if(settled)return;
      console.warn('[CHOCO GPS ERROR]',e?.code,e?.message);
      if(e?.code===1){done(()=>fail('Bạn đã chặn quyền vị trí. Vào Cài đặt iPhone → Quyền riêng tư & Bảo mật → Dịch vụ định vị → Safari → Khi dùng ứng dụng.'))}
      else if(e?.code===2||e?.code===3){const c=cached();if(c)done(()=>{apply(c.lat,c.lng);alert('📍 GPS hiện tại chưa phản hồi, đã dùng vị trí GPS gần nhất đã lưu.')});else if(e?.code===3)done(()=>fail('GPS phản hồi quá lâu. Hãy bật Định vị chính xác và thử lại.'));}
    };
    navigator.geolocation.getCurrentPosition(ok,err,{enableHighAccuracy:true,timeout:WAIT,maximumAge:0});
    try{watch=navigator.geolocation.watchPosition(ok,err,{enableHighAccuracy:true,timeout:WAIT,maximumAge:0})}catch{}
    timer=setTimeout(()=>{
      if(settled)return;
      const c=cached();
      if(c)done(()=>{apply(c.lat,c.lng);alert('📍 GPS hiện tại chưa phản hồi, đã dùng vị trí gần nhất đã lưu.')});
      else done(()=>fail('Không lấy được GPS sau 12 giây. Hãy bật GPS/Định vị chính xác rồi thử lại.'));
    },WAIT+1000);
  }
  window.getGPS=run;
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{buttons().forEach(b=>b.disabled=false)},100)});
})();