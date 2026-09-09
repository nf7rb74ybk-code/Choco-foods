/* CHOCO SHIP — CUSTOMER GPS / SHIPPING FIX v13
 * Shipping is location-based. Never use a fixed Phu Quoc origin.
 * Calculates restaurant -> customer distance whenever GPS/cart data becomes available.
 */
'use strict';
(function(){
  const U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const CACHE={};
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const valid=(a,b)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Number(a)>=-90&&Number(a)<=90&&Number(b)>=-180&&Number(b)<=180&&!(Number(a)===0&&Number(b)===0);
  function gps(){
    const g=window.currentGPS;
    if(valid(g?.lat,g?.lng))return{lat:Number(g.lat),lng:Number(g.lng)};
    const s=String(document.getElementById('selectedGPS')?.textContent||'');
    const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    return m&&valid(m[1],m[2])?{lat:Number(m[1]),lng:Number(m[2])}:null;
  }
  function cart(){
    try{const a=JSON.parse(localStorage.getItem('choco_customer_cart_v1')||'[]');if(Array.isArray(a)&&a.length)return a}catch{}
    return Array.isArray(window.cart)?window.cart:[];
  }
  function restaurantId(){const c=cart();return Number(c[0]?.restaurantId??c[0]?.restaurant_id)||0;}
  function hav(a,b,c,d){
    const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180;
    const z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;
    return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));
  }
  function fee(k){return k<=3?20000:k<=5?25000:k<=7?30000:k<=10?40000:k<=15?50000:60000;}
  async function restaurantLocation(id){
    id=Number(id||0);if(!id)return null;
    if(CACHE[id])return CACHE[id];
    try{
      const r=await fetch(U+'/rest/v1/restaurants?select=id,latitude,longitude&id=eq.'+encodeURIComponent(id)+'&limit=1',{headers:{apikey:K,Authorization:'Bearer '+(localStorage.getItem('choco_access_token')||K),Accept:'application/json'}});
      const rows=await r.json().catch(()=>[]),x=Array.isArray(rows)?rows[0]:null;
      const lat=Number(x?.latitude),lng=Number(x?.longitude);
      if(!valid(lat,lng))return null;
      return CACHE[id]={lat,lng};
    }catch(e){console.warn('[CHOCO GPS FIX] restaurant GPS',e);return null;}
  }
  function foodTotal(){
    if(typeof window.getFoodTotal==='function')return Number(window.getFoodTotal()||0);
    return cart().reduce((s,i)=>s+Number(i.price||0)*Number(i.qty||1),0);
  }
  async function refresh(){
    const g=gps(),rid=restaurantId();
    if(!g||!rid)return false;
    const loc=await restaurantLocation(rid);if(!loc)return false;
    const food=foodTotal(),km=hav(loc.lat,loc.lng,g.lat,g.lng),ship=fee(km),total=food+ship;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.innerText=v;};
    set('foodTotal',money(food));
    set('shippingFee',money(ship));
    set('shippingTotal',money(ship));
    set('total',money(total));
    set('shippingDistance',km.toFixed(1)+' km');
    set('selectedGPS',g.lat.toFixed(6)+', '+g.lng.toFixed(6));
    const st=document.getElementById('cartGpsText');if(st)st.textContent='📍 GPS: '+g.lat.toFixed(6)+', '+g.lng.toFixed(6);
    window.__CHOCO_SHIPPING_DISTANCE_KM__=Number(km.toFixed(3));
    window.__CHOCO_SHIPPING_FEE__=ship;
    return true;
  }
  window.shipFee=function(){
    const g=gps(),rid=restaurantId(),loc=CACHE[rid];
    if(!g||!loc)return 20000;
    return fee(hav(loc.lat,loc.lng,g.lat,g.lng));
  };
  window.updateShippingDisplay=function(){refresh();};
  window.__CHOCO_CUSTOMER_GPS_FIX__={version:'13',mode:'restaurant_to_customer'};
  let tries=0;
  const timer=setInterval(async()=>{tries++;if(await refresh()||tries>=15)clearInterval(timer)},800);
  setTimeout(refresh,100);
  setTimeout(refresh,1500);
})();