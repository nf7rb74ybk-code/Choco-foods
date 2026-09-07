/* CHOCO SHIP — Shipper order controls + navigation v3 */
'use strict';
(function(){
  if(window.__CHOCO_SHIPPER_POS__) return;
  window.__CHOCO_SHIPPER_POS__=true;

  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=localStorage.getItem('choco_access_token')||'';
  const UID=localStorage.getItem('choco_user_id')||'';
  const ROLE=localStorage.getItem('choco_role')||'';
  if(!TOKEN||!UID||ROLE!=='shipper') return;
  const headers={apikey:KEY,Authorization:'Bearer '+TOKEN,'Content-Type':'application/json',Accept:'application/json'};

  const FLOW={
    'Đã nhận':{next:'Đang lấy hàng',label:'🛵 BẮT ĐẦU LẤY HÀNG'},
    'Đang lấy hàng':{next:'Đang giao',label:'📦 ĐÃ LẤY HÀNG - BẮT ĐẦU GIAO'},
    'Đang giao':{next:'Đã giao',label:'🏁 XÁC NHẬN ĐÃ GIAO'},
    'Đã giao':{next:'Hoàn thành',label:'✅ HOÀN TẤT ĐƠN HÀNG'}
  };
  const esc=x=>String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const num=x=>{const n=Number(x);return Number.isFinite(n)?n:null};
  function hav(a,b,c,d){const R=6371,rad=Math.PI/180,x=(c-a)*rad,y=(d-b)*rad;const q=Math.sin(x/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
  function destination(order){
    const lat=num(order?.dropoff_latitude??order?.delivery_latitude??order?.latitude??order?.lat);
    const lng=num(order?.dropoff_longitude??order?.delivery_longitude??order?.longitude??order?.lng);
    return lat!==null&&lng!==null&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null;
  }
  function routeUrl(o){
    const d=destination(o); if(!d)return '';
    return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(d.lat+','+d.lng);
  }
  function findStatus(text){
    const s=String(text||'');
    for(const key of Object.keys(FLOW)) if(s.includes(key)) return key;
    if(s.includes('Hoàn thành')) return 'Hoàn thành';
    if(s.includes('Chờ xác nhận')) return 'Chờ xác nhận';
    return '';
  }
  async function getOwnOrders(){
    try{
      const u=SB+'/rest/v1/orders?select=id,code,status,shipper_id,address,latitude,longitude&shipper_id=eq.'+encodeURIComponent(UID)+'&order=created_at.desc';
      const r=await fetch(u,{headers}); if(!r.ok)return [];
      const d=await r.json(); return Array.isArray(d)?d:[];
    }catch{return []}
  }
  async function updateStatus(id,current,next,wrap){
    const cfg=FLOW[current]; if(!id||!cfg||cfg.next!==next)return;
    wrap?.querySelectorAll('button[data-action="status"]').forEach(b=>{b.disabled=true;b.textContent='⏳ ĐANG CẬP NHẬT...'});
    try{
      const qs='/rest/v1/orders?id=eq.'+encodeURIComponent(id)+'&shipper_id=eq.'+encodeURIComponent(UID)+'&status=eq.'+encodeURIComponent(current);
      const r=await fetch(SB+qs,{method:'PATCH',headers,body:JSON.stringify({status:next})});
      if(!r.ok)throw Error((await r.text())||('HTTP '+r.status));
      if(typeof window.loadOrders==='function')await window.loadOrders();
      setTimeout(enhance,100);setTimeout(syncSnapshot,500);
    }catch(e){
      alert('❌ Không thể cập nhật trạng thái: '+(e?.message||e));
      wrap?.querySelectorAll('button[data-action="status"]').forEach(b=>{b.disabled=false;b.textContent=cfg.label});
    }
  }
  function enhance(){
    const root=document.getElementById('orders'); if(!root)return;
    root.querySelectorAll('.order').forEach(card=>{
      const old=card.querySelector('[data-choco-control]'); if(old)old.remove();
      const code=card.querySelector('b')?.textContent?.trim()||'';
      const order=(window.__CHOCO_LAST_ORDERS__||[]).find(o=>String(o.code||'')===code&&String(o.shipper_id||'')===UID);
      if(!order)return;
      const current=String(order.status||findStatus(card.textContent));
      const cfg=FLOW[current];
      const wrap=document.createElement('div');
      wrap.dataset.chocoControl='1';
      wrap.style.cssText='margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb';

      const d=destination(order);
      const blocks=[];
      if(d&&window.__CHOCO_SHIPPER_COORDS__){
        const c=window.__CHOCO_SHIPPER_COORDS__;const km=hav(c.lat,c.lng,d.lat,d.lng);const mins=Math.max(1,Math.round(km/0.45));
        blocks.push('<div style="font-size:12px;color:#475569;margin-bottom:7px">📍 Cách điểm giao <b>'+km.toFixed(1)+' km</b> • ETA khoảng <b>'+mins+' phút</b></div>');
      } else if(d){
        blocks.push('<div style="font-size:12px;color:#475569;margin-bottom:7px">📍 Điểm giao: '+d.lat.toFixed(6)+', '+d.lng.toFixed(6)+'</div>');
      }
      if(d){
        blocks.push('<button data-action="route" style="width:100%;padding:11px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;font-size:14px;margin-bottom:7px">🗺️ MỞ ĐƯỜNG ĐẾN KHÁCH</button>');
      }
      if(cfg){
        blocks.push('<div style="font-size:12px;color:#64748b;margin-bottom:6px">🔄 Trạng thái tiếp theo: <b>'+esc(cfg.next)+'</b></div>');
        blocks.push('<button data-action="status" style="width:100%;padding:13px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-weight:900;font-size:15px">'+cfg.label+'</button>');
      }
      if(!blocks.length)return;
      wrap.innerHTML=blocks.join('');
      const rb=wrap.querySelector('[data-action="route"]');if(rb)rb.onclick=()=>{const u=routeUrl(order);if(u)window.open(u,'_blank','noopener')};
      const sb=wrap.querySelector('[data-action="status"]');if(sb)sb.onclick=()=>updateStatus(String(order.id),current,cfg.next,wrap);
      card.appendChild(wrap);
    });
  }
  async function syncSnapshot(){
    const data=await getOwnOrders();
    window.__CHOCO_LAST_ORDERS__=data;
    enhance();
  }
  window.__CHOCO_SHIPPER_COORDS__=null;
  if(navigator.geolocation){
    navigator.geolocation.watchPosition(p=>{window.__CHOCO_SHIPPER_COORDS__={lat:Number(p.coords.latitude),lng:Number(p.coords.longitude)};enhance()},()=>{}, {enableHighAccuracy:true,maximumAge:30000,timeout:15000});
  }
  const ordersEl=document.getElementById('orders');
  if(ordersEl)new MutationObserver(()=>setTimeout(enhance,0)).observe(ordersEl,{childList:true,subtree:true});
  syncSnapshot();setInterval(syncSnapshot,5000);
  window.addEventListener('pageshow',()=>setTimeout(syncSnapshot,100));
})();
