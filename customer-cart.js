/* CHOCO SHIP — CUSTOMER CART COMPATIBILITY SHIM v2
 * Cart ownership is handled by customer-add-fix.js.
 * This legacy file intentionally does not override add(), renderCart(), updateCart(),
 * or checkout handlers, preventing duplicate cart state and event conflicts.
 */
'use strict';
(function(){
  window.__CHOCO_CUSTOMER_CART_LEGACY_DISABLED__=true;
})();
