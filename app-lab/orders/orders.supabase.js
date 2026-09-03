const SUPABASE_URL='https://guwdswqaqnhzqapflvey.supabase.co';
const TABLE='choco_food_lab_orders';

async function request(path,{key,method='GET',body}={}){
  if(!key) throw new Error('Thiếu Supabase publishable key.');
  const res=await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
  const text=await res.text();
  let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!res.ok) throw new Error(data?.message||data?.hint||`Supabase HTTP ${res.status}`);
  return data;
}

export function createLabOrder(order,key){return request('',{key,method:'POST',body:order});}
export function getLabOrderByCode(code,key){return request(`?code=eq.${encodeURIComponent(code)}&select=*&limit=1`,{key});}
export function listLabOrders(key){return request('?select=*&order=created_at.desc&limit=100',{key});}
export function updateLabOrder(id,patch,key){return request(`?id=eq.${encodeURIComponent(id)}`,{key,method:'PATCH',body:{...patch,updated_at:new Date().toISOString()}});}
export function deleteLabOrder(id,key){return request(`?id=eq.${encodeURIComponent(id)}`,{key,method:'DELETE'});}
