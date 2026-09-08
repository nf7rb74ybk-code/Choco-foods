/* CHOCO SHIP — iOS MAP FALLBACK v10 — MAPLIBRE FIRST + OSM RASTER FALLBACK */
(function(){
'use strict';
var started=false,center={lat:0,lng:0},el;
function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function valid(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&a>=-85&&a<=85&&b>=-180&&b<=180}
function installMarkerShim(map){
  var old=window.L||{};
  old.marker=function(ll){var lat=Number(ll&&ll[0]),lng=Number(ll&&ll[1]),m=null;return {addTo:function(){if(window.maplibregl&&map){m=new maplibregl.Marker({color:'#ff6b00'}).setLngLat([lng,lat]).addTo(map)}return this},bindPopup:function(){return this},openPopup:function(){return this},remove:function(){try{if(m)m.remove()}catch(e){}return this}}};
  window.L=old;
}
function tryMapLibre(){
  if(!window.maplibregl||!el)return false;
  try{
    var map=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/liberty',center:[center.lng,center.lat],zoom:13,attributionControl:false,antialias:true});
    window.__CHOCO_MAPLIBRE__=map;
    window.__CHOCO_LEAFLET_MAP__=null;
    window.map=map;
    map.addControl(new maplibregl.AttributionControl({customAttribution:'© OpenStreetMap contributors © OpenMapTiles'}),'bottom-right');
    map.on('load',function(){
      window.__CHOCO_IOS_MAP_READY__=true;
      map.resize();
      console.log('[CHOCO IOS MAP v10] MapLibre/OpenFreeMap loaded');
    });
    map.on('error',function(e){console.warn('[CHOCO IOS MAP v10] MapLibre error',e&&e.error||e)});
    map.on('click',function(e){var lat=e.lngLat.lat,lng=e.lngLat.lng;if(valid(lat,lng)&&typeof window.setDeliveryLocation==='function')window.setDeliveryLocation(lat,lng)});
    installMarkerShim(map);
    setTimeout(function(){try{map.resize()}catch(e){}},500);
    return true;
  }catch(e){console.warn('[CHOCO IOS MAP v10] MapLibre init failed',e);return false}
}
function rasterFallback(){
  var z=13,n=Math.pow(2,z),X=function(l){return(l+180)/360*n},Y=function(l){var r=l*Math.PI/180;return(1-Math.asinh(Math.tan(r))/Math.PI)/2*n},LNG=function(v){return v/n*360-180},LAT=function(v){var q=Math.PI-2*Math.PI*v/n;return 180/Math.PI*Math.atan(Math.sinh(q))};
  el.innerHTML='';el.style.cssText+=';position:relative;overflow:hidden;background:#e7edf0;touch-action:none';
  var tiles=document.createElement('div');tiles.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none';el.appendChild(tiles);
  var layer=document.createElement('div');layer.style.cssText='position:absolute;inset:0;z-index:5;touch-action:none';el.appendChild(layer);
  var at=document.createElement('div');at.textContent='© OpenStreetMap contributors';at.style.cssText='position:absolute;right:2px;bottom:2px;z-index:7;background:rgba(255,255,255,.92);padding:2px 4px;font:11px Arial;color:#333';el.appendChild(at);
  var cx=X(center.lng),cy=Y(center.lat),tx=Math.floor(cx),ty=Math.floor(cy),w=el.clientWidth||360,h=el.clientHeight||320,ox=(cx-tx)*256+w/2-128,oy=(cy-ty)*256+h/2-128;
  for(var yy=ty-1;yy<=ty+1;yy++)for(var xx=tx-1;xx<=tx+1;xx++){var im=document.createElement('img');im.width=256;im.height=256;im.alt='';im.draggable=false;im.style.cssText='position:absolute;width:256px;height:256px;max-width:none';im.src='https://tile.openstreetmap.org/'+z+'/'+(((xx%n)+n)%n)+'/'+Math.max(0,Math.min(n-1,yy))+'.png';im.style.left=((xx-tx)*256+ox)+'px';im.style.top=((yy-ty)*256+oy)+'px';im.onerror=function(){this.style.display='none'};tiles.appendChild(im)}
  layer.addEventListener('click',function(e){var r=el.getBoundingClientRect(),mx=cx+(e.clientX-r.left-w/2)/256,my=cy+(e.clientY-r.top-h/2)/256,lat=LAT(my),lng=LNG(mx);if(valid(lat,lng)&&typeof window.setDeliveryLocation==='function')window.setDeliveryLocation(lat,lng)},{passive:false});
  window.__CHOCO_MAPLIBRE__=null;window.__CHOCO_LEAFLET_MAP__={invalidateSize:function(){return this},setView:function(){return this},removeLayer:function(){return this},on:function(){return this}};window.map=window.__CHOCO_LEAFLET_MAP__;
  installMarkerShim(null);
  console.warn('[CHOCO IOS MAP v10] Raster fallback active');
}
function init(){if(started||!isIOS())return;el=document.getElementById('map');if(!el){setTimeout(init,250);return}started=true;try{if(window.__CHOCO_MAPLIBRE__&&window.__CHOCO_MAPLIBRE__.remove)window.__CHOCO_MAPLIBRE__.remove()}catch(e){}el.innerHTML='';var ok=tryMapLibre();if(!ok)setTimeout(rasterFallback,800);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();