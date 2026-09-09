/* CHOCO SHIP — DIRECT ACCOUNT STATUS GUARD v1 */
'use strict';
(function(){
  var SUPABASE_URL='https://guwdswqaqnhzqapflvey.supabase.co';
  var SUPABASE_KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  var token=String(localStorage.getItem('choco_access_token')||'').trim();
  var path=String(location.pathname||'').toLowerCase();
  var expected=path.indexOf('shipper.html')>=0?'shipper':path.indexOf('customer.html')>=0||path.indexOf('restaurant.html')>=0?'customer':null;
  if(!expected)return;
  document.documentElement.style.visibility='hidden';
  function clear(){['choco_access_token','choco_user_id','choco_role','choco_email'].forEach(function(k){localStorage.removeItem(k)});try{sessionStorage.clear()}catch(e){}}
  function go(q){location.replace('index.html'+q)}
  if(!token){go('');return}
  (async function(){
    try{
      var a=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,Accept:'application/json'}});
      if(!a.ok)throw Error('SESSION_INVALID');
      var u=await a.json();
      if(!u||!u.id)throw Error('SESSION_INVALID');
      var p=await fetch(SUPABASE_URL+'/rest/v1/profiles?id=eq.'+encodeURIComponent(u.id)+'&select=role,account_status',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,Accept:'application/json'}});
      if(!p.ok)throw Error('PROFILE_CHECK_FAILED');
      var rows=await p.json();
      if(!Array.isArray(rows)||rows.length!==1)throw Error('PROFILE_INVALID');
      var profile=rows[0];
      if(profile.account_status==='locked'){clear();go('?locked=1');return}
      if(profile.role!==expected){clear();go('');return}
      document.documentElement.style.visibility='visible';
    }catch(e){console.warn('CHOCO ACCOUNT GUARD',e);clear();go('')}
  })();
})();
