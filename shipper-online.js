/* CHOCO SHIP - Shipper online heartbeat */
'use strict';
(function(){
  if(window.__CHOCO_SHIPPER_ONLINE__) return;
  window.__CHOCO_SHIPPER_ONLINE__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=localStorage.getItem('choco_access_token')||'';
  const UID=localStorage.getItem('choco_user_id')||'';
  const ROLE=localStorage.getItem('choco_role')||'';
  if(!TOKEN||!UID||ROLE!=='shipper') return;
  const headers={apikey:KEY,Authorization:'Bearer '+TOKEN,'Content-Type':'application/json',Accept:'application/json'};
  async function beat(){
    try{
      const r=await fetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(UID),{method:'PATCH',headers,body:JSON.stringify({last_seen:new Date().toISOString(),is_online:true})});
      if(!r.ok) console.warn('SHIPPER ONLINE',r.status,await r.text());
    }catch(e){console.warn('SHIPPER ONLINE',e)}
  }
  beat();
  setInterval(beat,30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')beat()});
  window.addEventListener('pagehide',()=>{fetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(UID),{method:'PATCH',keepalive:true,headers,body:JSON.stringify({last_seen:new Date().toISOString(),is_online:false})}).catch(()=>{})});
})();