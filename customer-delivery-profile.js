/* CHOCO SHIP — Customer delivery profile UX v2 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_DELIVERY_PROFILE__)return;
  window.__CHOCO_CUSTOMER_DELIVERY_PROFILE__=true;
  const KEY='choco_customer_delivery_profile_v1';
  const U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const get=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return{}}};
  const save=x=>{try{localStorage.setItem(KEY,JSON.stringify({...x,updated_at:new Date().toISOString()}))}catch{}};
  const token=()=>String(localStorage.getItem('choco_access_token')||'').trim();
  async function profile(){const t=token(),uid=String(localStorage.getItem('choco_user_id')||'').trim();if(!t||!uid)return null;try{const r=await fetch(U+'/rest/v1/profiles?id=eq.'+encodeURIComponent(uid)+'&select=full_name,phone',{headers:{apikey:K,Authorization:'Bearer '+t,Accept:'application/json'}});if(!r.ok)return null;return(await r.json())?.[0]||null}catch{return null}}
  function gps(){const g=window.currentGPS||{};if(Number.isFinite(Number(g.lat))&&Number.isFinite(Number(g.lng)))return{lat:Number(g.lat),lng:Number(g.lng)};const s=String(document.getElementById('selectedGPS')?.textContent||'');const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);return m?{lat:Number(m[1]),lng:Number(m[2])}:{lat:null,lng:null}}
  function fill(){
    const p=get(),n=document.getElementById('name'),ph=document.getElementById('phone'),a=document.getElementById('address');
    if(n&&!n.value&&p.name)n.value=p.name;
    if(ph&&!ph.value&&p.phone)ph.value=p.phone;
    // Never overwrite a non-empty address. The customer's newest typed address wins.
    if(a&&!a.value&&p.address)a.value=p.address;
    const g=gps();
    if(g.lat!==null&&g.lng!==null){
      window.currentGPS=window.currentGPS||{};window.currentGPS.lat=g.lat;window.currentGPS.lng=g.lng;
      const t=document.getElementById('locationText');if(t)t.innerHTML='📍 <b>Vị trí giao hàng:</b><br>'+g.lat.toFixed(6)+', '+g.lng.toFixed(6);
      const ct=document.getElementById('cartGpsText');if(ct)ct.textContent='📍 GPS: '+g.lat.toFixed(6)+', '+g.lng.toFixed(6);
      if(typeof window.updateShippingDisplay==='function')window.updateShippingDisplay();
    }
  }
  async function syncAccount(){const x=await profile();if(!x)return;const p=get();save({...p,name:String(x.full_name||p.name||''),phone:String(x.phone||p.phone||'')});fill()}
  function persist(){
    const n=document.getElementById('name'),ph=document.getElementById('phone'),a=document.getElementById('address'),g=gps(),old=get();
    save({name:String(n?.value||old.name||'').trim(),phone:String(ph?.value||old.phone||'').trim(),address:String(a?.value||old.address||'').trim(),lat:g.lat,lng:g.lng});
  }
  function ui(){
    const form=document.querySelector('.form');if(!form||document.getElementById('deliveryProfileActions'))return;
    const box=document.createElement('div');box.id='deliveryProfileActions';box.style.cssText='background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px;margin-bottom:10px;font-size:13px';
    box.innerHTML='<b>⚡ Đặt nhanh</b><div style="margin-top:4px;color:#666">Thông tin giao hàng mới nhất được giữ đồng bộ khi bạn đổi GPS hoặc địa chỉ.</div><button type="button" id="clearDeliveryProfile" style="margin-top:8px;border:0;background:#fff;color:#c2410c;padding:7px 10px;border-radius:8px;font-weight:700">🗑️ Xóa thông tin đã lưu</button>';
    form.insertBefore(box,form.firstChild);
    document.getElementById('clearDeliveryProfile').onclick=()=>{localStorage.removeItem(KEY);['name','phone','address'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});if(window.currentGPS){window.currentGPS.lat=null;window.currentGPS.lng=null}if(typeof window.updateShippingDisplay==='function')window.updateShippingDisplay();alert('✅ Đã xóa thông tin giao hàng đã lưu.')};
  }
  function boot(){
    ui();fill();syncAccount();
    ['name','phone','address'].forEach(id=>{const e=document.getElementById(id);if(e){e.addEventListener('input',persist);e.addEventListener('change',persist);e.addEventListener('blur',persist)}});
    window.__CHOCO_PERSIST_DELIVERY__=persist;
    window.addEventListener('beforeunload',persist);
  }
  const mo=new MutationObserver(()=>{if(document.getElementById('modal')){ui();fill()}});mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',boot);if(document.readyState!=='loading')boot();
})();
