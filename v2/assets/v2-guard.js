// CHOCO SHIP V2 TEST — role guard
(function(){
  const raw=localStorage.getItem('choco_v2_test_identity');
  let user=null; try{user=raw?JSON.parse(raw):null}catch{}
  const path=location.pathname;
  const expected=path.includes('/customer.html')?'customer':path.includes('/shipper.html')?'shipper':path.includes('/admin.html')?'admin':path.includes('/pos.html')?'pos':null;
  if(expected && (!user || user.role!==expected)){
    const login=new URL('./login.html',location.href);
    login.searchParams.set('role',expected);
    location.replace(login.href);
  }
})();
