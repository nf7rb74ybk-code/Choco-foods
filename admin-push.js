/* CHOCO SHIP — ADMIN BOOTSTRAP */
'use strict';
(function(){
  function load(src,flag,label){if(window[flag])return;window[flag]=true;const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>console.log('CHOCO ADMIN '+label+': loaded');s.onerror=e=>console.warn('CHOCO ADMIN '+label+': load failed',e);document.body.appendChild(s)}
  const start=()=>{load('./admin-shipper-map.js?v=20260906-2','__CHOCO_ADMIN_SHIPPER_MAP_LOADED__','SHIPPER MAP');load('./admin-shipper-manage.js?v=20260909-1','__CHOCO_ADMIN_SHIPPER_MANAGE_LOADED__','SHIPPER MANAGE');load('./admin-menu-manage.js?v=20260909-1','__CHOCO_ADMIN_MENU_MANAGE_LOADED__','MENU MANAGE');load('./admin-account-manager.js?v=20260909-1','__CHOCO_ADMIN_ACCOUNT_MANAGER__','ACCOUNT MANAGER')};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();