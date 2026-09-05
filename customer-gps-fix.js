/* CHOCO SHIP — CUSTOMER GPS FIX v6 */
'use strict';
(function(){
  let seq=0,active=false,timer=null;
  const buttons=()=>[document.getElementById('gpsButton'),document.getElementById('cartGpsButton')].filter(Boolean);
  const normal='📍 LẤY / CẬP NHẬT GPS GIAO HÀNG';
  function paint(text,disabled){buttons().forEach(b=>{b.disabled=!!disabled;b.innerText=text;});}
  function message(text){const a=document.getElementById('locationText'),c=document.getElementById('cartGpsText');if(a)a.textContent=text;if(c)c.textContent=text;}
  function cached(){try{const x=JSON.parse(localStorage.getItem('choco_customer_gps_v1')||'null'),lat=Number(x?.lat),lng=Number(x?.lng);return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null}catch{return null}}
  function apply(lat,lng,msg){lat=Number(lat);lng=Number(lng);if(!Number.isFinite(lat)||!Number.isFinite(lng)){message('⚠️ Tọa độ GPS không hợp lệ.');return false}try{if(typeof window.setDeliveryLocation!=='function'){message('⚠️ Bản đồ chưa sẵn sàng.');return false}window.setDeliveryLocation(lat,lng,msg||'📍 Vị trí GPS hiện tại');try{localStorage.setItem('choco_customer_gps_v1',JSON.stringify({lat,lng,updated_at:new Date().toISOString()}))}catch{}if(typeof window.__CHOCO_PERSIST_DELIVERY__==='function')window.__CHOCO_PERSIST_DELIVERY__();return true}catch(e){console.error('[CHOCO GPS APPLY]',e);message('⚠️ Không thể cập nhật vị trí lên bản đồ.');return false}}
  function finish(id,lat,lng,msg){if(id!==seq)return;active=false;if(timer){clearTimeout(timer);timer=null}const ok=lat!=null&&lng!=null?apply(lat,lng,msg):false;paint(normal,false);if(!ok&&lat==null)message(msg||'⚠️ Không lấy được GPS. Hãy thử lại hoặc chạm vị trí trên bản đồ.')}
  function run(){
    const id=++seq;
    if(timer){clearTimeout(timer);timer=null}
    if(!window.isSecureContext){paint(normal,false);message('⚠️ GPS cần HTTPS. Hãy mở CHOCO SHIP bằng GitHub Pages.');return}
    if(!navigator.geolocation){paint(normal,false);message('⚠️ Thiết bị không hỗ trợ GPS.');return}
    active=true;
    paint('⏳ ĐANG XIN GPS...',true);
    message('📍 Đang xin vị trí hiện tại...');
    let settled=false;
    const done=(fn)=>{if(settled||id!==seq)return;settled=true;fn()};
    const ok=p=>done(()=>finish(id,p?.coords?.latitude,p?.coords?.longitude,'📍 Vị trí GPS hiện tại'));
    const bad=e=>done(()=>{
      console.warn('[CHOCO GPS ERROR]',e?.code,e?.message);
      const c=cached();
      if(c)return finish(id,c.lat,c.lng,'📍 Vị trí GPS gần nhất đã lưu');
      let msg='⚠️ Không lấy được GPS.';
      if(e?.code===1)msg='⚠️ Safari chưa được cấp quyền vị trí. Hãy bật Dịch vụ định vị + Vị trí chính xác.';
      else if(e?.code===2)msg='⚠️ Chưa xác định được vị trí. Hãy bật Wi‑Fi/4G và thử lại.';
      else if(e?.code===3)msg='⚠️ GPS phản hồi quá lâu. Hãy thử lại hoặc chạm vị trí trên bản đồ.';
      finish(id,null,null,msg);
    });
    try{
      /* iPhone thường trả vị trí nhanh hơn khi không ép GPS độ chính xác cao ngay từ đầu. */
      navigator.geolocation.getCurrentPosition(ok,bad,{enableHighAccuracy:false,timeout:8000,maximumAge:30000});
    }catch(e){done(()=>finish(id,null,null,'⚠️ Không thể khởi động GPS trên thiết bị này.'))}
    /* QUAN TRỌNG: không bao giờ để UI kẹt ở trạng thái loading. */
    timer=setTimeout(()=>{
      if(id!==seq||!active)return;
      const c=cached();
      if(c){settled=true;finish(id,c.lat,c.lng,'📍 GPS gần nhất đã lưu');return}
      settled=true;active=false;paint(normal,false);message('⚠️ GPS chưa phản hồi. Bạn có thể bấm lại hoặc chạm trực tiếp vị trí trên bản đồ.');
    },5000);
  }
  window.getGPS=run;
  function ready(){paint(normal,false)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
