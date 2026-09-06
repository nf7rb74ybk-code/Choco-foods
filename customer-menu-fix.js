/* CHOCO SHIP — CUSTOMER MENU RESCUE v2 */
(function(){
  'use strict';
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const box=()=>document.getElementById('restaurants');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  function headers(){
    const session=localStorage.getItem('choco_access_token')||'';
    return {apikey:KEY,Authorization:'Bearer '+(session||KEY),Accept:'application/json'};
  }
  async function get(path){
    const r=await fetch(SB+path,{headers:headers(),cache:'no-store'});
    if(!r.ok){let detail='';try{detail=await r.text()}catch{};throw Error('HTTP '+r.status+(detail?' — '+detail.slice(0,180):''));}
    return r.json();
  }
  async function run(){
    const b=box(); if(!b)return;
    try{
      b.innerHTML='<div class="empty">⏳ Đang tải danh sách cửa hàng...</div>';
      const [restaurants,items]=await Promise.all([
        get('/rest/v1/restaurants?select=id,name,category,image_url,rating,is_open&is_open=eq.true&order=id.asc'),
        get('/rest/v1/menu_items?select=id,restaurant_id,name,description,price,image_url,is_available,sort_order&is_available=eq.true&order=sort_order.asc,id.asc')
      ]);
      const data=restaurants.map(r=>({...r,foods:items.filter(f=>String(f.restaurant_id)===String(r.id))})).filter(r=>r.foods.length);
      window.__CHOCO_LIVE_MENU__=data;
      b.innerHTML=data.map(r=>'<div class="restaurant"><div class="restaurant-head"><img class="restaurant-img" src="'+esc(r.image_url||'')+'" loading="lazy" onerror="this.style.display=\'none\'"><div class="restaurant-info"><div class="restaurant-name">'+esc(r.name)+'</div><div class="rating">⭐ '+esc(r.rating||'0')+'</div><div class="open">🟢 Đang nhận đơn</div></div></div>'+r.foods.map(f=>'<div class="food"><div><div class="food-name">'+esc(f.name)+'</div><div class="price">'+money(f.price)+'</div></div><button class="add" type="button" onclick="add('+Number(r.id)+','+Number(f.id)+')">+ Thêm</button></div>').join('')+'</div>').join('')||'<div class="empty">📭 Chưa có cửa hàng đang bán món.</div>';
      window.__CHOCO_MENU_RESCUE_OK__=true;
    }catch(e){console.error('[CHOCO MENU RESCUE]',e);b.innerHTML='<div class="empty">❌ Không tải được danh sách món.<br><small>'+esc(e.message||e)+'</small><br><button class="location" type="button" onclick="window.__CHOCO_MENU_RESCUE__.run()">🔄 TẢI LẠI MENU</button></div>'}
  }
  window.__CHOCO_MENU_RESCUE__={run};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1200),{once:true});else setTimeout(run,1200);
})();
