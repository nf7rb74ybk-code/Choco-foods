/* CHOCO SHIP — CUSTOMER ORDER FORCE v19 */
'use strict';
(function(){
  if(window.__CHOCO_ORDER_FORCE_V19__)return;
  window.__CHOCO_ORDER_FORCE_V19__=true;
  const CHECKOUT='customer-checkout.js?v=20260907-9';
  const TRACKING='customer-tracking-timeline.js?v=20260906-12';
  const CHAT='customer-shipper-chat.js?v=20260909-3';
  const RATING='customer-shipper-rating.js?v=20260909-2';
  let loadingCheckout=false,loadingTracking=false,loadingChat=false,loadingRating=false;
  function loadScript(src,ready,flag,onDone){if(ready())return true;if(flag())return false;onDone(true);const s=document.createElement('script');s.src=src;s.async=false;s.onload=function(){onDone(false)};s.onerror=function(){onDone(false);console.error('[CHOCO] script load failed',src)};(document.head||document.documentElement).appendChild(s);return false}
  function loadCheckout(){return loadScript(CHECKOUT,()=>typeof window.createOrder==='function',()=>loadingCheckout,v=>loadingCheckout=v)}
  function loadTracking(){return loadScript(TRACKING,()=>window.__CHOCO_CUSTOMER_TRACKING_V4__===true,()=>loadingTracking,v=>loadingTracking=v)}
  function loadChat(){return loadScript(CHAT,()=>window.__CHOCO_CHAT__===true,()=>loadingChat,v=>loadingChat=v)}
  function loadRating(){return loadScript(RATING,()=>window.__CHOCO_SHIPPER_RATING__===true,()=>loadingRating,v=>loadingRating=v)}
  function bind(){const b=document.getElementById('orderButton');if(!b)return;b.type='button';b.disabled=false;b.style.pointerEvents='auto';b.removeAttribute('onclick');if(!b.__chocoOrderBoundV19__){b.__chocoOrderBoundV19__=true;b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(!loadCheckout()){setTimeout(()=>{if(typeof window.createOrder==='function')window.createOrder(e);else alert('❌ Không tải được chức năng đặt đơn. Vui lòng kiểm tra kết nối mạng rồi thử lại.')},1000);return}try{window.createOrder(e)}catch(err){console.error('[CHOCO ORDER FORCE]',err);alert('❌ Lỗi đặt đơn: '+(err?.message||err))}},false)}loadCheckout()}
  function addOrderNav(){const nav=document.querySelector('.bottom');if(!nav)return;let btn=nav.querySelector('[data-choco-order-nav]');if(!btn){btn=document.createElement('button');btn.type='button';btn.setAttribute('data-choco-order-nav','1');btn.innerHTML='<span>📦</span>Đơn hàng';btn.onclick=function(){loadTracking();setTimeout(()=>document.getElementById('customerOrderTimeline')?.scrollIntoView({behavior:'smooth',block:'start'}),150)};nav.insertBefore(btn,nav.children[2]||null)}}
  function boot(){loadTracking();bind();addOrderNav();loadChat();loadRating();[300,1000,2000,3500].forEach(ms=>{setTimeout(loadTracking,ms);setTimeout(bind,ms);setTimeout(addOrderNav,ms);setTimeout(loadChat,ms);setTimeout(loadRating,ms)})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();