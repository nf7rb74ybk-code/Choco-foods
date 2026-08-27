(() => {
  const root = document.getElementById('app');
  const routes = {
    customer: 'https://nf7rb74ybk-code.github.io/Choco-foods/index.html',
    shipper: 'https://nf7rb74ybk-code.github.io/Choco-foods/shipper.html',
    admin: 'https://nf7rb74ybk-code.github.io/Choco-foods/admin.html'
  };
  window.openRole = role => {
    if (!routes[role]) return;
    root.innerHTML = `<iframe title="CHOCO SHIP ${role}" src="${routes[role]}" style="width:100%;height:100%;border:0;display:block;background:#fff"></iframe>`;
  };
})();
