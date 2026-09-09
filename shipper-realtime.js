/* CHOCO SHIP — Shipper Realtime order updates
 * Realtime is the fast path; shipper.html keeps 3s polling as fallback.
 */
(function(){
  'use strict';
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=localStorage.getItem('choco_access_token')||'';
  const UID=localStorage.getItem('choco_user_id')||'';
  if(!TOKEN||!UID||!window.supabase)return;

  let client;
  try{
    client=window.supabase.createClient(SB,KEY,{realtime:{params:{eventsPerSecond:10}}});
    if(client.realtime?.setAuth) client.realtime.setAuth(TOKEN);
  }catch(e){ console.warn('[CHOCO realtime] init failed',e); return; }

  let timer=0;
  function refresh(){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(typeof window.loadOrders==='function') window.loadOrders();
    },120);
  }

  const channel=client.channel('shipper-orders-realtime-'+UID)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'},refresh)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders'},refresh)
    .subscribe((status)=>{
      console.log('[CHOCO realtime]',status);
      const d=document.getElementById('debug');
      if(d){
        const old=d.innerHTML;
        if(status==='SUBSCRIBED') d.innerHTML=old+'<br>⚡ Realtime: ACTIVE';
        else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT') d.innerHTML=old+'<br>⚠️ Realtime: '+status+' • Polling fallback ACTIVE';
      }
    });

  window.addEventListener('beforeunload',()=>{try{client.removeChannel(channel)}catch{}});
})();
