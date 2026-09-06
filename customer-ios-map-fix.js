/* CHOCO SHIP — iOS MAP FALLBACK v5 */
(function(){
'use strict';
var started=false,z=12,center={lat:10.2899,lng:103.984},el,tiles,layer,pinEl,pin=null;
function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function valid(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&a>=-85&&a<=85&&b>=-180&&b<=180}
function x(l){return (l+180)/360*Math.pow(2,z)}
function y(l){var r=l*Math.PI/180;return (1-Math.asinh(Math.tan(r))/Math.PI)/2*Math.pow(2,z)}
function lng(xv){return xv/Math.pow(2,z)*360-180}
function lat(yv){var n=Math.PI-2*Math.PI*yv/Math.pow(2,z);return 180/Math.PI*Math.atan(Math.sinh(n))}
function bbox(){var w=el.clientWidth||360,h=el.clientHeight||320,cx=x(center.lng),cy=y(center.lat);return{west:lng(cx-w/512),east:lng(cx+w/512),north:lat(cy-h/512),south:lat(cy+h/512)}}
function tileUrl(host,zz,xx,yy){return 'https://'+host+'/'+zz+'/'+xx+'/'+yy+'.png'}
function render(){
 if(!el||!tiles)return;
 tiles.innerHTML='';
 var w=el.clientWidth||360,h=el.clientHeight||320,n=Math.pow(2,z),cx=x(center.lng),cy=y(center.lat),tx=Math.floor(cx),ty=Math.floor(cy),ox=(cx-tx)*256+w/2-128,oy=(cy-ty)*256+h/2-128;
 for(var yy=ty-2;yy<=ty+2;yy++)for(var xx=tx-2;xx<=tx+2;xx++){
   var wx=((xx%n)+n)%n, yy2=Math.max(0,Math.min(n-1,yy));
   var im=document.createElement('img');im.width=256;im.height=256;im.alt='';im.draggable=false;
   im.style.cssText='position:absolute;width:256px;height:256px;left:'+(xx-tx)*256+ox+'px;top:'+(yy-ty)*256+oy+'px;display:block;max-width:none;';
   im.src=tileUrl('tile.openstreetmap.org',z,wx,yy2);
   im.onerror=function(){if(this.dataset.fallback)return;this.dataset.fallback='1';this.src=tileUrl('a.basemaps.cartocdn.com',z,0,0)};
   tiles.appendChild(im);
 }
 positionPin();
}
function positionPin(){if(!pin||!pinEl)return;var w=el.clientWidth||360,h=el.clientHeight||320,cx=x(center.lng),cy=y(center.lat),px=(x(pin.lng)-cx)+w/2,py=(y(pin.lat)-cy)+h/2;pinEl.style.left=px+'px';pinEl.style.top=py+'px';pinEl.style.display='block'}
function selectAt(e){var r=el.getBoundingClientRect(),w=el.clientWidth||r.width,h=el.clientHeight||r.height,cx=x(center.lng),cy=y(center.lat),mx=cx+(e.clientX-r.left-w/2)/256,my=cy+(e.clientY-r.top-h/2)/256,la=lat(my),lo=lng(mx);if(valid(la,lo)&&typeof window.setDeliveryLocation==='function')window.setDeliveryLocation(la,lo);pin={lat:la,lng:lo};positionPin()}
function init(){if(started||!isIOS())return;el=document.getElementById('map');if(!el)return;started=true;try{if(window.__CHOCO_MAPLIBRE__&&window.__CHOCO_MAPLIBRE__.remove)window.__CHOCO_MAPLIBRE__.remove()}catch(e){}el.innerHTML='';el.style.cssText+=';position:relative;overflow:hidden;background:#dfe8d7;touch-action:manipulation';tiles=document.createElement('div');tiles.style.cssText='position:absolute;inset:0;overflow:hidden';el.appendChild(tiles);layer=document.createElement('div');layer.style.cssText='position:absolute;inset:0;z-index:5;background:transparent;touch-action:manipulation';el.appendChild(layer);pinEl=document.createElement('div');pinEl.textContent='📍';pinEl.style.cssText='position:absolute;z-index:6;transform:translate(-50%,-100%);font-size:34px;display:none;pointer-events:none';el.appendChild(pinEl);var at=document.createElement('div');at.textContent='© OpenStreetMap contributors';at.style.cssText='position:absolute;right:2px;bottom:2px;z-index:7;background:rgba(255,255,255,.9);padding:2px 4px;font:11px Arial;color:#333';el.appendChild(at);layer.addEventListener('click',selectAt,true);window.__CHOCO_LEAFLET_MAP__={invalidateSize:function(){render();return this},setView:function(ll,zz){if(ll&&valid(Number(ll[0]),Number(ll[1])))center={lat:Number(ll[0]),lng:Number(ll[1])};if(Number.isFinite(zz))z=Math.max(2,Math.min(19,Number(zz)));render();return this},on:function(){return this}};window.__CHOCO_MAPLIBRE__=null;window.map=window.__CHOCO_LEAFLET_MAP__;window.marker=null;render();setTimeout(render,800);setTimeout(render,2000);window.addEventListener('resize',render);console.log('[CHOCO IOS MAP v5] direct OSM tiles ready')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
