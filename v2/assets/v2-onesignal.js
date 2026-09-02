// CHOCO SHIP V2 — OneSignal (chạy song song với Native Web Push)
(function(){
const APP_ID='66bec449-f15b-4d0e-90fc-3dc470fef20c';
let ready=null;
async function init(){
  if(ready)return ready;
  ready=new Promise((resolve,reject)=>{
    window.OneSignalDeferred=window.OneSignalDeferred||[];
    window.OneSignalDeferred.push(async function(OneSignal){
      try{
        await OneSignal.init({
          appId:APP_ID,
          serviceWorkerPath:'/Choco-foods/OneSignalSDKWorker.js',
          serviceWorkerParam:{scope:'/Choco-foods/'},
          allowLocalhostAsSecureOrigin:false
        });
        resolve(OneSignal);
      }catch(e){reject(e)}
    });
    setTimeout(()=>reject(Error('OneSignal SDK timeout')),15000);
  });
  return ready;
}
async function enable(role,statusId,debugId){
  const s=document.getElementById(statusId),d=document.getElementById(debugId);
  try{
    const os=await init();
    const uid=typeof v2GetIdentity==='function'?(v2GetIdentity()?.user_id||''):'';
    if(!uid)throw Error('Chưa xác định tài khoản V2');
    await os.login(String(uid));
    if(os.Notifications && !os.Notifications.isPushSupported())throw Error('Thiết bị không hỗ trợ OneSignal Push');
    if(os.Notifications && os.Notifications.permission!=='granted')await os.Notifications.requestPermission();
    if(os.User?.PushSubscription?.optIn)await os.User.PushSubscription.optIn();
    let subId=os.User?.PushSubscription?.id||'';
    if(!subId){
      for(let i=0;i<10&&!subId;i++){
        await new Promise(r=>setTimeout(r,500));
        subId=os.User?.PushSubscription?.id||'';
      }
    }
    const optedIn=os.User?.PushSubscription?.optedIn;
    if(!subId || optedIn===false)throw Error('OneSignal chưa tạo subscription Push trên thiết bị này');
    try{await os.User.addTags({role:String(role||'shipper'),app:'choco-v2'});}catch(_){ }
    if(s)s.innerHTML='✅ <b>OneSignal ĐÃ BẬT</b>';
    if(d)d.innerHTML='Native Web Push + OneSignal đang hoạt động<br>OneSignal subscription: '+escapeHtml(subId);
    localStorage.setItem('choco_v2_onesignal_'+role,'1');
    return true;
  }catch(e){
    localStorage.removeItem('choco_v2_onesignal_'+role);
    if(s)s.innerHTML='⚠️ OneSignal: '+escapeHtml(e.message||String(e));
    if(d)d.innerHTML='Native Web Push vẫn có thể hoạt động • OneSignal chưa bật';
    console.warn('V2 OneSignal',e);
    return false;
  }
}
window.v2EnableOneSignalPush=enable;
})();
