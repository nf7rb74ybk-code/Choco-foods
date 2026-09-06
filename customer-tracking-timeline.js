/* CHOCO SHIP - CUSTOMER LIVE ORDER TRACKING v2
 * Reads the customer's latest order from Supabase and refreshes status.
 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_TRACKING_V2__) return;
  window.__CHOCO_CUSTOMER_TRACKING_V2__=true;
  const U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const steps=['Chờ xác nhận','Đã nhận','Đang lấy hàng','Đang giao','Đã giao','Hoàn thành'];
  let timer=null,loading=false;
  function esc(x){return String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
  function headers(){const t=localStorage.getItem('choco_access_token')||K;return{apikey:K,Authorization:'Bearer '+t,Accept:'application/json'}}
  function inject(){
    if(document.getElementById('customerOrderTimeline')) return;
    const box=document.createElement('section');box.id='customerOrderTimeline';
    box.style.cssText='background:#fff;border-radius:15px;padding:14px;margin:12px 0;box-shadow:0 2px 8px #ddd';
    box.innerHTML='<div style="font-size:19px;font-weight:800">📦 Đơn hàng</div><div id="cotCode" style="font-size:13px;color:#666;margin-top:5px">Chưa có đơn đang theo dõi.</div><div id="cotSteps" style="margin-top:12px"></div><div id="cotShipper" style="margin-top:10px"></div><div id="cotRefresh" style="font-size:11px;color:#888;margin-top:8px">Đang kết nối...</div>';
    const c=document.querySelector('.container');if(c)c.insertBefore(box,c.firstChild);
  }
  function render(o){
    const out=document.getElementById('cotSteps'),label=document.getElementById('cotCode'),ship=document.getElementById('cotShipper'),ref=document.getElementById('cotRefresh');if(!out)return;
    const status=String(o?.status||''),idx=steps.indexOf(status),code=o?.code||'';
    label.innerHTML=code?'🧾 Đơn <b>'+esc(code)+'</b>':'Chưa có đơn đang theo dõi.';
    if(!code){out.innerHTML='';ship.innerHTML='';if(ref)ref.textContent='Chưa có đơn';return}
    if(idx<0)out.innerHTML='<div style="padding:10px;border-radius:10px;background:#eff6ff">⏳ '+esc(status||'Đang xử lý')+'</div>';
    else out.innerHTML=steps.map((s,i)=>'<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0"><div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:'+(i<=idx?'#16a34a':'#e5e7eb')+';color:'+(i<=idx?'#fff':'#666')+';font-weight:900">'+(i<idx?'✓':i===idx?'●':'○')+'</div><div style="padding-top:4px;font-weight:'+(i===idx?'800':'600')+';color:'+(i<=idx?'#166534':'#777')+'">'+esc(s)+(i===idx?' <span style="font-size:12px">• HIỆN TẠI</span>':'')+'</div></div>').join('');
    const sn=String(o.shipper_name||'').trim(),sp=String(o.shipper_phone||'').trim();
    ship.innerHTML=(sn||sp)?'<div style="background:#f0fdf4;border-radius:10px;padding:10px">🛵 <b>Shipper</b>'+(sn?' — '+esc(sn):'')+(sp?' · '+esc(sp):'')+'</div>':'';
    if(ref)ref.textContent='🔄 Cập nhật lúc '+new Date().toLocaleTimeString('vi-VN');
  }
  function localOrder(){try{return JSON.parse(localStorage.getItem('choco_ship_last_order')||'null')}catch{return null}}
  async function sync(){
    if(loading)return;loading=true;inject();
    const local=localOrder();
    if(!local?.order_id){render(null);loading=false;return}
    try{
      const r=await fetch(U+'/rest/v1/orders?select=id,code,status,shipper_id,shipper_name,shipper_phone,created_at&id=eq.'+encodeURIComponent(local.order_id),{headers:headers()});
      if(r.status===401||r.status===403)throw Error('AUTH');
      const rows=await r.json();const o=Array.isArray(rows)?rows[0]:null;
      if(o){
        localStorage.setItem('choco_ship_last_order',JSON.stringify({...local,...o,order_id:o.id}));
        render({...local,...o});
      }else render(local);
    }catch(e){render(local);const ref=document.getElementById('cotRefresh');if(ref)ref.textContent='⚠️ Chưa đồng bộ máy chủ — đang thử lại';}
    finally{loading=false}
  }
  function boot(){inject();sync();if(timer)clearInterval(timer);timer=setInterval(sync,5000)}
  window.addEventListener('storage',sync);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
