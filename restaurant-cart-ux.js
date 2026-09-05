/* CHOCO SHIP — Restaurant Cart UX v1 */
'use strict';
(function(){
  if(window.__CHOCO_RESTAURANT_CART_UX__) return;
  window.__CHOCO_RESTAURANT_CART_UX__=true;
  const KEY='choco_customer_cart_v1';
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  function render(){
    let c=read();let old=document.getElementById('restaurantCartBar');
    if(!c.length){if(old)old.remove();return}
    const count=c.reduce((s,x)=>s+Math.max(1,Number(x.qty)||1),0);
    const total=c.reduce((s,x)=>s+Number(x.price||0)*Math.max(1,Number(x.qty)||1),0);
    if(!old){old=document.createElement('div');old.id='restaurantCartBar';document.body.appendChild(old)}
    old.style.cssText='position:fixed;left:12px;right:12px;bottom:14px;z-index:9999;max-width:676px;margin:auto;background:#16a34a;color:#fff;border-radius:14px;padding:11px 14px;box-shadow:0 6px 22px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:700;cursor:pointer;';
    old.innerHTML='<span>🛒 '+count+' món · '+money(total)+'</span><span>THANH TOÁN →</span>';
    old.onclick=()=>{location.href='./customer.html?openCart=1'};
  }
  window.addEventListener('storage',render);
  document.addEventListener('DOMContentLoaded',render);
  setInterval(render,1500);
})();
