(() => {
  const routes = { customer: 'customer.html', shipper: 'shipper.html', admin: 'admin.html' };
  window.openRole = role => { if (routes[role]) location.href = routes[role]; };
  window.openLogin = () => { location.href = 'login.html'; };
})();
