'use strict';
(function(){
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=localStorage.getItem('choco_access_token')||'';
  const UID=localStorage.getItem('choco_user_id')||'';
  const ROLE=localStorage.getItem('choco_role')||'';
  if(!TOKEN||!UID||ROLE!=='admin')return;
  const $=id=>document.getElementById(id);
  function dbg(t){const el=$('adminPushDebug');if(el)el.innerHTML=t}
  function b64(s){const p='='.repeat((4-s.length%4)%4);const r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0))}
  function endpointId(endpoint){let h=0;for(let i=0;i<endpoint.length;i++)h=((h<<5)-h+endpoint.charCodeAt(i))|0;return 'wp_admin_'+Math.abs(h).toString(36)+'_'+endpoint.length}
  async function getVapid(){const r=await fetch(SB+'/functions/v1/send-push?mode=public',{headers:{apikey:KEY,Accept:'application/json'}});const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}if(!r.ok||!j.vapid_public_key)throw Error('Không lấy được VAPID Public Key');return j.vapid_public_key.trim()}
  async function enable(){const btn=$('adminPush');if(btn)btn.disabled=true;try{
    if(!('serviceWorker'in navigator)||!('PushManager'in window))throw Error('Thiết bị không hỗ trợ Web Push');
    if(location.protocol!=='https:')throw Error('Web Push cần HTTPS');
    if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!(navigator.standalone===true||matchMedia('(display-mode:standalone)').matches))throw Error('iPhone cần mở CHOCO SHIP từ Màn hình chính (PWA)');
    dbg('⏳ Đang lấy VAPID...');
    const key=b64(await getVapid());
    if(key.length!==65||key[0]!==4)throw Error('VAPID Public Key không hợp lệ');
    const reg=await navigator.serviceWorker.register('./push-sw.js?v=20260827-3',{scope:'./'});
    await navigator.serviceWorker.ready;
    let permission=Notification.permission;if(permission!=='granted')permission=await Notification.requestPermission();
    if(permission!=='granted')throw Error('Bạn chưa cho phép thông báo');
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
    const j=sub.toJSON(),sid=endpointId(sub.endpoint);
    dbg('⏳ Đang đăng ký Admin...<br>Subscription: '+sid);
    const r=await fetch(SB+'/functions/v1/register-push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:UID,role:'admin',subscription_id:sid,subscription:{endpoint:sub.endpoint,keys:j.keys}})});
    const text=await r.text();let body={};try{body=JSON.parse(text)}catch{}if(!r.ok||body.ok===false)throw Error(body.error||body.message||text||('HTTP '+r.status));
    $('adminPushStatus').innerHTML='✅ <b>THÔNG BÁO ADMIN ĐÃ BẬT</b>';
    dbg('Web Push native: ACTIVE<br>Permission: YES<br>Subscription: '+sid);
    localStorage.setItem('choco_admin_push_enabled','1');
  }catch(e){$('adminPushStatus').textContent='❌ '+e.message;dbg('❌ '+e.message);if(btn)btn.disabled=false}}
  function init(){
    const box=document.createElement('div');box.className='admin-box';box.style.border='1px solid #bfdbfe';box.innerHTML='<div style="font-size:18px;font-weight:bold;color:#1d4ed8">🔔 THÔNG BÁO ADMIN</div><div id="adminPushStatus" style="margin:7px 0;color:#555">Chưa bật thông báo</div><button id="adminPush" style="width:100%;padding:13px;border:0;border-radius:10px;background:#1677ff;color:#fff;font-weight:bold;font-size:16px">🔔 BẬT THÔNG BÁO ADMIN</button><div id="adminPushDebug" style="margin-top:9px;background:#f3f4f6;padding:9px;border-radius:9px;font-size:12px;word-break:break-word">Web Push native • Tách riêng khỏi logic Push của Shipper</div>';
    const container=document.querySelector('.container');if(container)container.insertBefore(box,container.children[2]||null);
    $('adminPush').onclick=enable;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
