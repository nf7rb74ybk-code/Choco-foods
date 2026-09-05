/* CHOCO SHIP — Customer order history UX v1 */
(function(){
  'use strict';
  if(window.__CHOCO_CUSTOMER_HISTORY__)return;
  window.__CHOCO_CUSTOMER_HISTORY__=true;
  const U='https://guwdswqaqnhzqapflvey.supabase.co';
  const K='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const $=id=>document.getElementById(id);
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const headers=()=>({apikey:K,Authorization:'Bearer '+(localStorage.getItem('choco_access_token')||''),Accept:'application/json'});
  const active=new Set(['Chờ xác nhận','Đã nhận','Đang lấy hàng','Đang giao','Đã giao']);
  function badge(status){
    const s=String(status||'');
    const cls=active.has(s)?'active':s==='Hoàn thành'?'done':s.includes('Hủy')?'cancel':'pending';
    return `<span class="choco-status ${cls}">${esc(s||'Không rõ')}</span>`;
  }
  function injectStyle(){
    if(document.getElementById('choco-history-style'))return;
    const st=document.createElement('style');st.id='choco-history-style';
    st.textContent='.choco-history-card{border-top:1px solid #eee;padding:14px 0}.choco-status{display:inline-block;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:800;margin:5px 0}.choco-status.active{background:#dbeafe;color:#1d4ed8}.choco-status.done{background:#dcfce7;color:#166534}.choco-status.cancel{background:#fee2e2;color:#991b1b}.choco-status.pending{background:#fef3c7;color:#92400e}.choco-history-actions{display:flex;gap:8px;margin-top:9px}.choco-history-actions a{flex:1;text-align:center;text-decoration:none;padding:9px;border-radius:9px;background:#ff6b00;color:#fff;font-weight:800;font-size:13px}.choco-history-actions a.secondary{background:#eef2ff;color:#3730a3}.choco-history-empty{text-align:center;color:#777;padding:18px 0}';document.head.appendChild(st);
  }
  async function load(){
    const box=$('orders');if(!box)return;
    const token=String(localStorage.getItem('choco_access_token')||'').trim(),uid=String(localStorage.getItem('choco_user_id')||'').trim();
    if(!token||!uid)return;
    try{
      const r=await fetch(U+'/rest/v1/orders?customer_id=eq.'+encodeURIComponent(uid)+'&select=code,status,total,created_at,address&order=created_at.desc&limit=50',{headers:headers()});
      if(!r.ok)throw Error('HTTP '+r.status);
      const rows=await r.json();
      if(!rows.length){box.innerHTML='<div class="choco-history-empty">📭 Chưa có đơn hàng.</div>';return;}
      box.innerHTML=rows.map(o=>{
        const code=String(o.code||'');
        const canTrack=active.has(String(o.status||''));
        return `<div class="choco-history-card"><b>📦 ${esc(code)}</b><br>${badge(o.status)}<br>💰 <b>${money(o.total)}</b><br>📍 ${esc(o.address||'Chưa có địa chỉ')}<br><small>${o.created_at?new Date(o.created_at).toLocaleString('vi-VN'):''}</small><div class="choco-history-actions">${canTrack?`<a href="customer.html?track=${encodeURIComponent(code)}">📍 Theo dõi đơn</a>`:''}<a class="secondary" href="customer.html?order=${encodeURIComponent(code)}">🔎 Xem đơn</a></div></div>`;
      }).join('');
    }catch(e){console.error('CHOCO HISTORY',e);}
  }
  function boot(){injectStyle();load();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
