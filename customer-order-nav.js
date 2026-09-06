/* CHOCO SHIP — Customer Order Nav v1
   Adds the 5th bottom navigation item without changing the existing customer UI. */
(function(){
  'use strict';
  function addOrderNav(){
    var nav=document.querySelector('.bottom');
    if(!nav || nav.querySelector('[data-choco-order-nav]')) return;
    var btn=document.createElement('button');
    btn.type='button';
    btn.setAttribute('data-choco-order-nav','1');
    btn.onclick=function(){
      var el=document.getElementById('customerOrderTimeline');
      if(el){ el.scrollIntoView({behavior:'smooth',block:'start'}); return; }
      window.location.hash='orders';
      var timeline=document.querySelector('[id*=Order],[class*=order]');
      if(timeline) timeline.scrollIntoView({behavior:'smooth',block:'start'});
    };
    btn.innerHTML='<span>📦</span>Đơn hàng';
    nav.insertBefore(btn, nav.children[2] || null);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addOrderNav);
  else addOrderNav();
  window.addEventListener('load',addOrderNav);
})();
