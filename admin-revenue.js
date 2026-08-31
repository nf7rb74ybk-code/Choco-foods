/* CHOCO SHIP - Admin Revenue & Order History */
'use strict';
(function(){
  if(window.__CHOCO_ADMIN_REVENUE__) return;
  window.__CHOCO_ADMIN_REVENUE__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=()=>localStorage.getItem('choco_access_token')||'';
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const api=(p,o={})=>fetch(SB+p,{...o,headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json','Content-Type':'application/json',...(o.headers||{})}});
  function day(v){const d=v?new Date(v):new Date();return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'});}
  function inject(){
    if(document.getElementById('chocoRevenuePanel')) return;
    const style=document.createElement('style');
    style.textContent='.rev-panel{background:#fff;border-radius:15px;padding:15px;margin:0 0 15px;box-shadow:0 2px 8px #ddd;border:1px solid #e5e7eb}.rev-title{font-size:18px;font-weight:bold;margin-bottom:10px}.rev-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.rev-stat{background:#f8fafc;border-radius:11px;padding:11px;text-align:center;font-size:12px}.rev-stat b{display:block;font-size:18px;margin-top:4px}.rev-tools{display:flex;gap:7px;margin:10px 0;flex-wrap:wrap}.rev-tools input{flex:1;min-width:130px;padding:10px;border:1px solid #ddd;border-radius:9px}.rev-table{overflow:auto}.rev-row{border-top:1px solid #eee;padding:10px 0;font-size:13px}.rev-row-top{display:flex;justify-content:space-between;gap:8px}.rev-code{font-weight:bold;color:#ea580c}.rev-total{font-weight:bold;color:#166534}.rev-muted{color:#64748b;font-size:12px}.rev-badge{display:inline-block;padding:3px 7px;border-radius:999px;background:#f1f5f9;margin-top:4px}.rev-refresh{border:0;background:#ff6b00;color:#fff;padding:9px 12px;border-radius:9px;font-weight:bold}';
    document.head.appendChild(style);
    const panel=document.createElement('div');panel.id='chocoRevenuePanel';panel.className='rev-panel';
    panel.innerHTML='<div class="rev-title">📊 DOANH THU & LỊCH SỬ ĐƠN</div><div class="rev-grid"><div class="rev-stat">Doanh thu<b id="revRevenue">0đ</b></div><div class="rev-stat">Tiền món<b id="revFood">0đ</b></div><div class="rev-stat">Phí ship<b id="revShip">0đ</b></div><div class="rev-stat">Số đơn<b id="revOrders">0</b></div><div class="rev-stat">💵 Tiền mặt<b id="revCash">0đ</b></div><div class="rev-stat">🏦 Chuyển khoản<b id="revBank">0đ</b></div></div><div class="rev-tools"><input id="revDate" type="date"><input id="revSearch" placeholder="🔎 Mã đơn / khách / shipper"><button class="rev-refresh" id="revRefresh">🔄</button></div><div id="revStatus" class="rev-muted">Đang tải...</div><div id="revRows" class="rev-table"></div>';
    const orders=document.getElementById('orders');
    if(orders&&orders.parentElement) orders.parentElement.insertBefore(panel,orders);
    else document.querySelector('.container')?.appendChild(panel);
    document.getElementById('revDate').value=day();
    document.getElementById('revDate').onchange=load;
    document.getElementById('revSearch').oninput=load;
    document.getElementById('revRefresh').onclick=load;
  }
  let cache=[];
  async function load(){
    const status=document.getElementById('revStatus'),rows=document.getElementById('revRows');if(!status||!rows)return;
    try{
      const r=await api('/rest/v1/orders?select=id,code,name,phone,status,total,food_total,shipping_fee,payment,shipper_id,shipper_name,created_at&order=created_at.desc&limit=500');
      if(!r.ok) throw Error('Supabase HTTP '+r.status+': '+await r.text());
      cache=await r.json();
      const selected=document.getElementById('revDate').value||day();
      const q=(document.getElementById('revSearch').value||'').trim().toLowerCase();
      let list=cache.filter(o=>day(o.created_at)===selected);
      if(q) list=list.filter(o=>[o.code,o.name,o.phone,o.shipper_name,o.status].some(v=>String(v??'').toLowerCase().includes(q)));
      const done=list.filter(o=>o.status==='Hoàn thành');
      const sum=a=>a.reduce((s,o)=>s+Number(o.total||0),0);
      const food=sum(done.map(o=>o.food_total??0));
      const ship=sum(done.map(o=>o.shipping_fee??0));
      const revenue=sum(done);
      const cash=sum(done.filter(o=>o.payment!=='bank'));
      const bank=sum(done.filter(o=>o.payment==='bank'));
      document.getElementById('revRevenue').textContent=money(revenue);document.getElementById('revFood').textContent=money(food);document.getElementById('revShip').textContent=money(ship);document.getElementById('revOrders').textContent=done.length;document.getElementById('revCash').textContent=money(cash);document.getElementById('revBank').textContent=money(bank);
      status.textContent='📅 '+selected+' • '+list.length+' đơn trong ngày • Doanh thu tính theo đơn Hoàn thành';
      rows.innerHTML=list.length?list.map(o=>'<div class="rev-row"><div class="rev-row-top"><span class="rev-code">'+esc(o.code||o.id)+'</span><span class="rev-total">'+money(o.total)+'</span></div><div>'+esc(o.name||'')+' • '+esc(o.phone||'')+'</div><div class="rev-muted">'+esc(o.shipper_name||'Chưa có shipper')+' • '+esc(o.status||'')+' • '+esc(o.payment==='bank'?'Chuyển khoản':'Tiền mặt')+'</div></div>').join(''):'<div class="empty">📭 Không có đơn phù hợp.</div>';
    }catch(e){console.error('ADMIN REVENUE',e);status.textContent='❌ '+e.message;rows.innerHTML='';}
  }
  function start(){inject();load();setInterval(load,30000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();