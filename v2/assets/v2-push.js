// CHOCO SHIP V2 — Native Web Push
(function(){
const SB=V2_SUPABASE_CONFIG.url,KEY=V2_SUPABASE_CONFIG.anonKey;
const PUBLIC=SB+'/functions/v1/admin-push-public';
const REGISTER=SB+'/functions/v1/register-push';
const DISPATCH_SHIPPER=SB+'/functions/v1/shipper-push-dispatch';
const DISPATCH_ADMIN=SB+'/functions/v1/admin-send-push';
const $=id=>document.getElementById(id);
function token(){return v2GetAccessToken()||''}
function uid(){return v2GetIdentity()?.user_id||''}
function authHeaders(){return {apikey:KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json',Accept:'application/json'}}
function b64(s){const p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0))}
async function vapid(){const r=await fetch(PUBLIC,{headers:{apikey:KEY,Accept:'application/json'}}),j=await r.json();if(!r.ok||!j.vapid_public_key)throw Error('Không lấy được VAPID Public Key');return b64(j.vapid_public_key.trim())}
async function register(role){if(!token()||!uid())throw Error('Chưa đăng nhập V2');if(!('serviceWorker'in navigator)||!('PushManager'in window))throw Error('Thiết bị không hỗ trợ Web Push');if(!window.isSecureContext)throw Error('Web Push cần HTTPS');if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!(navigator.standalone===true||matchMedia('(display-mode:standalone)').matches))throw Error('iPhone cần mở V2 từ Màn hình chính (PWA)');let p=Notification.permission;if(p!=='granted')p=await Notification.requestPermission();if(p!=='granted')throw Error('Bạn chưa cho phép thông báo');const reg=await navigator.serviceWorker.register('./push-sw.js?v=v2-1',{scope:'./'});await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:await vapid()});const j=sub.toJSON();if(!j.endpoint||!j.keys?.p256dh||!j.keys?.auth)throw Error('Subscription thiếu endpoint/p256dh/auth');const r=await fetch(REGISTER,{method:'POST',headers:authHeaders(),body:JSON.stringify({user_id:uid(),role,subscription:{endpoint:j.endpoint,keys:{p256dh:j.keys.p256dh,auth:j.keys.auth}}})});const t=await r.text();let data={};try{data=JSON.parse(t)}catch{}if(!r.ok||!data.ok)throw Error(data.error||t||('HTTP '+r.status));localStorage.setItem('choco_v2_push_'+role,'1');return data}
async function dispatch(url){if(!token())return null;const r=await fetch(url,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token(),Accept:'application/json'}});const t=await r.text();let j={};try{j=JSON.parse(t)}catch{}if(!r.ok)throw Error(j.error||t||('HTTP '+r.status));return j}
async function enable(role,statusId,buttonId){const b=$(buttonId),s=$(statusId);if(b)b.disabled=true;try{await register(role);if(s)s.innerHTML='✅ <b>THÔNG BÁO ĐÃ BẬT</b>';return true}catch(e){if(s)s.innerHTML='❌ '+escapeHtml(e.message);return false}finally{if(b)b.disabled=false}}
async function tick(role){try{const j=await dispatch(role==='admin'?DISPATCH_ADMIN+'?mode=events':DISPATCH_SHIPPER);if(j?.processed>0){const id=role==='admin'?'v2AdminPushDebug':'v2ShipperPushDebug';if($(id))$(id).textContent='🔔 Đã xử lý '+j.processed+' thông báo'}}catch(e){console.warn('V2 PUSH',role,e)}}
window.v2EnablePush=enable;window.v2PushTick=tick;
})();