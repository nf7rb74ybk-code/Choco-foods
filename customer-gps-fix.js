/* CHOCO SHIP — CUSTOMER GPS COMPATIBILITY SHIM v11
 * IMPORTANT: customer-fix.js is the single owner of customer GPS/address.
 * This file intentionally does NOT override window.getGPS(), map handlers,
 * createOrder(), or address logic. It only keeps the old script reference safe.
 */
'use strict';
(function(){
  window.__CHOCO_CUSTOMER_GPS_FIX__={version:'11',owner:'customer-fix.js'};
})();
