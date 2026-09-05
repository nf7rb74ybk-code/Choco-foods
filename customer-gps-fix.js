/* CHOCO SHIP — CUSTOMER GPS FIX v4 */
'use strict';
(function(){
  const SOFT=3500,HARD=9000;
  let busy=false,seq=0;
  const buttons=()=>[document.getElementById('gpsButton'),document.getElementById('cartGpsButton')].filter(Boolean);
  function setBusy(v){
    busy=v;
    buttons().forEach(b=>{
      b.disabled=v;
      b.innerText=v?'⏳ ĐANG LẤY GPS...':'📍 LẤY / CẬP NHẬT GPS GIAO HÀNG';
    });
  }
  function fail(msg){
    setBusy(false);
    const t=document.getElementById('locationText');
    const c=document.getElementById('cartGpsText');
    if(t)t.textContent='⚠️ '+msg;
    if(c)c.textContent='⚠️ '+msg;
  }
  function cached(){
    try{
      const x=JSON.parse(localStorage.getItem('choco_customer_gps_v1')||'null');
      const lat=Number(x?.lat),lng=Number(x?.lng);
      if(Number.isFinite(lat)&&Number.isFinite(lng))return {lat,lng};
    }catch{}
    return null;
  }
  function apply(lat,lng,msg){
    const la=Number(lat),lo=Number(lng);
    if(!Number.isFinite(la)||!Number.isFinite(lo))return fail('Tọa độ GPS không hợp lệ.');
    try{
      if(typeof window.setDeliveryLocation!=='function')return fail('Bản đồ chưa sẵn sàng. Hãy thử lại.');
      window.setDeliveryLocation(la,lo,msg||'📍 Vị trí GPS hiện tại');
      try{localStorage.setItem('choco_customer_gps_v1',JSON.stringify({lat:la,lng:lo,updated_at:new Date().toISOString()}));}catch{}
      if(typeof window.__CHOCO_PERSIST_DELIVERY__==='function')window.__CHOCO_PERSIST_DELIVERY__();
      setBusy(false);
    }catch(e){console.error('[CHOCO GPS APPLY]',e);fail('Không thể cập nhật vị trí lên bản đồ.');}
  }
  function run(){
    if(busy)return;
    if(!window.isSecureContext)return fail('GPS cần HTTPS. Hãy mở CHOCO SHIP từ GitHub Pages.');
    if(!navigator.geolocation)return fail('Thiết bị không hỗ trợ GPS.');
    const my=++seq; setBusy(true);
    let settled=false,timer=null;
    const finish=fn=>{
      if(settled||my!==seq)return;
      settled=true;
      if(timer)clearTimeout(timer);
      try{fn();}catch(e){console.error('[CHOCO GPS FINISH]',e);setBusy(false);}
    };
    const success=p=>{
      const lat=p?.coords?.latitude,lng=p?.coords?.longitude;
      if(lat==null||lng==null)return;
      finish(()=>apply(lat,lng,'📍 Vị trí GPS hiện tại'));
    };
    const failure=e=>{
      if(settled||my!==seq)return;
      console.warn('[CHOCO GPS ERROR]',e?.code,e?.message);
      const c=cached();
      if(c)return finish(()=>apply(c.lat,c.lng,'📍 Vị trí GPS gần nhất đã lưu'));
      if(e?.code===1)return finish(()=>fail('Bạn đã chặn quyền vị trí. Hãy bật Dịch vụ định vị cho Safari rồi thử lại.'));
      if(e?.code===2)return finish(()=>fail('Không xác định được vị trí. Hãy bật Định vị chính xác rồi thử lại.'));
      if(e?.code===3)return finish(()=>fail('GPS phản hồi quá lâu. Hãy bật Định vị chính xác rồi thử lại.'));
      finish(()=>fail('Không lấy được GPS. Hãy thử lại.'));
    };
    try{
      navigator.geolocation.getCurrentPosition(success,failure,{enableHighAccuracy:false,timeout:SOFT,maximumAge:30000});
    }catch(e){finish(()=>fail('Không thể khởi động GPS trên thiết bị này.'));return;}
    timer=setTimeout(()=>{
      if(settled||my!==seq)return;
      try{
        navigator.geolocation.getCurrentPosition(success,failure,{enableHighAccuracy:true,timeout:HARD-SOFT,maximumAge:0});
      }catch(e){
        const c=cached();
        finish(()=>c?apply(c.lat,c.lng,'📍 Vị trí GPS gần nhất đã lưu'):fail('Không thể khởi động GPS trên thiết bị này.'));
      }
      timer=setTimeout(()=>{
        if(settled||my!==seq)return;
        const c=cached();
        finish(()=>c?apply(c.lat,c.lng,'📍 Vị trí GPS gần nhất đã lưu'):fail('GPS chưa phản hồi sau 9 giây. Hãy bật Định vị chính xác rồi thử lại.'));
      },HARD-SOFT+500);
    },SOFT+100);
  }
  window.getGPS=run;
  function ready(){buttons().forEach(b=>{b.disabled=false;});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();