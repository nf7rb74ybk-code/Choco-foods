/* CHOCO SHIP — CUSTOMER GPS CORE v7
 * Single owner of window.getGPS(). Never leaves the UI stuck in loading.
 */
'use strict';
(function(){
  const BUTTON_IDS=['gpsButton','cartGpsButton'];
  const NORMAL='📍 LẤY / CẬP NHẬT GPS GIAO HÀNG';
  const KEY='choco_customer_gps_v1';
  let requestId=0;
  let watchdog=null;

  const buttons=()=>BUTTON_IDS.map(id=>document.getElementById(id)).filter(Boolean);
  const setButtons=(text,disabled)=>buttons().forEach(b=>{b.disabled=!!disabled;b.textContent=text;});
  const setMessage=text=>{
    ['locationText','cartGpsText'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=text;});
  };
  const valid=(lat,lng)=>Number.isFinite(Number(lat))&&Number.isFinite(Number(lng));
  const readCache=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return valid(x?.lat,x?.lng)?{lat:Number(x.lat),lng:Number(x.lng)}:null}catch{return null}};
  const save=(lat,lng)=>{try{localStorage.setItem(KEY,JSON.stringify({lat,lng,updated_at:new Date().toISOString()}));}catch{}};

  function apply(lat,lng,label){
    lat=Number(lat); lng=Number(lng);
    if(!valid(lat,lng)){setMessage('⚠️ Tọa độ GPS không hợp lệ.');return false;}
    if(typeof window.setDeliveryLocation!=='function'){
      setMessage('⚠️ Bản đồ chưa sẵn sàng. Hãy thử lại sau 1 giây.');
      return false;
    }
    try{
      window.setDeliveryLocation(lat,lng,label||'📍 Vị trí GPS hiện tại');
      save(lat,lng);
      if(typeof window.__CHOCO_PERSIST_DELIVERY__==='function')window.__CHOCO_PERSIST_DELIVERY__();
      setMessage('🟢 GPS: '+lat.toFixed(6)+', '+lng.toFixed(6));
      return true;
    }catch(err){
      console.error('[CHOCO GPS APPLY]',err);
      setMessage('⚠️ Không thể cập nhật GPS lên bản đồ.');
      return false;
    }
  }

  function stop(){
    if(watchdog){clearTimeout(watchdog);watchdog=null;}
    setButtons(NORMAL,false);
  }

  function run(){
    const id=++requestId;
    if(watchdog){clearTimeout(watchdog);watchdog=null;}

    if(!window.isSecureContext){stop();setMessage('⚠️ GPS cần HTTPS. Hãy mở CHOCO SHIP bằng GitHub Pages.');return;}
    if(!navigator.geolocation){stop();setMessage('⚠️ Thiết bị/trình duyệt không hỗ trợ GPS.');return;}

    let settled=false;
    const finish=(fn)=>{
      if(settled||id!==requestId)return;
      settled=true;
      stop();
      fn();
    };

    setButtons('⏳ ĐANG XIN GPS...',true);
    setMessage('📍 Đang xin vị trí hiện tại từ iPhone...');

    const success=position=>finish(()=>{
      const lat=position?.coords?.latitude,lng=position?.coords?.longitude;
      if(!apply(lat,lng,'📍 Vị trí GPS hiện tại'))setMessage('⚠️ GPS lấy được nhưng bản đồ chưa nhận vị trí.');
    });

    const failure=error=>finish(()=>{
      console.warn('[CHOCO GPS]',error?.code,error?.message||'');
      const cached=readCache();
      if(cached&&apply(cached.lat,cached.lng,'📍 Vị trí GPS gần nhất đã lưu'))return;
      let msg='⚠️ Không lấy được GPS. Hãy thử lại.';
      if(error?.code===1)msg='⚠️ Chưa cấp quyền vị trí cho Safari. Hãy bật Dịch vụ định vị + Vị trí chính xác.';
      else if(error?.code===2)msg='⚠️ iPhone chưa xác định được vị trí. Bật Wi‑Fi/4G rồi thử lại.';
      else if(error?.code===3)msg='⚠️ GPS phản hồi quá lâu. Hãy thử lại hoặc chạm trực tiếp lên bản đồ.';
      setMessage(msg);
    });

    try{
      navigator.geolocation.getCurrentPosition(success,failure,{
        enableHighAccuracy:false,
        timeout:4000,
        maximumAge:30000
      });
    }catch(err){
      finish(()=>{console.error('[CHOCO GPS START]',err);setMessage('⚠️ Không thể khởi động GPS trên thiết bị này.');});
      return;
    }

    // Hard stop: regardless of browser behaviour, button is released after 5 seconds.
    watchdog=setTimeout(()=>finish(()=>{
      const cached=readCache();
      if(cached&&apply(cached.lat,cached.lng,'📍 Vị trí GPS gần nhất đã lưu'))return;
      setMessage('⚠️ GPS chưa phản hồi. Bấm lại hoặc chạm trực tiếp lên bản đồ.');
    }),5000);
  }

  window.getGPS=run;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setButtons(NORMAL,false),{once:true});
  else setButtons(NORMAL,false);
})();
