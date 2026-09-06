/* CHOCO SHIP — CUSTOMER ORDER FORCE v9
 * Ensures checkout is loaded before the order button can be used.
 */
'use strict';
(function(){
  if(window.__CHOCO_ORDER_FORCE_V9__)return;
  window.__CHOCO_ORDER_FORCE_V9__=true;
  const CHECKOUT='customer-checkout.js?v=20260906-5';
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
    if(b.__chocoOrderBoundV9__)return;
    b.__chocoOrderBoundV9__=true;
    b.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.createOrder!=='function'){
        loadCheckout();
        setTimeout(function(){
          if(typeof window.createOrder==='function')window.createOrder(e);
          else alert('❌ Không tải được chức năng đặt đơn. Vui lòng kiểm tra kết nối mạng rồi thử lại.');
        },800);
        return;
      }
      try{window.createOrder(e)}catch(err){console.error('[CHOCO ORDER FORCE]',err);alert('❌ Lỗi đặt đơn: '+(err?.message||err));}
    },false);
    if(typeof window.createOrder!=='function')loadCheckout();
  }
  function boot(){bind();setTimeout(bind,300);setTimeout(bind,1000);setTimeout(bind,2000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
