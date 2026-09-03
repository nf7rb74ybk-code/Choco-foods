// CHOCO FOOD APP — LAB Supabase catalog adapter
// LAB ONLY. Reads only the dedicated choco_food_lab_* tables.
// Never queries production orders/menu tables and never contains service_role keys.

const SUPABASE_URL = 'https://guwdswqaqnhzqapflvey.supabase.co';

// Publishable/anon key must be supplied by the LAB page at runtime.
// Do NOT put a service_role key in this file.
export async function loadCatalogFromSupabase(publishableKey) {
  if (!publishableKey) throw new Error('Thiếu Supabase publishable/anon key cho LAB.');

  const headers = {
    apikey: publishableKey,
    Authorization: `Bearer ${publishableKey}`,
    Accept: 'application/json'
  };

  const get = async (table, query = '') => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
    return res.json();
  };

  const [categories, restaurants, foods, options, promotions] = await Promise.all([
    get('choco_food_lab_categories', '?select=id,name,icon,sort_order&is_active=eq.true&order=sort_order.asc'),
    get('choco_food_lab_restaurants', '?select=id,name,description,image_url,rating,is_open,sort_order&is_active=eq.true&order=sort_order.asc'),
    get('choco_food_lab_foods', '?select=id,restaurant_id,category_id,name,description,price,image_url,rating,is_available,sort_order&is_active=eq.true&is_available=eq.true&order=sort_order.asc'),
    get('choco_food_lab_food_options', '?select=id,food_id,name,option_type,price_delta,is_active&is_active=eq.true&order=name.asc'),
    get('choco_food_lab_promotions', '?select=id,name,description,image_url,discount_type,discount_value,min_order_value,start_at,end_at,is_active&is_active=eq.true&order=start_at.desc')
  ]);

  const optionMap = new Map();
  for (const o of options) {
    if (!optionMap.has(o.food_id)) optionMap.set(o.food_id, []);
    optionMap.get(o.food_id).push(o);
  }

  const foodMap = new Map();
  for (const f of foods) {
    foodMap.set(f.id, {
      id: f.id,
      name: f.name,
      description: f.description || '',
      price: Number(f.price || 0),
      image: f.image_url || '',
      rating: Number(f.rating || 0),
      available: !!f.is_available,
      categoryId: f.category_id,
      options: optionMap.get(f.id) || []
    });
  }

  return {
    version: 1,
    source: 'supabase-lab',
    updatedAt: new Date().toISOString(),
    categories: [{ id: 'all', name: 'Tất cả', icon: '🍽️' }, ...categories.map(c => ({
      id: c.id, name: c.name, icon: c.icon || '🍽️'
    }))],
    restaurants: restaurants.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      rating: Number(r.rating || 0),
      image: r.image_url || '',
      isOpen: !!r.is_open,
      foods: foods.filter(f => f.restaurant_id === r.id).map(f => foodMap.get(f.id))
    })),
    promotions
  };
}

export async function loadCatalog({ publishableKey, fallback } = {}) {
  try {
    return await loadCatalogFromSupabase(publishableKey);
  } catch (error) {
    console.warn('[CHOCO FOOD LAB] Supabase catalog unavailable:', error);
    if (fallback) return structuredClone(fallback);
    throw error;
  }
}
