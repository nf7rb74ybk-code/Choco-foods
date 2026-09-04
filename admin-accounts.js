'use strict';
(function(){
  if(window.__CHOCO_ADMIN_ACCOUNTS__) return;
  window.__CHOCO_ADMIN_ACCOUNTS__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>localStorage.getItem('choco_access_token')||'';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function load(){
    const box=document.getElementById('chocoAccountsRows');
    const status=document.getElementById('chocoAccountsStatus');
    if(!box||!status)return;
    try{
      const r=await fetch(SB+'/rest/v1/profiles?select=id,role,full_name,phone,created_at,last_seen,is_online&order=created_at.desc',{headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json'}});
      if(r.status===401){status.textContent='⚠️ Phiên Admin hết hạn.';return;}
      if(!r.ok)throw Error('Supabase HTTP '+r.status+': '+await r.text());
      const rows=await r.json();
      const count={admin:0,shipper:0,customer:0};
      rows.forEach(x=>{if(count[x.role]!==undefined)count[x.role]++});
      const a=document.getElementById('acctAdmin'),s=document.getElementById('acctShipper'),c=document.getElementById('acctCustomer');
      if(a)a.textContent=count.admin;if(s)s.textContent=count.shipper;if(c)c.textContent=count.customer;
      status.textContent='Tổng '+rows.length+' tài khoản trong profiles';
      box.innerHTML=rows.length?rows.map(x=>{
        const role=x.role||'unknown';
        const label=role==='admin'?'👑 Admin':role==='shipper'?'🚚 Shipper':role==='customer'?'👤 Khách':'❓ '+role;
        const date=x.created_at?new Date(x.created_at).toLocaleDateString('vi-VN'):'';
        return '<div class="acct-row"><div><b>'+esc(x.full_name||'Chưa có tên')+'</b><div class="acct-muted">'+esc(x.phone||'Chưa có SĐT')+'</div></div><div class="acct-role '+esc(role)+'">'+label+'</div><div class="acct-id">'+esc(String(x.id))+' • '+date+'</div></div>';
      }).join(''):'<div class="acct-empty">📭 Chưa có tài khoản.</div>';
      renderOnline(rows);
    }catch(e){console.error('ADMIN ACCOUNTS',e);status.textContent='❌ '+e.message;box.innerHTML='';}
  }
  function inject(){
    const old=document.getElementById('chocoAccountsPanel');
    if(!old){
      const s=document.createElement('style');
      s.textContent='.acct-panel{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd}.acct-title{font-size:18px;font-weight:bold;margin-bottom:10px}.acct-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.acct-stat{background:#f8fafc;border-radius:10px;padding:10px;text-align:center;font-size:12px}.acct-stat b{display:block;font-size:21px;margin-top:4px}.acct-status{color:#64748b;font-size:12px;margin:10px 0}.acct-row{display:grid;grid-template-columns:1fr auto;gap:5px 10px;border-top:1px solid #eee;padding:10px 0}.acct-muted,.acct-id{color:#64748b;font-size:12px;margin-top:3px;word-break:break-all}.acct-role{font-weight:bold;align-self:center}.acct-role.admin{color:#b45309}.acct-role.shipper{color:#1d4ed8}.acct-role.customer{color:#15803d}.acct-empty{padding:18px;text-align:center;color:#777}@media(max-width:500px){.acct-row{grid-template-columns:1fr}.acct-role{justify-self:start}}';
      document.head.appendChild(s);
      const p=document.createElement('div');p.id='chocoAccountsPanel';p.className='acct-panel';
      p.innerHTML='<div class="acct-title">👥 TÀI KHOẢN & PHÂN QUYỀN</div><div class="acct-stats"><div class="acct-stat">👑 Admin<b id="acctAdmin">0</b></div><div class="acct-stat">🚚 Shipper<b id="acctShipper">0</b></div><div class="acct-stat">👤 Khách<b id="acctCustomer">0</b></div></div><div class="acct-status" id="chocoAccountsStatus">Đang tải...</div><div id="chocoAccountsRows"></div>';
      const container=document.querySelector('.container'),push=document.querySelector('.push-admin');
      if(push&&push.parentElement)push.parentElement.insertBefore(p,push.nextSibling);else if(container)container.insertBefore(p,container.firstChild);
    }
    const st=document.createElement('style');
    st.textContent='.online-panel{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd}.online-title{font-size:18px;font-weight:bold;margin-bottom:10px}.online-summary{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.online-badge{padding:7px 10px;border-radius:999px;background:#f1f5f9;font-size:13px;font-weight:700}.online-list{display:flex;flex-direction:column;gap:8px}.online-row{padding:11px;border:1px solid #eee;border-radius:11px}.online-name{font-weight:800}.online-meta{font-size:12px;color:#64748b;margin-top:3px}.online-live{color:#15803d;font-weight:800}.online-off{color:#64748b;font-weight:700}.manage-panel{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd}.manage-title{font-size:18px;font-weight:800;margin-bottom:10px}.manage-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.manage-input,.manage-select{width:100%;padding:11px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font-size:14px}.manage-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.manage-stat{background:#f8fafc;border-radius:10px;padding:10px;text-align:center;font-size:12px}.manage-stat b{display:block;font-size:18px;margin-top:4px}.manage-note{color:#64748b;font-size:12px;margin-top:8px}@media(max-width:500px){.manage-grid{grid-template-columns:1fr}.manage-summary{grid-template-columns:1fr 1fr 1fr}}';
    document.head.appendChild(st);
    if(!document.getElementById('chocoShipperOnlinePanel')){
      const p=document.createElement('div');p.id='chocoShipperOnlinePanel';p.className='online-panel';
      p.innerHTML='<div class="online-title">🚚 TRẠNG THÁI SHIPPER</div><div class="online-summary"><span class="online-badge">🟢 Online: <b id="onlineCount">0</b></span><span class="online-badge">⚫ Offline: <b id="offlineCount">0</b></span></div><div id="onlineStatus" class="online-meta">Đang tải...</div><div id="onlineList" class="online-list"></div>';
      const accounts=document.getElementById('chocoAccountsPanel');
      if(accounts&&accounts.parentElement)accounts.parentElement.insertBefore(p,accounts.nextSibling);
    }
    if(!document.getElementById('chocoOrderManagement')){
      const p=document.createElement('div');p.id='chocoOrderManagement';p.className='manage-panel';
      p.innerHTML='<div class="manage-title">📊 QUẢN LÝ ĐƠN HÀNG</div><div class="manage-grid"><input id="adminOrderSearch" class="manage-input" placeholder="🔎 Tìm mã đơn, tên, SĐT, địa chỉ..."><select id="adminOrderStatus" class="manage-select"><option value="all">📋 Tất cả trạng thái</option><option>Chờ xác nhận</option><option>Đã nhận</option><option>Đang lấy hàng</option><option>Đang giao</option><option>Đã giao</option><option>Hoàn thành</option><option>Đã hủy</option></select></div><div class="manage-grid" style="margin-top:8px"><select id="adminOrderPeriod" class="manage-select"><option value="all">📅 Tất cả thời gian</option><option value="today">Hôm nay</option><option value="7">7 ngày qua</option><option value="30">30 ngày qua</option></select><button id="adminOrderReset" class="manage-select" style="font-weight:800;cursor:pointer">♻️ XÓA BỘ LỌC</button></div><div class="manage-summary"><div class="manage-stat">Hiển thị<b id="adminVisibleOrders">0</b></div><div class="manage-stat">Doanh thu<b id="adminVisibleRevenue">0đ</b></div><div class="manage-stat">Chờ xử lý<b id="adminPendingOrders">0</b></div></div><div class="manage-note" id="adminManageNote">Bộ lọc áp dụng trên danh sách đơn bên dưới.</div>';
      const stats=document.querySelector('.stats'),orders=document.getElementById('orders');
      if(stats&&stats.parentElement)stats.parentElement.insertBefore(p,stats);else if(orders&&orders.parentElement)orders.parentElement.insertBefore(p,orders);
      const search=document.getElementById('adminOrderSearch'),status=document.getElementById('adminOrderStatus'),period=document.getElementById('adminOrderPeriod');
      [search,status,period].forEach(el=>el&&el.addEventListener('input',applyOrderFilters));
      document.getElementById('adminOrderReset')?.addEventListener('click',()=>{search.value='';status.value='all';period.value='all';applyOrderFilters()});
    }
  }
  function ago(iso){if(!iso)return 'Chưa có hoạt động';const ms=Date.now()-new Date(iso).getTime();if(ms<0)return 'vừa hoạt động';const sec=Math.floor(ms/1000);if(sec<60)return sec+' giây trước';const min=Math.floor(sec/60);if(min<60)return min+' phút trước';const h=Math.floor(min/60);if(h<24)return h+' giờ trước';return Math.floor(h/24)+' ngày trước'}
  function renderOnline(rows){
    const list=document.getElementById('onlineList'),status=document.getElementById('onlineStatus');if(!list||!status)return;
    const shippers=rows.filter(x=>x.role==='shipper');
    const now=Date.now(),fresh=shippers.map(x=>({...x,online:!!x.is_online&&x.last_seen&&(now-new Date(x.last_seen).getTime()<=90000)}));
    const on=fresh.filter(x=>x.online),off=fresh.filter(x=>!x.online);
    const onEl=document.getElementById('onlineCount'),offEl=document.getElementById('offlineCount');
    if(onEl)onEl.textContent=on.length;if(offEl)offEl.textContent=off.length;
    status.textContent='Cập nhật '+new Date().toLocaleTimeString('vi-VN')+' • Online khi heartbeat còn mới';
    list.innerHTML=fresh.length?fresh.map(x=>'<div class="online-row"><div class="online-name">'+(x.online?'🟢':'⚫')+' '+esc(x.full_name||'Shipper')+'</div><div class="online-meta">📞 '+esc(x.phone||'Chưa có SĐT')+' • '+(x.online?'<span class="online-live">Đang online</span>':'<span class="online-off">Offline')+'</span><br>🕐 '+esc(ago(x.last_seen))+'</div></div>').join(''):'<div class="online-meta">📭 Chưa có tài khoản Shipper.</div>';
  }
  async function loadOnlineOnly(){
    try{
      const r=await fetch(SB+'/rest/v1/profiles?select=id,role,full_name,phone,last_seen,is_online&role=eq.shipper&order=full_name.asc',{headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json'}});
      if(!r.ok)return;renderOnline(await r.json());
    }catch(e){console.warn('ADMIN SHIPPER ONLINE',e)}
  }
  function parseMoney(text){const m=String(text||'').replace(/[^0-9]/g,'');return Number(m||0)}
  function applyOrderFilters(){
    const root=document.getElementById('orders');if(!root)return;
    const q=String(document.getElementById('adminOrderSearch')?.value||'').trim().toLowerCase();
    const wanted=String(document.getElementById('adminOrderStatus')?.value||'all');
    const p=String(document.getElementById('adminOrderPeriod')?.value||'all');
    const now=Date.now();let visible=0,revenue=0,pending=0,totalCards=0;
    root.querySelectorAll('.order').forEach(card=>{
      totalCards++;
      const text=card.innerText||'';
      const select=card.querySelector('select');
      const current=select?.value||'';
      const hay=text.toLowerCase();
      const matchQ=!q||hay.includes(q);
      const matchStatus=wanted==='all'||current===wanted;
      const timeText=card.querySelector('.time')?.textContent||'';
      let dateOk=true;
      if(p!=='all'){
        const t=Date.parse(timeText);
        const ms=p==='today'?86400000:Number(p)*86400000;
        dateOk=Number.isFinite(t)?(now-t<=ms&&t<=now):true;
      }
      const ok=matchQ&&matchStatus&&dateOk;
      card.style.display=ok?'':'none';
      if(ok){visible++;revenue+=parseMoney(card.querySelector('.order-total-top')?.textContent);if(current==='Chờ xác nhận'||current==='Đã nhận'||current==='Đang lấy hàng'||current==='Đang giao')pending++;}
    });
    const v=document.getElementById('adminVisibleOrders'),r=document.getElementById('adminVisibleRevenue'),pn=document.getElementById('adminPendingOrders');
    if(v)v.textContent=visible;if(r)r.textContent=revenue.toLocaleString('vi-VN')+'đ';if(pn)pn.textContent=pending;
    const note=document.getElementById('adminManageNote');if(note)note.textContent=visible+' / '+totalCards+' đơn đang hiển thị'+(q?' • đã tìm kiếm':'')+(wanted!=='all'?' • '+wanted:'');
  }
  function start(){
    inject();load();setInterval(loadOnlineOnly,30000);setInterval(applyOrderFilters,2000);
    setTimeout(applyOrderFilters,700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
