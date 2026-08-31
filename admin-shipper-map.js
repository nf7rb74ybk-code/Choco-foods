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
  panel.innerHTML='<div style="font-size:18px;font-weight:bold;margin-bottom:8px">🗺️ VỊ TRÍ SHIPPER</div><div id="shipperGpsStatus" style="font-size:12px;color:#64748b;margin-bottom:10px">⏳ Đang tải vị trí...</div><div style="display:flex;gap:8px;margin-bottom:10px"><button id="shipperGpsRefresh" style="flex:1;border:0;border-radius:10px;padding:10px;background:#1677ff;color:#fff;font-weight:800">🔄 Cập nhật</button><button id="shipperGpsAll" style="flex:1;border:0;border-radius:10px;padding:10px;background:#ff6b00;color:#fff;font-weight:800">🎯 Xem tất cả</button></div><div id="shipperGpsMap" style="height:360px;border-radius:12px;overflow:hidden;background:#e5e7eb"></div><div id="shipperGpsList" style="margin-top:10px"></div>';
  const container=document.querySelector('.container');
  if(container) container.insertBefore(panel,container.firstElementChild?.nextElementSibling||container.firstChild);

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function ago(iso){if(!iso)return 'Chưa có';const ms=Date.now()-new Date(iso).getTime();if(ms<0)return 'vừa xong';const sec=Math.floor(ms/1000);if(sec<60)return sec+' giây trước';const min=Math.floor(sec/60);if(min<60)return min+' phút trước';const h=Math.floor(min/60);if(h<24)return h+' giờ trước';return Math.floor(h/24)+' ngày trước'}
  function tel(v){return String(v||'').replace(/[^0-9+]/g,'')}
  let map=null;
  const markers=new Map();
  let ready=false;
  let lastRows=[];

  function initMap(){
    if(ready||!window.L) return;
    map=L.map('shipperGpsMap').setView([10.2899,103.9840],12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
    ready=true;
    setTimeout(()=>map.invalidateSize(),300);
  }

  function fitAll(){
    if(!map)return;
    const points=lastRows.filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))).map(p=>[Number(p.latitude),Number(p.longitude)]);
    if(points.length===1)map.setView(points[0],16);
    else if(points.length>1)map.fitBounds(points,{padding:[30,30],maxZoom:16});
    else map.setView([10.2899,103.9840],12);
  }

  const script=document.createElement('script');
  script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload=()=>{initMap();loadShippers()};
  document.head.appendChild(script);

  async function loadShippers(){
    const status=document.getElementById('shipperGpsStatus');
    const list=document.getElementById('shipperGpsList');
    if(!status||!list)return;
    try{
      const r=await fetch(SB+'/rest/v1/profiles?role=eq.shipper&select=id,full_name,phone,is_online,last_seen,latitude,longitude&order=full_name.asc',{headers:{apikey:KEY,Authorization:'Bearer '+TOKEN,Accept:'application/json'}});
      if(!r.ok)throw Error('HTTP '+r.status+' '+await r.text());
      const rows=await r.json();
      lastRows=rows;
      initMap();
      const seen=new Set();let online=0,withGps=0;
      list.innerHTML='';
      rows.forEach(p=>{
        const id=String(p.id);seen.add(id);
        const hasGps=Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude));
        const isOnline=!!p.is_online&&p.last_seen&&(Date.now()-new Date(p.last_seen).getTime()<90000);
        if(isOnline)online++;if(hasGps)withGps++;
        if(hasGps&&map){
          const lat=Number(p.latitude),lng=Number(p.longitude);let marker=markers.get(id);
          if(!marker){marker=L.marker([lat,lng]).addTo(map);markers.set(id,marker)}else marker.setLatLng([lat,lng]);
          const phone=tel(p.phone);
          marker.bindPopup((isOnline?'🟢 Online':'⚫ Offline')+'<br><b>🚚 '+esc(p.full_name||'Shipper')+'</b><br>📞 '+esc(p.phone||'Chưa có SĐT')+'<br>📍 '+lat.toFixed(6)+', '+lng.toFixed(6)+'<br>🕐 '+esc(ago(p.last_seen))+(phone?'<br><a href="tel:'+esc(phone)+'" style="display:inline-block;margin-top:6px;padding:7px 10px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">📞 GỌI SHIPPER</a>':''));
        }
        list.innerHTML+='<div data-shipper-id="'+esc(id)+'" style="padding:10px 0;border-top:1px solid #eee;font-size:13px;cursor:pointer"><b>'+ (isOnline?'🟢':'⚫') +' '+esc(p.full_name||'Shipper')+'</b> • '+(hasGps?'📍 Có GPS':'📍 Chưa có GPS')+'<br><span style="color:#64748b">'+(isOnline?'Đang Online':'Offline')+' • '+esc(ago(p.last_seen))+'</span></div>';
      });
      for(const [id,m] of markers){if(!seen.has(id)){map.removeLayer(m);markers.delete(id)}}
      status.textContent='🟢 '+online+' Online • ⚫ '+(rows.length-online)+' Offline • 📍 '+withGps+' có GPS • Cập nhật '+new Date().toLocaleTimeString('vi-VN');
    }catch(e){status.textContent='❌ Không tải được GPS Shipper: '+e.message;console.error(e)}
  }

  document.getElementById('shipperGpsRefresh').onclick=loadShippers;
  document.getElementById('shipperGpsAll').onclick=fitAll;
  document.getElementById('shipperGpsList').addEventListener('click',e=>{
    const row=e.target.closest('[data-shipper-id]');
    if(!row||!map)return;
    const p=lastRows.find(x=>String(x.id)===row.dataset.shipperId);
    if(!p||!Number.isFinite(Number(p.latitude))||!Number.isFinite(Number(p.longitude)))return;
    map.setView([Number(p.latitude),Number(p.longitude)],16);
    const m=markers.get(row.dataset.shipperId);if(m)m.openPopup();
  });

  window.loadShipperGPS=loadShippers;
  setInterval(loadShippers,30000);
})();