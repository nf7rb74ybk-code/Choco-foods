/* CHOCO SHIP — Customer order detail UX v1 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_ORDER_DETAIL__)return;
  window.__CHOCO_CUSTOMER_ORDER_DETAIL__=true;
  const U='https://guwdswqaqnhzqapflvey.supabase.co';
  const K='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const $=id=>document.getElementById(id);
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const headers=()=>({apikey:K,Authorization:'Bearer '+(localStorage.getItem('choco_access_token')||''),Accept:'application/json'});
  function inject(){
    if($('chocoOrderDetail'))return;
    const m=document.createElement('div');m.id='chocoOrderDetail';m.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:5000;align-items:flex-end';
    m.innerHTML='<div id="codPanel" style="background:#fff;width:100%;max-width:700px;margin:auto;border-radius:20px 20px 0 0;padding:20px;max-height:88vh;overflow:auto"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">🧾 Chi tiết đơn hàng</h2><button id="codClose" style="border:0;background:#eee;border-radius:50%;width:36px;height:36px;font-size:20px">×</button></div><div id="codBody" style="margin-top:14px">⏳ Đang tải...</div></div>';
    document.body.appendChild(m);$('codClose').onclick=close;$('chocoOrderDetail').onclick=e=>{if(e.target===m)close()};
  }
  function close(){const m=$('chocoOrderDetail');if(m)m.style.display='none'}
  function status(s){const x=String(s||'');let bg='#fef3c7',fg='#92400e';if(['Đã nhận','Đang lấy hàng','Đang giao','Đã giao'].includes(x)){bg='#dbeafe';fg='#1d4ed8'}if(x==='Hoàn thành'){bg='#dcfce7';fg='#166534'}if(x.includes('Hủy')){bg='#fee2e2';fg='#991b1b'}return '<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:'+bg+';color:'+fg+';font-weight:800;font-size:13px">'+esc(x||'Không rõ')+'</span>'}
  function itemRows(items){
    let a=[];try{a=Array.isArray(items)?items:(typeof items==='string'?JSON.parse(items):[])}catch{}
    if(!Array.isArray(a)||!a.length)return '<div style="color:#777">Không có dữ liệu món trong đơn.</div>';
    return a.map(x=>{const name=x?.name||x?.foodName||x?.food_name||('Món #'+(x?.foodId??x?.food_id??''));const qty=Number(x?.qty??x?.quantity??1);const price=Number(x?.price??x?.unit_price??0);return '<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #eee"><span>'+esc(name)+' × '+qty+'</span><b>'+money(price*qty)+'</b></div>'}).join('');
  }
  async function open(code){
    inject();const body=$('codBody');$('chocoOrderDetail').style.display='flex';body.innerHTML='⏳ Đang tải đơn <b>'+esc(code)+'</b>...';
    const uid=String(localStorage.getItem('choco_user_id')||'').trim(),token=String(localStorage.getItem('choco_access_token')||'').trim();
    if(!uid||!token){body.innerHTML='🔐 Vui lòng đăng nhập lại.';return}
    try{
      const q=U+'/rest/v1/orders?customer_id=eq.'+encodeURIComponent(uid)+'&code=eq.'+encodeURIComponent(code)+'&select=code,status,name,phone,address,note,payment,items,food_total,shipping_fee,total,created_at&limit=1';
      const r=await fetch(q,{headers:headers()});if(!r.ok)throw Error('HTTP '+r.status);const rows=await r.json();const o=rows[0];if(!o)throw Error('NOT_FOUND');
      body.innerHTML='<div style="line-height:1.6"><div style="font-size:20px;font-weight:900">📦 '+esc(o.code)+'</div><div style="margin:8px 0">'+status(o.status)+'</div><div style="color:#666;font-size:13px">'+(o.created_at?new Date(o.created_at).toLocaleString('vi-VN'):'')+'</div><div style="margin-top:14px"><b>🍽️ Món đã đặt</b>'+itemRows(o.items)+'</div><div style="margin-top:14px;line-height:1.8"><div>👤 '+esc(o.name)+'</div><div>📞 '+esc(o.phone)+'</div><div>📍 '+esc(o.address)+'</div>'+(o.note?'<div>📝 '+esc(o.note)+'</div>':'')+'<div>💳 '+(o.payment==='bank'?'Chuyển khoản':'Tiền mặt')+'</div></div><div style="margin-top:14px;border-top:1px solid #ddd;padding-top:10px"><div style="display:flex;justify-content:space-between">Tiền món <b>'+money(o.food_total)+'</b></div><div style="display:flex;justify-content:space-between">Phí ship <b>'+money(o.shipping_fee)+'</b></div><div style="display:flex;justify-content:space-between;font-size:20px;margin-top:8px"><b>TỔNG</b><b>'+money(o.total)+'</b></div></div><button id="codTrack" style="width:100%;margin-top:15px;border:0;background:#1677ff;color:#fff;padding:13px;border-radius:10px;font-weight:800">📍 THEO DÕI ĐƠN</button></div>';
      $('codTrack').onclick=()=>{location.href='./customer.html?track='+encodeURIComponent(o.code)};
    }catch(e){console.error('CHOCO ORDER DETAIL',e);body.innerHTML='❌ Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này.'}
  }
  function boot(){inject();const p=new URLSearchParams(location.search),code=p.get('order');if(code)open(code)}
  window.__CHOCO_OPEN_ORDER_DETAIL__=open;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
