/* CHOCO CUSTOMER AUTH GUARD v1 */
'use strict';
(function(){
  var SUPABASE_URL='https://guwdswqaqnhzqapflvey.supabase.co';
  var SUPABASE_KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  var token=String(localStorage.getItem('choco_access_token')||'').trim();
  document.documentElement.style.visibility='hidden';
  function clear(){['choco_access_token','choco_refresh_token','choco_user_id','choco_role','choco_email'].forEach(function(k){localStorage.removeItem(k)});}
  function login(){location.replace('./login.html');}
  if(!token){login();return;}
  (async function(){
    try{
      var r=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,Accept:'application/json'}});
      if(!r.ok)throw Error('SESSION_INVALID');
      var u=await r.json();
      if(!u||!u.id)throw Error('SESSION_INVALID');
      var p=await fetch(SUPABASE_URL+'/rest/v1/profiles?id=eq.'+encodeURIComponent(u.id)+'&select=role,account_status',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,Accept:'application/json'}});
      if(!p.ok)throw Error('PROFILE_CHECK_FAILED');
      var rows=await p.json();
      if(!Array.isArray(rows)||rows.length!==1)throw Error('PROFILE_INVALID');
      var profile=rows[0];
      if(String(profile.account_status||'').toLowerCase()==='locked')throw Error('ACCOUNT_LOCKED');
      if(String(profile.role||'').toLowerCase()!=='customer')throw Error('NOT_CUSTOMER');
      localStorage.setItem('choco_role','customer');
      document.documentElement.style.visibility='visible';
    }catch(e){console.warn('CHOCO CUSTOMER AUTH GUARD',e);clear();login();}
  })();
})();
