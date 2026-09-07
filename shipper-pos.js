/* CHOCO SHIP — Shipper order controls + navigation + new-order alert v4 */
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
  const num=x=>{const n=Number(x);return Number.isFinite(n)?n:null};
  function hav(a,b,c,d){const R=6371,rad=Math.PI/180,x=(c-a)*rad,y=(d-b)*rad;const q=Math.sin(x/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
  function destination(order){
    const lat=num(order?.dropoff_latitude??order?.delivery_latitude??order?.latitude??order?.lat);
    const lng=num(order?.dropoff_longitude??order?.delivery_longitude??order?.longitude??order?.lng);
    return lat!==null&&lng!==null&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null;
  }
  function routeUrl(o){const d=destination(o);if(!d)return '';return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(d.lat+','+d.lng)}

  // New-order sound + visible alert. Sound is unlocked by the button/user interaction.
  let audioCtx=null;
  let soundEnabled=localStorage.getItem('choco_ship_sound_v1')==='1';
  let alertTimer=null;
  let knownAssigned=null;
  function ensureAlertUI(){
    if(document.getElementById('chocoNewOrderAlert'))return;
    const box=document.createElement('div');box.id='chocoNewOrderAlert';box.style.cssText='position:fixed;top:12px;left:12px;right:12px;z-index:99999;background:#16a34a;color:#fff;border-radius:16px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.22);display:none;font-weight:900;text-align:center';
    box.innerHTML='<div style="font-size:18px">🔔 CÓ ĐƠN MỚI!</div><div id="chocoNewOrderText" style="font-size:13px;margin-top:4px"></div><button id="chocoNewOrderClose" style="margin-top:9px;border:0;border-radius:9px;padding:8px 14px;background:#fff;color:#166534;font-weight:900">XEM ĐƠN</button>';
    document.body.appendChild(box);
    document.getElementById('chocoNewOrderClose').onclick=()=>{box.style.display='none';if(alertTimer)clearTimeout(alertTimer);document.getElementById('orders')?.scrollIntoView({behavior:'smooth',block:'start'})};
  }
  function unlockSound(){
    try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();soundEnabled=true;localStorage.setItem('choco_ship_sound_v1','1');updateSoundButton();beep(880,.08)}catch(e){soundEnabled=false}
  }
  function beep(freq=880,duration=.16){
    if(!soundEnabled)return;
    try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.22,audioCtx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration+.03)}catch(e){}
  }
  function newOrderSound(){beep(880,.13);setTimeout(()=>beep(1175,.16),170);setTimeout(()=>beep(1568,.2),370)}
  function updateSoundButton(){const b=document.getElementById('chocoSoundButton');if(b)b.textContent=soundEnabled?'🔊 ÂM THANH: BẬT':'🔇 BẬT ÂM THANH'}
  function ensureSoundButton(){
    if(document.getElementById('chocoSoundButton'))return;
    const b=document.createElement('button');b.id='chocoSoundButton';b.type='button';b.style.cssText='position:fixed;bottom:14px;right:14px;z-index:9998;border:0;border-radius:999px;padding:10px 14px;background:#fff;color:#0f172a;box-shadow:0 4px 16px rgba(0,0,0,.18);font-weight:900;font-size:12px';b.onclick=unlockSound;document.body.appendChild(b);updateSoundButton();
    if(soundEnabled){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}
  }
  function showNewOrderAlert(order){
    ensureAlertUI();const box=document.getElementById('chocoNewOrderAlert'),txt=document.getElementById('chocoNewOrderText');if(!box)return;
    txt.textContent=(order.code?'Đơn '+order.code:'Có đơn mới')+(order.address?' • '+order.address:'');box.style.display='block';newOrderSound();
    if(alertTimer)clearTimeout(alertTimer);alertTimer=setTimeout(()=>box.style.display='none',12000);
    if(navigator.vibrate)try{navigator.vibrate([180,80,180])}catch(e){}
  }
  function detectNewAssigned(data){
    const assigned=data.filter(o=>String(o.shipper_id||'')===UID&&o.status==='Đã nhận');
    const ids=assigned.map(o=>String(o.id)).sort().join(',');
    if(knownAssigned===null){knownAssigned=ids;return}
    const old=new Set(knownAssigned?knownAssigned.split(','):[]);
    const fresh=assigned.filter(o=>!old.has(String(o.id)));
    knownAssigned=ids;
    if(fresh.length)showNewOrderAlert(fresh[0]);
  }

  function findStatus(text){const s=String(text||'');for(const key of Object.keys(FLOW))if(s.includes(key))return key;if(s.includes('Hoàn thành'))return 'Hoàn thành';if(s.includes('Chờ xác nhận'))return 'Chờ xác nhận';return ''}
  async function getOwnOrders(){try{const u=SB+'/rest/v1/orders?select=id,code,status,shipper_id,address,latitude,longitude&shipper_id=eq.'+encodeURIComponent(UID)+'&order=created_at.desc';const r=await fetch(u,{headers});if(!r.ok)return [];const d=await r.json();return Array.isArray(d)?d:[]}catch{return []}}
  async function updateStatus(id,current,next,wrap){const cfg=FLOW[current];if(!id||!cfg||cfg.next!==next)return;wrap?.querySelectorAll('button[data-action="status"]').forEach(b=>{b.disabled=true;b.textContent='⏳ ĐANG CẬP NHẬT...'});try{const qs='/rest/v1/orders?id=eq.'+encodeURIComponent(id)+'&shipper_id=eq.'+encodeURIComponent(UID)+'&status=eq.'+encodeURIComponent(current);const r=await fetch(SB+qs,{method:'PATCH',headers,body:JSON.stringify({status:next})});if(!r.ok)throw Error((await r.text())||('HTTP '+r.status));if(typeof window.loadOrders==='function')await window.loadOrders();setTimeout(enhance,100);setTimeout(syncSnapshot,500)}catch(e){alert('❌ Không thể cập nhật trạng thái: '+(e?.message||e));wrap?.querySelectorAll('button[data-action="status"]').forEach(b=>{b.disabled=false;b.textContent=cfg.label})}}
  function enhance(){const root=document.getElementById('orders');if(!root)return;root.querySelectorAll('.order').forEach(card=>{const old=card.querySelector('[data-choco-control]');if(old)old.remove();const code=card.querySelector('b')?.textContent?.trim()||'';const order=(window.__CHOCO_LAST_ORDERS__||[]).find(o=>String(o.code||'')===code&&String(o.shipper_id||'')===UID);if(!order)return;const current=String(order.status||findStatus(card.textContent));const cfg=FLOW[current];const wrap=document.createElement('div');wrap.dataset.chocoControl='1';wrap.style.cssText='margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb';const d=destination(order),blocks=[];if(d&&window.__CHOCO_SHIPPER_COORDS__){const c=window.__CHOCO_SHIPPER_COORDS__,km=hav(c.lat,c.lng,d.lat,d.lng),mins=Math.max(1,Math.round(km/0.45));blocks.push('<div style="font-size:12px;color:#475569;margin-bottom:7px">📍 Cách điểm giao <b>'+km.toFixed(1)+' km</b> • ETA khoảng <b>'+mins+' phút</b></div>')}else if(d)blocks.push('<div style="font-size:12px;color:#475569;margin-bottom:7px">📍 Điểm giao: '+d.lat.toFixed(6)+', '+d.lng.toFixed(6)+'</div>');if(d)blocks.push('<button data-action="route" style="width:100%;padding:11px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;font-size:14px;margin-bottom:7px">🗺️ MỞ ĐƯỜNG ĐẾN KHÁCH</button>');if(cfg){blocks.push('<div style="font-size:12px;color:#64748b;margin-bottom:6px">🔄 Trạng thái tiếp theo: <b>'+esc(cfg.next)+'</b></div>');blocks.push('<button data-action="status" style="width:100%;padding:13px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-weight:900;font-size:15px">'+cfg.label+'</button>')}if(!blocks.length)return;wrap.innerHTML=blocks.join('');const rb=wrap.querySelector('[data-action="route"]');if(rb)rb.onclick=()=>{const u=routeUrl(order);if(u)window.open(u,'_blank','noopener')};const sb=wrap.querySelector('[data-action="status"]');if(sb)sb.onclick=()=>updateStatus(String(order.id),current,cfg.next,wrap);card.appendChild(wrap)})}
  async function syncSnapshot(){const data=await getOwnOrders();window.__CHOCO_LAST_ORDERS__=data;detectNewAssigned(data);enhance()}
  window.__CHOCO_SHIPPER_COORDS__=null;if(navigator.geolocation)navigator.geolocation.watchPosition(p=>{window.__CHOCO_SHIPPER_COORDS__={lat:Number(p.coords.latitude),lng:Number(p.coords.longitude)};enhance()},()=>{},{enableHighAccuracy:true,maximumAge:30000,timeout:15000});
  const ordersEl=document.getElementById('orders');if(ordersEl)new MutationObserver(()=>setTimeout(enhance,0)).observe(ordersEl,{childList:true,subtree:true});
  ensureAlertUI();ensureSoundButton();syncSnapshot();setInterval(syncSnapshot,5000);window.addEventListener('pageshow',()=>setTimeout(syncSnapshot,100));
})();