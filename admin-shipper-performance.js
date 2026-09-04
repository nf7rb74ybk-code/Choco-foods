'use strict';
(function(){
  if(window.__CHOCO_ADMIN_SHIPPER_PERFORMANCE__)return;
  window.__CHOCO_ADMIN_SHIPPER_PERFORMANCE__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>localStorage.getItem('choco_access_token')||'';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const money=v=>Number(v||0).toLocaleString('vi-VN')+'đ';
  let orders=[],shippers=[];
  async function api(path){return fetch(SB+path,{headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json'}})}
  function online(s){return !!s.is_online&&s.last_seen&&(Date.now()-new Date(s.last_seen).getTime()<=90000)}
  function today(iso){if(!iso)return false;const d=new Date(iso),n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate()}
  function inject(){
    if(document.getElementById('chocoShipperPerformance'))return;
    const st=document.createElement('style');
    st.textContent='.perf-panel{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd;border:1px solid #e2e8f0}.perf-title{font-size:18px;font-weight:800;margin-bottom:4px}.perf-note{font-size:12px;color:#64748b;margin-bottom:11px}.perf-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}.perf-stat{background:#f8fafc;border-radius:10px;padding:9px;text-align:center;font-size:12px}.perf-stat b{display:block;font-size:19px;margin-top:3px}.perf-list{display:flex;flex-direction:column;gap:9px}.perf-row{border:1px solid #e5e7eb;border-radius:12px;padding:11px}.perf-row.overload{border-color:#ef4444;background:#fff7f7}.perf-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.perf-name{font-weight:800}.perf-status{font-size:12px;font-weight:800}.perf-online{color:#15803d}.perf-offline{color:#64748b}.perf-warning{color:#dc2626;font-weight:900}.perf-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}.perf-metric{background:#f8fafc;border-radius:8px;padding:7px;text-align:center;font-size:11px}.perf-metric b{display:block;font-size:15px;margin-top:2px}.perf-actions{margin-top:8px;display:flex;gap:7px}.perf-btn{border:0;border-radius:9px;padding:9px 12px;background:#1677ff;color:#fff;font-weight:800;cursor:pointer}.perf-btn.secondary{background:#64748b}.perf-empty{text-align:center;color:#64748b;padding:15px}@media(max-width:600px){.perf-summary{grid-template-columns:1fr 1fr}.perf-metrics{grid-template-columns:1fr 1fr}.perf-head{align-items:flex-start;flex-direction:column}.perf-actions{display:grid;grid-template-columns:1fr}.perf-btn{width:100%}}';
    document.head.appendChild(st);
    const p=document.createElement('div');p.id='chocoShipperPerformance';p.className='perf-panel';
    p.innerHTML='<div class="perf-title">📊 HIỆU SUẤT & TẢI SHIPPER</div><div class="perf-note">Theo dõi đơn đang giữ, đơn hoàn thành hôm nay, doanh thu phí giao và cảnh báo quá tải.</div><div class="perf-summary"><div class="perf-stat">🚚 Shipper<b id="perfTotal">0</b></div><div class="perf-stat">🟢 Online<b id="perfOnline">0</b></div><div class="perf-stat">🔥 Quá tải<b id="perfOverload">0</b></div><div class="perf-stat">📦 Đang chạy<b id="perfActive">0</b></div></div><div id="perfList" class="perf-list"><div class="perf-empty">⏳ Đang tải...</div></div>';
    const dispatch=document.getElementById('chocoDispatchPanel'),accounts=document.getElementById('chocoAccountsPanel'),container=document.querySelector('.container');
    if(dispatch&&dispatch.parentElement)dispatch.parentElement.insertBefore(p,dispatch.nextSibling);else if(accounts&&accounts.parentElement)accounts.parentElement.insertBefore(p,accounts.nextSibling);else if(container)container.insertBefore(p,container.firstChild);
  }
  function render(){
    const list=document.getElementById('perfList');if(!list)return;
    const activeStatuses=['Đã nhận','Đang lấy hàng','Đang giao','Đã giao'];
    const data=shippers.map(s=>{
      const mine=orders.filter(o=>String(o.shipper_id)===String(s.id));
      const active=mine.filter(o=>activeStatuses.includes(o.status));
      const done=mine.filter(o=>o.status==='Hoàn thành');
      const todayDone=done.filter(o=>today(o.created_at));
      const revenue=todayDone.reduce((a,o)=>a+Number(o.shipping_fee||0),0);
      return {...s,active:active.length,done:done.length,todayDone:todayDone.length,revenue,online:online(s)};
    }).sort((a,b)=>Number(b.active>=3)-Number(a.active>=3)||b.active-a.active||Number(b.online)-Number(a.online)||b.todayDone-a.todayDone);
    const total=document.getElementById('perfTotal'),on=document.getElementById('perfOnline'),ov=document.getElementById('perfOverload'),act=document.getElementById('perfActive');
    if(total)total.textContent=data.length;if(on)on.textContent=data.filter(x=>x.online).length;if(ov)ov.textContent=data.filter(x=>x.active>=3).length;if(act)act.textContent=data.reduce((a,x)=>a+x.active,0);
    if(!data.length){list.innerHTML='<div class="perf-empty">📭 Chưa có tài khoản Shipper.</div>';return}
    list.innerHTML=data.map(s=>'<div class="perf-row '+(s.active>=3?'overload':'')+'"><div class="perf-head"><div class="perf-name">'+(s.online?'🟢':'⚫')+' '+esc(s.full_name||'Shipper')+'</div><div class="perf-status '+(s.online?'perf-online':'perf-offline')+'">'+(s.online?'ONLINE':'OFFLINE')+(s.active>=3?' • ⚠️ QUÁ TẢI':'')+'</div></div><div class="perf-metrics"><div class="perf-metric">Đang giữ<b>'+s.active+'</b></div><div class="perf-metric">Hoàn thành<b>'+s.done+'</b></div><div class="perf-metric">Hôm nay<b>'+s.todayDone+'</b></div><div class="perf-metric">Phí giao hôm nay<b>'+money(s.revenue)+'</b></div></div><div class="perf-actions"><button class="perf-btn" data-view="'+esc(s.id)+'">👁 XEM ĐƠN</button></div></div>').join('');
    list.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>viewOrders(btn.dataset.view)));
  }
  function viewOrders(shipperId){
    const cards=document.querySelectorAll('#orders .order');let found=0;
    cards.forEach(card=>{const text=(card.innerText||'').toLowerCase();const target=shippers.find(s=>String(s.id)===String(shipperId));const name=(target?.full_name||'').toLowerCase();const phone=String(target?.phone||'').toLowerCase();const ok=(name&&text.includes(name))||(phone&&text.includes(phone));card.style.display=ok?'':'none';if(ok)found++});
    document.getElementById('orders')?.scrollIntoView({behavior:'smooth',block:'start'});
    if(!found)alert('ℹ️ Danh sách đơn hiện tại chưa hiển thị đủ thông tin Shipper này.');
  }
  async function load(){
    const list=document.getElementById('perfList');if(list)list.innerHTML='<div class="perf-empty">⏳ Đang cập nhật...</div>';
    try{
      const [rs,ro]=await Promise.all([api('/rest/v1/profiles?select=id,full_name,phone,is_online,last_seen&role=eq.shipper&order=full_name.asc'),api('/rest/v1/orders?select=id,code,status,shipper_id,total,shipping_fee,created_at&order=created_at.desc')]);
      if(!rs.ok)throw Error('Shippers HTTP '+rs.status+': '+await rs.text());
      if(!ro.ok)throw Error('Orders HTTP '+ro.status+': '+await ro.text());
      shippers=await rs.json();orders=await ro.json();render();
    }catch(e){console.error('ADMIN SHIPPER PERFORMANCE',e);if(list)list.innerHTML='<div class="perf-empty">❌ '+esc(e.message)+'</div>'}
  }
  function start(){inject();load();setInterval(load,30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
(function(){
  const s=document.createElement('script');
  s.src='./admin-dispatch-smart.js?v=20260904-3';
  s.async=true;
  document.head.appendChild(s);
})();
