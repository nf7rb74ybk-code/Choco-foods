(() => {
  const SUPABASE_URL='https://guwdswqaqnhzqapflvey.supabase.co';
  const SUPABASE_KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  async function saveToken(token){
    const access=localStorage.getItem('choco_access_token');
    const uid=localStorage.getItem('choco_user_id');
    if(!access||!uid||!token)return;
    const p=await window.CHOCO_AUTH?.profile();
    const role=p?.role||localStorage.getItem('choco_role');
    if(!['admin','shipper'].includes(role))return;
    const platform=window.Capacitor?.getPlatform?.()||'unknown';
    if(!['ios','android'].includes(platform))return;
    const r=await fetch(`${SUPABASE_URL}/rest/v1/native_push_devices?on_conflict=user_id,platform,token`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+access,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:uid,role,platform,token,enabled:true,updated_at:new Date().toISOString()})});
    if(!r.ok)console.error('[CHOCO NATIVE PUSH] save token failed',await r.text());
  }
  window.addEventListener('choco-native-push-token',e=>saveToken(e.detail));
  window.CHOCO_REGISTER_NATIVE_PUSH=async()=>{
    if(!window.CHOCO_NATIVE_PUSH)return {ok:false,reason:'native push bridge unavailable'};
    return window.CHOCO_NATIVE_PUSH.init();
  };
})();
