/* CHOCO SHIP — Restaurant Live Menu UX v1 */
'use strict';
(function(){
  if(window.__CHOCO_RESTAURANT_LIVE__) return;
  window.__CHOCO_RESTAURANT_LIVE__=true;
  const U='https://guwdswqaqnhzqapflvey.supabase.co';
  const K='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const token=localStorage.getItem('choco_access_token')||'';
  const H={apikey:K,Authorization:'Bearer '+token,Accept:'application/json'};
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function load(){
    const name=new URLSearchParams(location.search).get('name');
    if(!name)return;
    try{
      const [rr,cc,ii]=await Promise.all([
        fetch(U+'/rest/v1/restaurants?select=id,name,category,image_url,rating,is_open&name=eq.'+encodeURIComponent(name)+'&limit=1',{headers:H}),
        fetch(U+'/rest/v1/menu_categories?select=id,restaurant_id,name,sort_order,is_active&is_active=eq.true&order=sort_order.asc',{headers:H}),
        fetch(U+'/rest/v1/menu_items?select=id,restaurant_id,category_id,name,description,price,image_url,is_available,sort_order&is_available=eq.true&order=sort_order.asc',{headers:H})
      ]);
      if(!rr.ok||!cc.ok||!ii.ok)throw Error('live menu fetch failed');
      const r=(await rr.json())[0], cats=await cc.json(), items=await ii.json();
      if(!r)return;
      const foods=items.filter(x=>String(x.restaurant_id)===String(r.id));
      const groups=cats.filter(x=>String(x.restaurant_id)===String(r.id)).map(c=>({id:c.id,name:c.name,foods:foods.filter(f=>String(f.category_id)===String(c.id))})).filter(g=>g.foods.length);
      const uncategorized=foods.filter(f=>!groups.some(g=>g.foods.some(x=>String(x.id)===String(f.id))));
      if(uncategorized.length)groups.push({id:'other',name:'Món khác',foods:uncategorized});
      render(r,groups);
    }catch(e){console.warn('CHOCO RESTAURANT LIVE',e);}
  }
  function render(r,groups){
    const app=document.getElementById('app');if(!app)return;
    const img=r.image_url||'';
    app.innerHTML='<div class="hero" style="background-image:url('+esc(img)+')"></div>'+
      '<section class="card"><div class="name">'+esc(r.name)+'</div><div class="rating">⭐ '+esc(r.rating||'Chưa có đánh giá')+' · '+esc(r.category||'Đồ ăn')+'</div><div class="status">'+(r.is_open?'🟢 Đang nhận đơn':'🔴 Tạm đóng')+'</div><div class="meta">🛵 Phí giao hàng tính theo khoảng cách<br>⏱️ Dự kiến giao: 20–40 phút</div></section>'+
      '<div class="tabs">'+groups.map((g,i)=>'<span onclick="document.getElementById(\'cat-'+i+'\')?.scrollIntoView({behavior:\'smooth\',block:\'start\'})">'+esc(g.name)+'</span>').join('')+'<span>⭐ Đánh giá</span></div>'+groups.map((g,i)=>'<div class="section" id="cat-'+i+'">🍽️ '+esc(g.name)+'</div>'+g.foods.map(f=>'<div class="food"><div style="flex:1"><b>'+esc(f.name)+'</b>'+(f.description?'<div class="meta">'+esc(f.description)+'</div>':'')+'<div class="price">'+money(f.price)+'</div></div><button class="add" onclick="window.__restaurantAdd('+Number(r.id)+','+Number(f.id)+')">+ Thêm</button></div>').join('')).join('')+
      '<div class="section">⭐ Đánh giá</div><div class="card"><b id="liveRatingSummary">⭐ '+esc(r.rating||'Chưa có đánh giá')+'</b><div class="meta">Khách hàng có thể đánh giá sau khi hoàn thành đơn.</div></div>'+
      '<div class="section">ℹ️ Thông tin cửa hàng</div><div class="card info">📍 Phú Quốc<br>'+ (r.is_open?'🕐 Đang mở cửa và nhận đơn':'🔴 Tạm đóng cửa') +'<br>💳 Tiền mặt / Chuyển khoản<div class="notice">💡 Chọn món rồi bấm <b>+ Thêm</b>. Giỏ hàng chỉ nhận món từ một quán trong mỗi đơn.</div></div>';
  }
  window.__restaurantAdd=function(rid,fid){
    const key='choco_customer_cart_v1';let c=[];try{c=JSON.parse(localStorage.getItem(key)||'[]')}catch{}
    if(!Array.isArray(c))c=[];
    const old=c.find(x=>String(x.restaurantId)===String(rid)&&String(x.foodId)===String(fid));
    if(c.length&&c.some(x=>String(x.restaurantId)!==String(rid))){if(!confirm('Giỏ hàng đang có món của quán khác. Xóa giỏ và thêm món này?'))return;c=[]}
    if(old)old.qty=Math.min(99,Number(old.qty||1)+1);
    else c.push({restaurantId:rid,foodId:fid,name:'Món ăn',price:0,qty:1});
    localStorage.setItem(key,JSON.stringify(c));
    alert('✅ Đã thêm món vào giỏ. Mở giỏ hàng để hoàn tất đơn.');
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,500));else setTimeout(load,500);
})();
