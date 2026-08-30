// CHOCO SHIP V2 TEST — role guard
// Pages call v2RequireRole(role) after all V2 scripts are loaded.
// Do not trust the legacy choco_v2_test_identity value for authorization.
(function(){
  window.v2GuardExpectedRole=function(){
    const path=location.pathname;
    return path.includes('/customer.html')?'customer':path.includes('/shipper.html')?'shipper':path.includes('/admin.html')?'admin':path.includes('/pos.html')?'pos':null;
  };
})();
