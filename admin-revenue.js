/* CHOCO SHIP - Admin Revenue & Order History + Analytics */
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
  const localDate=v=>{const d=new Date(v);return new Date(d.toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh'}));};
  const day=v=>{const d=v?new Date(v):new Date();return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'});};
  const startOfDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
  function inject(){
    if(document.getElementById('chocoRevenuePanel')) return;
    const style=document.createElement('style');
    style.textContent='.rev-panel{background:#fff;border-radius:15px;padding:15px;margin:0 0 15px;box-shadow:0 2px 8px #ddd;border:1px solid #e5e7eb}.rev-title{font-size:18px;font-weight:bold;margin-bottom:10px}.rev-sub{font-size:13px;font-weight:bold;margin:14px 0 8px}.rev-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.rev-stat{background:#f8fafc;border-radius:11px;padding:11px;text-align:center;font-size:12px}.rev-stat b{display:block;font-size:18px;margin-top:4px}.rev-tools{display:flex;gap:7px;margin:10px 0;flex-wrap:wrap}.rev-tools input{flex:1;min-width:130px;padding:10px;border:1px solid #ddd;border-radius:9px}.rev-table{overflow:auto}.rev-row{border-top:1px solid #eee;padding:10px 0;font-size:13px}.rev-row-top{display:flex;justify-content:space-between;gap:8px}.rev-code{font-weight:bold;color:#ea580c}.rev-total{font-weight:bold;color:#166534}.rev-muted{color:#64748b;font-size:12px}.rev-refresh{border:0;background:#ff6b00;color:#fff;padding:9px 12px;border-radius:9px;font-weight:bold}.rev-shipper{display:grid;grid-template-columns:1fr auto auto;gap:8px;border-top:1px solid #eee;padding:9px 0;font-size:13px}.rev-pill{padding:3px 7px;border-radius:999px;background:#f1f5f9;font-size:11px}';
    document.head.appendChild(style);
    const panel=document.createElement('div');panel.id='chocoRevenuePanel';panel.className='rev-panel';
    panel.innerHTML='<div class="rev-title">📊 DOANH THU & LỊCH SỬ ĐƠN</div><div class="rev-grid"><div class="rev-stat">Doanh thu hôm nay<b id="revRevenue">0đ</b></div><div class="rev-stat">Tiền món<b id="revFood">0đ</b></div><div class="rev-stat">Phí ship<b id="revShip">0đ</b></div><div class="rev-stat">Đơn hoàn thành<b id="revOrders">0</b></div><div class="rev-stat">💵 Tiền mặt<b id="revCash">0đ</b></div><div class="rev-stat">🏦 Chuyển khoản<b id="revBank">0đ</b></div></div><div class="rev-sub">📈 7 NGÀY GẦN NHẤT</div><div class="rev-grid"><div class="rev-stat">Doanh thu 7 ngày<b id="revWeekRevenue">0đ</b></div><div class="rev-stat">Đơn hoàn thành<b id="revWeekOrders">0</b></div></div><div id="revWeekRows" class="rev-table"></div><div class="rev-sub">📆 THÁNG HIỆN TẠI</div><div class="rev-grid"><div class="rev-stat">Doanh thu tháng<b id="revMonthRevenue">0đ</b></div><div class="rev-stat">Đơn hoàn thành<b id="revMonthOrders">0</b></div></div><div id="revMonthRows" class="rev-table"></div><div class="rev-sub">🏆 DOANH THU THEO SHIPPER</div><div id="revShipperRows" class="rev-table"></div><div class="rev-tools"><input id="revDate" type="date"><input id="revSearch" placeholder="🔎 Mã đơn / khách / shipper"><button class="rev-refresh" id="revRefresh">🔄</button></div><div id="revStatus" class="rev-muted">Đang tải...</div><div id="revRows" class="rev-table"></div>';
    const orders=document.getElementById('orders');
    if(orders&&orders.parentElement) orders.parentElement.insertBefore(panel,orders); else document.querySelector('.container')?.appendChild(panel);
    document.getElementById('revDate').value=day();
    document.getElementById('revDate').onchange=load;
    document.getElementById('revSearch').oninput=load;
    document.getElementById('revRefresh').onclick=load;
  }
  let cache=[];
  function completed(o){return String(o.status||'').trim().toLowerCase()==='hoàn thành';}
  function sum(a,key='total'){return a.reduce((s,o)=>s+Number(o[key]||0),0);}
  function rangeForDays(days){const today=startOfDay(localDate(new Date()));const from=new Date(today);from.setDate(from.getDate()-days+1);return {from,to:new Date(today.getTime()+86400000)};}
  function inRange(o,r){const d=localDate(o.created_at||o.time);return d>=r.from&&d<r.to;}
  function renderPeriodRows(targetId,arr){
    const box=document.getElementById(targetId);if(!box)return;
    const map={};
    arr.forEach(o=>{if(!completed(o))return;const k=day(o.created_at||o.time);if(!map[k])map[k]=[];map[k].push(o)});
    const keys=Object.keys(map).sort().reverse();
    box.innerHTML=keys.length?keys.map(k=>'<div class="rev-row"><div class="rev-row-top"><span>'+k+'</span><strong class="rev-total">'+money(sum(map[k]))+'</strong></div><div class="rev-muted">'+map[k].length+' đơn hoàn thành • Phí ship '+money(sum(map[k],'shipping_fee'))+'</div></div>').join(''):'<div class="rev-muted">Chưa có dữ liệu.</div>';
  }
  function renderShippers(arr){
    const box=document.getElementById('revShipperRows');if(!box)return;
    const m={};
    arr.filter(completed).forEach(o=>{const key=o.shipper_id||o.shipper_name||'Chưa có shipper';if(!m[key])m[key]={name:o.shipper_name||'Chưa có shipper',orders:0,revenue:0,ship:0};m[key].orders++;m[key].revenue+=Number(o.total||0);m[key].ship+=Number(o.shipping_fee||0)});
    const list=Object.values(m).sort((a,b)=>b.revenue-a.revenue);
    box.innerHTML=list.length?list.map((x,i)=>'<div class="rev-shipper"><span><b>#'+(i+1)+' '+esc(x.name)+'</b><br><span class="rev-muted">'+x.orders+' đơn • Phí ship '+money(x.ship)+'</span></span><strong class="rev-total">'+money(x.revenue)+'</strong><span class="rev-pill">'+x.orders+' đơn</span></div>').join(''):'<div class="rev-muted">Chưa có đơn hoàn thành theo shipper.</div>';
  }
  async function load(){
    const status=document.getElementById('revStatus'),rows=document.getElementById('revRows');if(!status||!rows)return;
    try{
      const r=await api('/rest/v1/orders?select=id,code,name,phone,status,total,food_total,shipping_fee,payment,shipper_id,shipper_name,created_at,time&order=created_at.desc&limit=1000');
      if(!r.ok) throw Error('Supabase HTTP '+r.status+': '+await r.text());
      cache=await r.json();
      const selected=document.getElementById('revDate').value||day();
      const q=(document.getElementById('revSearch').value||'').trim().toLowerCase();
      let list=cache.filter(o=>day(o.created_at||o.time)===selected);
      if(q)list=list.filter(o=>[o.code,o.name,o.phone,o.shipper_name,o.status].some(v=>String(v??'').toLowerCase().includes(q)));
      const done=list.filter(completed);
      document.getElementById('revRevenue').textContent=money(sum(done));document.getElementById('revFood').textContent=money(sum(done,'food_total'));document.getElementById('revShip').textContent=money(sum(done,'shipping_fee'));document.getElementById('revOrders').textContent=done.length;document.getElementById('revCash').textContent=money(sum(done.filter(o=>o.payment!=='bank')));document.getElementById('revBank').textContent=money(sum(done.filter(o=>o.payment==='bank')));
      const week=rangeForDays(7),weekDone=cache.filter(o=>inRange(o,week)&&completed(o));document.getElementById('revWeekRevenue').textContent=money(sum(weekDone));document.getElementById('revWeekOrders').textContent=weekDone.length;renderPeriodRows('revWeekRows',weekDone);
      const now=localDate(new Date()),monthFrom=new Date(now.getFullYear(),now.getMonth(),1),monthTo=new Date(now.getFullYear(),now.getMonth()+1,1),monthDone=cache.filter(o=>{const d=localDate(o.created_at||o.time);return d>=monthFrom&&d<monthTo&&completed(o)});document.getElementById('revMonthRevenue').textContent=money(sum(monthDone));document.getElementById('revMonthOrders').textContent=monthDone.length;renderPeriodRows('revMonthRows',monthDone);renderShippers(monthDone);
      status.textContent='📅 '+selected+' • '+list.length+' đơn trong ngày • Doanh thu chỉ tính đơn Hoàn thành';
      rows.innerHTML=list.length?list.map(o=>'<div class="rev-row"><div class="rev-row-top"><span class="rev-code">'+esc(o.code||o.id)+'</span><span class="rev-total">'+money(o.total)+'</span></div><div>'+esc(o.name||'')+' • '+esc(o.phone||'')+'</div><div class="rev-muted">'+esc(o.shipper_name||'Chưa có shipper')+' • '+esc(o.status||'')+' • '+esc(o.payment==='bank'?'Chuyển khoản':'Tiền mặt')+'</div></div>').join(''):'<div class="empty">📭 Không có đơn phù hợp.</div>';
    }catch(e){console.error('ADMIN REVENUE',e);status.textContent='❌ '+e.message;rows.innerHTML='';}
  }
  function start(){inject();load();setInterval(load,30000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();