// CHOCO SHIP V2 — data/auth layer
// V2 remains isolated on branch choco-ship-v2 until every module is tested.
const V2_SUPABASE_CONFIG = Object.freeze({url:'https://guwdswqaqnhzqapflvey.supabase.co',anonKey:'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9'});
const V2_API={orders:'/rest/v1/choco_v2_test_orders',logs:'/rest/v1/choco_v2_test_logs',profiles:'/rest/v1/choco_v2_auth_profiles'};
function v2Ready(){return Boolean(V2_SUPABASE_CONFIG.url&&V2_SUPABASE_CONFIG.anonKey)}
function v2GetAccessToken(){try{return JSON.parse(sessionStorage.getItem('choco_v2_session')||'null')?.access_token||null}catch{return null}}
function v2Headers(extra={}){const token=v2GetAccessToken();const headers={apikey:V2_SUPABASE_CONFIG.anonKey,'Content-Type':'application/json',...extra};if(token)headers.Authorization=`Bearer ${token}`;return headers}
async function v2Request(path,options={}){if(!v2Ready())throw new Error('V2 chưa được cấu hình Supabase.');const res=await fetch(V2_SUPABASE_CONFIG.url.replace(/\/$/,'')+path,{...options,headers:v2Headers(options.headers||{})});const text=await res.text();if(!res.ok)throw new Error(text||`HTTP ${res.status}`);return text?JSON.parse(text):null}
async function v2CreateOrder(order){return v2Request(V2_API.orders,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(order)})}
async function v2ListOrders(){return v2Request(`${V2_API.orders}?select=*&order=created_at.desc`)}
async function v2UpdateOrder(id,patch){return v2Request(`${V2_API.orders}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)})}
async function v2Log(orderId,event,payload={}){return v2Request(V2_API.logs,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({order_id:orderId,event,payload})})}
async function v2SignIn(email,password){return v2Request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})})}
async function v2GetProfile(accessToken,userId){const res=await fetch(V2_SUPABASE_CONFIG.url+`${V2_API.profiles}?select=user_id,display_name,role,phone,active&user_id=eq.${encodeURIComponent(userId)}&active=eq.true`,{headers:{apikey:V2_SUPABASE_CONFIG.anonKey,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'}});const text=await res.text();if(!res.ok)throw new Error(text||`HTTP ${res.status}`);return text?JSON.parse(text):null}
