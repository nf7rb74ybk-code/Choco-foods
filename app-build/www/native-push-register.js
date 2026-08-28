(() => {
  const SUPABASE_URL='https://guwdswqaqnhzqapflvey.supabase.co';
  const SUPABASE_KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  async function saveToken(token){
    try {
      const access=localStorage.getItem('choco_access_token');
      if(!access||!token)return {ok:false,reason:'missing auth or token'};
      const u=await window.CHOCO_AUTH?.user();
      const uid=u?.id;
      if(!uid)return {ok:false,reason:'not signed in'};
      const p=await window.CHOCO_AUTH?.profile();
      const role=p?.role||localStorage.getItem('choco_role');
      if(!['admin','shipper'].includes(role))return {ok:false,reason:'invalid role'};
      const platform=window.Capacitor?.getPlatform?.()||'unknown';
      if(!['ios','android'].includes(platform))return {ok:false,reason:'not native'};
      const r=await fetch(`${SUPABASE_URL}/rest/v1/native_push_devices?on_conflict=user_id,platform,token`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+access,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:uid,role,platform,token,enabled:true,updated_at:new Date().toISOString()})});
      if(!r.ok){const text=await r.text();console.error('[CHOCO NATIVE PUSH] save token failed',text);return {ok:false,reason:text};}
      console.log('[CHOCO NATIVE PUSH] token saved',platform,role);
      return {ok:true};
    } catch(e){console.error('[CHOCO NATIVE PUSH] save error',e);return {ok:false,reason:e.message};}
  }
  window.addEventListener('choco-native-push-token',e=>saveToken(e.detail));
  window.CHOCO_REGISTER_NATIVE_PUSH=async()=>{
    if(!window.CHOCO_NATIVE_PUSH)return {ok:false,reason:'native push bridge unavailable'};
    return window.CHOCO_NATIVE_PUSH.init();
  };
})();
