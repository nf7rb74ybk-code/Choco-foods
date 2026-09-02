// CHOCO SHIP V2 — Native Web Push (aligned with production flow)
(function(){
'use strict';
const SB=V2_SUPABASE_CONFIG.url,KEY=V2_SUPABASE_CONFIG.anonKey;
const PUBLIC=SB+'/functions/v1/admin-push-public';
const REGISTER=SB+'/functions/v1/register-push';
const DISPATCH_SHIPPER=SB+'/functions/v1/shipper-push-dispatch';
const DISPATCH_ADMIN=SB+'/functions/v1/admin-send-push';
const $=id=>document.getElementById(id);
function token(){return v2GetAccessToken()||''}
function uid(){return v2GetIdentity()?.user_id||''}
function authHeaders(){return {apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json','Content-Type':'application/json'}}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function b64(s){const p='='.repeat((4-s.length%4)%4);const r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0))}
function iosPwa(){return /iphone|ipad|ipod/i.test(navigator.userAgent)&&(navigator.standalone===true||matchMedia('(display-mode:standalone)').matches)}
function endpointId(endpoint){let h=0;for(let i=0;i<endpoint.length;i++)h=((h<<5)-h+endpoint.charCodeAt(i))|0;return 'wp_'+Math.abs(h).toString(36)+'_'+endpoint.length}
async function getVapidPublic(){const r=await fetch(PUBLIC,{headers:{apikey:KEY,Accept:'application/json'}});const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}if(!r.ok||!j.vapid_public_key)throw Error('Không lấy được VAPID Public Key từ máy chủ');return j.vapid_public_key.trim()}
async function register(role){
 if(!token()||!uid())throw Error('Chưa đăng nhập V2');
 if(!('serviceWorker'in navigator))throw Error('Thiết bị không hỗ trợ Service Worker');
 if(!('PushManager'in window))throw Error('Thiết bị không hỗ trợ Web Push');
 if(!('Notification'in window))throw Error('Thiết bị không hỗ trợ thông báo');
 if(location.protocol!=='https:')throw Error('Web Push cần HTTPS');
 if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!iosPwa())throw Error('iPhone cần mở V2 từ Màn hình chính (PWA)');
 let permission=Notification.permission;
 if(permission!=='granted')permission=await Notification.requestPermission();
 if(permission!=='granted')throw Error(permission==='denied'?'Thông báo đang bị chặn. Hãy cho phép CHOCO SHIP trong cài đặt thông báo.':'Bạn chưa cho phép thông báo');
 const button=document.querySelector('.push');
 if(button)button.disabled=true;
 let reg=await navigator.serviceWorker.getRegistration('./');
 if(!reg){reg=await navigator.serviceWorker.register('./push-sw.js?v=v2-prod-1',{scope:'./'})}else{try{await reg.update()}catch{}}
 await navigator.serviceWorker.ready;
 const VAPID_PUBLIC_KEY=await getVapidPublic();
 const appKey=b64(VAPID_PUBLIC_KEY);
 if(appKey.length!==65||appKey[0]!==4)throw Error('VAPID Public Key không hợp lệ');
 let sub=await reg.pushManager.getSubscription();
 if(sub){try{await sub.unsubscribe()}catch{}}
 sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:appKey});
 if(!sub||!sub.endpoint)throw Error('Không tạo được Web Push subscription');
 const j=sub.toJSON();
 if(!j.keys?.p256dh||!j.keys?.auth)throw Error('Subscription Web Push thiếu p256dh hoặc auth');
 const sid=endpointId(sub.endpoint);
 const r=await fetch(REGISTER,{method:'POST',headers:authHeaders(),body:JSON.stringify({shipper_id:uid(),user_id:uid(),role,subscription:{endpoint:sub.endpoint,keys:{p256dh:j.keys.p256dh,auth:j.keys.auth}}})});
 const text=await r.text();let data={};try{data=JSON.parse(text)}catch{}
 if(!r.ok||data.ok===false)throw Error(data.error||data.message||text||('HTTP '+r.status));
 localStorage.setItem('choco_v2_push_'+role,'1');
 return { ...data, subscription_id:sid };
}
async function dispatch(url){if(!token())return null;const r=await fetch(url,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json'}});const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}if(!r.ok)throw Error(j.error||t||('HTTP '+r.status));return j}
async function enable(role,statusId,buttonId){const b=$(buttonId),s=$(statusId);if(b)b.disabled=true;try{const data=await register(role);if(s)s.innerHTML='✅ <b>THÔNG BÁO ĐÃ BẬT</b><br><small>Native Web Push • '+esc(data.subscription_id||'ACTIVE')+'</small>';return true}catch(e){if(s)s.innerHTML='❌ '+esc(e.message);return false}finally{if(b)b.disabled=false}}
async function tick(role){try{const j=await dispatch(role==='admin'?DISPATCH_ADMIN+'?mode=events':DISPATCH_SHIPPER);if(j?.processed>0){const id=role==='admin'?'v2AdminPushDebug':'v2ShipperPushDebug';if($(id))$(id).textContent='🔔 Đã xử lý '+j.processed+' thông báo'}}catch(e){console.warn('V2 PUSH',role,e)}}
window.v2EnablePush=enable;window.v2PushTick=tick;
})();