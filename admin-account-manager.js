/* CHOCO SHIP — ADMIN ACCOUNT MANAGER v1 */
'use strict';
(function(){
  if(window.__CHOCO_ADMIN_ACCOUNT_MANAGER__)return;
  window.__CHOCO_ADMIN_ACCOUNT_MANAGER__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>localStorage.getItem('choco_access_token')||'';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let rows=[];
  async function api(path,opts={}){
    const r=await fetch(SB+path,{...opts,headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json','Content-Type':'application/json',...(opts.headers||{})}});
    const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{}
    if(!r.ok)throw Error((data&&data.message)||text||('HTTP '+r.status));
    return data;
  }
  function roleLabel(r){return r==='admin'?'👑 Admin':r==='shipper'?'🚚 Shipper':'👤 Customer'}
  function inject(){
    if(document.getElementById('chocoAccountManager'))return;
    const st=document.createElement('style');
    st.textContent='.cam{background:#fff;border-radius:15px;padding:15px;margin-bottom:15px;box-shadow:0 2px 8px #ddd}.cam-title{font-size:18px;font-weight:800;margin-bottom:10px}.cam-tools{display:grid;grid-template-columns:1fr auto;gap:8px}.cam-input,.cam-select,.cam-btn{padding:10px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font-size:14px}.cam-btn{cursor:pointer;font-weight:800}.cam-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.cam-stat{background:#f8fafc;border-radius:10px;padding:8px;text-align:center;font-size:12px}.cam-stat b{display:block;font-size:18px}.cam-list{display:flex;flex-direction:column;gap:8px}.cam-row{border:1px solid #e5e7eb;border-radius:12px;padding:10px}.cam-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.cam-name{font-weight:800}.cam-meta{font-size:12px;color:#64748b;margin-top:3px;word-break:break-all}.cam-actions{display:grid;grid-template-columns:1fr 1fr auto;gap:7px;margin-top:8px}.cam-danger{border-color:#fecaca}.cam-locked{opacity:.7;background:#fff7ed}@media(max-width:600px){.cam-tools{grid-template-columns:1fr}.cam-summary{grid-template-columns:1fr 1fr}.cam-actions{grid-template-columns:1fr 1fr}.cam-actions .cam-btn:last-child{grid-column:1/-1}}';
    document.head.appendChild(st);
    const p=document.createElement('div');p.id='chocoAccountManager';p.className='cam';
    p.innerHTML='<div class="cam-title">🔐 QUẢN LÝ TÀI KHOẢN THỰC TẾ</div><div class="cam-tools"><input id="camSearch" class="cam-input" placeholder="🔎 Tìm tên, SĐT, ID..."><select id="camRole" class="cam-select"><option value="all">Tất cả quyền</option><option value="admin">👑 Admin</option><option value="shipper">🚚 Shipper</option><option value="customer">👤 Customer</option></select></div><div class="cam-summary"><div class="cam-stat">Admin<b id="camAdmin">0</b></div><div class="cam-stat">Shipper<b id="camShipper">0</b></div><div class="cam-stat">Customer<b id="camCustomer">0</b></div><div class="cam-stat">Khóa<b id="camLocked">0</b></div></div><div id="camStatus" class="cam-meta">Đang tải...</div><div id="camList" class="cam-list"></div>';
    const legacy=document.getElementById('chocoAccountsPanel');
    if(legacy){legacy.replaceWith(p)}else{const container=document.querySelector('.container');if(container)container.insertBefore(p,container.firstChild);else document.body.prepend(p)}
    document.getElementById('camSearch').addEventListener('input',render);document.getElementById('camRole').addEventListener('change',render);
  }
  async function load(){
    const status=document.getElementById('camStatus');
    try{rows=await api('/rest/v1/profiles?select=id,role,full_name,phone,created_at,last_seen,is_online,account_status&order=created_at.desc');render();status.textContent='Đã tải '+rows.length+' tài khoản • chỉ Admin mới thao tác được';}
    catch(e){status.textContent='❌ '+e.message;console.error('CHOCO ACCOUNT MANAGER',e)}
  }
  function render(){
    const q=(document.getElementById('camSearch')?.value||'').trim().toLowerCase(),role=document.getElementById('camRole')?.value||'all';
    const list=document.getElementById('camList');if(!list)return;
    const f=rows.filter(x=>(role==='all'||x.role===role)&&(!q||[x.full_name,x.phone,x.id,x.role].some(v=>String(v??'').toLowerCase().includes(q))));
    const count={admin:0,shipper:0,customer:0,locked:0};rows.forEach(x=>{if(count[x.role]!==undefined)count[x.role]++;if(x.account_status==='locked')count.locked++});
    ['admin','shipper','customer'].forEach(k=>{const e=document.getElementById('cam'+k[0].toUpperCase()+k.slice(1));if(e)e.textContent=count[k]});const l=document.getElementById('camLocked');if(l)l.textContent=count.locked;
    list.innerHTML=f.length?f.map(x=>{const locked=x.account_status==='locked';const self=x.id===tokenUserId();const canRole=!self;return '<div class="cam-row '+(locked?'cam-locked':'')+'"><div class="cam-head"><span class="cam-name">'+(locked?'🔒 ':'')+esc(x.full_name||'Chưa có tên')+'</span><b>'+roleLabel(x.role)+'</b></div><div class="cam-meta">📞 '+esc(x.phone||'Chưa có SĐT')+' • ID: '+esc(x.id)+'</div><div class="cam-meta">📅 '+esc(x.created_at?new Date(x.created_at).toLocaleDateString('vi-VN'):'')+' • '+(locked?'Đã khóa':'Đang hoạt động')+'</div><div class="cam-actions">'+(canRole?'<select class="cam-select" onchange="window.chocoSetRole(\''+esc(x.id)+'\',this.value)"><option value="">Đổi quyền…</option><option value="customer" '+(x.role==='customer'?'selected':'')+'>👤 Customer</option><option value="shipper" '+(x.role==='shipper'?'selected':'')+'>🚚 Shipper</option><option value="admin" '+(x.role==='admin'?'selected':'')+'>👑 Admin</option></select>':'<span class="cam-meta">Tài khoản hiện tại</span>')+(canRole?'<button class="cam-btn '+(locked?'':'cam-danger')+'" onclick="window.chocoSetStatus(\''+esc(x.id)+'\','+(locked?'\'active\'':'\'locked\'')+')">'+(locked?'🔓 MỞ KHÓA':'🔒 KHÓA')+'</button>':'')+'<button class="cam-btn" onclick="window.chocoRefreshAccounts()">↻</button></div></div>'}).join(''):'<div class="cam-meta">📭 Không có tài khoản phù hợp.</div>';
  }
  function tokenUserId(){try{const p=JSON.parse(atob((token().split('.')[1]||'').replace(/-/g,'+').replace(/_/g,'/')));return p.sub||''}catch{return ''}}
  async function callRpc(name,body){return api('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(body)})}
  window.chocoSetRole=async(id,role)=>{if(!role)return;const x=rows.find(r=>r.id===id);if(!x||x.role===role)return;if(!confirm('Đổi quyền tài khoản này thành '+role+'?')){load();return}try{await callRpc('admin_set_profile_role',{p_user_id:id,p_role:role});await load();alert('✅ Đã đổi quyền thành công.')}catch(e){alert('❌ Không đổi được quyền: '+e.message);load()}};
  window.chocoSetStatus=async(id,status)=>{if(!confirm(status==='locked'?'Khóa tài khoản này?':'Mở khóa tài khoản này?'))return;try{await callRpc('admin_set_profile_status',{p_user_id:id,p_status:status});await load();alert(status==='locked'?'🔒 Đã khóa tài khoản.':'🔓 Đã mở khóa tài khoản.')}catch(e){alert('❌ Thao tác thất bại: '+e.message);load()}};
  window.chocoRefreshAccounts=load;
  function start(){inject();load()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
