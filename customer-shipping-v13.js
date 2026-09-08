/* CHOCO SHIP — CUSTOMER SHIPPING v13
 * Final guard: restaurant -> customer only. Never use a fixed Phu Quoc origin.
 */
'use strict';
(function(){
  const U=window.SUPABASE_URL||'https://guwdswqaqnhzqapflvey.supabase.co';
  const K=window.SUPABASE_KEY||'sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const KEY='choco_customer_cart_v1';
  const cache={};
  const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
  const valid=(a,b)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Number(a)>=-90&&Number(a)<=90&&Number(b)>=-180&&Number(b)<=180;
  const readCart=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(x)&&x.length)return x}catch{}return Array.isArray(window.cart)?window.cart:[]};
  const gps=()=>{const g=window.currentGPS;if(valid(g?.lat,g?.lng)&&!(Number(g.lat)===0&&Number(g.lng)===0))return{lat:Number(g.lat),lng:Number(g.lng)};const t=document.getElementById('selectedGPS')?.textContent||'';const m=String(t).match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);return m&&valid(m[1],m[2])?{lat:Number(m[1]),lng:Number(m[2])}:null};
  const rid=()=>Number(readCart()[0]?.restaurantId??readCart()[0]?.restaurant_id)||0;
  const hav=(a,b,c,d)=>{const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))};
  const fee=k=>k<=3?20000:k<=5?25000:k<=7?30000:k<=10?40000:k<=15?50000:60000;
  async function loc(id){id=Number(id);if(!id)return null;if(cache[id])return cache[id];try{const r=await fetch(U+'/rest/v1/restaurants?select=id,latitude,longitude&id=eq.'+encodeURIComponent(id)+'&limit=1',{headers:{apikey:K,Authorization:'Bearer '+(localStorage.getItem('choco_access_token')||K),Accept:'application/json'}});const a=await r.json();const x=a?.[0];if(!valid(x?.latitude,x?.longitude))return null;return cache[id]={lat:Number(x.latitude),lng:Number(x.longitude)}}catch(e){return null}}
  async function refresh(){const g=gps(),id=rid();if(!g||!id)return;const r=await loc(id);if(!r)return;const km=hav(r.lat,r.lng,g.lat,g.lng),ship=fee(km);let food=0;const c=readCart();food=c.reduce((s,i)=>s+Number(i.price||0)*Number(i.qty||1),0);const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('foodTotal',money(food));set('shippingFee',money(ship));set('shippingTotal',money(ship));set('total',money(food+ship));set('shippingDistance',km.toFixed(1)+' km');set('selectedGPS',g.lat.toFixed(6)+', '+g.lng.toFixed(6));}
  window.shipFee=function(){return 20000};
  window.updateShippingDisplay=function(){refresh()};
  window.__CHOCO_SHIPPING_V13__=true;
  [100,500,1200,2500,5000].forEach(ms=>setTimeout(refresh,ms));
  setInterval(refresh,1500);
})();
