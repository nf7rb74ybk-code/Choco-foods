// CHOCO SHIP V2 — Supabase Auth session + V2 role profile
const V2_ROLES=Object.freeze({customer:'Customer',shipper:'Shipper',admin:'Admin',pos:'POS'});
function v2GetSession(){try{return JSON.parse(sessionStorage.getItem('choco_v2_session')||'null')}catch{return null}}
function v2GetIdentity(){try{return JSON.parse(localStorage.getItem('choco_v2_auth_identity')||'null')}catch{return null}}
function v2SetIdentity(identity){localStorage.setItem('choco_v2_auth_identity',JSON.stringify(identity))}
function v2ClearIdentity(){localStorage.removeItem('choco_v2_auth_identity');sessionStorage.removeItem('choco_v2_session')}
async function v2RestoreAuth(){const s=v2GetSession();if(!s?.access_token||!s?.user?.id){v2ClearIdentity();return null}const rows=await v2GetProfile(s.access_token,s.user.id);const p=rows?.[0];if(!p||!p.active||!V2_ROLES[p.role]){v2ClearIdentity();return null}v2SetIdentity(p);return p}
async function v2RequireRole(role){const p=await v2RestoreAuth();if(!p||p.role!==role){location.replace('./login.html?role='+encodeURIComponent(role));return null}return p}
async function v2Logout(){const s=v2GetSession();try{if(s?.access_token)await fetch(V2_SUPABASE_CONFIG.url+'/auth/v1/logout',{method:'POST',headers:{apikey:V2_SUPABASE_CONFIG.anonKey,Authorization:`Bearer ${s.access_token}`}})}finally{v2ClearIdentity();location.replace('./login.html')}}
function v2AccountHtml(extraClass=''){const u=v2GetIdentity();if(!u)return '';const role=V2_ROLES[u.role]||u.role;return `<span class="${extraClass}">👤 <b>${escapeHtml(u.display_name||u.user_id)}</b> · ${escapeHtml(role)}</span>`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
