/* CHOCO SHIP — iOS MAP RASTER FALLBACK v2
 * Dependency-free OpenStreetMap raster renderer.
 * Avoids WebGL/MapLibre and external Leaflet CDN failures on iPhone Safari.
 */
(function(){
  'use strict';
  var started=false, z=12, center={lat:10.2899,lng:103.984};
  var el, layer, pin;
  function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
  function valid(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&a>=-85&&a<=85&&b>=-180&&b<=180}
  function xFromLng(lng,z){return (lng+180)/360*Math.pow(2,z)}
  function yFromLat(lat,z){var r=lat*Math.PI/180;return (1-Math.asinh(Math.tan(r))/Math.PI)/2*Math.pow(2,z)}
  function lngFromX(x,z){return x/Math.pow(2,z)*360-180}
  function latFromY(y,z){var n=Math.PI-2*Math.PI*y/Math.pow(2,z);return 180/Math.PI*Math.atan(Math.sinh(n))}
  function render(){
    if(!el)return;
    var w=el.clientWidth||window.innerWidth||360, h=el.clientHeight||320, tile=256;
    var cx=xFromLng(center.lng,z), cy=yFromLat(center.lat,z);
    layer.innerHTML='';
    var left=cx*tile-w/2, top=cy*tile-h/2;
    var minX=Math.floor(left/tile)-1,maxX=Math.floor((left+w)/tile)+1;
    var minY=Math.floor(top/tile)-1,maxY=Math.floor((top+h)/tile)+1,n=Math.pow(2,z);
    for(var ty=minY;ty<=maxY;ty++)for(var tx=minX;tx<=maxX;tx++){
      var ix=((tx%n)+n)%n;
      if(ty<0||ty>=n)continue;
      var img=document.createElement('img');
      img.alt='';img.draggable=false;img.decoding='async';img.loading='eager';
      img.src='https://tile.openstreetmap.org/'+z+'/'+ix+'/'+ty+'.png';
      img.style.cssText='position:absolute;width:256px;height:256px;left:'+(tx*tile-left)+'px;top:'+(ty*tile-top)+'px;display:block;max-width:none;user-select:none;-webkit-user-drag:none;';
      layer.appendChild(img);
    }
    if(pin){
      var px=xFromLng(pin.lng,z)*tile-left, py=yFromLat(pin.lat,z)*tile-top;
      pinEl.style.left=px+'px';pinEl.style.top=py+'px';pinEl.style.display='block';
    }
  }
  function selectAt(clientX,clientY){
    var r=el.getBoundingClientRect(), w=el.clientWidth||r.width,h=el.clientHeight||r.height;
    var cx=xFromLng(center.lng,z),cy=yFromLat(center.lat,z);
    var px=cx*256+(clientX-r.left-w/2),py=cy*256+(clientY-r.top-h/2);
    var lat=latFromY(py/256,z),lng=lngFromX(px/256,z);
    if(valid(lat,lng)&&typeof window.setDeliveryLocation==='function')window.setDeliveryLocation(lat,lng);
    pin={lat:lat,lng:lng};render();
  }
  function init(){
    if(started)return;
    if(!isIOS())return;
    el=document.getElementById('map');if(!el)return;
    started=true;
    try{if(window.__CHOCO_MAPLIBRE__&&window.__CHOCO_MAPLIBRE__.remove)window.__CHOCO_MAPLIBRE__.remove()}catch(e){}
    el.innerHTML='';el.style.position='relative';el.style.overflow='hidden';el.style.background='#dbeafe';el.style.touchAction='none';
    layer=document.createElement('div');layer.style.cssText='position:absolute;inset:0;overflow:hidden;background:#dbeafe;';el.appendChild(layer);
    pinEl=document.createElement('div');pinEl.innerHTML='📍';pinEl.style.cssText='position:absolute;transform:translate(-50%,-100%);font-size:34px;line-height:1;z-index:5;display:none;pointer-events:none;text-shadow:0 1px 3px #fff;';el.appendChild(pinEl);
    var attribution=document.createElement('div');attribution.innerHTML='© OpenStreetMap contributors';attribution.style.cssText='position:absolute;right:2px;bottom:2px;background:rgba(255,255,255,.85);font:11px Arial;padding:2px 4px;z-index:6;color:#333;';el.appendChild(attribution);
    var dragging=false,lastX=0,lastY=0;
    el.addEventListener('click',function(e){if(!dragging)selectAt(e.clientX,e.clientY)},true);
    el.addEventListener('pointerdown',function(e){dragging=false;lastX=e.clientX;lastY=e.clientY},true);
    el.addEventListener('pointermove',function(e){if(e.buttons){var dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(dx)+Math.abs(dy)>6)dragging=true;lastX=e.clientX;lastY=e.clientY}},true);
    window.__CHOCO_LEAFLET_MAP__={invalidateSize:function(){render();return this},setView:function(ll,zz){if(ll&&valid(ll[0],ll[1]))center={lat:Number(ll[0]),lng:Number(ll[1])};if(Number.isFinite(zz))z=Math.max(2,Math.min(19,Number(zz)));render();return this},on:function(){return this}};
    window.__CHOCO_MAPLIBRE__=null;window.map=window.__CHOCO_LEAFLET_MAP__;window.marker=null;
    render();
    setTimeout(render,300);setTimeout(render,1000);setTimeout(render,2500);
    console.log('[CHOCO IOS MAP] dependency-free OSM raster ready');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
