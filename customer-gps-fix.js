/* CHOCO SHIP — CUSTOMER GPS CORE v10
 * Single owner of window.getGPS(). Gets GPS, fills address, and never leaves UI locked.
 */
'use strict';
(function(){
  const BUTTON_IDS=['gpsButton','cartGpsButton'];
  const NORMAL='📍 LẤY / CẬP NHẬT GPS GIAO HÀNG';
  const KEY='choco_customer_gps_v1';
  let requestId=0,watchdog=null;
  const buttons=()=>BUTTON_IDS.map(id=>document.getElementById(id)).filter(Boolean);
  const setButtons=(text,disabled)=>buttons().forEach(b=>{b.disabled=!!disabled;b.textContent=text;});
  const setMessage=text=>['locationText','cartGpsText'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=text;});
  const valid=(lat,lng)=>Number.isFinite(Number(lat))&&Number.isFinite(Number(lng));
  const readCache=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return valid(x?.lat,x?.lng)?{lat:Number(x.lat),lng:Number(x.lng)}:null}catch{return null}};
  const save=(lat,lng)=>{try{localStorage.setItem(KEY,JSON.stringify({lat,lng,updated_at:new Date().toISOString()}));}catch{}};
  function apply(lat,lng,label){
    lat=Number(lat);lng=Number(lng);if(!valid(lat,lng))return false;
    try{
      if(typeof window.setDeliveryLocation!=='function')return false;
      window.setDeliveryLocation(lat,lng,label||'📍 Vị trí GPS hiện tại');
      save(lat,lng);
      if(typeof window.__CHOCO_PERSIST_DELIVERY__==='function')window.__CHOCO_PERSIST_DELIVERY__();
      setMessage('📍 Đang xác định địa chỉ...\nGPS: '+lat.toFixed(6)+', '+lng.toFixed(6));
      reverseAddress(lat,lng);
      return true;
    }catch(e){console.error('[CHOCO GPS APPLY]',e);return false}
  }
  async function reverseAddress(lat,lng){
    const addressEl=document.getElementById('address'),ct=document.getElementById('cartGpsText');
    let address='';
    try{
      const r=await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lng)+'&localityLanguage=vi');
      if(r.ok){
        const d=await r.json(),a=[];
        const pick=['road','locality','city','principalSubdivision'];
        pick.forEach(k=>{if(d[k]&&!a.includes(d[k]))a.push(d[k]);});
        if(d.localityInfo?.administrative){
          d.localityInfo.administrative.map(x=>x?.name).filter(Boolean).forEach(x=>{if(!a.includes(x))a.push(x)});
        }
        if(d.countryName&&!a.includes(d.countryName))a.push(d.countryName);
        address=a.slice(0,6).join(', ');
      }
    }catch(e){console.warn('[CHOCO REVERSE BDC]',e)}
    if(!address){
      try{
        const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lng)+'&zoom=18&addressdetails=1&accept-language=vi');
        if(r.ok){const d=await r.json();address=d.display_name||'';}
      }catch(e){console.warn('[CHOCO REVERSE NOMINATIM]',e)}
    }
    if(addressEl){
      addressEl.value=address||('GPS '+lat.toFixed(6)+', '+lng.toFixed(6));
      addressEl.dispatchEvent(new Event('input',{bubbles:true}));
    }
    if(ct)ct.textContent='📍 '+(address||'Đã lấy GPS, chưa lấy được tên địa chỉ')+'\nGPS: '+lat.toFixed(6)+', '+lng.toFixed(6);
  }
  function reset(){if(watchdog){clearTimeout(watchdog);watchdog=null}setButtons(NORMAL,false)}
  function run(){
    const id=++requestId;
    if(watchdog){clearTimeout(watchdog);watchdog=null}
    if(!window.isSecureContext){reset();setMessage('⚠️ GPS cần HTTPS. Hãy mở CHOCO SHIP bằng GitHub Pages.');return}
    if(!navigator.geolocation){reset();setMessage('⚠️ iPhone/Safari không hỗ trợ GPS.');return}
    setButtons('⏳ ĐANG LẤY GPS...',true);setMessage('📍 Đang xin vị trí hiện tại...');
    let done=false,attempt=0;
    const finish=(fn)=>{if(done||id!==requestId)return;done=true;reset();try{fn()}catch(e){console.error('[CHOCO GPS]',e);setMessage('⚠️ GPS gặp lỗi. Hãy thử lại.')}};
    const ok=p=>finish(()=>{const lat=p?.coords?.latitude,lng=p?.coords?.longitude;if(!apply(lat,lng,'📍 Vị trí GPS hiện tại'))setMessage('⚠️ GPS có tọa độ nhưng bản đồ chưa nhận được.');});
    const fail=e=>{
      if(done||id!==requestId)return;
      if(attempt===0){
        attempt=1;
        try{navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:false,timeout:8000,maximumAge:60000});return}catch{}
      }
      finish(()=>{
        console.warn('[CHOCO GPS]',e?.code,e?.message||'');
        const c=readCache();
        if(c&&apply(c.lat,c.lng,'📍 Vị trí gần nhất đã lưu'))return;
        const code=e?.code;
        setMessage(code===1?'⚠️ Safari chưa được cấp quyền vị trí. Bật Cài đặt → Quyền riêng tư & Bảo mật → Dịch vụ định vị → Safari → Khi dùng ứng dụng + Vị trí chính xác.':code===2?'⚠️ iPhone chưa xác định được vị trí. Hãy bật Wi‑Fi/4G và thử lại.':'⚠️ GPS phản hồi quá chậm. Hãy thử lại hoặc chạm trực tiếp lên bản đồ để chọn vị trí.');
      });
    };
    try{navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:true,timeout:12000,maximumAge:60000})}catch(e){fail({code:2,message:e?.message||String(e)})}
    watchdog=setTimeout(()=>finish(()=>{const c=readCache();if(c&&apply(c.lat,c.lng,'📍 Vị trí gần nhất đã lưu'))return;setMessage('⚠️ GPS quá lâu — đã tự hủy để không treo. Chạm bản đồ để chọn vị trí.')}),22000);
  }
  window.getGPS=run;
  const init=()=>setButtons(NORMAL,false);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
