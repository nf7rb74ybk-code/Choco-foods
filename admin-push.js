/* CHOCO SHIP — ADMIN BOOTSTRAP */
'use strict';
(function(){
  function loadShipperMap(){if(window.__CHOCO_ADMIN_SHIPPER_MAP_LOADED__)return;window.__CHOCO_ADMIN_SHIPPER_MAP_LOADED__=true;const s=document.createElement('script');s.src='./admin-shipper-map.js?v=20260906-2';s.async=true;s.onload=()=>console.log('CHOCO ADMIN SHIPPER MAP: loaded');s.onerror=e=>console.warn('CHOCO ADMIN SHIPPER MAP: load failed',e);document.body.appendChild(s)}
  function loadMenuManage(){if(window.__CHOCO_ADMIN_MENU_MANAGE_LOADED__)return;window.__CHOCO_ADMIN_MENU_MANAGE_LOADED__=true;const s=document.createElement('script');s.src='./admin-menu-manage.js?v=20260909-1';s.async=true;s.onload=()=>console.log('CHOCO ADMIN MENU MANAGE: loaded');s.onerror=e=>console.warn('CHOCO ADMIN MENU MANAGE: load failed',e);document.body.appendChild(s)}
  const start=()=>{loadShipperMap();loadMenuManage()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();