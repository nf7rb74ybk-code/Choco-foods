(() => {
  const routes = { customer: 'customer.html', shipper: 'shipper.html', admin: 'admin.html' };
  window.openRole = role => { if (routes[role]) location.href = routes[role]; };
  window.openLogin = () => alert('Màn hình đăng nhập Supabase sẽ được nối ở bước kế tiếp.');
})();
