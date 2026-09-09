/* CHOCO SHIP — CUSTOMER SHIPPING v14
 * Final customer pricing guard: restaurant -> customer.
 * v14 is a cache-busted replacement for v13 so old browser/CDN JS cannot keep the 20k fallback.
 */
'use strict';
(function(){
  const U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const KEY='choco_customer_cart_v1';
  const cache={};
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const valid=(lat,lng)=>Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))&&Number(lat)>=-90&&Number(lat)<=90&&Number(lng)>=-180&&Number(lng)<=180&&!(Number(lat)===0&&Number(lng)===0);
  function cart(){
    try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a)&&a.length)return a}catch{}
    return Array.isArray(window.cart)?window.cart:[];
  }
  function gps(){
    const g=window.currentGPS;
    if(valid(g?.lat,g?.lng))return{lat:Number(g.lat),lng:Number(g.lng)};
    const s=String(document.getElementById('selectedGPS')?.textContent||'');
    const m=s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    return m&&valid(m[1],m[2])?{lat:Number(m[1]),lng:Number(m[2])}:null;
  }
  function rid(){const c=cart();return Number(c[0]?.restaurantId??c[0]?.restaurant_id)||0;}
  function hav(a,b,c,d){
    const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180;
    const z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;
    return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));
  }
  function fee(k){return k<=3?20000:k<=5?25000:k<=7?30000:k<=10?40000:k<=15?50000:60000;}
  async function restaurant(id){
    id=Number(id);if(!id)return null;
    if(cache[id])return cache[id];
    try{
      const r=await fetch(U+'/rest/v1/restaurants?select=id,latitude,longitude&id=eq.'+encodeURIComponent(id)+'&limit=1',{headers:{apikey:K,Authorization:'Bearer '+(localStorage.getItem('choco_access_token')||K),Accept:'application/json'},cache:'no-store'});
      if(!r.ok)return null;
      const a=await r.json();const x=a?.[0];
      if(!valid(x?.latitude,x?.longitude))return null;
      return cache[id]={lat:Number(x.latitude),lng:Number(x.longitude)};
    }catch(e){return null;}
  }
  function set(id,value){const e=document.getElementById(id);if(e)e.textContent=value;}
  async function refresh(){
    const g=gps(),id=rid();
    if(!g||!id)return false;
    const r=await restaurant(id);if(!r)return false;
    const km=hav(r.lat,r.lng,g.lat,g.lng),ship=fee(km),c=cart();
    const food=c.reduce((s,i)=>s+Number(i.price||0)*Number(i.qty??i.quantity??1),0);
    set('selectedGPS',g.lat.toFixed(6)+', '+g.lng.toFixed(6));
    set('shippingDistance',km.toFixed(1)+' km');
    set('shippingFee',money(ship));
    set('shippingTotal',money(ship));
    set('foodTotal',money(food));
    set('total',money(food+ship));
    window.__CHOCO_SHIPPING_V14__={restaurantId:id,restaurant:r,customer:g,distanceKm:km,shippingFee:ship};
    return true;
  }
  window.shipFee=function(){return 20000;};
  window.updateShippingDisplay=function(){refresh();};
  window.__CHOCO_SHIPPING_V14_LOADED__=true;
  [0,300,800,1500,3000,5000].forEach(ms=>setTimeout(refresh,ms));
  setInterval(refresh,1000);
})();
