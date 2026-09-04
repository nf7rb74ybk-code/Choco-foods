'use strict';
(function(){
  if(window.__CHOCO_ADMIN_SHIPPER_MANAGE__)return;
  window.__CHOCO_ADMIN_SHIPPER_MANAGE__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>localStorage.getItem('choco_access_token')||'';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>Number(v||0).toLocaleString('vi-VN')+'đ';
  let orders=[],shippers=[];
  async function api(path,options={}){return fetch(SB+path,{...options,headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json',...(options.headers||{})}})}
  function inject(){
    if(document.getElementById('chocoDispatchPanel'))return;
    const st=document.createElement('style');
    st.textContent='.dispatch-panel{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd;border:1px solid #dbeafe}.dispatch-title{font-size:18px;font-weight:800;margin-bottom:5px}.dispatch-note{font-size:12px;color:#64748b;margin-bottom:11px}.dispatch-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}.dispatch-stat{background:#f8fafc;border-radius:10px;padding:10px;text-align:center;font-size:12px}.dispatch-stat b{display:block;font-size:20px;margin-top:3px}.dispatch-refresh{width:100%;border:0;border-radius:10px;padding:11px;background:#1677ff;color:#fff;font-weight:800;cursor:pointer;margin-bottom:10px}.dispatch-list{display:flex;flex-direction:column;gap:9px}.dispatch-order{border:1px solid #e5e7eb;border-radius:12px;padding:11px}.dispatch-head{display:flex;justify-content:space-between;gap:8px;font-weight:800}.dispatch-code{color:#ea580c}.dispatch-customer{font-size:13px;margin-top:4px}.dispatch-meta{font-size:12px;color:#64748b;margin-top:3px;line-height:1.5}.dispatch-actions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:8px}.dispatch-select{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:9px;background:#fff}.dispatch-btn{border:0;border-radius:9px;padding:10px 12px;background:#16a34a;color:#fff;font-weight:800;cursor:pointer}.dispatch-btn:disabled{opacity:.55;cursor:not-allowed}.dispatch-empty{text-align:center;color:#64748b;padding:16px 5px}@media(max-width:500px){.dispatch-summary{grid-template-columns:1fr 1fr 1fr}.dispatch-actions{grid-template-columns:1fr}.dispatch-btn{width:100%}}';
    document.head.appendChild(st);
    const p=document.createElement('div');p.id='chocoDispatchPanel';p.className='dispatch-panel';
    p.innerHTML='<div class="dispatch-title">🚚 ĐIỀU PHỐI SHIPPER</div><div class="dispatch-note">Gán nhanh Shipper cho đơn chưa có người nhận. Đơn được gán sẽ chuyển sang trạng thái <b>Đã nhận</b>.</div><div class="dispatch-summary"><div class="dispatch-stat">⏳ Chưa gán<b id="dispatchUnassigned">0</b></div><div class="dispatch-stat">🟢 Online<b id="dispatchOnline">0</b></div><div class="dispatch-stat">📦 Đang chạy<b id="dispatchRunning">0</b></div></div><button class="dispatch-refresh" id="dispatchRefresh">🔄 CẬP NHẬT ĐIỀU PHỐI</button><div id="dispatchList" class="dispatch-list"><div class="dispatch-empty">⏳ Đang tải...</div></div>';
    const stats=document.querySelector('.stats');
    if(stats&&stats.parentElement)stats.parentElement.insertBefore(p,stats);else document.querySelector('.container')?.appendChild(p);
    document.getElementById('dispatchRefresh').addEventListener('click',load);
  }
  function shipperOnline(s){return !!s.is_online&&s.last_seen&&(Date.now()-new Date(s.last_seen).getTime()<=90000)}
  function render(){
    const list=document.getElementById('dispatchList');if(!list)return;
    const unassigned=orders.filter(o=>!o.shipper_id&&['Chờ xác nhận','Đã nhận'].includes(o.status));
    const online=shippers.filter(shipperOnline).length;
    const running=orders.filter(o=>o.shipper_id&&['Đã nhận','Đang lấy hàng','Đang giao','Đã giao'].includes(o.status)).length;
    document.getElementById('dispatchUnassigned').textContent=unassigned.length;
    document.getElementById('dispatchOnline').textContent=online;
    document.getElementById('dispatchRunning').textContent=running;
    if(!unassigned.length){list.innerHTML='<div class="dispatch-empty">✅ Hiện không có đơn chờ gán Shipper.</div>';return}
    const opts=shippers.map(s=>'<option value="'+esc(s.id)+'">'+(shipperOnline(s)?'🟢 ':'⚫ ')+esc(s.full_name||'Shipper')+' • '+esc(s.phone||'')+'</option>').join('');
    list.innerHTML=unassigned.map(o=>'<div class="dispatch-order"><div class="dispatch-head"><span class="dispatch-code">'+esc(o.code||('#'+o.id))+'</span><span>'+esc(o.status||'')+'</span></div><div class="dispatch-customer">👤 '+esc(o.name||'Khách')+' • 📞 '+esc(o.phone||'Chưa có SĐT')+'</div><div class="dispatch-meta">📍 '+esc(o.address||'Chưa có địa chỉ')+'<br>💰 '+money(o.total)+' • '+esc(o.payment||'')+'</div><div class="dispatch-actions"><select class="dispatch-select" data-order="'+esc(o.id)+'"><option value="">-- Chọn Shipper --</option>'+opts+'</select><button class="dispatch-btn" data-assign="'+esc(o.id)+'">GÁN</button></div></div>').join('');
    list.querySelectorAll('[data-assign]').forEach(btn=>btn.addEventListener('click',()=>assign(btn.dataset.assign,btn)));
  }
  async function load(){
    const list=document.getElementById('dispatchList');if(list)list.innerHTML='<div class="dispatch-empty">⏳ Đang cập nhật...</div>';
    try{
      const [ro,rs]=await Promise.all([
        api('/rest/v1/orders?select=id,code,name,phone,address,total,payment,status,shipper_id,created_at&order=created_at.desc'),
        api('/rest/v1/profiles?select=id,full_name,phone,role,is_online,last_seen&role=eq.shipper&order=full_name.asc')
      ]);
      if(ro.status===401||rs.status===401){if(list)list.innerHTML='<div class="dispatch-empty">⚠️ Phiên Admin hết hạn.</div>';return}
      if(!ro.ok)throw Error('Orders HTTP '+ro.status+': '+await ro.text());
      if(!rs.ok)throw Error('Shippers HTTP '+rs.status+': '+await rs.text());
      orders=await ro.json();shippers=await rs.json();render();
    }catch(e){console.error('ADMIN DISPATCH',e);if(list)list.innerHTML='<div class="dispatch-empty">❌ '+esc(e.message)+'</div>'}
  }
  async function assign(id,btn){
    const select=document.querySelector('select[data-order="'+CSS.escape(String(id))+'"]');
    const shipperId=select?.value||'';
    if(!shipperId){alert('⚠️ Hãy chọn Shipper trước.');return}
    btn.disabled=true;btn.textContent='ĐANG GÁN...';
    try{
      const current=orders.find(x=>String(x.id)===String(id));
      if(!current)throw Error('Không tìm thấy đơn');
      const body={shipper_id:shipperId};
      if(current.status==='Chờ xác nhận')body.status='Đã nhận';
      const r=await api('/rest/v1/orders?id=eq.'+encodeURIComponent(id)+'&shipper_id=is.null',{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(body)});
      if(r.status===401){alert('⚠️ Phiên Admin hết hạn.');location.href='login.html';return}
      if(!r.ok)throw Error('HTTP '+r.status+': '+await r.text());
      alert('✅ Đã gán Shipper cho đơn '+(current.code||id));
      await load();
      if(typeof window.loadOrders==='function')window.loadOrders();
    }catch(e){alert('❌ Không thể gán Shipper: '+e.message);btn.disabled=false;btn.textContent='GÁN'}
  }
  function start(){inject();load();setInterval(load,30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();