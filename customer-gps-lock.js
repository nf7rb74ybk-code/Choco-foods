/* CHOCO SHIP — CUSTOMER GPS LOCK
 * Intentionally does not override getGPS.
 * customer-gps-fix.js is the single GPS owner and already provides
 * timeout/watchdog + UI reset for iPhone/Safari.
 */
'use strict';
(function(){
  // Keep this file as a compatibility shim for existing customer.html references.
  // Do not add another click handler or overwrite window.getGPS here.
  window.__CHOCO_GPS_LOCK_DISABLED__ = true;
})();
