/* CHOCO SHIP - CUSTOMER LIVE TRACKING v7
 * FIX v7: customer.html uses MapLibre, not Leaflet.
 * FIX: fetches the customer's own order GPS so the route can be drawn.
 * Tracks order status + shipper GPS + online state + distance + ETA.
 */
'use strict';
(function(){
  if(window.__CHOCO_CUSTOMER_TRACKING_V7__)return;
  window.__CHOCO_CUSTOMER_TRACKING_V7__=true;
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const AUTH_KEY='sb-guwdswqaqnhzqapflvey-auth-token';
  const POLL=10000, ROUTE=30000;
  let timer=null,map=null,mapReady=null,shipperMarker=null,customerMarker=null,lastRoute=0,lastKey='',refreshing=false;
  const esc=x=>String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const dist=(a,b,c,d)=>{const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,q=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));};
  function jwt(t){try{const p=String(t||'').split('.')[1];if(!p)return null;return JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-p.length%4)%4)));}catch{return null}}
  function standardSession(){try{let s=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');if(s?.session)s=s.session;return s&&s.access_token?s:null}catch{return null}}
  function order(){try{return JSON.parse(localStorage.getItem('choco_ship_last_order')||'null')}catch{return null}}
  function auth(){
    const custom=localStorage.getItem('choco_access_token')||'';
    const standard=standardSession();
    const candidates=[];
    if(standard?.access_token)candidates.push({token:standard.access_token,refresh:standard.refresh_token||'',user:standard.user||null});
    if(custom)candidates.push({token:custom,refresh:localStorage.getItem('choco_refresh_token')||'',user:null});
    const chosen=candidates[0]||null;
    if(!chosen)return{token:'',id:'',refresh:'',email:'',user:null};
    const p=jwt(chosen.token);
    return{token:chosen.token,id:String(p?.sub||chosen.user?.id||''),refresh:chosen.refresh||'',email:chosen.user?.email||localStorage.getItem('choco_email')||'',user:chosen.user||null};
  }
  function saveSession(j){
    if(j.access_token)localStorage.setItem('choco_access_token',j.access_token);
    if(j.refresh_token)localStorage.setItem('choco_refresh_token',j.refresh_token);
    const id=String(j.user?.id||jwt(j.access_token)?.sub||'');
    if(id)localStorage.setItem('choco_user_id',id);
    if(j.user?.email)localStorage.setItem('choco_email',j.user.email);
    localStorage.setItem('choco_role','customer');
    try{localStorage.setItem(AUTH_KEY,JSON.stringify(j));}catch(e){console.warn('AUTH STORAGE:',e)}
  }
  async function refreshAccess(){
    if(refreshing)return false;
    const a=auth();if(!a.refresh)return false;
    refreshing=true;
    try{
      const r=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY},body:JSON.stringify({refresh_token:a.refresh})});
      const j=await r.json();if(!r.ok||!j.access_token)throw Error(j.error_description||j.msg||'Refresh session failed');saveSession(j);return true;
    }catch(e){console.warn('CUSTOMER SESSION REFRESH:',e);return false}finally{refreshing=false}
  }
  function loginBox(){
    if(document.getElementById('ctLogin'))return;
    const d=document.createElement('div');d.id='ctLogin';d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999999;display:flex;align-items:center;justify-content:center;padding:18px';
    d.innerHTML='<div style="width:100%;max-width:420px;background:#fff;border-radius:20px;padding:22px"><div style="font-size:24px;font-weight:900;color:#ff6b00;text-align:center">🍔 CHOCO SHIP</div><div style="font-weight:800;margin:15px 0 8px">🔐 Đăng nhập để theo dõi đơn</div><input id="ctEmail" type="email" placeholder="Email" autocomplete="username" style="width:100%;padding:13px;margin-top:12px;border:1px solid #ddd;border-radius:10px;font-size:16px"><input id="ctPass" type="password" placeholder="Mật khẩu" autocomplete="current-password" style="width:100%;padding:13px;margin-top:9px;border:1px solid #ddd;border-radius:10px;font-size:16px"><button id="ctLoginBtn" style="width:100%;padding:13px;margin-top:12px;border:0;border-radius:10px;background:#ff6b00;color:#fff;font-weight:800;font-size:16px">🔐 ĐĂNG NHẬP</button><div id="ctLoginMsg" style="margin-top:10px;color:#991b1b"></div></div>';
    document.body.appendChild(d);
    document.getElementById('ctLoginBtn').onclick=async()=>{const b=document.getElementById('ctLoginBtn'),m=document.getElementById('ctLoginMsg');b.disabled=true;b.textContent='⏳ ĐANG ĐĂNG NHẬP...';try{const email=document.getElementById('ctEmail').value.trim().toLowerCase(),password=document.getElementById('ctPass').value;if(!email||!password)throw Error('Vui lòng nhập email và mật khẩu.');const r=await fetch(SB+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY},body:JSON.stringify({email,password})}),j=await r.json();if(!r.ok)throw Error(j.error_description||j.msg||j.message||'Email hoặc mật khẩu không đúng.');saveSession(j);d.remove();await refresh(true)}catch(e){m.textContent='❌ '+e.message;b.disabled=false;b.textContent='🔐 ĐĂNG NHẬP'}};
  }
  function inject(){
    if(document.getElementById('customerTrackingBox'))return;
    const s=document.createElement('style');s.textContent='#customerTrackingBox{background:#fff;border-radius:15px;padding:14px;margin:12px 0;box-shadow:0 2px 8px #ddd}#customerTrackingMap{height:300px;border-radius:12px;margin-top:10px;overflow:hidden}.ct-status{padding:10px;border-radius:10px;background:#eff6ff;color:#1d4ed8;line-height:1.5}.ct-btn{width:100%;border:0;border-radius:10px;padding:12px;margin-top:10px;background:#1677ff;color:#fff;font-weight:800}.ct-muted{font-size:12px;color:#666;margin-top:7px}';document.head.appendChild(s);
    const b=document.createElement('section');b.id='customerTrackingBox';b.innerHTML='<div style="font-size:19px;font-weight:800">🚚 Theo dõi Shipper</div><div id="customerTrackingStatus" class="ct-status" style="margin-top:10px">📦 Chưa có đơn đang theo dõi.</div><div id="customerTrackingMap"></div><button id="customerTrackingRefresh" class="ct-btn">🔄 CẬP NHẬT VỊ TRÍ</button><div class="ct-muted">🔐 Chỉ tài khoản khách sở hữu đơn mới xem được vị trí Shipper.</div>';
    document.querySelector('.container')?.insertBefore(b,document.querySelector('.container').firstChild);
    document.getElementById('customerTrackingRefresh').onclick=()=>refresh(true);
  }
  async function initMap(){
    if(map&&mapReady)return mapReady;
    const el=document.getElementById('customerTrackingMap');
    if(!el||!window.maplibregl){throw Error('MapLibre chưa sẵn sàng');}
    mapReady=new Promise((resolve,reject)=>{
      try{
        map=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/liberty',center:[103.984,10.2899],zoom:12});
        map.addControl(new maplibregl.NavigationControl(),'top-right');
        map.on('load',()=>resolve(map));
        map.on('error',e=>console.warn('[CHOCO TRACK MAP]',e?.error||e));
      }catch(e){reject(e)}
    });
    return mapReady;
  }
  function setMarker(old,lat,lng,color,title){
    const popup=new maplibregl.Popup({offset:25}).setHTML(title);
    if(old){old.setLngLat([lng,lat]).setPopup(popup);return old}
    return new maplibregl.Marker({color}).setLngLat([lng,lat]).setPopup(popup).addTo(map);
  }
  function setRoute(points){
    const data={type:'Feature',geometry:{type:'LineString',coordinates:points},properties:{}};
    const src=map.getSource('choco-live-route');
    if(src){src.setData(data);return}
    map.addSource('choco-live-route',{type:'geojson',data});
    map.addLayer({id:'choco-live-route-line',type:'line',source:'choco-live-route',paint:{'line-color':'#1677ff','line-width':5,'line-opacity':0.85}});
  }
  function fit(slat,slng,clat,clng){
    const a=Math.min(slng,clng),b=Math.min(slat,clat),c=Math.max(slng,clng),d=Math.max(slat,clat);
    map.fitBounds([[a,b],[c,d]],{padding:45,maxZoom:16,duration:500});
  }
  async function tracking(){
    const a=auth(),o=order();
    if(!a.token||!a.id)return{auth:false};
    let r=await fetch(SB+'/rest/v1/rpc/get_my_shipper_tracking',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+a.token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_order_code:o?.code||''})});
    if(r.status===401){if(await refreshAccess()){const b=auth();r=await fetch(SB+'/rest/v1/rpc/get_my_shipper_tracking',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+b.token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_order_code:o?.code||''})});}else return{auth:false,expired:true}}
    if(!r.ok)throw Error('Tracking HTTP '+r.status);
    const rows=await r.json();return{auth:true,data:Array.isArray(rows)?rows[0]:rows};
  }
  async function orderGeo(){
    const a=auth(),o=order();if(!a.token||!o)return null;
    const key=o.order_id?'id=eq.'+encodeURIComponent(o.order_id):'code=eq.'+encodeURIComponent(o.code||'');
    const r=await fetch(SB+'/rest/v1/orders?select=id,code,latitude,longitude&'+key+'&limit=1',{headers:{apikey:KEY,Authorization:'Bearer '+a.token,Accept:'application/json'}});
    if(!r.ok)return null;const rows=await r.json();const x=rows?.[0];if(!x)return null;
    const lat=Number(x.latitude),lng=Number(x.longitude);return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
  }
  async function road(slat,slng,clat,clng,manual){
    const key=[slat.toFixed(5),slng.toFixed(5),clat.toFixed(5),clng.toFixed(5)].join(',');
    if(!manual&&key===lastKey&&Date.now()-lastRoute<ROUTE)return;
    try{
      const r=await fetch('https://router.project-osrm.org/route/v1/driving/'+slng+','+slat+';'+clng+','+clat+'?overview=full&geometries=geojson&steps=false');
      const d=await r.json();if(d.code!=='Ok'||!d.routes?.[0])throw Error('route');
      const rt=d.routes[0],pts=rt.geometry.coordinates;setRoute(pts);lastRoute=Date.now();lastKey=key;
      const st=document.getElementById('customerTrackingStatus');if(st){const km=(rt.distance/1000).toFixed(1),min=Math.max(1,Math.round(rt.duration/60));st.innerHTML+='<br>🛣️ Tuyến thực tế: <b>'+km+' km</b> • ⏱️ ETA khoảng <b>'+min+' phút</b>'}
    }catch(e){setRoute([[slng,slat],[clng,clat]]);const st=document.getElementById('customerTrackingStatus');if(st)st.innerHTML+='<br>📏 Khoảng cách đường chim bay: <b>'+dist(slat,slng,clat,clng).toFixed(1)+' km</b>';}
  }
  async function refresh(manual){
    const st=document.getElementById('customerTrackingStatus');if(!st)return;const o=order();if(!o?.code){st.innerHTML='📦 Chưa có đơn đang theo dõi.';return}
    try{
      const x=await tracking();
      if(!x.auth){st.innerHTML='🔐 <b>Phiên đăng nhập khách chưa sẵn sàng.</b><br>Đăng nhập đúng tài khoản đã đặt đơn để xem Shipper.';loginBox();return}
      const t=x.data;
      if(!t){st.innerHTML='🔒 Không có quyền xem tracking đơn <b>'+esc(o.code)+'</b>.';return}
      const status=String(t.order_status||t.status||'').trim();
      if(status==='Hoàn thành'){st.innerHTML='✅ <b>'+esc(o.code)+'</b><br>Đơn hàng đã <b>Hoàn thành</b>.<br>🎉 Cảm ơn bạn đã sử dụng CHOCO SHIP!';if(timer){clearInterval(timer);timer=null}return}
      if(status==='Đã giao'){st.innerHTML='🏁 <b>'+esc(o.code)+'</b><br>Đơn đã <b>Đã giao</b>. Shipper đã hoàn tất giao hàng.';return}
      if(!t.shipper_id){st.innerHTML='⏳ <b>'+esc(o.code)+'</b><br>Đang chờ Shipper nhận đơn.<br>📍 Khi Shipper nhận đơn, vị trí sẽ hiện tự động.';return}
      const slat=Number(t.latitude),slng=Number(t.longitude),online=!!(t.is_online&&t.last_seen&&Date.now()-new Date(t.last_seen).getTime()<90000);
      const geo=await orderGeo();
      const clat=geo?.lat,clng=geo?.lng;
      let km=null;if(Number.isFinite(clat)&&Number.isFinite(clng)&&Number.isFinite(slat)&&Number.isFinite(slng))km=dist(slat,slng,clat,clng);
      st.innerHTML='🚚 <b>'+esc(t.shipper_name||'Shipper')+'</b>'+(t.shipper_phone?' · '+esc(t.shipper_phone):'')+'<br>'+(online?'🟢 Đang Online':'🟠 Mất tín hiệu')+'<br>📦 Trạng thái: <b>'+esc(status||'Đang giao')+'</b>'+(km!=null?'<br>📏 Cách điểm giao: <b>'+km.toFixed(1)+' km</b>':'')+(t.last_seen?'<br>🕐 GPS cập nhật: '+new Date(t.last_seen).toLocaleTimeString('vi-VN'):'');
      if(!Number.isFinite(slat)||!Number.isFinite(slng)){st.innerHTML+='<br>📍 Shipper chưa có GPS hiện tại.';return}
      await initMap();
      shipperMarker=setMarker(shipperMarker,slat,slng,'#ef4444','🚚 <b>'+esc(t.shipper_name||'Shipper')+'</b><br>'+(online?'🟢 Online':'🟠 Mất tín hiệu'));
      if(Number.isFinite(clat)&&Number.isFinite(clng)){customerMarker=setMarker(customerMarker,clat,clng,'#1677ff','📍 <b>Điểm giao hàng</b>');await road(slat,slng,clat,clng,manual);if(manual||!map._tracked){fit(slat,slng,clat,clng);map._tracked=true}}
    }catch(e){st.innerHTML='❌ '+esc(e?.message||e)}
  }
  function start(){inject();setTimeout(()=>refresh(false),250);timer=setInterval(()=>refresh(false),POLL)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();