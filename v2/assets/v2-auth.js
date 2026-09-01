// CHOCO SHIP V2 — Auth helper
const V2_ROLES=Object.freeze({customer:'Customer',shipper:'Shipper',admin:'Admin',pos:'POS'});
function v2GetSession(){try{const a=localStorage.getItem('choco_v2_session');if(a)return JSON.parse(a);const b=sessionStorage.getItem('choco_v2_session');if(b){localStorage.setItem('choco_v2_session',b);return JSON.parse(b)}return null}catch{return null}}
function v2GetIdentity(){try{return JSON.parse(localStorage.getItem('choco_v2_auth_identity')||'null')}catch{return null}}
function v2SetIdentity(identity){localStorage.setItem('choco_v2_auth_identity',JSON.stringify(identity))}
function v2SaveSession(s){localStorage.setItem('choco_v2_session',JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token||'',expires_at:s.expires_at||0,user:s.user}))}
function v2ClearIdentity(){localStorage.removeItem('choco_v2_auth_identity');localStorage.removeItem('choco_v2_session');try{sessionStorage.removeItem('choco_v2_session')}catch{}}
function v2RoleIsValid(p,role){return !!(p&&p.active&&V2_ROLES[p.role]&&(!role||p.role===role))}
async function v2RestoreAuth(role){
  let s=v2GetSession();
  let cached=v2GetIdentity();
  if(cached&&v2RoleIsValid(cached,role)&&s?.access_token&&s?.user?.id)return cached;
  if(!s?.access_token||!s?.user?.id){v2ClearIdentity();return null}
  try{
    const rows=await v2GetProfile(s.access_token,s.user.id); const p=rows?.[0];
    if(v2RoleIsValid(p,role)){v2SetIdentity(p);return p}
  }catch(e){}
  if(!s.refresh_token){v2ClearIdentity();return null}
  try{
    const fresh=await Promise.race([v2RefreshSession(s.refresh_token),new Promise((_,reject)=>setTimeout(()=>reject(new Error('AUTH_TIMEOUT')),6000))]);
    if(!fresh?.access_token||!fresh?.user?.id){v2ClearIdentity();return null}
    v2SaveSession(fresh);
    const rows=await Promise.race([v2GetProfile(fresh.access_token,fresh.user.id),new Promise((_,reject)=>setTimeout(()=>reject(new Error('PROFILE_TIMEOUT')),6000))]);
    const p=rows?.[0];
    if(!v2RoleIsValid(p,role)){v2ClearIdentity();return null}
    v2SetIdentity(p);return p;
  }catch(e){v2ClearIdentity();return null}
}
async function v2RequireRole(role){
  try{
    const p=await Promise.race([v2RestoreAuth(role),new Promise((_,reject)=>setTimeout(()=>reject(new Error('AUTH_TIMEOUT')),8000))]);
    if(!v2RoleIsValid(p,role)){v2ClearIdentity();location.replace('./login.html?role='+encodeURIComponent(role));return null}
    return p;
  }catch(e){v2ClearIdentity();location.replace('./login.html?role='+encodeURIComponent(role)+'&error=auth');return null}
}
async function v2Logout(){const s=v2GetSession();try{if(s?.access_token)await fetch(V2_SUPABASE_CONFIG.url+'/auth/v1/logout',{method:'POST',headers:{apikey:V2_SUPABASE_CONFIG.anonKey,Authorization:`Bearer ${s.access_token}`}})}finally{v2ClearIdentity();location.replace('./login.html')}}
function v2AccountHtml(extraClass=''){const u=v2GetIdentity();if(!u)return '';const role=V2_ROLES[u.role]||u.role;return `<span class="${extraClass}">👤 <b>${escapeHtml(u.display_name||u.user_id)}</b> · ${escapeHtml(role)}</span>`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c))}
