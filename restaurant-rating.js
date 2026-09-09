/* CHOCO SHIP - PUBLIC RESTAURANT REVIEWS v4 */
'use strict';
(function(){
  if(window.__CHOCO_RESTAURANT_RATING_V4__)return;
  window.__CHOCO_RESTAURANT_RATING_V4__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let loadedId=null;

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

  function ensureReviewUI(){
    if(document.getElementById('chocoReviewList'))return true;
    const summary=document.getElementById('liveRatingSummary');
    if(!summary)return false;
    const ratingCard=summary.closest('.card');
    if(!ratingCard)return false;
    const heading=document.createElement('div');
    heading.className='section';
    heading.id='chocoReviewHeading';
    heading.textContent='💬 Nhận xét khách hàng';
    const card=document.createElement('div');
    card.className='card';
    card.id='chocoReviewCard';
    card.innerHTML='<div id="chocoReviewList" class="meta">⏳ Đang tải nhận xét...</div>';
    ratingCard.after(heading,card);
    return true;
  }

  function renderReviews(rows){
    const box=document.getElementById('chocoReviewList');
    if(!box)return;
    if(!rows.length){
      box.innerHTML='<div class="meta">Chưa có nhận xét từ khách hàng.</div>';
      return;
    }
    box.innerHTML=rows.map(r=>{
      const n=Math.max(0,Math.min(5,Number(r.rating||0)));
      const stars='★'.repeat(n)+'☆'.repeat(5-n);
      const text=String(r.comment||'').trim();
      const dt=r.created_at?new Date(r.created_at).toLocaleDateString('vi-VN'):'';
      return '<div style="padding:12px 0;border-top:1px solid #eee">'
        +'<div style="color:#f59e0b;font-weight:800;letter-spacing:1px">'+stars+'</div>'
        +(text?'<div style="margin-top:5px;line-height:1.5">'+esc(text)+'</div>':'')
        +(dt?'<div style="margin-top:4px;font-size:12px;color:#777">'+esc(dt)+'</div>':'')
        +'</div>';
    }).join('');
  }

  async function load(){
    try{
      const id=await resolveId();
      if(!id)return;
      if(!ensureReviewUI())return;
      const h={apikey:KEY,Accept:'application/json'};
      const [sr,rr]=await Promise.all([
        fetch(SB+'/rest/v1/rpc/get_restaurant_rating_summary',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({p_restaurant_id:id})}),
        fetch(SB+'/rest/v1/rpc/get_restaurant_reviews',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({p_restaurant_id:id,p_limit:20})})
      ]);
      if(!sr.ok||!rr.ok)throw Error('restaurant rating fetch failed');
      const x=(await sr.json())?.[0];
      const reviews=await rr.json();
      if(!x)return;
      const avg=Number(x.avg_rating||0),count=Number(x.review_count||0);
      const box=document.getElementById('liveRatingSummary');
      if(box)box.innerHTML=count?'⭐ <b>'+avg.toFixed(1)+'/5</b> · '+count+' đánh giá':'⭐ Chưa có đánh giá';
      const detail=document.getElementById('chocoRatingDetail');
      if(detail)detail.innerHTML=count?'5★ '+(x.five_star||0)+' · 4★ '+(x.four_star||0)+' · 3★ '+(x.three_star||0)+' · 2★ '+(x.two_star||0)+' · 1★ '+(x.one_star||0):'';
      renderReviews(Array.isArray(reviews)?reviews:[]);
      loadedId=id;
    }catch(e){console.warn('RESTAURANT RATING:',e)}
  }

  function boot(){
    const app=document.getElementById('app');
    if(!app)return;
    const observer=new MutationObserver(()=>{
      if(document.getElementById('liveRatingSummary')){
        ensureReviewUI();
        if(loadedId===null)load();
        observer.disconnect();
      }
    });
    observer.observe(app,{childList:true,subtree:true});
    ensureReviewUI();
    load();
    setTimeout(()=>observer.disconnect(),15000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();