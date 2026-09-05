/* CHOCO SHIP - Admin live Shipper GPS map — MapLibre + OpenFreeMap */
'use strict';
(function(){
  if(window.__CHOCO_ADMIN_SHIPPER_MAP__) return;
  window.__CHOCO_ADMIN_SHIPPER_MAP__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=localStorage.getItem('choco_access_token')||'';
  const ROLE=localStorage.getItem('choco_role')||'';
  if(!TOKEN||ROLE!=='admin') return;

  const MAPLIBRE_CSS='https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css';
  const MAPLIBRE_JS='https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js';
  const MAP_STYLE='https://tiles.openfreemap.org/styles/liberty';
  const CENTER=[103.9840,10.2899];
  const css=document.createElement('link');css.rel='stylesheet';css.href=MAPLIBRE_CSS;document.head.appendChild(css);

  const panel=document.createElement('div');panel.id='shipperGpsPanel';panel.className='admin-box';panel.innerHTML='<div style="font-size:18px;font-weight:bold;margin-bottom:8px">🗺️ VỊ TRÍ SHIPPER</div><div id="shipperGpsStatus" style="font-size:12px;color:#64748b;margin-bottom:10px">⏳ Đang tải vị trí...</div><div style="display:flex;gap:8px;margin-bottom:10px"><button id="shipperGpsRefresh" style="flex:1;border:0;border-radius:10px;padding:10px;background:#1677ff;color:#fff;font-weight:800">🔄 Cập nhật</button><button id="shipperGpsAll" style="flex:1;border:0;border-radius:10px;padding:10px;background:#ff6b00;color:#fff;font-weight:800">🎯 Xem tất cả</button></div><div id="shipperGpsMap" style="height:360px;border-radius:12px;overflow:hidden;background:#e5e7eb"></div><div id="shipperGpsList" style="margin-top:10px"></div>';
  const container=document.querySelector('.container');if(container)container.insertBefore(panel,container.firstElementChild?.nextElementSibling||container.firstChild);

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  function ago(iso){if(!iso)return 'Chưa có';const ms=Date.now()-new Date(iso).getTime();if(ms<0)return 'vừa xong';const sec=Math.floor(ms/1000);if(sec<60)return sec+' giây trước';const min=Math.floor(sec/60);if(min<60)return min+' phút trước';const h=Math.floor(min/60);if(h<24)return h+' giờ trước';return Math.floor(h/24)+' ngày trước'}
  function tel(v){return String(v||'').replace(/[^0-9+]/g,'')}
  function validGPS(p){return Number.isFinite(Number(p?.latitude))&&Number.isFinite(Number(p?.longitude))}

  let map=null;const markers=new Map();let lastRows=[];let mapReady=false;let loading=false;
  function initMap(){
    if(mapReady||!window.maplibregl)return;
    const el=document.getElementById('shipperGpsMap');if(!el)return;
    map=new maplibregl.Map({container:el,style:MAP_STYLE,center:CENTER,zoom:12,attributionControl:true});
    map.addControl(new maplibregl.NavigationControl({showCompass:true}), 'top-right');
    map.on('load',()=>{mapReady=true;setTimeout(()=>map.resize(),200);loadShippers()});
  }
  function markerPopup(p,isOnline,lat,lng){
    const phone=tel(p.phone);
    const html=(isOnline?'🟢 Online':'⚫ Offline')+'<br><b>🚚 '+esc(p.full_name||'Shipper')+'</b><br>📞 '+esc(p.phone||'Chưa có SĐT')+'<br>📍 '+lat.toFixed(6)+', '+lng.toFixed(6)+'<br>🕐 '+esc(ago(p.last_seen))+(phone?'<br><a href="tel:'+esc(phone)+'" style="display:inline-block;margin-top:6px;padding:7px 10px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">📞 GỌI SHIPPER</a>':'');
    return new maplibregl.Popup({offset:28,maxWidth:'280px'}).setHTML(html);
  }
  function upsertMarker(p,isOnline){
    if(!map||!mapReady||!validGPS(p))return;
    const id=String(p.id),lat=Number(p.latitude),lng=Number(p.longitude);
    let item=markers.get(id);
    if(!item){
      const el=document.createElement('div');el.style.width='30px';el.style.height='30px';el.style.borderRadius='50%';el.style.background=isOnline?'#16a34a':'#64748b';el.style.border='3px solid #fff';el.style.boxShadow='0 2px 8px rgba(0,0,0,.35)';el.style.display='flex';el.style.alignItems='center';el.style.justifyContent='center';el.textContent='🚚';el.style.fontSize='15px';
      const marker=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([lng,lat]).setPopup(markerPopup(p,isOnline,lat,lng)).addTo(map);
      item={marker,el};markers.set(id,item);
    }else{
      item.marker.setLngLat([lng,lat]);item.marker.setPopup(markerPopup(p,isOnline,lat,lng));item.el.style.background=isOnline?'#16a34a':'#64748b';
    }
  }
  function fitAll(){
    if(!map||!mapReady)return;
    const points=lastRows.filter(validGPS).map(p=>[Number(p.longitude),Number(p.latitude)]);
    if(points.length===1){map.flyTo({center:points[0],zoom:16,duration:500});return}
    if(points.length>1){const b=new maplibregl.LngLatBounds();points.forEach(x=>b.extend(x));map.fitBounds(b,{padding:40,maxZoom:16,duration:500});return}
    map.flyTo({center:CENTER,zoom:12,duration:500});
  }
  async function loadShippers(){
    if(loading)return;loading=true;
    const status=document.getElementById('shipperGpsStatus'),list=document.getElementById('shipperGpsList');if(!status||!list){loading=false;return}
    try{
      const r=await fetch(SB+'/rest/v1/profiles?role=eq.shipper&select=id,full_name,phone,is_online,last_seen,latitude,longitude&order=full_name.asc',{headers:{apikey:KEY,Authorization:'Bearer '+TOKEN,Accept:'application/json'}});
      if(!r.ok)throw Error('HTTP '+r.status+' '+await r.text());
      const rows=await r.json();lastRows=Array.isArray(rows)?rows:[];initMap();
      if(!mapReady){loading=false;return}
      const seen=new Set();let online=0,withGps=0;list.innerHTML='';
      lastRows.forEach(p=>{
        const id=String(p.id);seen.add(id);const hasGps=validGPS(p);const isOnline=!!p.is_online&&p.last_seen&&(Date.now()-new Date(p.last_seen).getTime()<90000);if(isOnline)online++;if(hasGps)withGps++;
        if(hasGps)upsertMarker(p,isOnline);
        list.innerHTML+='<div data-shipper-id="'+esc(id)+'" style="padding:10px 0;border-top:1px solid #eee;font-size:13px;cursor:pointer"><b>'+(isOnline?'🟢':'⚫')+' '+esc(p.full_name||'Shipper')+'</b> • '+(hasGps?'📍 Có GPS':'📍 Chưa có GPS')+'<br><span style="color:#64748b">'+(isOnline?'Đang Online':'Offline')+' • '+esc(ago(p.last_seen))+'</span></div>';
      });
      for(const [id,item] of markers){if(!seen.has(id)){item.marker.remove();markers.delete(id)}}
      status.textContent='🟢 '+online+' Online • ⚫ '+(lastRows.length-online)+' Offline • 📍 '+withGps+' có GPS • Cập nhật '+new Date().toLocaleTimeString('vi-VN');
    }catch(e){status.textContent='❌ Không tải được GPS Shipper: '+e.message;console.error(e)}finally{loading=false}
  }
  document.getElementById('shipperGpsRefresh').onclick=loadShippers;
  document.getElementById('shipperGpsAll').onclick=fitAll;
  document.getElementById('shipperGpsList').addEventListener('click',e=>{const row=e.target.closest('[data-shipper-id]');if(!row||!map||!mapReady)return;const p=lastRows.find(x=>String(x.id)===row.dataset.shipperId);if(!p||!validGPS(p))return;const lng=Number(p.longitude),lat=Number(p.latitude);map.flyTo({center:[lng,lat],zoom:16,duration:500});const item=markers.get(row.dataset.shipperId);if(item)item.marker.togglePopup()});
  window.loadShipperGPS=loadShippers;
  setInterval(loadShippers,30000);

  const script=document.createElement('script');script.src=MAPLIBRE_JS;script.onload=()=>{initMap();if(mapReady)loadShippers()};document.head.appendChild(script);

  const dispatch=document.createElement('script');dispatch.src='./admin-dispatch.js?v=20260831-1';dispatch.onload=()=>window.loadDispatch&&window.loadDispatch();document.body.appendChild(dispatch);
})();
