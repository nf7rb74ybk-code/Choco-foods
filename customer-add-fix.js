/* CHOCO SHIP — CUSTOMER CART/ADD FIX v8
 * Cart is owned here. Checkout remains owned by customer-checkout.js.
 */
'use strict';
(function(){
  const KEY='choco_customer_cart_v1';
  const qty=v=>Math.max(1,Math.min(99,Number(v)||1));
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const foods=()=>{const rows=Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[];return rows.flatMap(r=>(r.foods||[]).map(f=>({...f,restaurantId:r.id,restaurant:r.name})))};
  function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  function normalize(c){return (Array.isArray(c)?c:[]).map(x=>({...x,restaurantId:Number(x.restaurantId??x.restaurant_id),foodId:Number(x.foodId??x.food_id),price:Number(x.price||0),qty:qty(x.qty??x.quantity)})).filter(x=>Number.isInteger(x.restaurantId)&&x.restaurantId>0&&Number.isInteger(x.foodId)&&x.foodId>0)}
  function write(c){const n=normalize(c);window.cart=n;try{localStorage.setItem(KEY,JSON.stringify(n))}catch{}return n}
  function total(c){return normalize(c).reduce((s,x)=>s+x.price*x.qty,0)}
  function sync(){const c=read(),count=c.reduce((s,x)=>s+qty(x.qty),0),ce=document.getElementById('count');if(ce)ce.textContent=count;const food=total(c);const ship=Number(String(document.getElementById('shippingFee')?.textContent||'20000').replace(/[^0-9]/g,''))||20000;[['foodTotal',food],['shippingTotal',ship],['total',food+ship]].forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=money(v)});return c}
  function render(){const c=sync(),box=document.getElementById('cartItems');if(!box)return;if(!c.length){box.innerHTML='<div class="empty">🛒 Giỏ hàng đang trống.</div>';return}box.innerHTML=c.map((x,i)=>'<div class="cart-item"><div style="flex:1"><b>'+esc(x.name||'Món ăn')+'</b><div style="color:#ff5a00;font-weight:bold;margin-top:4px">'+money(x.price)+'</div></div><div class="qty"><button type="button" data-ci="'+i+'" data-cd="-1">−</button><b>'+qty(x.qty)+'</b><button type="button" data-ci="'+i+'" data-cd="1">+</button><button type="button" data-ci="'+i+'" data-cr="1">🗑️</button></div></div>').join('')}
  window.add=function(rid,fid){const rs=Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[],r=rs.find(x=>String(x.id)===String(rid)),f=r?.foods?.find(x=>String(x.id)===String(fid));if(!r||!f){alert('❌ Không tìm thấy món.');return}let c=read();if(c.length&&c.some(x=>String(x.restaurantId)!==String(r.id))){if(!confirm('Giỏ hàng đang có món của quán khác. Xóa giỏ và thêm món này?'))return;c=[]}const old=c.find(x=>String(x.foodId)===String(f.id));if(old)old.qty=qty(old.qty)+1;else c.push({restaurantId:Number(r.id),restaurant:r.name,foodId:Number(f.id),name:f.name,price:Number(f.price||0),qty:1});write(c);render();alert('✅ Đã thêm '+f.name+' vào giỏ hàng')};
  window.renderCart=render;
  window.updateCart=function(){write(read());render()};
  window.openCart=function(){render();const m=document.getElementById('modal');if(m)m.style.display='flex'};
  window.closeCart=function(){const m=document.getElementById('modal');if(m)m.style.display='none'};
  document.addEventListener('click',e=>{const b=e.target.closest('[data-ci]');if(!b)return;const i=Number(b.dataset.ci),c=read();if(!c[i])return;if(b.dataset.cr)c.splice(i,1);else c[i].qty=qty(c[i].qty)+Number(b.dataset.cd||0);if(c[i]?.qty<1)c.splice(i,1);write(c);render()});
  function restore(){const c=read();window.cart=normalize(c);sync()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else restore();
})();
