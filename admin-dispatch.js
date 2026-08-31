/* CHOCO SHIP - Admin smart dispatch */
'use strict';
(function(){
  if(window.__CHOCO_ADMIN_DISPATCH__) return;
  window.__CHOCO_ADMIN_DISPATCH__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=()=>localStorage.getItem('choco_access_token')||'';
  const ROLE=localStorage.getItem('choco_role')||'';
  if(ROLE!=='admin') return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>Number(v||0).toLocaleString('vi-VN')+'đ';
  function distance(a,b,c,d){const R=6371,la=(c-a)*Math.PI/180,lo=(d-b)*Math.PI/180,x=Math.sin(la/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(lo/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
  function ago(iso){if(!iso)return 'chưa có';const s=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/1000));if(s<60)return s+' giây';const m=Math.floor(s/60);if(m<60)return m+' phút';return Math.floor(m/60)+' giờ';}
  const style=document.createElement('style');
  style.textContent='.dispatch-panel{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd;border:1px solid #bfdbfe}.dispatch-title{font-size:18px;font-weight:800;margin-bottom:10px}.dispatch-help{font-size:12px;color:#64748b;margin-bottom:10px}.dispatch-order{border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-top:9px}.dispatch-order-head{display:flex;justify-content:space-between;gap:8px}.dispatch-code{font-weight:800;color:#ff6b00}.dispatch-total{font-weight:800;color:#e65100}.dispatch-shipper{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px;margin-top:9px}.dispatch-off{background:#f8fafc;border-color:#e2e8f0}.dispatch-btn{width:100%;border:0;border-radius:9px;padding:10px;margin-top:8px;background:#1677ff;color:#fff;font-weight:800}.dispatch-empty{padding:18px;text-align:center;color:#777}.dispatch-muted{font-size:12px;color:#64748b}.dispatch-near{color:#15803d;font-weight:800}.dispatch-far{color:#c2410c;font-weight:800}';
  document.head.appendChild(style);
  function inject(){
    if(document.getElementById('chocoDispatchPanel'))return;
    const p=document.createElement('div');p.id='chocoDispatchPanel';p.className='dispatch-panel';
    p.innerHTML='<div class="dispatch-title">🧭 ĐIỀU PHỐI ĐƠN THÔNG MINH</div><div class="dispatch-help">Hiển thị Shipper có GPS gần vị trí giao hàng nhất. Chỉ gợi ý, không tự nhận/gán đơn.</div><div id="dispatchStatus" class="dispatch-muted">⏳ Đang tải...</div><div id="dispatchOrders"></div>';
    const container=document.querySelector('.container');
    const mapPanel=document.getElementById('shipperGpsPanel');
    if(mapPanel&&mapPanel.parentElement)mapPanel.parentElement.insertBefore(p,mapPanel);else if(container)container.insertBefore(p,container.firstChild);
  }
  async function get(path){const r=await fetch(SB+path,{headers:{apikey:KEY,Authorization:'Bearer '+TOKEN(),Accept:'application/json'}});if(!r.ok)throw Error('HTTP '+r.status+' '+await r.text());return r.json();}
  async function load(){
    inject();const status=document.getElementById('dispatchStatus'),box=document.getElementById('dispatchOrders');if(!status||!box)return;
    try{
      const [orders,profiles]=await Promise.all([
        get('/rest/v1/orders?select=id,code,name,phone,address,dropoff,latitude,longitude,status,shipper_id,created_at,total&order=created_at.desc&limit=50'),
        get('/rest/v1/profiles?select=id,full_name,phone,is_online,last_seen,latitude,longitude&role=eq.shipper&order=full_name.asc')
      ]);
      const ship=profiles.map(p=>({...p,lat:Number(p.latitude),lng:Number(p.longitude),online:!!p.is_online&&p.last_seen&&(Date.now()-new Date(p.last_seen).getTime()<90000)})).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
      const pending=orders.filter(o=>!o.shipper_id&&o.status==='Chờ xác nhận'&&Number.isFinite(Number(o.latitude))&&Number.isFinite(Number(o.longitude)));
      if(!pending.length){box.innerHTML='<div class="dispatch-empty">📭 Chưa có đơn chờ xác nhận có GPS.</div>';status.textContent='Cập nhật '+new Date().toLocaleTimeString('vi-VN');return;}
      box.innerHTML='';
      pending.forEach(o=>{
        const lat=Number(o.latitude),lng=Number(o.longitude);
        const candidates=ship.map(s=>({...s,distance:distance(lat,lng,s.lat,s.lng)})).sort((a,b)=>a.distance-b.distance);
        const online=candidates.filter(s=>s.online);
        const nearest=online[0]||candidates[0];
        let html='<div class="dispatch-order"><div class="dispatch-order-head"><div class="dispatch-code">📦 '+esc(o.code||('#'+o.id))+'</div><div class="dispatch-total">'+money(o.total)+'</div></div><div style="margin-top:6px;font-size:13px">👤 '+esc(o.name||'Khách hàng')+'<br>🏁 '+esc(o.dropoff||o.address||'Chưa có địa chỉ')+'</div>';
        if(nearest){html+='<div class="dispatch-shipper '+(nearest.online?'':'dispatch-off')+'"><b>'+ (nearest.online?'🟢':'⚫') +' '+esc(nearest.full_name||'Shipper')+'</b><br><span class="dispatch-muted">📏 '+nearest.distance.toFixed(1)+' km • '+(nearest.online?'Online':'Offline')+' • GPS '+esc(ago(nearest.last_seen))+' trước</span>'+(nearest.phone?'<br>📞 '+esc(nearest.phone):'')+'</div>';if(nearest.online)html+='<div class="dispatch-near">⭐ Gợi ý Shipper gần nhất đang Online</div>';}else html+='<div class="dispatch-empty">⚠️ Chưa có Shipper nào có GPS.</div>';
        html+='<button class="dispatch-btn" data-lat="'+lat+'" data-lng="'+lng+'">📍 XEM VỊ TRÍ ĐƠN</button></div>';
        box.innerHTML+=html;
      });
      status.textContent='🧭 '+pending.length+' đơn chờ điều phối • '+ship.filter(s=>s.online).length+' Shipper Online có GPS • Cập nhật '+new Date().toLocaleTimeString('vi-VN');
    }catch(e){console.error('ADMIN DISPATCH',e);status.textContent='❌ '+e.message;box.innerHTML='<div class="dispatch-empty">Không tải được dữ liệu điều phối.</div>';}
  }
  document.addEventListener('click',e=>{const b=e.target.closest('.dispatch-btn');if(!b)return;const lat=Number(b.dataset.lat),lng=Number(b.dataset.lng);if(window.loadShipperGPS)window.loadShipperGPS();const map=document.getElementById('shipperGpsMap');if(map&&window.L){setTimeout(()=>{const p=document.getElementById('shipperGpsPanel');if(p)p.scrollIntoView({behavior:'smooth',block:'center'});},100)}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{inject();load()});else{inject();load()}
  setInterval(load,30000);
  window.loadDispatch=load;
})();