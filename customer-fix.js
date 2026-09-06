/* CHOCO SHIP — CUSTOMER CORE FIX v12
 * GPS + reverse geocode + guaranteed delivery-address field fill.
 */
'use strict';
(function(){
  const PHU_QUOC={lat:10.2899,lng:103.984};
  let requestId=0,timer=null;
  const btns=()=>['gpsButton','cartGpsButton'].map(id=>document.getElementById(id)).filter(Boolean);
  const setBtns=(text,disabled)=>btns().forEach(b=>{b.disabled=!!disabled;b.textContent=text});
  const msg=t=>['locationText','cartGpsText'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=t});
  const valid=(a,b)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b));
  const state=()=>window.currentGPS&&valid(window.currentGPS.lat,window.currentGPS.lng)?window.currentGPS:{lat:null,lng:null};
  const distance=(a,b,c,d)=>{const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))};
  const fee=()=>{const g=state();if(g.lat==null)return 20000;const km=distance(PHU_QUOC.lat,PHU_QUOC.lng,g.lat,g.lng);return km<=3?20000:km<=5?25000:km<=7?30000:km<=10?40000:km<=15?50000:60000};
  function display(){
    const g=state(),food=typeof getFoodTotal==='function'?getFoodTotal():0,ship=fee(),km=g.lat==null?null:distance(PHU_QUOC.lat,PHU_QUOC.lng,g.lat,g.lng);
    [['foodTotal',food],['shippingFee',ship],['shippingTotal',ship],['total',food+ship]].forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=Number(v).toLocaleString('vi-VN')+'đ'});
    const d=document.getElementById('shippingDistance');if(d)d.textContent=km==null?'Chưa chọn vị trí':km.toFixed(1)+' km';
    const s=document.getElementById('selectedGPS');if(s)s.textContent=g.lat==null?'Chưa chọn':g.lat.toFixed(6)+', '+g.lng.toFixed(6);
  }
  async function reverseText(lat,lng){
    const bdc='https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lng)+'&localityLanguage=vi';
    const nom='https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lng)+'&zoom=18&addressdetails=1&accept-language=vi';
    try{
      const r=await Promise.race([fetch(bdc,{cache:'no-store'}),new Promise((_,rej)=>setTimeout(()=>rej(Error('timeout')),4500))]);
      if(r.ok){const d=await r.json(),a=[];['road','neighbourhood','locality','city','principalSubdivision'].forEach(k=>{if(d[k]&&!a.includes(d[k]))a.push(d[k])});if(d.localityInfo?.administrative)d.localityInfo.administrative.map(x=>x?.name).filter(Boolean).forEach(x=>{if(!a.includes(x))a.push(x)});if(a.length)return a.slice(0,7).join(', ')}
    }catch(e){console.warn('[CHOCO ADDRESS BDC]',e)}
    try{
      const r=await Promise.race([fetch(nom,{cache:'no-store'}),new Promise((_,rej)=>setTimeout(()=>rej(Error('timeout')),4500))]);
      if(r.ok){const d=await r.json();if(d.display_name)return d.display_name}
    }catch(e){console.warn('[CHOCO ADDRESS NOMINATIM]',e)}
    return '';
  }
  function putAddress(value,lat,lng,onlyIfGpsFallback){
    const text=String(value||'').trim(); if(!text)return false;
    const el=document.getElementById('address'); if(!el)return false;
    const gpsFallback='GPS '+lat.toFixed(6)+', '+lng.toFixed(6);
    if(onlyIfGpsFallback && el.value.trim() && el.value.trim()!==gpsFallback)return false;
    el.value=text;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    try{el.focus();el.blur()}catch{}
    try{window.__CHOCO_PERSIST_DELIVERY__?.()}catch{}
    return true;
  }
  async function address(lat,lng){
    const fallback='GPS '+lat.toFixed(6)+', '+lng.toFixed(6);
    // Retry briefly because the cart modal/address node can be mounted after GPS is pressed.
    let filled=false;
    for(let i=0;i<12&&!filled;i++){
      filled=putAddress(fallback,lat,lng,false);
      if(!filled)await new Promise(r=>setTimeout(r,100));
    }
    const text=await reverseText(lat,lng);
    if(text)putAddress(text,lat,lng,true);
    const ct=document.getElementById('cartGpsText');
    if(ct)ct.textContent='📍 '+(text||'Đã lấy GPS')+'\nGPS: '+lat.toFixed(6)+', '+lng.toFixed(6);
  }
  function apply(lat,lng,label){
    lat=Number(lat);lng=Number(lng);if(!valid(lat,lng))return false;
    window.currentGPS={lat,lng,source:label||'GPS'};
    try{if(window.marker&&window.map&&typeof window.map.removeLayer==='function')window.map.removeLayer(window.marker);if(window.L&&window.map&&typeof window.L.marker==='function'){window.marker=window.L.marker([lat,lng]).addTo(window.map).bindPopup('📍 Vị trí giao hàng').openPopup();if(typeof window.map.setView==='function')window.map.setView([lat,lng],16)}}catch(e){console.warn('[CHOCO MAP]',e)}
    const lt=document.getElementById('locationText');if(lt)lt.innerHTML='📍 <b>Vị trí giao hàng:</b><br>'+lat.toFixed(6)+', '+lng.toFixed(6);
    try{localStorage.setItem('choco_customer_gps_v1',JSON.stringify({lat,lng,updated_at:new Date().toISOString()}))}catch{}
    display();msg('📍 GPS đã lấy thành công. Đang điền địa chỉ...\nGPS: '+lat.toFixed(6)+', '+lng.toFixed(6));address(lat,lng);return true;
  }
  function run(){
    const id=++requestId;if(timer){clearTimeout(timer);timer=null}
    if(!window.isSecureContext){msg('⚠️ GPS cần HTTPS.');return}
    if(!navigator.geolocation){msg('⚠️ Thiết bị không hỗ trợ GPS.');return}
    setBtns('⏳ ĐANG LẤY GPS...',true);msg('📍 Đang xin vị trí hiện tại...');let retried=false,done=false;
    const finish=()=>{if(done||id!==requestId)return;done=true;if(timer){clearTimeout(timer);timer=null}setBtns('📍 LẤY / CẬP NHẬT GPS GIAO HÀNG',false)};
    const ok=p=>{if(done||id!==requestId)return;finish();if(!apply(p.coords.latitude,p.coords.longitude,'GPS'))msg('⚠️ Tọa độ GPS không hợp lệ.')};
    const fail=e=>{if(done||id!==requestId)return;if(!retried){retried=true;try{navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:false,timeout:8000,maximumAge:60000});return}catch{}}finish();const c=(()=>{try{return JSON.parse(localStorage.getItem('choco_customer_gps_v1')||'null')}catch{return null}})();if(c&&valid(c.lat,c.lng)){apply(c.lat,c.lng,'GPS gần nhất');return}msg(e?.code===1?'⚠️ Safari chưa được cấp quyền vị trí. Hãy bật Dịch vụ định vị + Vị trí chính xác.':e?.code===2?'⚠️ Không xác định được vị trí. Hãy bật Wi‑Fi/4G và thử lại.':'⚠️ GPS phản hồi quá chậm. Bạn có thể chạm trực tiếp lên bản đồ.')};
    try{navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:true,timeout:12000,maximumAge:60000})}catch(e){fail({code:2})}timer=setTimeout(()=>fail({code:3}),13000);
  }
  window.getGPS=run;window.setDeliveryLocation=(lat,lng)=>apply(lat,lng,'Bản đồ');window.calculateShippingFee=fee;window.updateShippingDisplay=display;
  function bindMap(){try{if(!window.map)return;if(typeof window.map.off==='function')window.map.off('click');if(typeof window.map.on==='function')window.map.on('click',e=>{const ll=e?.latlng;if(ll)apply(ll.lat,ll.lng,'Bản đồ')})}catch(e){console.warn('[CHOCO MAP BIND]',e)}}
  function init(){setBtns('📍 LẤY / CẬP NHẬT GPS GIAO HÀNG',false);display();setTimeout(bindMap,300)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
