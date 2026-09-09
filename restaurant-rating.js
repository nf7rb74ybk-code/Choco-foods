/* CHOCO SHIP - PUBLIC RESTAURANT REVIEWS v3 */
'use strict';
(function(){
  if(window.__CHOCO_RESTAURANT_RATING_V3__)return;
  window.__CHOCO_RESTAURANT_RATING_V3__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
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
      const h={apikey:KEY,Accept:'application/json'};
      const [sr,rr]=await Promise.all([
        fetch(SB+'/rest/v1/rpc/get_restaurant_rating_summary',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({p_restaurant_id:id})}),
        fetch(SB+'/rest/v1/rpc/get_restaurant_reviews',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({p_restaurant_id:id,p_limit:20})})
      ]);
      if(!sr.ok||!rr.ok)throw Error('restaurant rating fetch failed');
      const x=(await sr.json())?.[0], reviews=await rr.json();
      if(!x)return;
      const avg=Number(x.avg_rating||0),count=Number(x.review_count||0);
      const box=document.getElementById('chocoLiveRating');
      if(box)box.innerHTML=count?'⭐ <b>'+avg.toFixed(1)+'/5</b> · '+count+' đánh giá':'⭐ Chưa có đánh giá';
      const detail=document.getElementById('chocoRatingDetail');
      if(detail)detail.innerHTML=count?'5★ '+(x.five_star||0)+' · 4★ '+(x.four_star||0)+' · 3★ '+(x.three_star||0)+' · 2★ '+(x.two_star||0)+' · 1★ '+(x.one_star||0):'';
      renderReviews(Array.isArray(reviews)?reviews:[]);
    }catch(e){console.warn('RESTAURANT RATING:',e)}
  }
  function renderReviews(rows){
    const box=document.getElementById('chocoReviewList');if(!box)return;
    if(!rows.length){box.innerHTML='<div class="meta">Chưa có nhận xét từ khách hàng.</div>';return;}
    box.innerHTML=rows.map(r=>{
      const stars='★'.repeat(Math.max(0,Math.min(5,Number(r.rating||0))))+'☆'.repeat(Math.max(0,5-Number(r.rating||0)));
      const text=String(r.comment||'').trim();
      const dt=r.created_at?new Date(r.created_at).toLocaleDateString('vi-VN'):'';
      return '<div style="padding:12px 0;border-top:1px solid #eee"><div style="color:#f59e0b;font-weight:800">'+stars+'</div>'+(text?'<div style="margin-top:5px;line-height:1.5">'+esc(text)+'</div>':'')+(dt?'<div style="margin-top:4px;font-size:12px;color:#777">'+dt+'</div>':'')+'</div>';
    }).join('');
  }
  function start(){
    const old=document.querySelector('.rating');
    if(old&&!document.getElementById('chocoLiveRating')){
      const live=document.createElement('div');live.id='chocoLiveRating';live.className='rating';old.replaceWith(live);
      const detail=document.createElement('div');detail.id='chocoRatingDetail';detail.className='meta';live.after(detail);
    }
    const section=document.querySelector('.section');
    if(section&&!document.getElementById('chocoReviewList')){
      const s=document.createElement('div');s.className='card';s.id='chocoReviewCard';s.innerHTML='<div id="chocoReviewList" class="meta">⏳ Đang tải nhận xét...</div>';
      const heading=document.createElement('div');heading.className='section';heading.textContent='💬 Nhận xét khách hàng';
      const info=document.querySelector('.info');
      if(info&&info.parentElement){info.parentElement.insertBefore(heading,info);info.parentElement.insertBefore(s,info);}
      else {document.querySelector('.wrap')?.append(heading,s);}
    }
    load();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,700));else setTimeout(start,700);
})();