/* CHOCO SHIP - CUSTOMER LIVE ORDER TRACKING v3
 * Customer order status + assigned shipper GPS using MapLibre.
 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_TRACKING_V3__) return;
  window.__CHOCO_CUSTOMER_TRACKING_V3__=true;

  const U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const steps=['Chờ xác nhận','Đã nhận','Đang lấy hàng','Đang giao','Đã giao','Hoàn thành'];
  let timer=null,loading=false,map=null,shipMarker=null,destMarker=null,lineAdded=false;

  function esc(x){return String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
  function headers(){const t=localStorage.getItem('choco_access_token');return{apikey:K,Authorization:'Bearer '+(t||K),Accept:'application/json'}}
  function localOrder(){try{return JSON.parse(localStorage.getItem('choco_ship_last_order')||'null')}catch{return null}}

  function inject(){
    if(document.getElementById('customerOrderTimeline')) return;
    const box=document.createElement('section');box.id='customerOrderTimeline';
    box.style.cssText='background:#fff;border-radius:15px;padding:14px;margin:12px 0;box-shadow:0 2px 8px #ddd';
    box.innerHTML='<div style="font-size:19px;font-weight:800">📦 Đơn hàng</div><div id="cotCode" style="font-size:13px;color:#666;margin-top:5px">Chưa có đơn đang theo dõi.</div><div id="cotSteps" style="margin-top:12px"></div><div id="cotShipper" style="margin-top:10px"></div><div id="cotLive" style="display:none;margin-top:12px"><div id="cotLiveInfo" style="font-size:13px;font-weight:700;margin-bottom:8px"></div><div id="cotMap" style="height:280px;border-radius:12px;overflow:hidden;background:#eef2f7"></div></div><div id="cotRefresh" style="font-size:11px;color:#888;margin-top:8px">Đang kết nối...</div>';
    const c=document.querySelector('.container');if(c)c.insertBefore(box,c.firstChild);
  }

  function renderStatus(o){
    const out=document.getElementById('cotSteps'),label=document.getElementById('cotCode'),ship=document.getElementById('cotShipper'),ref=document.getElementById('cotRefresh');
    if(!out)return;
    const status=String(o?.status||''),idx=steps.indexOf(status),code=o?.code||'';
    label.innerHTML=code?'🧾 Đơn <b>'+esc(code)+'</b>':'Chưa có đơn đang theo dõi.';
    if(!code){out.innerHTML='';ship.innerHTML='';if(ref)ref.textContent='Chưa có đơn';return}
    if(idx<0)out.innerHTML='<div style="padding:10px;border-radius:10px;background:#eff6ff">⏳ '+esc(status||'Đang xử lý')+'</div>';
    else out.innerHTML=steps.map((s,i)=>'<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0"><div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:'+(i<=idx?'#16a34a':'#e5e7eb')+';color:'+(i<=idx?'#fff':'#666')+';font-weight:900">'+(i<idx?'✓':i===idx?'●':'○')+'</div><div style="padding-top:4px;font-weight:'+(i===idx?'800':'600')+';color:'+(i<=idx?'#166534':'#777')+'">'+esc(s)+(i===idx?' <span style="font-size:12px">• HIỆN TẠI</span>':'')+'</div></div>').join('');
    const sn=String(o.shipper_name||'').trim(),sp=String(o.shipper_phone||'').trim();
    ship.innerHTML=(sn||sp)?'<div style="background:#f0fdf4;border-radius:10px;padding:10px">🛵 <b>Shipper</b>'+(sn?' — '+esc(sn):'')+(sp?' · '+esc(sp):'')+'</div>':'<div style="background:#fff7ed;border-radius:10px;padding:10px">🛵 Đã có Shipper nhận đơn — đang lấy vị trí GPS...</div>';
    if(ref)ref.textContent='🔄 Cập nhật lúc '+new Date().toLocaleTimeString('vi-VN');
  }

  function haversine(a,b){const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLon=(b.lng-a.lng)*Math.PI/180;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}

  function initMap(){
    const el=document.getElementById('cotMap');
    if(!el||!window.maplibregl||map)return;
    map=new maplibregl.Map({container:el,style:{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm'}]},center:[106.6067,11.3859],zoom:14});
    map.addControl(new maplibregl.NavigationControl(),'top-right');
  }

  function showLive(o,gps){
    const live=document.getElementById('cotLive'),info=document.getElementById('cotLiveInfo');if(!live||!gps)return;
    live.style.display='block';initMap();
    if(!map){info.textContent='📍 GPS Shipper: '+gps.lat.toFixed(6)+', '+gps.lng.toFixed(6);return}
    const ship={lat:Number(gps.latitude),lng:Number(gps.longitude)},dest={lat:Number(o.latitude),lng:Number(o.longitude)};
    if(!Number.isFinite(ship.lat)||!Number.isFinite(ship.lng))return;
    const km=Number.isFinite(dest.lat)&&Number.isFinite(dest.lng)?haversine(ship,dest):null;
    const eta=km!=null?Math.max(1,Math.ceil(km/25*60)):'—';
    info.innerHTML='🛵 Shipper đang ở <b>'+ship.lat.toFixed(5)+', '+ship.lng.toFixed(5)+'</b>'+(km!=null?' · 📏 Còn khoảng <b>'+km.toFixed(2)+' km</b> · ⏱️ ~<b>'+eta+' phút</b>':'');
    try{
      if(shipMarker)shipMarker.remove();
      shipMarker=new maplibregl.Marker({color:'#ef4444'}).setLngLat([ship.lng,ship.lat]).setPopup(new maplibregl.Popup().setText('🛵 Vị trí Shipper')).addTo(map);
      if(Number.isFinite(dest.lat)&&Number.isFinite(dest.lng)){
        if(destMarker)destMarker.remove();
        destMarker=new maplibregl.Marker({color:'#16a34a'}).setLngLat([dest.lng,dest.lat]).setPopup(new maplibregl.Popup().setText('📍 Điểm giao')).addTo(map);
        const coords=[[ship.lng,ship.lat],[dest.lng,dest.lat]];
        const source=map.getSource('cot-route');
        if(source)source.setData({type:'Feature',geometry:{type:'LineString',coordinates:coords}});
        else {map.addSource('cot-route',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:coords}}});map.addLayer({id:'cot-route-line',type:'line',source:'cot-route',paint:{'line-color':'#2563eb','line-width':4}})}
        const b=new maplibregl.LngLatBounds();b.extend([ship.lng,ship.lat]);b.extend([dest.lng,dest.lat]);map.fitBounds(b,{padding:45,maxZoom:16});
      }else map.flyTo({center:[ship.lng,ship.lat],zoom:16});
    }catch(e){console.warn('[CHOCO TRACK MAP]',e)}
  }

  async function sync(){
    if(loading)return;loading=true;inject();
    const local=localOrder();
    if(!local?.order_id){renderStatus(null);loading=false;return}
    try{
      const r=await fetch(U+'/rest/v1/orders?select=id,code,status,shipper_id,shipper_name,shipper_phone,created_at,latitude,longitude&id=eq.'+encodeURIComponent(local.order_id),{headers:headers()});
      if(r.status===401||r.status===403)throw Error('AUTH');
      const rows=await r.json(),o=Array.isArray(rows)?rows[0]:null;
      if(!o){renderStatus(local);loading=false;return}
      localStorage.setItem('choco_ship_last_order',JSON.stringify({...local,...o,order_id:o.id}));renderStatus({...local,...o});
      const live=['Đã nhận','Đang lấy hàng','Đang giao'].includes(String(o.status||''));
      if(live&&o.shipper_id){
        const g=await fetch(U+'/rest/v1/shipper_gps_history?select=latitude,longitude,recorded_at&shipper_id=eq.'+encodeURIComponent(o.shipper_id)+'&order=recorded_at.desc&limit=1',{headers:headers()});
        if(g.ok){const gr=await g.json();if(Array.isArray(gr)&&gr[0])showLive(o,gr[0]);else{const x=document.getElementById('cotLive');if(x)x.style.display='block';const i=document.getElementById('cotLiveInfo');if(i)i.textContent='📡 Shipper chưa gửi GPS mới.'}}
      }else{const x=document.getElementById('cotLive');if(x)x.style.display='none'}
    }catch(e){const ref=document.getElementById('cotRefresh');if(ref)ref.textContent='⚠️ Chưa đồng bộ máy chủ — đang thử lại';console.warn('[CHOCO TRACK]',e)}
    finally{loading=false}
  }

  function boot(){inject();sync();if(timer)clearInterval(timer);timer=setInterval(sync,10000)}
  window.addEventListener('storage',sync);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
