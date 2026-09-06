/* CHOCO SHIP — iOS MAP RASTER FALLBACK v1
 * Uses Leaflet + OpenStreetMap raster tiles on Safari/iOS.
 * Purpose: avoid WebGL/MapLibre blank-map cases while keeping existing GPS/address logic.
 */
(function(){
  'use strict';
  var started=false;
  function loadCss(){
    if(document.getElementById('choco-leaflet-css')) return;
    var l=document.createElement('link');
    l.id='choco-leaflet-css'; l.rel='stylesheet';
    l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(l);
  }
  function loadJs(done){
    if(window.L && window.L.map && window.L.tileLayer) return done();
    var s=document.getElementById('choco-leaflet-js');
    if(s){s.addEventListener('load',done,{once:true});return;}
    window.L=undefined;
    s=document.createElement('script'); s.id='choco-leaflet-js'; s.async=true;
    s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload=done;
    s.onerror=function(){console.warn('[CHOCO IOS MAP] Leaflet load failed');};
    document.head.appendChild(s);
  }
  function init(){
    if(started) return; started=true;
    var el=document.getElementById('map'); if(!el) return;
    loadCss();
    loadJs(function(){
      try{
        if(window.__CHOCO_MAPLIBRE__ && window.__CHOCO_MAPLIBRE__.remove){
          try{window.__CHOCO_MAPLIBRE__.remove();}catch(e){}
        }
        el.innerHTML='';
        el.style.background='#e5e7eb';
        var map=window.L.map(el,{zoomControl:true,attributionControl:true,tap:true}).setView([10.2899,103.984],12);
        window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
          maxZoom:19,
          attribution:'© OpenStreetMap contributors',
          crossOrigin:true
        }).addTo(map);
        window.__CHOCO_LEAFLET_MAP__=map;
        window.__CHOCO_MAPLIBRE__=null;
        window.map=map;
        window.marker=null;
        map.on('click',function(e){
          var lat=e&&e.latlng&&e.latlng.lat, lng=e&&e.latlng&&e.latlng.lng;
          if(Number.isFinite(lat)&&Number.isFinite(lng)&&typeof window.setDeliveryLocation==='function'){
            window.setDeliveryLocation(lat,lng);
          }
        });
        setTimeout(function(){try{map.invalidateSize(true);}catch(e){}},100);
        setTimeout(function(){try{map.invalidateSize(true);}catch(e){}},700);
        console.log('[CHOCO IOS MAP] Leaflet OSM ready');
      }catch(e){console.error('[CHOCO IOS MAP] init failed',e);}
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
