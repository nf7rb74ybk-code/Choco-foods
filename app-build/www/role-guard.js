(() => {
  const SUPABASE_URL='https://guwdswqaqnhzqapflvey.supabase.co';
  const SUPABASE_KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const required=document.documentElement.dataset.role;
  async function guard(){
    const token=localStorage.getItem('choco_access_token');
    if(!token){location.replace('login.html');return;}
    try{
      const u=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token}});
      if(!u.ok) throw Error('session');
      const user=await u.json();
      const r=await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token}});
      if(!r.ok) throw Error('profile');
      const rows=await r.json();
      const role=rows?.[0]?.role;
      if(!role){location.replace('login.html');return;}
      localStorage.setItem('choco_role',role);
      if(required && role!==required){location.replace(role+'.html');return;}
      document.documentElement.classList.add('authorized');
    }catch(e){localStorage.removeItem('choco_access_token');localStorage.removeItem('choco_refresh_token');localStorage.removeItem('choco_user_id');localStorage.removeItem('choco_role');location.replace('login.html');}
  }
  guard();
})();
