'use strict';
(function(){
  if(window.__CHOCO_ADMIN_SMART_DISPATCH__)return;
  window.__CHOCO_ADMIN_SMART_DISPATCH__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>localStorage.getItem('choco_access_token')||'';
  const active=['Đã nhận','Đang lấy hàng','Đang giao','Đã giao'];
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let orders=[],shippers=[];
  async function api(path,options={}){return fetch(SB+path,{...options,headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json',...(options.headers||{})}})}
  const isOnline=s=>!!s.is_online&&s.last_seen&&(Date.now()-new Date(s.last_seen).getTime()<=90000);
  function stats(){return shippers.map(s=>({...s,active:orders.filter(o=>String(o.shipper_id)===String(s.id)&&active.includes(o.status)).length}));}
  function pick(){const list=stats().filter(s=>isOnline(s));return list.sort((a,b)=>a.active-b.active||new Date(b.last_seen||0)-new Date(a.last_seen||0))[0]||null;}
  function inject(){
    if(document.getElementById('chocoSmartDispatch'))return;
    const st=document.createElement('style');
    st.textContent='.smart-panel{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd;border:1px solid #bfdbfe}.smart-title{font-size:18px;font-weight:800}.smart-note{font-size:12px;color:#64748b;margin:4px 0 10px}.smart-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px}.smart-stat{background:#f8fafc;border-radius:10px;padding:9px;text-align:center;font-size:12px}.smart-stat b{display:block;font-size:19px;margin-top:3px}.smart-list{display:flex;flex-direction:column;gap:8px}.smart-row{border:1px solid #e5e7eb;border-radius:11px;padding:10px}.smart-head{display:flex;justify-content:space-between;gap:8px;font-weight:800}.smart-reco{margin-top:5px;font-size:13px}.smart-load{font-size:12px;color:#64748b;margin-top:3px}.smart-btn{margin-top:8px;width:100%;border:0;border-radius:9px;padding:10px;background:#1677ff;color:#fff;font-weight:800;cursor:pointer}.smart-btn:disabled{opacity:.55}.smart-empty{text-align:center;color:#64748b;padding:12px}@media(max-width:500px){.smart-summary{grid-template-columns:1fr 1fr 1fr}.smart-head{flex-direction:column}}';
    document.head.appendChild(st);
    const p=document.createElement('div');p.id='chocoSmartDispatch';p.className='smart-panel';
    p.innerHTML='<div class="smart-title">🤖 ĐIỀU PHỐI THÔNG MINH</div><div class="smart-note">Tự chọn Shipper đang Online và có ít đơn đang chạy nhất. Không tự gán nếu không có Shipper Online.</div><div class="smart-summary"><div class="smart-stat">⏳ Chờ gán<b id="smartUnassigned">0</b></div><div class="smart-stat">🟢 Shipper Online<b id="smartOnline">0</b></div><div class="smart-stat">⚠️ Quá tải<b id="smartOverload">0</b></div></div><div id="smartList" class="smart-list"><div class="smart-empty">⏳ Đang tải...</div></div>';
    const perf=document.getElementById('chocoShipperPerformance'),dispatch=document.getElementById('chocoDispatchPanel'),container=document.querySelector('.container');
    if(perf?.parentElement)perf.parentElement.insertBefore(p,perf.nextSibling);else if(dispatch?.parentElement)dispatch.parentElement.insertBefore(p,dispatch.nextSibling);else if(container)container.insertBefore(p,container.firstChild);
  }
  function render(){
    const list=document.getElementById('smartList');if(!list)return;
    const waiting=orders.filter(o=>!o.shipper_id&&o.status==='Chờ xác nhận');
    const online=stats().filter(isOnline);
    const overload=stats().filter(s=>s.active>=3);
    document.getElementById('smartUnassigned').textContent=waiting.length;
    document.getElementById('smartOnline').textContent=online.length;
    document.getElementById('smartOverload').textContent=overload.length;
    if(!waiting.length){list.innerHTML='<div class="smart-empty">✅ Không có đơn mới cần điều phối.</div>';return}
    list.innerHTML=waiting.map(o=>{const p=pick();return '<div class="smart-row"><div class="smart-head"><span>🧾 '+esc(o.code||('#'+o.id))+'</span><span>'+esc(o.name||'Khách')+'</span></div><div class="smart-load">📍 '+esc(o.address||'Chưa có địa chỉ')+'</div><div class="smart-reco">'+(p?'💡 Gợi ý: <b>'+esc(p.full_name||'Shipper')+'</b> • đang giữ '+p.active+' đơn':'⚠️ Chưa có Shipper Online để gợi ý')+'</div>'+(p?'<button class="smart-btn" data-auto="'+esc(o.id)+'" data-shipper="'+esc(p.id)+'">⚡ GÁN THEO GỢI Ý</button>':'')+'</div>'}).join('');
    list.querySelectorAll('[data-auto]').forEach(b=>b.addEventListener('click',()=>assign(b.dataset.auto,b.dataset.shipper,b)));
  }
  async function load(){
    try{
      const [ro,rs]=await Promise.all([api('/rest/v1/orders?select=id,code,name,address,status,shipper_id,created_at&order=created_at.desc'),api('/rest/v1/profiles?select=id,full_name,phone,is_online,last_seen&role=eq.shipper&order=full_name.asc')]);
      if(!ro.ok||!rs.ok)throw Error('Không tải được dữ liệu điều phối');
      orders=await ro.json();shippers=await rs.json();render();
    }catch(e){console.error('SMART DISPATCH',e)}
  }
  async function assign(id,shipperId,btn){
    btn.disabled=true;btn.textContent='⏳ ĐANG GÁN...';
    try{
      const r=await api('/rest/v1/orders?id=eq.'+encodeURIComponent(id)+'&shipper_id=is.null&status=eq.Chờ%20xác%20nhận',{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({shipper_id:shipperId,status:'Đã nhận'})});
      if(!r.ok)throw Error('HTTP '+r.status+': '+await r.text());
      await load();
      if(typeof window.loadOrders==='function')window.loadOrders();
      alert('✅ Đã gán đơn theo gợi ý của hệ thống.');
    }catch(e){alert('❌ Không thể gán: '+e.message);btn.disabled=false;btn.textContent='⚡ GÁN THEO GỢI Ý'}
  }
  function start(){inject();load();setInterval(load,30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
