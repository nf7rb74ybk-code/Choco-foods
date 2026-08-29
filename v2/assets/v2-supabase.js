// CHOCO SHIP V2 — TEST data layer
// Intentionally targets ONLY choco_v2_test_* tables.
// Fill these values with the existing project's PUBLIC URL + ANON KEY before enabling remote TEST mode.
const V2_SUPABASE_CONFIG = Object.freeze({
  url: '',
  anonKey: ''
});

const V2_API = {
  orders: '/rest/v1/choco_v2_test_orders',
  logs: '/rest/v1/choco_v2_test_logs'
};

function v2Ready(){ return Boolean(V2_SUPABASE_CONFIG.url && V2_SUPABASE_CONFIG.anonKey); }
function v2Headers(extra={}){ return { apikey: V2_SUPABASE_CONFIG.anonKey, Authorization: `Bearer ${V2_SUPABASE_CONFIG.anonKey}`, 'Content-Type':'application/json', ...extra }; }
async function v2Request(path, options={}){
  if(!v2Ready()) throw new Error('V2 TEST chưa được cấu hình Supabase public URL/anon key.');
  const res=await fetch(V2_SUPABASE_CONFIG.url.replace(/\/$/,'')+path,{...options,headers:v2Headers(options.headers||{})});
  const text=await res.text();
  if(!res.ok) throw new Error(text||`HTTP ${res.status}`);
  return text?JSON.parse(text):null;
}
async function v2CreateOrder(order){
  return v2Request(V2_API.orders,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(order)});
}
async function v2ListOrders(){
  return v2Request(`${V2_API.orders}?select=*&order=created_at.desc`);
}
async function v2UpdateOrder(id, patch){
  return v2Request(`${V2_API.orders}?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)});
}
async function v2Log(orderId,event,payload={}){
  return v2Request(V2_API.logs,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({order_id:orderId,event,payload})});
}
