/* CHOCO SHIP - CUSTOMER TRACKING TIMELINE */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_TRACKING_TIMELINE__) return;
  window.__CHOCO_CUSTOMER_TRACKING_TIMELINE__=true;
  const steps=['Chờ xác nhận','Đã nhận','Đang lấy hàng','Đang giao','Đã giao','Hoàn thành'];
  function esc(x){return String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]) )}
  function inject(){
    if(document.getElementById('customerOrderTimeline')) return;
    const box=document.createElement('section');box.id='customerOrderTimeline';
    box.style.cssText='background:#fff;border-radius:15px;padding:14px;margin:12px 0;box-shadow:0 2px 8px #ddd';
    box.innerHTML='<div style="font-size:19px;font-weight:800">📦 Trạng thái đơn hàng</div><div id="cotCode" style="font-size:13px;color:#666;margin-top:5px">Chưa có đơn đang theo dõi.</div><div id="cotSteps" style="margin-top:12px"></div>';
    const c=document.querySelector('.container');if(c)c.insertBefore(box,c.firstChild);
  }
  function render(status,code){
    const out=document.getElementById('cotSteps'),label=document.getElementById('cotCode');if(!out)return;
    const idx=steps.indexOf(String(status||''));
    label.innerHTML=code?'🧾 Đơn <b>'+esc(code)+'</b>':'Chưa có đơn đang theo dõi.';
    if(idx<0){out.innerHTML='<div style="padding:10px;border-radius:10px;background:#eff6ff">⏳ '+esc(status||'Đang xử lý')+'</div>';return}
    out.innerHTML=steps.map((s,i)=>'<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0"><div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:'+(i<=idx?'#16a34a':'#e5e7eb')+';color:'+(i<=idx?'#fff':'#666')+';font-weight:900">'+(i<idx?'✓':i===idx?'●':'○')+'</div><div style="padding-top:4px;font-weight:'+(i===idx?'800':'600')+';color:'+(i<=idx?'#166534':'#777')+'">'+esc(s)+(i===idx?' <span style="font-size:12px">• HIỆN TẠI</span>':'')+'</div></div>').join('');
  }
  function sync(){
    inject();
    let o=null;try{o=JSON.parse(localStorage.getItem('choco_ship_last_order')||'null')}catch{}
    render(o?.status||'',o?.code||'');
  }
  window.addEventListener('storage',sync);document.addEventListener('DOMContentLoaded',sync);if(document.readyState!=='loading')sync();
})();