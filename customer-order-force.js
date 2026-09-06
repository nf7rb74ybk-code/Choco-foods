/* CHOCO SHIP — CUSTOMER ORDER FORCE COMPATIBILITY SHIM v8
 * Guarantees the ĐẶT ĐƠN button has a live click path even when an older
 * cached customer-checkout.js is present. Does not duplicate checkout calls.
 */
'use strict';
(function(){
  if(window.__CHOCO_ORDER_FORCE_V8__)return;
  window.__CHOCO_ORDER_FORCE_V8__=true;
  function bind(){
    const b=document.getElementById('orderButton');
    if(!b||b.__chocoOrderBound)return;
    b.__chocoOrderBound=true;
    b.type='button';
    b.disabled=false;
    b.style.pointerEvents='auto';
    b.removeAttribute('onclick');
    b.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.createOrder==='function'){
        try{window.createOrder(e)}catch(err){console.error('[CHOCO ORDER FORCE]',err);alert('❌ Lỗi đặt đơn: '+(err?.message||err))}
      }else{
        alert('⚠️ Chức năng đặt đơn chưa tải xong. Vui lòng tải lại trang rồi thử lại.');
      }
    },false);
  }
  function boot(){bind();setTimeout(bind,300);setTimeout(bind,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
