// CHOCO FOOD APP — LAB Supabase catalog adapter v2
// LAB ONLY. Read-only catalog access. Never touches production orders/menu.
const SUPABASE_URL='https://guwdswqaqnhzqapflvey.supabase.co';
export async function loadCatalogFromSupabase(publishableKey){
 if(!publishableKey) throw new Error('Thiếu Supabase publishable/anon key cho LAB.');
 const headers={apikey:publishableKey,Authorization:`Bearer ${publishableKey}`,Accept:'application/json'};
 const get=async(table,query='')=>{const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`,{headers});if(!r.ok)throw new Error(`${table}: HTTP ${r.status}`);return r.json()};
 const [categories,restaurants,foods,options,promotions]=await Promise.all([
  get('choco_food_lab_categories','?select=id,name,slug,image_url,sort_order&is_active=eq.true&order=sort_order.asc'),
  get('choco_food_lab_restaurants','?select=id,name,slug,description,image_url,is_open&is_active=eq.true&order=name.asc'),
  get('choco_food_lab_foods','?select=id,restaurant_id,category_id,name,slug,description,price,image_url,is_available,sort_order&is_active=eq.true&is_available=eq.true&order=sort_order.asc'),
  get('choco_food_lab_food_options','?select=id,food_id,name,price_delta,is_required,is_active,sort_order&is_active=eq.true&order=sort_order.asc'),
  get('choco_food_lab_promotions','?select=id,code,title,description,discount_type,discount_value,min_order_value,starts_at,ends_at,is_active&is_active=eq.true&order=starts_at.desc')
 ]);
 const optionMap=new Map();for(const o of options){if(!optionMap.has(o.food_id))optionMap.set(o.food_id,[]);optionMap.get(o.food_id).push(o)}
 const normalizedFoods=foods.map(f=>({id:f.id,restaurant_id:f.restaurant_id,category_id:f.category_id,name:f.name,description:f.description||'',price:Number(f.price||0),image_url:f.image_url||'',rating:0,available:!!f.is_available,options:optionMap.get(f.id)||[]}));
 return {version:2,source:'supabase-lab',updatedAt:new Date().toISOString(),categories:[{id:'all',name:'Tất cả',icon:'🍽️'},...categories.map(c=>({id:c.id,name:c.name,icon:c.image_url||'🍽️'}))],restaurants:restaurants.map(r=>({id:r.id,name:r.name,description:r.description||'',rating:0,image:r.image_url||'',isOpen:!!r.is_open,foods:normalizedFoods.filter(f=>f.restaurant_id===r.id)})),foods:normalizedFoods,promotions};
}
export async function loadCatalog({publishableKey,fallback}={}){try{return await loadCatalogFromSupabase(publishableKey)}catch(e){console.warn('[CHOCO FOOD LAB] Catalog unavailable:',e);if(fallback)return structuredClone(fallback);throw e}}
