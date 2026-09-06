/* CHOCO SHIP — CUSTOMER ORDER FORCE v11
 * Ensures checkout is loaded before the order button can be used.
 * Adds the 5-item customer bottom navigation: Home / Cart / Orders / GPS / Account.
 */
'use strict';
(function(){
  if(window.__CHOCO_ORDER_FORCE_V11__)return;
  window.__CHOCO_ORDER_FORCE_V11__=true;
  const CHECKOUT='customer-checkout.js?v=20260906-6';
  let loading=false;
  function loadCheckout(){
    if(typeof window.createOrder==='function')return true;
    if(loading)return false;
    loading=true;
    const s=document.createElement('script');
    s.src=CHECKOUT;
    s.async=false;
    s.onload=function(){loading=false;bind();};
    s.onerror=function(){loading=false;console.error('[CHOCO ORDER FORCE] checkout load failed',s.src);};
    (document.head||document.documentElement).appendChild(s);
    return false;
  }
  function bind(){
    const b=document.getElementById('orderButton');
    if(!b)return;
    b.type='button';
    b.disabled=false;
    b.style.pointerEvents='auto';
    b.removeAttribute('onclick');
    if(b.__chocoOrderBoundV11__)return;
    b.__chocoOrderBoundV11__=true;
    b.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.createOrder!=='function'){
        loadCheckout();
        setTimeout(function(){
          if(typeof window.createOrder==='function')window.createOrder(e);
          else alert('❌ Không tải được chức năng đặt đơn. Vui lòng kiểm tra kết nối mạng rồi thử lại.');
        },1000);
        return;
      }
      try{window.createOrder(e)}catch(err){console.error('[CHOCO ORDER FORCE]',err);alert('❌ Lỗi đặt đơn: '+(err?.message||err));}
    },false);
    if(typeof window.createOrder!=='function')loadCheckout();
  }
  function addOrderNav(){
    const nav=document.querySelector('.bottom');
    if(!nav||nav.querySelector('[data-choco-order-nav]'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.setAttribute('data-choco-order-nav','1');
    btn.innerHTML='<span>📦</span>Đơn hàng';
    btn.onclick=function(){
      const el=document.getElementById('customerOrderTimeline');
      if(el){el.scrollIntoView({behavior:'smooth',block:'start'});return;}
      const target=document.querySelector('[id*=Order],[class*=order]');
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    };
    nav.insertBefore(btn,nav.children[2]||null);
  }
  function boot(){
    bind();
    addOrderNav();
    setTimeout(bind,300);
    setTimeout(addOrderNav,300);
    setTimeout(bind,1000);
    setTimeout(addOrderNav,1000);
    setTimeout(bind,2000);
    setTimeout(addOrderNav,2000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
