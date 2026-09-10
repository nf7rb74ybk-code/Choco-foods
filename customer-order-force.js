/* CHOCO SHIP — CUSTOMER ORDER FORCE v21 */
'use strict';
(function(){
  if(window.__CHOCO_ORDER_FORCE_V21__)return;
  window.__CHOCO_ORDER_FORCE_V21__=true;
  const CHECKOUT='customer-checkout.js?v=20260907-9';
  const TRACKING='customer-tracking-timeline.js?v=20260906-12';
  const CHAT='customer-shipper-chat.js?v=20260909-3';
  const RATING='customer-shipper-rating.js?v=20260909-2';
  let loadingCheckout=false,loadingTracking=false,loadingChat=false,loadingRating=false;

  function showOrderLimitPopup(){
    let old=document.getElementById('chocoOrderLimitPopup');
    if(old){old.classList.add('show');return;}
    const style=document.createElement('style');
    style.id='chocoOrderLimitStyle';
    style.textContent=`
      #chocoOrderLimitPopup{display:none;position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:18px}
      #chocoOrderLimitPopup.show{display:flex;animation:chocoLimitFade .18s ease-out}
      #chocoOrderLimitPopup .choco-limit-card{width:min(100%,430px);background:#fff;border-radius:28px;padding:22px 20px 20px;box-shadow:0 24px 70px rgba(0,0,0,.25);text-align:center;transform:translateY(8px);animation:chocoLimitUp .22s ease-out forwards}
      #chocoOrderLimitPopup .choco-limit-art{height:155px;border-radius:22px;background:linear-gradient(180deg,#fff7ed,#f0fdf4);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:17px}
      #chocoOrderLimitPopup .choco-limit-art:before,#chocoOrderLimitPopup .choco-limit-art:after{content:'';position:absolute;border-radius:50%;background:rgba(16,185,129,.09)}
      #chocoOrderLimitPopup .choco-limit-art:before{width:150px;height:150px;left:-55px;bottom:-90px}
      #chocoOrderLimitPopup .choco-limit-art:after{width:130px;height:130px;right:-45px;top:-70px}
      #chocoOrderLimitPopup .choco-scooter{font-size:76px;line-height:1;filter:drop-shadow(0 7px 7px rgba(0,0,0,.13));position:relative;z-index:2}
      #chocoOrderLimitPopup .choco-limit-badge{position:absolute;right:24px;top:20px;background:#ff6b00;color:#fff;font-weight:800;font-size:19px;padding:10px 13px;border-radius:18px;box-shadow:0 7px 15px rgba(255,107,0,.25);z-index:3}
      #chocoOrderLimitPopup h2{font-size:24px;line-height:1.2;color:#172554;margin:0 0 10px;font-weight:800}
      #chocoOrderLimitPopup .choco-limit-text{font-size:16px;line-height:1.55;color:#475569;margin:0 auto 15px;max-width:370px}
      #chocoOrderLimitPopup .choco-limit-note{display:flex;align-items:center;text-align:left;gap:11px;background:#ecfdf5;border:1px solid #bbf7d0;color:#166534;border-radius:17px;padding:12px 14px;margin:0 0 18px;font-size:14px;line-height:1.4;font-weight:600}
      #chocoOrderLimitPopup .choco-limit-check{width:34px;height:34px;min-width:34px;border-radius:50%;background:#10b981;color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900}
      #chocoOrderLimitPopup .choco-limit-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #chocoOrderLimitPopup button{height:50px;border-radius:15px;font-size:15px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent}
      #chocoOrderLimitPopup .choco-limit-orders{background:#fff;color:#059669;border:2px solid #10b981}
      #chocoOrderLimitPopup .choco-limit-ok{background:#10b981;color:#fff;border:2px solid #10b981;box-shadow:0 7px 16px rgba(16,185,129,.22)}
      #chocoOrderLimitPopup button:active{transform:scale(.98)}
      @keyframes chocoLimitFade{from{opacity:0}to{opacity:1}}
      @keyframes chocoLimitUp{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:390px){#chocoOrderLimitPopup{padding:12px}#chocoOrderLimitPopup .choco-limit-card{border-radius:24px;padding:17px 15px 15px}#chocoOrderLimitPopup .choco-limit-art{height:135px}#chocoOrderLimitPopup .choco-scooter{font-size:65px}#chocoOrderLimitPopup h2{font-size:21px}#chocoOrderLimitPopup .choco-limit-text{font-size:15px}#chocoOrderLimitPopup .choco-limit-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    const box=document.createElement('div');
    box.id='chocoOrderLimitPopup';
    box.innerHTML=`
      <div class="choco-limit-card" role="dialog" aria-modal="true" aria-labelledby="chocoLimitTitle">
        <div class="choco-limit-art">
          <div class="choco-scooter" aria-hidden="true">🛵</div>
          <div class="choco-limit-badge">2/2</div>
        </div>
        <h2 id="chocoLimitTitle">Bạn đã đạt giới hạn đơn</h2>
        <p class="choco-limit-text">Để đảm bảo các đơn hàng được giao nhanh và chính xác, bạn vui lòng chờ một đơn hoàn tất hoặc bị huỷ trước khi đặt đơn mới nhé ❤️</p>
        <div class="choco-limit-note"><span class="choco-limit-check">✓</span><span>Đơn đã <b>hoàn thành</b> hoặc <b>bị huỷ</b> sẽ không tính vào giới hạn.</span></div>
        <div class="choco-limit-actions">
          <button type="button" class="choco-limit-orders" data-limit-orders>📦 Xem đơn hàng</button>
          <button type="button" class="choco-limit-ok" data-limit-ok>Đã hiểu</button>
        </div>
      </div>`;
    document.body.appendChild(box);
    const close=function(){box.classList.remove('show')};
    box.querySelector('[data-limit-ok]').onclick=close;
    box.querySelector('[data-limit-orders]').onclick=function(){
      close();
      try{loadTracking();}catch(e){}
      setTimeout(function(){
        const el=document.getElementById('customerOrderTimeline');
        if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
      },120);
    };
    box.addEventListener('click',function(e){if(e.target===box)close()});
    box.classList.add('show');
  }

  function installFriendlyAlerts(){
    if(window.__CHOCO_FRIENDLY_ALERTS__)return;
    window.__CHOCO_FRIENDLY_ALERTS__=true;
    const nativeAlert=window.alert.bind(window);
    window.alert=function(message){
      const text=String(message??'');
      if(text.includes('ACTIVE_ORDER_LIMIT_REACHED')){showOrderLimitPopup();return;}
      return nativeAlert(message);
    };
  }

  function loadScript(src,ready,flag,onDone){if(ready())return true;if(flag())return false;onDone(true);const s=document.createElement('script');s.src=src;s.async=false;s.onload=function(){onDone(false)};s.onerror=function(){onDone(false);console.error('[CHOCO] script load failed',src)};(document.head||document.documentElement).appendChild(s);return false}
  function loadCheckout(){return loadScript(CHECKOUT,()=>typeof window.createOrder==='function',()=>loadingCheckout,v=>loadingCheckout=v)}
  function loadTracking(){return loadScript(TRACKING,()=>window.__CHOCO_CUSTOMER_TRACKING_V4__===true,()=>loadingTracking,v=>loadingTracking=v)}
  function loadChat(){return loadScript(CHAT,()=>window.__CHOCO_CHAT__===true,()=>loadingChat,v=>loadingChat=v)}
  function loadRating(){return loadScript(RATING,()=>window.__CHOCO_SHIPPER_RATING__===true,()=>loadingRating,v=>loadingRating=v)}
  function bind(){const b=document.getElementById('orderButton');if(!b)return;b.type='button';b.disabled=false;b.style.pointerEvents='auto';b.removeAttribute('onclick');if(!b.__chocoOrderBoundV21__){b.__chocoOrderBoundV21__=true;b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(!loadCheckout()){setTimeout(()=>{if(typeof window.createOrder==='function')window.createOrder(e);else alert('❌ Không tải được chức năng đặt đơn. Vui lòng kiểm tra kết nối mạng rồi thử lại.')},1000);return}try{window.createOrder(e)}catch(err){console.error('[CHOCO ORDER FORCE]',err);alert('❌ Lỗi đặt đơn: '+(err?.message||err))}},false)}loadCheckout()}
  function addOrderNav(){const nav=document.querySelector('.bottom');if(!nav)return;let btn=nav.querySelector('[data-choco-order-nav]');if(!btn){btn=document.createElement('button');btn.type='button';btn.setAttribute('data-choco-order-nav','1');btn.innerHTML='<span>📦</span>Đơn hàng';btn.onclick=function(){loadTracking();setTimeout(()=>document.getElementById('customerOrderTimeline')?.scrollIntoView({behavior:'smooth',block:'start'}),150)};nav.insertBefore(btn,nav.children[2]||null)}}
  function boot(){installFriendlyAlerts();loadTracking();bind();addOrderNav();loadChat();loadRating();[300,1000,2000,3500].forEach(ms=>{setTimeout(loadTracking,ms);setTimeout(bind,ms);setTimeout(addOrderNav,ms);setTimeout(loadChat,ms);setTimeout(loadRating,ms)})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();