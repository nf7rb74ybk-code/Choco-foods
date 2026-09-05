/* CHOCO SHIP — CUSTOMER TRACKING UX 14.5 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_TRACKING_UX__) return;
  window.__CHOCO_CUSTOMER_TRACKING_UX__=true;
  const esc=x=>String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  function inject(){
    const box=document.getElementById('customerTrackingBox');
    if(!box||document.getElementById('customerTrackingSummary'))return;
    const el=document.createElement('div');
    el.id='customerTrackingSummary';
    el.style.cssText='margin-top:10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px;line-height:1.5';
    el.innerHTML='<div style="font-weight:900;font-size:16px">📍 Thông tin giao hàng trực tiếp</div><div id="ctuxGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div style="background:#fff;padding:10px;border-radius:10px"><div style="font-size:12px;color:#666">⏱️ Dự kiến</div><b id="ctuxEta">Đang cập nhật…</b></div><div style="background:#fff;padding:10px;border-radius:10px"><div style="font-size:12px;color:#666">📏 Còn lại</div><b id="ctuxDistance">Đang cập nhật…</b></div><div style="background:#fff;padding:10px;border-radius:10px"><div style="font-size:12px;color:#666">📡 Tín hiệu GPS</div><b id="ctuxSignal">Đang cập nhật…</b></div><div style="background:#fff;padding:10px;border-radius:10px"><div style="font-size:12px;color:#666">🕐 Cập nhật cuối</div><b id="ctuxUpdated">Đang cập nhật…</b></div></div><div id="ctuxWarning" style="display:none;margin-top:9px;padding:9px;border-radius:9px;background:#fff1f2;color:#9f1239;font-size:13px"></div><button id="ctuxMapBtn" style="width:100%;border:0;border-radius:10px;padding:11px;margin-top:10px;background:#1677ff;color:#fff;font-weight:800">🗺️ XEM BẢN ĐỒ SHIPPER</button>';
    box.insertBefore(el,document.getElementById('customerTrackingMap'));
    document.getElementById('ctuxMapBtn').onclick=()=>document.getElementById('customerTrackingMap')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function parse(){
    inject();
    const st=document.getElementById('customerTrackingStatus');
    if(!st)return;
    const text=(st.innerText||'').replace(/\s+/g,' ').trim();
    const eta=text.match(/ETA khoảng\s+([0-9]+\s+phút)/i)?.[1]||'';
    const distance=text.match(/Cách điểm giao:\s+([0-9.,]+\s*km)/i)?.[1]||text.match(/Tuyến thực tế:\s+([0-9.,]+\s*km)/i)?.[1]||'';
    const updated=text.match(/GPS cập nhật:\s+([0-9:]+)/i)?.[1]||'';
    const signal=/Đang Online/i.test(text)?'🟢 Online':/Mất tín hiệu/i.test(text)?'🟠 Mất tín hiệu':'⏳ Chưa có GPS';
    const e=document.getElementById('ctuxEta'),d=document.getElementById('ctuxDistance'),s=document.getElementById('ctuxSignal'),u=document.getElementById('ctuxUpdated'),w=document.getElementById('ctuxWarning');
    if(e)e.textContent=eta||(/Đã giao|Hoàn thành/i.test(text)?'Đã hoàn tất':'Đang tính…');
    if(d)d.textContent=distance||(/chờ Shipper/i.test(text)?'Chưa có Shipper':'Đang cập nhật…');
    if(s)s.textContent=signal;
    if(u)u.textContent=updated||'Chưa có dữ liệu';
    if(w){
      const stale=/Mất tín hiệu/i.test(text);
      w.style.display=stale?'block':'none';
      w.textContent=stale?'⚠️ GPS Shipper đang mất tín hiệu hoặc chưa cập nhật gần đây. Vị trí có thể chưa chính xác.':'';
    }
  }
  function start(){inject();parse();const st=document.getElementById('customerTrackingStatus');if(st)new MutationObserver(()=>parse()).observe(st,{childList:true,subtree:true,characterData:true});setInterval(parse,5000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,350));else setTimeout(start,350);
})();