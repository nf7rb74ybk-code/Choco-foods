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
    const j=sub.toJSON();
    dbg('⏳ Đang đăng ký Admin...');
    const r=await fetch(SB+'/rest/v1/subscriptions',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+TOKEN,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({user_id:UID,endpoint:sub.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,updated_at:new Date().toISOString()})});
    if(!r.ok)throw Error('Supabase REST '+r.status+': '+await r.text());
    $('adminPushStatus').innerHTML='✅ <b>THÔNG BÁO ADMIN ĐÃ BẬT</b>';dbg('Web Push native: ACTIVE<br>Permission: YES');localStorage.setItem('choco_admin_push_enabled','1');if($('adminPushTest'))$('adminPushTest').disabled=false;
    await checkAdminStatusPush();
  }catch(e){$('adminPushStatus').textContent='❌ '+e.message;dbg('❌ '+e.message);if(btn)btn.disabled=false}}
  async function testPush(){const btn=$('adminPushTest');if(btn)btn.disabled=true;dbg('⏳ Đang gửi TEST tới Admin...');try{
    const r=await fetch(SB+'/functions/v1/send-push?mode=test_admin&user_id='+encodeURIComponent(UID),{headers:{apikey:KEY,Authorization:'Bearer '+TOKEN,Accept:'application/json'}});
    const text=await r.text();let j={};try{j=JSON.parse(text)}catch{}if(!r.ok||!j.ok)throw Error(j.error||text||('HTTP '+r.status));
    dbg('✅ Đã gửi TEST. Target: '+(j.target_count||0)+'<br>Kiểm tra thông báo trên iPhone.');$('adminPushStatus').innerHTML='✅ <b>TEST PUSH ĐÃ GỬI</b>';
  }catch(e){dbg('❌ TEST PUSH: '+e.message);$('adminPushStatus').innerHTML='❌ <b>TEST PUSH THẤT BẠI</b><br>'+e.message}finally{if(btn)btn.disabled=false}}
  async function checkAdminStatusPush(){
    if(!localStorage.getItem('choco_admin_push_enabled'))return;
    try{
      const r=await fetch(SB+'/functions/v1/send-push?mode=admin_status',{headers:{apikey:KEY,Authorization:'Bearer '+TOKEN,Accept:'application/json'}});
      const text=await r.text();let j={};try{j=JSON.parse(text)}catch{}
      if(!r.ok||!j.ok)throw Error(j.error||text||('HTTP '+r.status));
      if(j.processed>0){
        dbg('🔔 Đã gửi '+j.processed+' thông báo trạng thái cho Admin.');
        if($('adminPushStatus'))$('adminPushStatus').innerHTML='✅ <b>THÔNG BÁO ADMIN ĐANG HOẠT ĐỘNG</b><br>Đã gửi: '+j.processed;
      }
    }catch(e){console.error('ADMIN STATUS PUSH:',e);}
  }
  function init(){const box=document.createElement('div');box.className='admin-box';box.style.border='1px solid #bfdbfe';box.innerHTML='<div style="font-size:18px;font-weight:bold;color:#1d4ed8">🔔 THÔNG BÁO ADMIN</div><div id="adminPushStatus" style="margin:7px 0;color:#555">Chưa bật thông báo</div><button id="adminPush" style="width:100%;padding:13px;border:0;border-radius:10px;background:#1677ff;color:#fff;font-weight:bold;font-size:16px">🔔 BẬT THÔNG BÁO ADMIN</button><button id="adminPushTest" disabled style="width:100%;padding:13px;border:0;border-radius:10px;background:#16a34a;color:#fff;font-weight:bold;font-size:16px;margin-top:8px">🧪 TEST PUSH ADMIN</button><div id="adminPushDebug" style="margin-top:9px;background:#f3f4f6;padding:9px;border-radius:9px;font-size:12px;word-break:break-word">Web Push native • Tách riêng khỏi logic Push của Shipper</div>';const container=document.querySelector('.container');if(container)container.insertBefore(box,container.children[2]||null);$('adminPush').onclick=enable;$('adminPushTest').onclick=testPush;
    if(localStorage.getItem('choco_admin_push_enabled')==='1'){
      $('adminPushStatus').innerHTML='✅ <b>THÔNG BÁO ADMIN ĐÃ BẬT</b>';
      $('adminPushTest').disabled=false;
      checkAdminStatusPush();
      setInterval(checkAdminStatusPush,10000);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
