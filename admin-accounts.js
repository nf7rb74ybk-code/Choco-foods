'use strict';
(function(){
  if(window.__CHOCO_ADMIN_ACCOUNTS__) return;
  window.__CHOCO_ADMIN_ACCOUNTS__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>localStorage.getItem('choco_access_token')||'';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  async function load(){
    const box=document.getElementById('chocoAccountsRows');
    const status=document.getElementById('chocoAccountsStatus');
    if(!box||!status)return;
    try{
      const r=await fetch(SB+'/rest/v1/profiles?select=id,role,full_name,phone,created_at&order=created_at.desc',{headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json'}});
      if(r.status===401){status.textContent='⚠️ Phiên Admin hết hạn.';return;}
      if(!r.ok)throw Error('Supabase HTTP '+r.status+': '+await r.text());
      const rows=await r.json();
      const count={admin:0,shipper:0,customer:0};
      rows.forEach(x=>{if(count[x.role]!==undefined)count[x.role]++});
      document.getElementById('acctAdmin').textContent=count.admin;
      document.getElementById('acctShipper').textContent=count.shipper;
      document.getElementById('acctCustomer').textContent=count.customer;
      status.textContent='Tổng '+rows.length+' tài khoản trong profiles';
      box.innerHTML=rows.length?rows.map(x=>{
        const role=x.role||'unknown';
        const label=role==='admin'?'👑 Admin':role==='shipper'?'🚚 Shipper':role==='customer'?'👤 Khách':'❓ '+role;
        const date=x.created_at?new Date(x.created_at).toLocaleDateString('vi-VN'):'';
        return '<div class="acct-row"><div><b>'+esc(x.full_name||'Chưa có tên')+'</b><div class="acct-muted">'+esc(x.phone||'Chưa có SĐT')+'</div></div><div class="acct-role '+esc(role)+'">'+label+'</div><div class="acct-id">'+esc(String(x.id))+' • '+date+'</div></div>';
      }).join(''):'<div class="acct-empty">📭 Chưa có tài khoản.</div>';
    }catch(e){console.error('ADMIN ACCOUNTS',e);status.textContent='❌ '+e.message;box.innerHTML='';}
  }
  function inject(){
    if(document.getElementById('chocoAccountsPanel'))return;
    const s=document.createElement('style');
    s.textContent='.acct-panel{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd}.acct-title{font-size:18px;font-weight:bold;margin-bottom:10px}.acct-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.acct-stat{background:#f8fafc;border-radius:10px;padding:10px;text-align:center;font-size:12px}.acct-stat b{display:block;font-size:21px;margin-top:4px}.acct-status{color:#64748b;font-size:12px;margin:10px 0}.acct-row{display:grid;grid-template-columns:1fr auto;gap:5px 10px;border-top:1px solid #eee;padding:10px 0}.acct-muted,.acct-id{color:#64748b;font-size:12px;margin-top:3px;word-break:break-all}.acct-role{font-weight:bold;align-self:center}.acct-role.admin{color:#b45309}.acct-role.shipper{color:#1d4ed8}.acct-role.customer{color:#15803d}.acct-empty{padding:18px;text-align:center;color:#777}@media(max-width:500px){.acct-row{grid-template-columns:1fr}.acct-role{justify-self:start}}';
    document.head.appendChild(s);
    const p=document.createElement('div');p.id='chocoAccountsPanel';p.className='acct-panel';
    p.innerHTML='<div class="acct-title">👥 TÀI KHOẢN & PHÂN QUYỀN</div><div class="acct-stats"><div class="acct-stat">👑 Admin<b id="acctAdmin">0</b></div><div class="acct-stat">🚚 Shipper<b id="acctShipper">0</b></div><div class="acct-stat">👤 Khách<b id="acctCustomer">0</b></div></div><div class="acct-status" id="chocoAccountsStatus">Đang tải...</div><div id="chocoAccountsRows"></div>';
    const container=document.querySelector('.container');
    const push=document.querySelector('.push-admin');
    if(push&&push.parentElement)push.parentElement.insertBefore(p,push.nextSibling);else if(container)container.insertBefore(p,container.firstChild);
  }
  function start(){inject();load();setInterval(load,60000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
