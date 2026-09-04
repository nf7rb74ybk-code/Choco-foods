// CHOCO ADMIN ACCOUNTS CORE + SHIPPER DASHBOARD
(function(){
  const base='https://raw.githubusercontent.com/nf7rb74ybk-code/Choco-foods/362db9f72353c03b51e27b7c23ebdfde23ab1cdc/';
  const a=document.createElement('script');
  a.src=base+'admin-accounts.js';
  a.onload=function(){
    const p=document.createElement('script');
    p.src='./admin-shipper-performance.js?v=20260904-2';
    p.async=true;
    document.head.appendChild(p);
  };
  a.onerror=function(){console.error('CHOCO ADMIN ACCOUNTS CORE LOAD FAILED')};
  document.head.appendChild(a);
})();
