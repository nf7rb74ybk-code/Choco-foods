/* CHOCO SHIP — iOS MAP FALLBACK v4
 * Uses the official OpenStreetMap embeddable map instead of direct raster
 * tile <img> requests, which were rendering as '?' on iPhone Safari.
 * A transparent touch layer keeps GPS coordinate selection working.
 */
(function(){
  'use strict';
  var started=false,z=12,center={lat:10.2899,lng:103.984};
  var el,frame,layer,pin=null,pinEl,overlay,attribution;
  function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
  function valid(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&a>=-85&&a<=85&&b>=-180&&b<=180}
  function xFromLng(lng,zz){return (lng+180)/360*Math.pow(2,zz)}
  function yFromLat(lat,zz){var r=lat*Math.PI/180;return (1-Math.asinh(Math.tan(r))/Math.PI)/2*Math.pow(2,zz)}
  function lngFromX(x,zz){return x/Math.pow(2,zz)*360-180}
  function latFromY(y,zz){var n=Math.PI-2*Math.PI*y/Math.pow(2,zz);return 180/Math.PI*Math.atan(Math.sinh(n))}
  function bbox(){
    var w=el.clientWidth||360,h=el.clientHeight||320,tile=256,n=Math.pow(2,z);
    var cx=xFromLng(center.lng,z),cy=yFromLat(center.lat,z);
    var left=cx-w/(2*tile),right=cx+w/(2*tile),top=cy-h/(2*tile),bottom=cy+h/(2*tile);
    var west=lngFromX(left,z),east=lngFromX(right,z),north=latFromY(top,z),south=latFromY(bottom,z);
    return {west:west,south:south,east:east,north:north};
  }
  function embedUrl(){
    var b=bbox();
    return 'https://www.openstreetmap.org/export/embed.html?bbox='+b.west.toFixed(6)+'%2C'+b.south.toFixed(6)+'%2C'+b.east.toFixed(6)+'%2C'+b.north.toFixed(6)+'&layer=mapnik&marker='+center.lat.toFixed(6)+'%2C'+center.lng.toFixed(6);
  }
  function positionPin(){
    if(!pin||!pinEl)return;
    var b=bbox(),w=el.clientWidth||360,h=el.clientHeight||320;
    var px=(pin.lng-b.west)/(b.east-b.west)*w;
    var py=(b.north-pin.lat)/(b.north-b.south)*h;
    pinEl.style.left=px+'px';pinEl.style.top=py+'px';pinEl.style.display='block';
  }
  function reloadMap(){
    if(!frame||!el)return;
    frame.src=embedUrl();
    positionPin();
  }
  function selectAt(clientX,clientY){
    var r=el.getBoundingClientRect(),w=el.clientWidth||r.width,h=el.clientHeight||r.height,b=bbox();
    var px=Math.max(0,Math.min(w,clientX-r.left)),py=Math.max(0,Math.min(h,clientY-r.top));
    var lng=b.west+(px/w)*(b.east-b.west),lat=b.north-(py/h)*(b.north-b.south);
    if(valid(lat,lng)&&typeof window.setDeliveryLocation==='function')window.setDeliveryLocation(lat,lng);
    pin={lat:lat,lng:lng};positionPin();
  }
  function init(){
    if(started||!isIOS())return;
    el=document.getElementById('map');if(!el)return;started=true;
    try{if(window.__CHOCO_MAPLIBRE__&&window.__CHOCO_MAPLIBRE__.remove)window.__CHOCO_MAPLIBRE__.remove()}catch(e){}
    el.innerHTML='';el.style.position='relative';el.style.overflow='hidden';el.style.background='#e5e7eb';el.style.touchAction='manipulation';
    frame=document.createElement('iframe');
    frame.title='OpenStreetMap';frame.setAttribute('aria-label','Bản đồ OpenStreetMap');frame.frameBorder='0';frame.scrolling='no';
    frame.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;pointer-events:none;background:#e5e7eb;';
    el.appendChild(frame);
    layer=document.createElement('div');layer.style.cssText='position:absolute;inset:0;z-index:4;pointer-events:auto;background:transparent;';el.appendChild(layer);
    pinEl=document.createElement('div');pinEl.innerHTML='📍';pinEl.style.cssText='position:absolute;transform:translate(-50%,-100%);font-size:34px;line-height:1;z-index:6;display:none;pointer-events:none;text-shadow:0 1px 3px #fff;';el.appendChild(pinEl);
    attribution=document.createElement('div');attribution.innerHTML='© OpenStreetMap contributors';attribution.style.cssText='position:absolute;right:2px;bottom:2px;background:rgba(255,255,255,.9);font:11px Arial;padding:2px 4px;z-index:7;color:#333;pointer-events:none;';el.appendChild(attribution);
    var moved=false,lastX=0,lastY=0;
    layer.addEventListener('pointerdown',function(e){moved=false;lastX=e.clientX;lastY=e.clientY},true);
    layer.addEventListener('pointermove',function(e){if(e.buttons){if(Math.abs(e.clientX-lastX)+Math.abs(e.clientY-lastY)>8)moved=true}},true);
    layer.addEventListener('click',function(e){if(!moved)selectAt(e.clientX,e.clientY)},true);
    window.__CHOCO_LEAFLET_MAP__={
      invalidateSize:function(){reloadMap();return this},
      setView:function(ll,zz){if(ll&&valid(Number(ll[0]),Number(ll[1]))){center={lat:Number(ll[0]),lng:Number(ll[1])}}if(Number.isFinite(zz))z=Math.max(2,Math.min(19,Number(zz)));reloadMap();return this},
      on:function(){return this}
    };
    window.__CHOCO_MAPLIBRE__=null;window.map=window.__CHOCO_LEAFLET_MAP__;window.marker=null;
    reloadMap();
    setTimeout(reloadMap,700);setTimeout(reloadMap,1800);
    window.addEventListener('resize',function(){reloadMap()});
    console.log('[CHOCO IOS MAP v4] OpenStreetMap embed ready');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
