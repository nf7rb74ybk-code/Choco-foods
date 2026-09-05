/* CHOCO SHIP - Customer cart UX v1 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_CART__) return;
  window.__CHOCO_CUSTOMER_CART__=true;
  const KEY='choco_customer_cart_v1';
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(window.cart||[]));}catch(e){}};
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  function safeQty(v){return Math.max(1,Math.min(99,Number(v)||1));}
  window.__CHOCO_CART_SAVE__=save;
  function render(){
    const b=document.getElementById('cartItems');
    if(!b)return;
    const c=Array.isArray(window.cart)?window.cart:[];
    if(!c.length){
      b.innerHTML='<div class="empty">🛒 Giỏ hàng đang trống.<br>Hãy chọn món để bắt đầu.</div>';
      if(typeof window.updateShippingDisplay==='function')window.updateShippingDisplay();
      return;
    }
    b.innerHTML=c.map((x,i)=>{
      const q=safeQty(x.qty), sub=Number(x.price||0)*q;
      return '<div class="cart-item"><div style="flex:1"><b>'+String(x.name||'Món ăn').replace(/[&<>\"\']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]))+'</b><div style="color:#ff5a00;font-weight:bold;margin-top:4px">'+money(x.price)+'</div><div style="font-size:12px;color:#777;margin-top:3px">'+String(x.restaurant||'').replace(/[&<>\"\']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]))+'</div></div><div style="text-align:right"><div class="qty"><button type="button" data-cart-action="minus" data-cart-index="'+i+'">−</button><strong>'+q+'</strong><button type="button" data-cart-action="plus" data-cart-index="'+i+'">+</button></div><div style="font-weight:bold;margin-top:6px">'+money(sub)+'</div><button type="button" data-cart-action="remove" data-cart-index="'+i+'" style="border:0;background:none;color:#dc2626;font-size:12px;margin-top:5px">Xóa</button></div></div>';
    }).join('');
    if(typeof window.updateShippingDisplay==='function')window.updateShippingDisplay();
  }
  window.renderCart=render;
  window.updateCart=function(){
    const c=Array.isArray(window.cart)?window.cart:[];
    const count=c.reduce((s,x)=>s+safeQty(x.qty),0);
    const el=document.getElementById('count'); if(el)el.innerText=count;
    save();
    if(typeof window.updateShippingDisplay==='function')window.updateShippingDisplay();
  };
  window.add=function(rid,fid){
    const d=Array.isArray(window.data)?window.data:[];
    const r=d.find(x=>String(x.id)===String(rid));
    const f=r?.foods?.find(x=>String(x.id)===String(fid));
    if(!r||!f)return;
    const c=Array.isArray(window.cart)?window.cart:[];
    if(c.length && String(c[0].restaurantId)!==String(r.id)){
      if(!confirm('Giỏ hàng đang có món của quán khác. Xóa giỏ và thêm món này?'))return;
      c.length=0;
    }
    const old=c.find(x=>String(x.foodId)===String(f.id));
    if(old)old.qty=safeQty(old.qty)+1;
    else c.push({restaurantId:r.id,restaurant:r.name,foodId:f.id,name:f.name,price:Number(f.price||0),qty:1});
    window.cart=c;
    window.updateCart();
    render();
  };
  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-cart-action]');
    if(!b)return;
    e.preventDefault();
    const i=Number(b.dataset.cartIndex),action=b.dataset.cartAction,c=window.cart;
    if(!Array.isArray(c)||!c[i])return;
    if(action==='plus')c[i].qty=safeQty(c[i].qty)+1;
    else if(action==='minus'){c[i].qty=safeQty(c[i].qty)-1;if(c[i].qty<1)c.splice(i,1);}
    else if(action==='remove')c.splice(i,1);
    window.cart=c;
    window.updateCart();
    render();
  });
  function restore(){
    try{
      const raw=localStorage.getItem(KEY); if(!raw)return;
      const saved=JSON.parse(raw);
      if(!Array.isArray(saved))return;
      window.cart=saved.filter(x=>x&&x.foodId&&x.restaurantId).map(x=>({...x,qty:safeQty(x.qty),price:Number(x.price||0)}));
      window.updateCart();
    }catch(e){console.warn('CHOCO CART RESTORE',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore);else restore();
})();
