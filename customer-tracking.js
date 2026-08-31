/* CHOCO SHIP - Customer live shipper tracking */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_TRACKING__) return;
  window.__CHOCO_CUSTOMER_TRACKING__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const POLL_MS=10000;
  let timer=null,map=null,customerMarker=null,shipperMarker=null,line=null,trail=null;
  let trailPoints=[];
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const dist=(a,b,c,d)=>{const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,q=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));};
  function inject(){
    if(document.getElementById('customerTrackingBox')) return;
    const style=document.createElement('style');
    style.textContent='#customerTrackingBox{background:#fff;border-radius:15px;padding:14px;margin:12px 0;box-shadow:0 2px 8px #ddd}#customerTrackingMap{height:300px;border-radius:12px;margin-top:10px}.ct-status{padding:10px;border-radius:10px;background:#eff6ff;color:#1d4ed8;line-height:1.5}.ct-btn{width:100%;border:0;border-radius:10px;padding:12px;margin-top:10px;background:#1677ff;color:#fff;font-weight:800}.ct-muted{font-size:12px;color:#666;margin-top:7px}';
    document.head.appendChild(style);
    const box=document.createElement('section');box.id='customerTrackingBox';
    box.innerHTML='<div style="font-size:19px;font-weight:800">🚚 Theo dõi Shipper</div><div id="customerTrackingStatus" class="ct-status" style="margin-top:10px">📦 Chưa có đơn đang theo dõi.</div><div id="customerTrackingMap"></div><button id="customerTrackingRefresh" class="ct-btn">🔄 CẬP NHẬT VỊ TRÍ</button><div class="ct-muted">🚚 Marker Shipper sẽ di chuyển theo GPS thực tế. Đường nét chấm thể hiện quãng đường đã cập nhật trong phiên này.</div>';
    const container=document.querySelector('.container')||document.body;container.insertBefore(box,container.firstChild);
    document.getElementById('customerTrackingRefresh').onclick=()=>refresh(true);
  }
  function initMap(){if(map||!window.L||!document.getElementById('customerTrackingMap'))return;map=L.map('customerTrackingMap').setView([10.2899,103.9840],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);}
  function setMarker(old,lat,lng,text){if(old){old.setLatLng([lat,lng]);old.setPopupContent(text);return old}return L.marker([lat,lng]).addTo(map).bindPopup(text)}
  function getOrder(){let raw=localStorage.getItem('choco_ship_last_order');if(!raw)return null;try{return JSON.parse(raw)}catch{return null}}
  async function refresh(manual){
    const status=document.getElementById('customerTrackingStatus');if(!status)return;const order=getOrder();if(!order||!order.code){status.innerHTML='📦 Chưa có đơn đang theo dõi.';return}
    try{
      const r=await fetch(SB+'/rest/v1/orders?code=eq.'+encodeURIComponent(order.code)+'&select=id,code,name,address,latitude,longitude,status,shipper_id,shipper_name,shipper_phone,created_at&limit=1',{headers:{apikey:KEY,Accept:'application/json'}});if(!r.ok)throw Error('Không tải được đơn hàng');const rows=await r.json(),o=rows[0];if(!o){status.innerHTML='❌ Không tìm thấy đơn <b>'+esc(order.code)+'</b>';return}
      if(o.status==='Đã giao'){status.innerHTML='✅ <b>Đơn '+esc(o.code)+' đã giao thành công.</b>';if(timer)clearInterval(timer);return}
      if(!o.shipper_id){status.innerHTML='⏳ <b>'+esc(o.code)+'</b><br>Đơn đang chờ CHOCO SHIP gán Shipper.';return}
      const pr=await fetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(o.shipper_id)+'&select=full_name,phone,latitude,longitude,last_seen,is_online&limit=1',{headers:{apikey:KEY,Accept:'application/json'}});const ps=pr.ok?await pr.json():[],s=ps[0];
      if(!s||s.latitude==null||s.longitude==null){status.innerHTML='🚚 <b>'+esc(o.shipper_name||s?.full_name||'Shipper')+'</b><br>🟠 Đã nhận đơn nhưng chưa có GPS hiện tại.<br>📦 Trạng thái: '+esc(o.status||'Đang giao');return}
      const slat=Number(s.latitude),slng=Number(s.longitude),clat=Number(o.latitude),clng=Number(o.longitude),online=!!(s.is_online&&s.last_seen&&Date.now()-new Date(s.last_seen).getTime()<90000),km=Number.isFinite(clat)&&Number.isFinite(clng)?dist(slat,slng,clat,clng):null;
      status.innerHTML='🚚 <b>'+esc(s.full_name||o.shipper_name||'Shipper')+'</b><br>'+(online?'🟢 Đang Online':'🟠 Mất tín hiệu')+'<br>📦 Trạng thái: <b>'+esc(o.status||'Đang giao')+'</b>'+(km!=null?'<br>📏 Còn khoảng: <b>'+km.toFixed(1)+' km</b>':'')+(s.last_seen?'<br>🕐 GPS cập nhật: '+new Date(s.last_seen).toLocaleTimeString('vi-VN'):'');
      initMap();if(!map)return;
      shipperMarker=setMarker(shipperMarker,slat,slng,'🚚 <b>'+esc(s.full_name||'Shipper')+'</b><br>'+(online?'🟢 Online':'🟠 Mất tín hiệu'));
      if(trailPoints.length===0||dist(trailPoints[trailPoints.length-1][0],trailPoints[trailPoints.length-1][1],slat,slng)>0.02){trailPoints.push([slat,slng]);if(trailPoints.length>100)trailPoints.shift()}
      if(trail){trail.setLatLngs(trailPoints)}else trail=L.polyline(trailPoints,{dashArray:'6 8'}).addTo(map);
      if(Number.isFinite(clat)&&Number.isFinite(clng)){
        customerMarker=setMarker(customerMarker,clat,clng,'📍 <b>Vị trí giao hàng</b>');
        if(line)line.setLatLngs([[slat,slng],[clat,clng]]);else line=L.polyline([[slat,slng],[clat,clng]]).addTo(map);
        if(manual||!map._customerTrackedOnce){map.fitBounds([[slat,slng],[clat,clng]],{padding:[25,25],maxZoom:16});map._customerTrackedOnce=true}
      }else if(manual)map.setView([slat,slng],16);
    }catch(e){if(manual)status.innerHTML='❌ '+esc(e.message||e)}
  }
  function start(){inject();refresh(false);timer=setInterval(()=>refresh(false),POLL_MS)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();