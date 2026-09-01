/* CHOCO SHIP - CUSTOMER FIX v3: LOGIN + CUSTOMER ID + GPS + ADDRESS */
(function () {
  "use strict";
  var U="https://guwdswqaqnhzqapflvey.supabase.co";
  var K="sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9";
  var originalFetch=window.fetch.bind(window);

  function decodeJwt(token){try{var p=String(token||"").split(".");if(p.length!==3)return null;var s=p[1].replace(/-/g,"+").replace(/_/g,"/");s+="=".repeat((4-s.length%4)%4);return JSON.parse(atob(s));}catch(e){return null;}}
  function identity(){var token=localStorage.getItem("choco_access_token")||"",c=decodeJwt(token);return{token:token,id:c&&c.sub?String(c.sub):"",exp:c&&Number(c.exp||0)};}
  function validIdentity(){var x=identity();return !!(x.token&&x.id&&(!x.exp||x.exp*1000>Date.now()+30000));}
  function resolveCustomer(){var x=identity();if(!x.token||!x.id)return{ok:false};localStorage.setItem("choco_user_id",x.id);localStorage.setItem("choco_role","customer");return{ok:true,id:x.id,token:x.token};}
  window.getCustomerId=function(){var x=identity();return validIdentity()?x.id:"";};
  window.chocoResolveCustomer=resolveCustomer;

  function installLogin(){
    if(document.getElementById("chocoCustomerLogin"))return;
    var css=document.createElement("style");css.id="chocoCustomerLoginCss";css.textContent="#chocoCustomerLogin{position:fixed;inset:0;background:#f5f5f5;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}#chocoCustomerLogin .cl-card{width:100%;max-width:420px;background:#fff;border-radius:20px;padding:24px;box-shadow:0 5px 25px #ddd}#chocoCustomerLogin .cl-logo{text-align:center;color:#ff6b00;font-size:29px;font-weight:900}#chocoCustomerLogin .cl-sub{text-align:center;color:#777;margin:7px 0 20px}#chocoCustomerLogin label{display:block;font-weight:700;margin:11px 0 6px}#chocoCustomerLogin input{width:100%;padding:14px;border:1px solid #ddd;border-radius:10px;font-size:16px}#chocoCustomerLogin button{width:100%;padding:14px;border:0;border-radius:10px;background:#ff6b00;color:#fff;font-size:16px;font-weight:800;margin-top:16px}#chocoCustomerLogin button:disabled{opacity:.6}#chocoCustomerLogin .cl-msg{margin-top:12px;padding:11px;border-radius:10px;display:none;white-space:pre-line}#chocoCustomerLogin .cl-err{display:block;background:#fee2e2;color:#991b1b}#chocoCustomerLogin .cl-ok{display:block;background:#dcfce7;color:#166534}";document.head.appendChild(css);
    var d=document.createElement("div");d.id="chocoCustomerLogin";d.innerHTML='<div class="cl-card"><div class="cl-logo">🍔 CHOCO SHIP</div><div class="cl-sub">🔐 Đăng nhập tài khoản khách hàng</div><form id="chocoCustomerLoginForm"><label>Email</label><input id="chocoCustomerEmail" type="email" autocomplete="username" required placeholder="Email khách hàng"><label>Mật khẩu</label><input id="chocoCustomerPassword" type="password" autocomplete="current-password" required placeholder="Mật khẩu"><button id="chocoCustomerLoginBtn" type="submit">🔐 ĐĂNG NHẬP</button></form><div id="chocoCustomerLoginMsg" class="cl-msg"></div></div>';
    document.body.appendChild(d);
    document.getElementById("chocoCustomerLoginForm").onsubmit=async function(e){e.preventDefault();var b=document.getElementById("chocoCustomerLoginBtn"),m=document.getElementById("chocoCustomerLoginMsg");b.disabled=true;b.textContent="⏳ ĐANG ĐĂNG NHẬP...";try{var email=document.getElementById("chocoCustomerEmail").value.trim().toLowerCase(),password=document.getElementById("chocoCustomerPassword").value,r=await originalFetch(U+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json",apikey:K},body:JSON.stringify({email:email,password:password})}),t=await r.text(),j={};try{j=JSON.parse(t)}catch(_){ }if(!r.ok)throw Error(j.error_description||j.msg||j.message||"Email hoặc mật khẩu không đúng.");var token=j.access_token,id=String(j.user&&j.user.id||decodeJwt(token)&&decodeJwt(token).sub||"");if(!token||!id)throw Error("Không lấy được ID tài khoản.");localStorage.setItem("choco_access_token",token);localStorage.setItem("choco_user_id",id);localStorage.setItem("choco_role","customer");localStorage.setItem("choco_email",j.user&&j.user.email||email);var meta=j.user&&j.user.user_metadata||{};if(meta.full_name)localStorage.setItem("choco_customer_name",meta.full_name);m.textContent="✅ Đăng nhập thành công";m.className="cl-msg cl-ok";m.style.display="block";d.style.display="none";window.dispatchEvent(new Event("choco-customer-login"));}catch(err){m.textContent="❌ "+(err.message||String(err));m.className="cl-msg cl-err";m.style.display="block";b.disabled=false;b.textContent="🔐 ĐĂNG NHẬP";}};
  }

  function boot(){if(!validIdentity())installLogin();else resolveCustomer();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();

  if(!window.__chocoCustomerOrderIdentityInstalled){
    window.__chocoCustomerOrderIdentityInstalled=true;
    window.fetch=async function(input,init){
      init=init||{};var url=typeof input==="string"?input:(input&&input.url)||"",method=String(init.method||(input&&input.method)||"GET").toUpperCase();
      if(method==="POST"&&/\/rest\/v1\/orders(?:\?|$)/i.test(url)&&init.body){var result=resolveCustomer();if(!result.ok){installLogin();throw Error("Vui lòng đăng nhập tài khoản khách.");}var payload;try{payload=JSON.parse(init.body);}catch(e){throw Error("Dữ liệu đơn hàng không hợp lệ.");}payload.customer_id=result.id;init=Object.assign({},init,{body:JSON.stringify(payload)});var h=new Headers(init.headers||{});h.set("Content-Type","application/json");h.set("apikey",K);h.set("Authorization","Bearer "+result.token);init.headers=h;}
      return originalFetch(input,init);
    };
  }

  function setText(id,v){var el=document.getElementById(id);if(el)el.innerText=v;}
  function setAddress(v){var el=document.getElementById("address");if(el&&v)el.value=v;}
  function gpsText(lat,lng){return Number(lat).toFixed(6)+", "+Number(lng).toFixed(6);}
  async function reverseAddress(lat,lng){
    var urls=[
      "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude="+encodeURIComponent(lat)+"&longitude="+encodeURIComponent(lng)+"&localityLanguage=vi",
      "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+encodeURIComponent(lat)+"&lon="+encodeURIComponent(lng)+"&accept-language=vi"
    ];
    for(var i=0;i<urls.length;i++)try{var r=await originalFetch(urls[i],{headers:{Accept:"application/json"}});if(!r.ok)continue;var d=await r.json();if(d.display_name)return d.display_name;if(d.localityInfo){var a=[];if(d.locality)a.push(d.locality);if(d.city&&!a.includes(d.city))a.push(d.city);if(d.principalSubdivision&&!a.includes(d.principalSubdivision))a.push(d.principalSubdivision);if(a.length)return a.join(", ");}if(d.address){var x=d.address,a2=[];[x.house_number,x.road,x.quarter,x.suburb,x.village,x.town,x.city,x.state].forEach(function(v){if(v&&!a2.includes(v))a2.push(v)});if(a2.length)return a2.join(", ");}}catch(e){}
    return null;
  }

  async function doGPS(){
    if(!navigator.geolocation){alert("❌ Thiết bị/trình duyệt không hỗ trợ GPS.");return;}
    if(location.protocol!=="https:"&&location.hostname!=="localhost"){alert("❌ GPS chỉ hoạt động trên HTTPS.");return;}
    var buttons=[document.getElementById("gpsButton"),document.getElementById("cartGpsButton")].filter(Boolean);
    buttons.forEach(function(b){b.disabled=true;b.dataset.old=b.innerText;b.innerText="⏳ ĐANG LẤY GPS...";});
    setText("locationText","⏳ Đang xin quyền vị trí...");setText("cartGpsText","⏳ Đang xin quyền GPS...");
    navigator.geolocation.getCurrentPosition(async function(p){
      var lat=Number(p.coords.latitude),lng=Number(p.coords.longitude);
      try{if(typeof window.setDeliveryLocation==="function")window.setDeliveryLocation(lat,lng,"📍 Vị trí GPS hiện tại");}catch(e){}
      setText("locationText","📍 Vị trí GPS: "+gpsText(lat,lng));setText("selectedGPS",gpsText(lat,lng));setText("cartGpsText","📍 GPS: "+gpsText(lat,lng)+"\n⏳ Đang tìm địa chỉ...");
      try{if(typeof window.updateShippingDisplay==="function")window.updateShippingDisplay();}catch(e){}
      var addr=await reverseAddress(lat,lng);if(addr){setAddress(addr);setText("cartGpsText","📍 "+addr+"\nGPS: "+gpsText(lat,lng));}else setText("cartGpsText","📍 GPS: "+gpsText(lat,lng)+"\n⚠️ Không lấy được tên địa chỉ, bạn có thể nhập tay.");
      buttons.forEach(function(b){b.disabled=false;b.innerText="📍 CẬP NHẬT VỊ TRÍ";});
    },function(err){var msg="⚠️ Không lấy được GPS.";if(err&&err.code===1)msg="⚠️ Bạn đã chặn quyền vị trí. Vào Cài đặt → Quyền riêng tư & bảo mật → Dịch vụ định vị → Safari và bật vị trí.";else if(err&&err.code===2)msg="⚠️ Thiết bị chưa xác định được vị trí. Hãy bật GPS và thử lại ngoài trời.";else if(err&&err.code===3)msg="⚠️ GPS quá thời gian chờ. Hãy thử lại.";setText("locationText",msg);setText("cartGpsText",msg);buttons.forEach(function(b){b.disabled=false;b.innerText="📍 LẤY / CẬP NHẬT GPS GIAO HÀNG";});alert(msg);},{enableHighAccuracy:true,timeout:30000,maximumAge:0});
  }
  window.getGPS=doGPS;
})();