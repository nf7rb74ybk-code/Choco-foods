// CHOCO SHIP V2 TEST role gate. This is a TEST identity selector, not production authentication.
const V2_ROLES = Object.freeze({customer:'Customer',shipper:'Shipper',admin:'Admin',pos:'POS'});
function v2GetIdentity(){try{return JSON.parse(localStorage.getItem('choco_v2_test_identity')||'null')}catch{return null}}
function v2SetIdentity(identity){localStorage.setItem('choco_v2_test_identity',JSON.stringify(identity))}
function v2ClearIdentity(){localStorage.removeItem('choco_v2_test_identity')}
async function v2LoginTest(userKey){if(!v2Ready()) throw new Error('Chưa cấu hình Supabase TEST.');const rows=await v2Request(`/rest/v1/choco_v2_test_users?select=user_key,display_name,role,phone,active&user_key=eq.${encodeURIComponent(userKey)}&active=eq.true`);if(!rows.length) throw new Error('Không tìm thấy tài khoản TEST.');if(!V2_ROLES[rows[0].role]) throw new Error('Role TEST không hợp lệ.');v2SetIdentity(rows[0]);return rows[0]}
function v2RequireRole(role){const u=v2GetIdentity();if(!u||u.role!==role){location.replace('./login.html?role='+encodeURIComponent(role));return null}return u}
function v2Logout(){v2ClearIdentity();location.replace('./login.html')}
function v2AccountHtml(extraClass=''){const u=v2GetIdentity();if(!u)return '';const role=V2_ROLES[u.role]||u.role;return `<span class="${extraClass}">👤 <b>${escapeHtml(u.display_name||u.user_key)}</b> · ${escapeHtml(role)}</span><button type="button" onclick="v2Logout()">🚪 Đăng xuất</button>`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
