/* CHOCO SHIP - GPS anti-hang guard v2 + chat loader */
'use strict';
(function(){
  const boot=()=>{
    const btn=document.getElementById('shipperGpsButton');
    if(btn&&!btn.dataset.gpsGuard){
      btn.dataset.gpsGuard='1';
      btn.addEventListener('click',function(e){
        e.preventDefault();e.stopImmediatePropagation();
        const status=document.getElementById('shipperGpsStatus');
        const set=(t,ok=false)=>{if(status){status.textContent=t;status.style.color=ok?'#166534':'#64748b'}btn.disabled=false;btn.textContent=ok?'✅ GPS ĐANG HOẠT ĐỘNG':'📍 BẬT GPS SHIPPER'};
        if(!navigator.geolocation){set('❌ Thiết bị không hỗ trợ GPS.');return}
        btn.disabled=true;btn.textContent='⏳ ĐANG LẤY VỊ TRÍ...';
        let done=false,timer=setTimeout(()=>{if(done)return;done=true;set('❌ GPS quá lâu không phản hồi. Hãy bật Dịch vụ định vị rồi thử lại.');},10000);
        navigator.geolocation.getCurrentPosition(p=>{if(done)return;done=true;clearTimeout(timer);const lat=Number(p.coords.latitude),lng=Number(p.coords.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lng)){set('❌ GPS trả về vị trí không hợp lệ.');return}window.__CHOCO_GPS_GUARD__={lat,lng,at:Date.now()};window.currentGPS={lat,lng};set('🟢 GPS đã bật • '+lat.toFixed(6)+', '+lng.toFixed(6),true);try{localStorage.setItem('choco_shipper_gps',JSON.stringify({lat,lng,at:Date.now()}))}catch{}},e=>{if(done)return;done=true;clearTimeout(timer);if(e?.code===1)set('❌ Quyền vị trí bị chặn. Cho phép Safari dùng vị trí.');else if(e?.code===2)set('❌ Không xác định được vị trí. Bật Dịch vụ định vị.');else set('❌ GPS hết thời gian chờ. Thử lại.')},{enableHighAccuracy:true,timeout:8000,maximumAge:15000});
      },true);
    }
    if(!document.getElementById('chocoShipperChatLoader')){const s=document.createElement('script');s.id='chocoShipperChatLoader';s.src='./customer-shipper-chat.js?v=20260909-3';s.async=false;s.onload=()=>console.log('[CHOCO] Shipper chat loaded');s.onerror=()=>console.warn('[CHOCO] Shipper chat failed to load');(document.head||document.documentElement).appendChild(s)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setTimeout(boot,500);
})();