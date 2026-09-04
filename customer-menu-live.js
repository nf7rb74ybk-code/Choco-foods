(()=>{'use strict';
if(window.__CHOCO_CUSTOMER_MENU_LIVE__)return;
window.__CHOCO_CUSTOMER_MENU_LIVE__=true;
const SB='https://guwdswqaqnhzqapflvey.supabase.co';
const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
const auth=()=>({apikey:KEY,Authorization:'Bearer '+(localStorage.getItem('choco_access_token')||''),Accept:'application/json'});
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const money=v=>Number(v||0).toLocaleString('vi-VN')+'đ';
let liveData=[];
async function get(path){const r=await fetch(SB+path,{headers:auth()});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function loadLiveMenu(){
 try{
  const [rs,cs,ms]=await Promise.all([
   get('/rest/v1/restaurants?select=id,name,category,description,image_url,banner_url,rating,is_open,delivery_fee,eta_min,eta_max&is_open=eq.true&order=name.asc'),
   get('/rest/v1/menu_categories?select=id,restaurant_id,name,sort_order,is_active&is_active=eq.true&order=sort_order.asc'),
   get('/rest/v1/menu_items?select=id,restaurant_id,category_id,name,description,price,image_url,is_available,sort_order&is_available=eq.true&order=sort_order.asc')
  ]);
  const cats=Array.isArray(cs)?cs:[],items=Array.isArray(ms)?ms:[];
  liveData=(Array.isArray(rs)?rs:[]).map(r=>({id:r.id,name:r.name,category:String(r.category||'').toLowerCase(),rating:String(r.rating??'0'),image:r.image_url||r.banner_url||'',foods:items.filter(f=>String(f.restaurant_id)===String(r.id)).map(f=>({id:f.id,name:f.name,price:Number(f.price||0),image:f.image_url||'',description:f.description||'',categoryId:f.category_id}))}));
  window.__CHOCO_LIVE_RESTAURANTS__=liveData;
  window.showRestaurants=render;
  window.add=addLive;
  render();
 }catch(e){console.warn('[CHOCO] Live menu unavailable, keeping fallback menu:',e)}
}
function currentCat(){const a=document.querySelector('.categories .active');return a?.getAttribute('data-cat')||'all'}
function render(){
 const box=document.getElementById('restaurants');if(!box)return;
 const search=String(document.getElementById('search')?.value||'').toLowerCase();const cat=currentCat();box.innerHTML='';
 liveData.forEach(r=>{
  if(cat!=='all'&&r.category!==cat)return;
  const foods=r.foods.filter(f=>!search||r.name.toLowerCase().includes(search)||f.name.toLowerCase().includes(search));if(search&&!foods.length)return;
  box.insertAdjacentHTML('beforeend',`<div class="restaurant"><div class="restaurant-head"><img class="restaurant-img" src="${esc(r.image)}" loading="lazy"><div class="restaurant-info"><div class="restaurant-name">${esc(r.name)}</div><div class="rating">⭐ ${esc(r.rating)}</div><div class="open">🟢 Đang nhận đơn</div></div></div>${foods.map(f=>`<div class="food"><div><div class="food-name">${esc(f.name)}</div><div class="price">${money(f.price)}</div></div><button class="add" onclick="add(${Number(r.id)},${Number(f.id)})">+ Thêm</button></div>`).join('')}</div>`);
 });
 if(!box.innerHTML)box.innerHTML='<div class="empty">📭 Hiện chưa có món đang bán.</div>';
}
function addLive(rid,fid){const r=liveData.find(x=>String(x.id)===String(rid));const f=r?.foods.find(x=>String(x.id)===String(fid));if(!r||!f)return;const item=window.__CHOCO_CART__?.find?.(x=>String(x.foodId)===String(f.id));if(typeof window.__CHOCO_ORIGINAL_ADD__==='function'){window.__CHOCO_ORIGINAL_ADD__(rid,fid);return}if(Array.isArray(window.cart)){const old=window.cart.find(x=>String(x.foodId)===String(f.id));if(old)old.qty++;else window.cart.push({restaurantId:r.id,restaurant:r.name,foodId:f.id,name:f.name,price:f.price,qty:1});window.updateCart?.();alert('✅ Đã thêm '+f.name)}}
const hookCategory=()=>{document.querySelectorAll('.categories button').forEach((b,i)=>{if(!b.hasAttribute('data-cat')){const cats=['all','cơm','bún','gà','đồ uống'];b.setAttribute('data-cat',cats[i]||'all')}b.addEventListener('click',()=>setTimeout(render,0))})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{hookCategory();loadLiveMenu()});else{hookCategory();loadLiveMenu()}
})();