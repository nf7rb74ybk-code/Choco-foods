// CHOCO SHIP V2 TEST — lightweight role guard
(function(){
  const role=localStorage.getItem('choco_v2_role');
  const path=location.pathname;
  const expected=path.includes('/customer.html')?'customer':path.includes('/shipper.html')?'shipper':path.includes('/admin.html')?'admin':path.includes('/pos.html')?'pos':null;
  if(expected && role!==expected){
    const login=new URL('./login.html',location.href);
    login.searchParams.set('next',expected);
    location.replace(login.href);
  }
})();
