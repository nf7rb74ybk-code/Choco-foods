/* CHOCO SHIP - PUBLIC RESTAURANT RATING v2 - DYNAMIC RESTAURANT ID */
'use strict';
(function(){
  if(window.__CHOCO_RESTAURANT_RATING__)return;
  window.__CHOCO_RESTAURANT_RATING__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  async function resolveId(){
    const qs=new URLSearchParams(location.search);
    const direct=qs.get('restaurant_id')||qs.get('restaurantId')||'';
    if(/^\d+$/.test(direct))return Number(direct);
    const name=qs.get('name')||'';
    if(!name)return null;
    const r=await fetch(SB+'/rest/v1/restaurants?select=id&name=eq.'+encodeURIComponent(name)+'&limit=1',{headers:{apikey:KEY}});
    if(!r.ok)return null;
    const rows=await r.json();
    return rows?.[0]?.id?Number(rows[0].id):null;
  }
  async function load(){
    try{
      const id=await resolveId();
      if(!id)return;
      const r=await fetch(SB+'/rest/v1/rpc/get_restaurant_rating_summary',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({p_restaurant_id:id})});
      if(!r.ok)throw Error(await r.text());
      const x=(await r.json())?.[0];
      if(!x)return;
      const avg=Number(x.avg_rating||0),count=Number(x.review_count||0);
      const box=document.getElementById('chocoLiveRating');
      if(!box)return;
      box.innerHTML=count?`⭐ <b>${avg.toFixed(1)}/5</b> · ${count} đánh giá`:'⭐ Chưa có đánh giá';
      const detail=document.getElementById('chocoRatingDetail');
      if(detail)detail.innerHTML=count?`5★ ${x.five_star||0} · 4★ ${x.four_star||0} · 3★ ${x.three_star||0} · 2★ ${x.two_star||0} · 1★ ${x.one_star||0}`:'';
    }catch(e){console.warn('RESTAURANT RATING:',e)}
  }
  function start(){
    const old=document.querySelector('.rating');
    if(old&&!document.getElementById('chocoLiveRating')){
      const live=document.createElement('div');live.id='chocoLiveRating';live.className='rating';old.replaceWith(live);
      const detail=document.createElement('div');detail.id='chocoRatingDetail';detail.className='meta';live.after(detail);
    }
    load();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();