/* CHOCO SHIP - Admin live Shipper GPS map */
'use strict';
(function(){
  if(window.__CHOCO_ADMIN_SHIPPER_MAP__) return;
  window.__CHOCO_ADMIN_SHIPPER_MAP__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=localStorage.getItem('choco_access_token')||'';
  const ROLE=localStorage.getItem('choco_role')||'';
  if(!TOKEN||ROLE!=='admin') return;

  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  const panel=document.createElement('div');
  panel.id='shipperGpsPanel';
  panel.className='admin-box';
  panel.innerHTML='<div style="font-size:18px;font-weight:bold;margin-bottom:8px">🗺️ VỊ TRÍ SHIPPER</div><div id="shipperGpsStatus" style="font-size:12px;color:#64748b;margin-bottom:10px">⏳ Đang tải vị trí...</div><div id="shipperGpsMap" style="height:360px;border-radius:12px;overflow:hidden;background:#e5e7eb"></div><div id="shipperGpsList" style="margin-top:10px"></div>';
  const container=document.querySelector('.container');
  if(container) container.insertBefore(panel,container.firstElementChild?.nextElementSibling||container.firstChild);

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  let map=null;
  const markers=new Map();
  let ready=false;

  function initMap(){
    if(ready||!window.L) return;
    map=L.map('shipperGpsMap').setView([10.2899,103.9840],12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
    ready=true;
    setTimeout(()=>map.invalidateSize(),300);
  }

  const script=document.createElement('script');
  script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload=()=>{initMap();loadShippers()};
  document.head.appendChild(script);

  async function loadShippers(){
    const status=document.getElementById('shipperGpsStatus');
    const list=document.getElementById('shipperGpsList');
    try{
      const r=await fetch(SB+'/rest/v1/profiles?role=eq.shipper&select=id,full_name,phone,is_online,last_seen,latitude,longitude&order=full_name.asc',{headers:{apikey:KEY,Authorization:'Bearer '+TOKEN,Accept:'application/json'}});
      if(!r.ok) throw Error('HTTP '+r.status+' '+await r.text());
      const rows=await r.json();
      initMap();
      const seen=new Set();
      let online=0,withGps=0;
      list.innerHTML='';
      rows.forEach(p=>{
        const id=String(p.id); seen.add(id);
        const hasGps=Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude));
        const isOnline=!!p.is_online && p.last_seen && (Date.now()-new Date(p.last_seen).getTime()<90000);
        if(isOnline) online++;
        if(hasGps) withGps++;
        if(hasGps&&map){
          const lat=Number(p.latitude),lng=Number(p.longitude);
          let marker=markers.get(id);
          const label=(isOnline?'🟢 Online':'⚫ Offline')+'<br><b>🚚 '+esc(p.full_name||'Shipper')+'</b><br>📞 '+esc(p.phone||'Chưa có SĐT')+'<br>📍 '+lat.toFixed(6)+', '+lng.toFixed(6);
          if(!marker){marker=L.marker([lat,lng]).addTo(map);markers.set(id,marker)}else marker.setLatLng([lat,lng]);
          marker.bindPopup(label);
        }
        const ago=p.last_seen?Math.max(0,Math.floor((Date.now()-new Date(p.last_seen).getTime())/60000))+' phút trước':'Chưa có';
        list.innerHTML+='<div style="padding:9px 0;border-top:1px solid #eee;font-size:13px"><b>'+ (isOnline?'🟢':'⚫') +' '+esc(p.full_name||'Shipper')+'</b> • '+(hasGps?'📍 Có GPS':'📍 Chưa có GPS')+'<br><span style="color:#64748b">'+(isOnline?'Đang Online':'Offline')+' • Hoạt động: '+ago+'</span></div>';
      });
      for(const [id,m] of markers){if(!seen.has(id)){map.removeLayer(m);markers.delete(id)}}
      status.textContent='🟢 '+online+' Online • ⚫ '+(rows.length-online)+' Offline • 📍 '+withGps+' có GPS';
    }catch(e){status.textContent='❌ Không tải được GPS Shipper: '+e.message;console.error(e)}
  }
  window.loadShipperGPS=loadShippers;
  setInterval(loadShippers,30000);
})();