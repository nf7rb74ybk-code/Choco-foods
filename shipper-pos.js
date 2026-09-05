/* CHOCO SHIP - legacy compatibility shim
   Lifecycle is owned by shipper-online.js to avoid duplicate status buttons.
*/
'use strict';
(function(){
  if(window.__CHOCO_SHIPPER_POS__) return;
  window.__CHOCO_SHIPPER_POS__=true;
  // Keep the old entry point harmless for pages that still load shipper-pos.js.
  // The authoritative lifecycle implementation lives in shipper-online.js.
})();
