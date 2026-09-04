/* CHOCO SHIP - CUSTOMER ACCOUNT NAV v1 */
(function(){
  'use strict';
  if(window.__chocoAccountNavInstalled)return;
  window.__chocoAccountNavInstalled=true;
  function add(){
    if(document.getElementById('chocoAccountBtn'))return;
    const style=document.createElement('style');
    style.textContent='.choco-account-btn{border:0;background:#fff;color:#ff6b00;border-radius:10px;padding:9px 11px;font-weight:800;font-size:13px}.choco-account-name{display:none}@media(min-width:560px){.choco-account-name{display:inline}}';
    document.head.appendChild(style);
    const header=document.querySelector('header .header');
    if(header){
      const b=document.createElement('button');b.id='chocoAccountBtn';b.className='choco-account-btn';
      b.innerHTML='👤 <span class="choco-account-name">Tài khoản</span>';
      b.onclick=()=>location.href='customer-account.html';
      const cart=header.querySelector('.cart');
      header.insertBefore(b,cart||null);
    }
    const bottom=document.querySelector('.bottom');
    if(bottom&&!document.getElementById('chocoAccountBottom')){
      const b=document.createElement('button');b.id='chocoAccountBottom';b.innerHTML='<span>👤</span>Tài khoản';b.onclick=()=>location.href='customer-account.html';bottom.appendChild(b);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();
