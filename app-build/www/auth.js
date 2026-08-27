(() => {
  const SUPABASE_URL='https://guwdswqaqnhzqapflvey.supabase.co';
  const SUPABASE_KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  window.CHOCO_AUTH={
    async signIn(email,password){const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok)throw Error(d.error_description||d.msg||'Đăng nhập thất bại');localStorage.setItem('choco_access_token',d.access_token);localStorage.setItem('choco_refresh_token',d.refresh_token||'');localStorage.setItem('choco_user_id',d.user?.id||'');return d},
    async user(){const t=localStorage.getItem('choco_access_token');if(!t)return null;const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+t}});return r.ok?await r.json():null},
    logout(){['choco_access_token','choco_refresh_token','choco_user_id','choco_role'].forEach(k=>localStorage.removeItem(k));location.href='index.html'}
  };
})();
