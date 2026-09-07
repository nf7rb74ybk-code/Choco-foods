/* CHOCO SHIP — Shipper order status controls v2
   Owns the visible lifecycle UI so it works even when shipper-online.js
   misses the first rendered order snapshot.
*/
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

  function findStatus(text){
    const s=String(text||'');
    for(const key of Object.keys(FLOW)) if(s.includes('📌 '+key)||s.includes(key)) return key;
    if(s.includes('📌 Chờ xác nhận')||s.includes('Chờ xác nhận')) return 'Chờ xác nhận';
    if(s.includes('Hoàn thành')) return 'Hoàn thành';
    return '';
  }

  async function getOwnOrders(){
    try{
      const r=await fetch(SB+'/rest/v1/orders?select=id,code,status,shipper_id&shipper_id=eq.'+encodeURIComponent(UID)+'&order=created_at.desc',{headers});
      if(!r.ok) return [];
      const data=await r.json();
      return Array.isArray(data)?data:[];
    }catch{return []}
  }

  async function updateStatus(id,current,next,wrap){
    const cfg=FLOW[current];
    if(!id||!cfg||cfg.next!==next) return;
    wrap?.querySelectorAll('button').forEach(b=>{b.disabled=true;b.textContent='⏳ ĐANG CẬP NHẬT...'});
    try{
      const qs='/rest/v1/orders?id=eq.'+encodeURIComponent(id)+'&shipper_id=eq.'+encodeURIComponent(UID)+'&status=eq.'+encodeURIComponent(current);
      const r=await fetch(SB+qs,{method:'PATCH',headers,body:JSON.stringify({status:next})});
      if(!r.ok) throw Error((await r.text())||('HTTP '+r.status));
      if(typeof window.loadOrders==='function') await window.loadOrders();
      setTimeout(enhance,50);
      setTimeout(enhance,500);
    }catch(e){
      alert('❌ Không thể cập nhật trạng thái: '+(e?.message||e));
      wrap?.querySelectorAll('button').forEach(b=>{b.disabled=false;b.textContent=FLOW[current].label});
    }
  }
  window.chocoUpdateOrderStatus=updateStatus;

  function enhance(){
    const root=document.getElementById('orders');
    if(!root) return;
    root.querySelectorAll('.order').forEach(card=>{
      const old=card.querySelector('[data-choco-status-control]');
      if(old) old.remove();
      const text=card.textContent||'';
      const current=findStatus(text);
      if(!FLOW[current]) return;

      const codeEl=card.querySelector('b');
      const code=codeEl?.textContent?.trim()||'';
      const order=(window.__CHOCO_LAST_ORDERS__||[]).find(o=>String(o.code||'')===code&&String(o.shipper_id||'')===UID);
      const id=order?.id;
      if(!id) return;

      const cfg=FLOW[current];
      const wrap=document.createElement('div');
      wrap.setAttribute('data-choco-status-control','1');
      wrap.style.cssText='margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb';
      wrap.innerHTML='<div style="font-size:12px;color:#64748b;margin-bottom:6px">🔄 Trạng thái tiếp theo: <b>'+esc(cfg.next)+'</b></div><button style="width:100%;padding:13px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-weight:900;font-size:15px">'+cfg.label+'</button>';
      wrap.querySelector('button').onclick=()=>updateStatus(String(id),current,cfg.next,wrap);
      card.appendChild(wrap);
      card.dataset.statusFlowReady='1';
    });
  }

  async function syncSnapshot(){
    const data=await getOwnOrders();
    if(data.length) window.__CHOCO_LAST_ORDERS__=data;
    enhance();
  }

  const ordersEl=document.getElementById('orders');
  if(ordersEl) new MutationObserver(()=>setTimeout(enhance,0)).observe(ordersEl,{childList:true,subtree:true});
  syncSnapshot();
  setInterval(syncSnapshot,3000);
  window.addEventListener('pageshow',()=>setTimeout(syncSnapshot,100));
})();
