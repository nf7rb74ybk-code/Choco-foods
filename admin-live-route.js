/* CHOCO SHIP - Admin live route tracking */
'use strict';
(function(){
  if(window.__CHOCO_ADMIN_LIVE_ROUTE__) return;
  window.__CHOCO_ADMIN_LIVE_ROUTE__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const REFRESH_MS=10000;
  let timer=null,map=null,markers={},routes={};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function km(a,b,c,d){const R=6371,p=(c-a)*Math.PI/180,q=(d-b)*Math.PI/180,x=Math.sin(p/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(q/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
  function ensure(){
    if(document.getElementById('adminLiveRouteBox')) return;
    if(!window.L) return;
    const style=document.createElement('style');style.textContent='#adminLiveRouteBox{background:#fff;border-radius:15px;padding:14px;margin:12px 0;box-shadow:0 2px 8px #ddd}#adminLiveRouteMap{height:420px;border-radius:12px;margin-top:10px}.alr-title{font-size:19px;font-weight:800}.alr-note{font-size:12px;color:#666;margin-top:8px}.alr-card{background:#f8fafc;border-radius:10px;padding:9px;margin-top:8px}';document.head.appendChild(style);
    const box=document.createElement('section');box.id='adminLiveRouteBox';box.innerHTML='<div class="alr-title">🗺️ LIVE SHIPPER & TUYẾN ĐƯỜNG</div><div id="adminLiveRouteList" class="alr-card">⏳ Đang tải...</div><div id="adminLiveRouteMap"></div><div class="alr-note">🔄 GPS cập nhật tự động mỗi 10 giây. Tuyến đường dùng OpenStreetMap/OSRM.</div>';
    const host=document.querySelector('.container')||document.querySelector('main')||document.body;host.insertBefore(box,host.firstChild);
    map=L.map('adminLiveRouteMap').setView([10.2899,103.984],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
  }
  async function getJson(path){const r=await fetch(SB+path,{headers:{apikey:KEY,Accept:'application/json'}});if(!r.ok)throw Error(await r.text());return r.json()}
  async function route(a,b,c,d){try{const r=await fetch('https://router.project-osrm.org/route/v1/driving/'+b+','+a+';'+d+','+c+'?overview=full&geometries=geojson');if(!r.ok)return null;const j=await r.json();const x=j.routes?.[0];if(!x)return null;return {km:x.distance/1000,min:x.duration/60,coords:x.geometry.coordinates.map(v=>[v[1],v[0]])}}catch{return null}}
  function marker(id,lat,lng,text){if(markers[id])markers[id].setLatLng([lat,lng]).setPopupContent(text);else markers[id]=L.marker([lat,lng]).addTo(map).bindPopup(text);}
  async function refresh(){
    ensure();if(!map)return;
    const list=document.getElementById('adminLiveRouteList');
    try{
      const orders=await getJson('/rest/v1/orders?select=id,code,name,address,latitude,longitude,status,shipper_id,shipper_name,shipper_phone&shipper_id=not.is.null&status=neq.Đã%20giao&order=created_at.desc');
      const ids=orders.map(o=>String(o.shipper_id));
      if(!orders.length){list.innerHTML='📭 Không có đơn đang giao.';return}
      const profiles=await getJson('/rest/v1/profiles?id=in.('+encodeURIComponent(ids.join(','))+')&select=id,full_name,phone,latitude,longitude,last_seen,is_online');
      const pm=new Map(profiles.map(p=>[String(p.id),p]));let html='';
      for(const o of orders){const s=pm.get(String(o.shipper_id));if(!s||s.latitude==null||s.longitude==null){html+='<div class="alr-card">📦 <b>'+esc(o.code)+'</b> — 🚚 '+esc(o.shipper_name||s?.full_name||'Shipper')+'<br>🟠 Chưa có GPS.</div>';continue}
        const slat=Number(s.latitude),slng=Number(s.longitude),clat=Number(o.latitude),clng=Number(o.longitude);const online=s.is_online&&s.last_seen&&Date.now()-new Date(s.last_seen).getTime()<90000;let info='📦 <b>'+esc(o.code)+'</b> — 🚚 <b>'+esc(s.full_name||o.shipper_name||'Shipper')+'</b><br>📌 '+esc(o.status)+'<br>🟢 '+(online?'Online':'Offline');
        if(Number.isFinite(clat)&&Number.isFinite(clng)){const straight=km(slat,slng,clat,clng);const rt=await route(slat,slng,clat,clng);if(rt){info+='<br>🛣️ '+rt.km.toFixed(1)+' km • ⏱️ '+Math.max(1,Math.round(rt.min))+' phút';const rid=String(o.id);if(routes[rid])routes[rid].setLatLngs(rt.coords);else routes[rid]=L.polyline(rt.coords).addTo(map)}else info+='<br>📏 '+straight.toFixed(1)+' km (thẳng)';marker('s_'+o.shipper_id,slat,slng,'🚚 <b>'+esc(s.full_name||o.shipper_name||'Shipper')+'</b><br>'+esc(o.code)+'<br>🟢 '+(online?'Online':'Offline'));marker('c_'+o.id,clat,clng,'📍 <b>Khách</b><br>'+esc(o.code));
        }html+='<div class="alr-card">'+info+'</div>';
      }
      list.innerHTML=html;
    }catch(e){list.innerHTML='❌ '+esc(e.message||e)}
  }
  function start(){ensure();refresh();timer=setInterval(refresh,REFRESH_MS)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();