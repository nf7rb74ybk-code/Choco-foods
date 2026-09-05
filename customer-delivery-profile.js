/* CHOCO SHIP — Customer delivery profile UX v1 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_DELIVERY_PROFILE__)return;
  window.__CHOCO_CUSTOMER_DELIVERY_PROFILE__=true;
  const KEY='choco_customer_delivery_profile_v1';
  const U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
  const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const token=()=>String(localStorage.getItem('choco_access_token')||'').trim();
  async function profile(){
    const t=token(); if(!t)return null;
    const uid=String(localStorage.getItem('choco_user_id')||'').trim(); if(!uid)return null;
    try{const r=await fetch(U+'/rest/v1/profiles?id=eq.'+encodeURIComponent(uid)+'&select=full_name,phone',{headers:{apikey:K,Authorization:'Bearer '+t,Accept:'application/json'}});if(!r.ok)return null;return (await r.json())?.[0]||null}catch{return null}
  }
  function fill(){
    const p=get(),n=document.getElementById('name'),ph=document.getElementById('phone'),a=document.getElementById('address');
    if(n&&!n.value&&p.name)n.value=p.name;
    if(ph&&!ph.value&&p.phone)ph.value=p.phone;
    if(a&&!a.value&&p.address)a.value=p.address;
    if(p.lat!=null&&p.lng!=null&&window.currentGPS&&window.currentGPS.lat==null){window.currentGPS.lat=Number(p.lat);window.currentGPS.lng=Number(p.lng);if(typeof window.updateShippingDisplay==='function')window.updateShippingDisplay();const t=document.getElementById('locationText');if(t)t.innerHTML='📍 <b>Vị trí giao hàng đã lưu:</b><br>'+Number(p.lat).toFixed(6)+', '+Number(p.lng).toFixed(6)}
  }
  async function syncAccount(){const x=await profile();if(!x)return;const p=get();save({...p,name:String(x.full_name||p.name||''),phone:String(x.phone||p.phone||'')});fill()}
  function persist(){const n=document.getElementById('name'),ph=document.getElementById('phone'),a=document.getElementById('address');const g=window.currentGPS||{};save({name:String(n?.value||'').trim(),phone:String(ph?.value||'').trim(),address:String(a?.value||'').trim(),lat:Number.isFinite(Number(g.lat))?Number(g.lat):null,lng:Number.isFinite(Number(g.lng))?Number(g.lng):null,updated_at:new Date().toISOString()})}
  function ui(){
    const form=document.querySelector('.form');if(!form||document.getElementById('deliveryProfileActions'))return;
    const box=document.createElement('div');box.id='deliveryProfileActions';box.style.cssText='background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px;margin-bottom:10px;font-size:13px';
    box.innerHTML='<b>⚡ Đặt nhanh</b><div style="margin-top:4px;color:#666">Thông tin giao hàng được lưu trên thiết bị để lần sau không cần nhập lại.</div><button type="button" id="clearDeliveryProfile" style="margin-top:8px;border:0;background:#fff;color:#c2410c;padding:7px 10px;border-radius:8px;font-weight:700">🗑️ Xóa thông tin đã lưu</button>';
    form.insertBefore(box,form.firstChild);
    document.getElementById('clearDeliveryProfile').onclick=()=>{localStorage.removeItem(KEY);['name','phone','address'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});if(window.currentGPS){window.currentGPS.lat=null;window.currentGPS.lng=null}if(typeof window.updateShippingDisplay==='function')window.updateShippingDisplay();alert('✅ Đã xóa thông tin giao hàng đã lưu.')};
  }
  function boot(){ui();fill();syncAccount();['name','phone','address'].forEach(id=>document.getElementById(id)?.addEventListener('change',persist));document.getElementById('address')?.addEventListener('blur',persist)}
  const mo=new MutationObserver(()=>{if(document.getElementById('modal')){ui();fill()}});mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',boot);window.addEventListener('beforeunload',persist);if(document.readyState!=='loading')boot();
})();
