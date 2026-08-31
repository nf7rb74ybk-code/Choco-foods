/* CHOCO SHIP - Shipper online + GPS heartbeat + history */
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
  let coords=null,watchId=null,lastHistoryAt=0;

  async function recordHistory(){
    if(!coords||Date.now()-lastHistoryAt<25000) return;
    lastHistoryAt=Date.now();
    try{
      const r=await fetch(SB+'/rest/v1/shipper_gps_history',{method:'POST',headers,body:JSON.stringify({shipper_id:UID,latitude:coords.lat,longitude:coords.lng})});
      if(!r.ok) console.warn('SHIPPER GPS HISTORY',r.status,await r.text());
    }catch(e){console.warn('SHIPPER GPS HISTORY',e)}
  }

  async function save(extra={}){
    try{
      const body={last_seen:new Date().toISOString(),is_online:true,...extra};
      const r=await fetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(UID),{method:'PATCH',headers,body:JSON.stringify(body)});
      if(!r.ok) console.warn('SHIPPER ONLINE/GPS',r.status,await r.text());
      else await recordHistory();
    }catch(e){console.warn('SHIPPER ONLINE/GPS',e)}
  }

  function updateGPS(position){
    coords={lat:Number(position.coords.latitude),lng:Number(position.coords.longitude)};
    save({latitude:coords.lat,longitude:coords.lng});
  }

  function startGPS(){
    if(!navigator.geolocation||watchId!==null) return;
    watchId=navigator.geolocation.watchPosition(updateGPS,err=>{
      console.warn('SHIPPER GPS',err);
      save();
    },{enableHighAccuracy:true,maximumAge:15000,timeout:15000});
  }

  save();
  startGPS();
  setInterval(()=>{
    if(coords) save({latitude:coords.lat,longitude:coords.lng});
    else save();
  },30000);

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      save(coords?{latitude:coords.lat,longitude:coords.lng}:{});
      startGPS();
    }
  });

  window.addEventListener('pagehide',()=>{
    if(watchId!==null){try{navigator.geolocation.clearWatch(watchId)}catch{}}
    fetch(SB+'/rest/v1/profiles?id=eq.'+encodeURIComponent(UID),{method:'PATCH',keepalive:true,headers,body:JSON.stringify({last_seen:new Date().toISOString(),is_online:false})}).catch(()=>{});
  });
})();