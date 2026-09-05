/* CHOCO SHIP — CUSTOMER ADD FIX v2
   Final click handler for live menu + shared cart.
*/
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_ADD_FIX_V2__) return;
  window.__CHOCO_CUSTOMER_ADD_FIX_V2__=true;
  const KEY='choco_customer_cart_v1';
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const safeQty=v=>Math.max(1,Math.min(99,Number(v)||1));
  function readCart(){
    try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[];}catch{return [];}
  }
  function save(c){
    window.cart=c;
    try{localStorage.setItem(KEY,JSON.stringify(c));}catch{}
    if(typeof window.updateCart==='function')window.updateCart();
    if(typeof window.renderCart==='function')window.renderCart();
  }
  function findFood(rid,fid){
    const live=Array.isArray(window.__CHOCO_LIVE_MENU__)?window.__CHOCO_LIVE_MENU__:[];
    const r=live.find(x=>String(x.id)===String(rid));
    const f=r?.foods?.find(x=>String(x.id)===String(fid));
    return r&&f?{r,f}:null;
  }
  window.add=function(rid,fid){
    const found=findFood(rid,fid);
    if(!found){
      console.error('[CHOCO ADD] Không tìm thấy món',rid,fid);
      alert('❌ Không tìm thấy món. Vui lòng tải lại trang.');
      return;
    }
    const {r,f}=found;
    let c=readCart();
    const different=c.find(x=>String(x.restaurantId)!==String(r.id));
    if(different){
      if(!confirm('Giỏ hàng đang có món của quán khác. Xóa giỏ và thêm món này?'))return;
      c=[];
    }
    const old=c.find(x=>String(x.foodId)===String(f.id));
    if(old)old.qty=safeQty(old.qty)+1;
    else c.push({restaurantId:r.id,restaurant:r.name,foodId:f.id,name:f.name,price:Number(f.price||0),qty:1});
    save(c);
    const count=c.reduce((s,x)=>s+safeQty(x.qty),0);
    const el=document.getElementById('count');if(el)el.innerText=count;
    console.log('[CHOCO ADD OK]',f.name,c);
    alert('✅ Đã thêm '+f.name+' vào giỏ hàng');
  };
  function sync(){
    const c=readCart();window.cart=c;
    const el=document.getElementById('count');if(el)el.innerText=c.reduce((s,x)=>s+safeQty(x.qty),0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
})();
