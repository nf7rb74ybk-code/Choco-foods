/* CHOCO SHIP — CUSTOMER MENU RESCUE v1 */
(function(){
  'use strict';
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const box=()=>document.getElementById('restaurants');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  async function run(){
    const b=box(); if(!b)return;
    try{
      b.innerHTML='<div class="empty">⏳ Đang tải danh sách cửa hàng...</div>';
      const token=localStorage.getItem('choco_access_token')||'';
      const headers={apikey:KEY,Authorization:'Bearer '+token,Accept:'application/json'};
      const [rr,ir]=await Promise.all([
        fetch(SB+'/rest/v1/restaurants?select=id,name,category,image_url,rating,is_open&is_open=eq.true&order=id.asc',{headers}),
        fetch(SB+'/rest/v1/menu_items?select=id,restaurant_id,name,description,price,image_url,is_available,sort_order&is_available=eq.true&order=sort_order.asc',{headers})
      ]);
      if(!rr.ok)throw Error('Cửa hàng HTTP '+rr.status);
      if(!ir.ok)throw Error('Món ăn HTTP '+ir.status);
      const restaurants=await rr.json(), items=await ir.json();
      const data=restaurants.map(r=>({...r,foods:items.filter(f=>String(f.restaurant_id)===String(r.id))})).filter(r=>r.foods.length);
      window.__CHOCO_LIVE_MENU__=data.map(r=>({...r,foods:r.foods.map(f=>({id:f.id,name:f.name,price:Number(f.price||0),description:f.description||'',categoryId:f.category_id}))}));
      b.innerHTML=data.map(r=>'<div class="restaurant"><div class="restaurant-head"><img class="restaurant-img" src="'+esc(r.image_url||'')+'" loading="lazy" onerror="this.style.display=\'none\'"><div class="restaurant-info"><div class="restaurant-name">'+esc(r.name)+'</div><div class="rating">⭐ '+esc(r.rating||'0')+'</div><div class="open">🟢 Đang nhận đơn</div></div></div>'+r.foods.map(f=>'<div class="food"><div><div class="food-name">'+esc(f.name)+'</div><div class="price">'+money(f.price)+'</div></div><button class="add" type="button" onclick="add('+Number(r.id)+','+Number(f.id)+')">+ Thêm</button></div>').join('')+'</div>').join('')||'<div class="empty">📭 Chưa có cửa hàng đang bán món.</div>';
      window.__CHOCO_MENU_RESCUE_OK__=true;
    }catch(e){console.error('[CHOCO MENU RESCUE]',e);b.innerHTML='<div class="empty">❌ Không tải được danh sách món.<br><small>'+esc(e.message||e)+'</small><br><button class="location" type="button" onclick="window.__CHOCO_MENU_RESCUE__.run()">🔄 TẢI LẠI MENU</button></div>'}
  }
  window.__CHOCO_MENU_RESCUE__={run};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1200),{once:true});else setTimeout(run,1200);
})();
