/* CHOCO SHIP - CUSTOMER LOGIN + CUSTOMER ID + GPS FIX */
(function () {
  "use strict";
  var U="https://guwdswqaqnhzqapflvey.supabase.co";
  var K="sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9";
  var originalFetch=window.fetch.bind(window);

  function decodeJwt(token){try{var p=String(token||"").split(".");if(p.length!==3)return null;var s=p[1].replace(/-/g,"+").replace(/_/g,"/");s+="=".repeat((4-s.length%4)%4);return JSON.parse(atob(s));}catch(e){return null;}}
  function identity(){var token=localStorage.getItem("choco_access_token")||"",c=decodeJwt(token);return{token:token,id:c&&c.sub?String(c.sub):"",exp:c&&Number(c.exp||0)};}
  function clearAuth(){["choco_access_token","choco_user_id","choco_role","choco_email","choco_customer_name"].forEach(function(k){localStorage.removeItem(k);});}
  function validIdentity(){var x=identity();return !!(x.token&&x.id&&(!x.exp||x.exp*1000>Date.now()+30000));}

  function installLogin(){
    if(document.getElementById("chocoCustomerLogin"))return;
    var css=document.createElement("style");css.id="chocoCustomerLoginCss";css.textContent="#chocoCustomerLogin{position:fixed;inset:0;background:#f5f5f5;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}#chocoCustomerLogin .cl-card{width:100%;max-width:420px;background:#fff;border-radius:20px;padding:24px;box-shadow:0 5px 25px #ddd}#chocoCustomerLogin .cl-logo{text-align:center;color:#ff6b00;font-size:29px;font-weight:900}#chocoCustomerLogin .cl-sub{text-align:center;color:#777;margin:7px 0 20px}#chocoCustomerLogin label{display:block;font-weight:700;margin:11px 0 6px}#chocoCustomerLogin input{width:100%;padding:14px;border:1px solid #ddd;border-radius:10px;font-size:16px}#chocoCustomerLogin button{width:100%;padding:14px;border:0;border-radius:10px;background:#ff6b00;color:#fff;font-size:16px;font-weight:800;margin-top:16px}#chocoCustomerLogin button:disabled{opacity:.6}#chocoCustomerLogin .cl-msg{margin-top:12px;padding:11px;border-radius:10px;display:none;white-space:pre-line}#chocoCustomerLogin .cl-err{display:block;background:#fee2e2;color:#991b1b}#chocoCustomerLogin .cl-ok{display:block;background:#dcfce7;color:#166534}#chocoCustomerLogin .cl-back{text-align:center;margin-top:15px}#chocoCustomerLogin .cl-back a{color:#1677ff;font-weight:700;text-decoration:none}";document.head.appendChild(css);
    var d=document.createElement("div");d.id="chocoCustomerLogin";d.innerHTML='<div class="cl-card"><div class="cl-logo">🍔 CHOCO SHIP</div><div class="cl-sub">🔐 Đăng nhập tài khoản khách hàng</div><form id="chocoCustomerLoginForm"><label>Email</label><input id="chocoCustomerEmail" type="email" autocomplete="username" required placeholder="Email khách hàng"><label>Mật khẩu</label><input id="chocoCustomerPassword" type="password" autocomplete="current-password" required placeholder="Mật khẩu"><button id="chocoCustomerLoginBtn" type="submit">🔐 ĐĂNG NHẬP</button></form><div id="chocoCustomerLoginMsg" class="cl-msg"></div><div class="cl-back"><a href="index.html">← Quay về trang đăng nhập chung</a></div></div>';
    document.body.appendChild(d);
    document.getElementById("chocoCustomerLoginForm").onsubmit=async function(ev){
      ev.preventDefault();var b=document.getElementById("chocoCustomerLoginBtn"),m=document.getElementById("chocoCustomerLoginMsg");b.disabled=true;b.textContent="⏳ ĐANG ĐĂNG NHẬP...";m.className="cl-msg";m.style.display="none";
      try{
        var email=document.getElementById("chocoCustomerEmail").value.trim().toLowerCase(),password=document.getElementById("chocoCustomerPassword").value;
        var r=await originalFetch(U+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json",apikey:K},body:JSON.stringify({email:email,password:password})});
        var t=await r.text(),j={};try{j=JSON.parse(t)}catch(e){}
        if(!r.ok)throw Error(j.error_description||j.msg||j.message||"Email hoặc mật khẩu không đúng.");
        var token=j.access_token,id=String(j.user&&j.user.id||decodeJwt(token)&&decodeJwt(token).sub||"");
        if(!token||!id)throw Error("Đăng nhập thành công nhưng không lấy được ID tài khoản.");
        localStorage.setItem("choco_access_token",token);localStorage.setItem("choco_user_id",id);localStorage.setItem("choco_role","customer");localStorage.setItem("choco_email",j.user&&j.user.email||email);
        var meta=j.user&&j.user.user_metadata||{};if(meta.full_name)localStorage.setItem("choco_customer_name",meta.full_name);
        m.textContent="✅ Đăng nhập thành công!";m.className="cl-msg cl-ok";m.style.display="block";
        d.style.display="none";window.dispatchEvent(new Event("choco-customer-login"));
      }catch(e){m.textContent="❌ "+(e.message||String(e));m.className="cl-msg cl-err";m.style.display="block";b.disabled=false;b.textContent="🔐 ĐĂNG NHẬP";}
    };
  }

  async function resolveCustomer(){
    var x=identity();
    if(!x.token||!x.id)return{ok:false,error:"NO_SESSION"};
    /* Do not query profiles/choco_v2_auth_profiles here. Those tables are RLS-protected and were the cause of the false login error. */
    localStorage.setItem("choco_user_id",x.id);localStorage.setItem("choco_role","customer");
    return{ok:true,id:x.id,token:x.token};
  }
  window.getCustomerId=function(){var x=identity();return validIdentity()?x.id:"";};
  window.chocoResolveCustomer=resolveCustomer;

  function boot(){
    if(!validIdentity())installLogin();
    else {var d=document.getElementById("chocoCustomerLogin");if(d)d.style.display="none";resolveCustomer();}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
  window.addEventListener("choco-customer-login",function(){resolveCustomer();});

  if(!window.__chocoCustomerOrderIdentityInstalled){
    window.__chocoCustomerOrderIdentityInstalled=true;
    window.fetch=async function(input,init){
      init=init||{};var url=typeof input==="string"?input:(input&&input.url)||"",method=String(init.method||(input&&input.method)||"GET").toUpperCase();
      if(method==="POST"&&/\/rest\/v1\/orders(?:\?|$)/i.test(url)&&init.body){
        var result=await resolveCustomer();
        if(!result.ok){installLogin();throw new Error("Vui lòng đăng nhập tài khoản khách.");}
        var payload;try{payload=typeof init.body==="string"?JSON.parse(init.body):null;}catch(e){payload=null;}
        if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error("Dữ liệu đơn hàng không hợp lệ.");
        payload.customer_id=result.id;
        init=Object.assign({},init,{body:JSON.stringify(payload)});
        var h=new Headers(init.headers||{});h.set("Content-Type","application/json");h.set("apikey",K);h.set("Authorization","Bearer "+result.token);init.headers=h;
      }
      return originalFetch(input,init);
    };
  }

  var REVERSE_URL=U+"/functions/v1/reverse-geocode";
  function setText(id,v){var el=document.getElementById(id);if(el)el.innerText=v;}
  function setAddress(v){var el=document.getElementById("address");if(el&&v){el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}}
  function gpsText(lat,lng){return Number(lat).toFixed(6)+", "+Number(lng).toFixed(6);}
  async function reverseViaSupabase(lat,lng){var x=identity(),h={"Content-Type":"application/json",apikey:K};if(x.token)h.Authorization="Bearer "+x.token;var r=await originalFetch(REVERSE_URL,{method:"POST",headers:h,body:JSON.stringify({lat:lat,lng:lng})});if(!r.ok)throw Error("HTTP "+r.status);var d=await r.json();return d&&d.ok&&d.address?d.address:null;}
  async function reverseBigDataCloud(lat,lng){try{var r=await originalFetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude="+encodeURIComponent(lat)+"&longitude="+encodeURIComponent(lng)+"&localityLanguage=vi",{headers:{Accept:"application/json"}});if(!r.ok)return null;var d=await r.json(),a=[];if(d.locality)a.push(d.locality);if(d.city&&!a.includes(d.city))a.push(d.city);if(d.principalSubdivision&&!a.includes(d.principalSubdivision))a.push(d.principalSubdivision);if(d.countryName&&!a.includes(d.countryName))a.push(d.countryName);return a.length?a.join(", "):null}catch(e){return null;}}
  async function reverseGeocode(lat,lng){try{return await reverseViaSupabase(lat,lng)}catch(e){return await reverseBigDataCloud(lat,lng)}}
  function finish(lat,lng){lat=Number(lat);lng=Number(lng);if(!Number.isFinite(lat)||!Number.isFinite(lng))return;setAddress("GPS: "+gpsText(lat,lng));setText("cartGpsText","📍 GPS giao hàng: "+gpsText(lat,lng)+"\n⏳ Đang tìm địa chỉ...");reverseGeocode(lat,lng).then(function(a){if(a){var el=document.getElementById("address");if(el&&(!el.value||el.value.indexOf("GPS:")===0))setAddress(a);setText("cartGpsText","📍 "+a+"\nGPS: "+gpsText(lat,lng));}else setText("cartGpsText","📍 GPS: "+gpsText(lat,lng)+"\n⚠️ Chưa tìm được tên địa chỉ tự động.")}).catch(function(){})}
  function extractGPS(){var els=[document.getElementById("selectedGPS"),document.getElementById("cartGpsText"),document.getElementById("locationText")];for(var i=0;i<els.length;i++){var text=els[i]?els[i].innerText||":"",m=text.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);if(m)return{lat:Number(m[1]),lng:Number(m[2])}}return null}
  function watchGPS(){var n=0,t=setInterval(function(){var g=extractGPS();if(g){clearInterval(t);finish(g.lat,g.lng)}else if(++n>=100)clearInterval(t)},250)}
  var originalGetGPS=window.getGPS;
  if(typeof originalGetGPS==="function")window.getGPS=function(){originalGetGPS();watchGPS()};
})();