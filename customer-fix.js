/* CHOCO SHIP - CUSTOMER ID + GPS ADDRESS FIX */
(function () {
  "use strict";

  var SUPABASE_URL = "https://guwdswqaqnhzqapflvey.supabase.co";
  var SUPABASE_KEY = "sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9";
  var originalFetch = window.fetch.bind(window);

  function decodeJwt(token) {
    try {
      var p = String(token || "").split(".");
      if (p.length !== 3) return null;
      var b = p[1].replace(/-/g, "+").replace(/_/g, "/");
      b += "=".repeat((4 - b.length % 4) % 4);
      return JSON.parse(atob(b));
    } catch (e) { return null; }
  }

  function localIdentity() {
    var token = localStorage.getItem("choco_access_token") || "";
    var claims = decodeJwt(token);
    return { token: token, id: claims && claims.sub ? String(claims.sub) : "" };
  }

  async function resolveCustomer() {
    var x = localIdentity();
    if (!x.token || !x.id) return { ok: false, error: "Không xác định được tài khoản khách." };

    try {
      var r = await originalFetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + encodeURIComponent(x.id) + "&select=id,role,full_name,phone", {
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + x.token, Accept: "application/json" }
      });
      if (!r.ok) return { ok: false, error: "Không kiểm tra được quyền tài khoản." };
      var rows = await r.json();
      var p = rows && rows[0];
      if (!p || p.role !== "customer") {
        localStorage.removeItem("choco_user_id");
        return { ok: false, error: "Tài khoản hiện tại không phải tài khoản Khách hàng." };
      }
      localStorage.setItem("choco_user_id", String(p.id));
      localStorage.setItem("choco_role", "customer");
      if (p.full_name) localStorage.setItem("choco_customer_name", p.full_name);
      if (p.phone) localStorage.setItem("choco_customer_phone", p.phone);
      return { ok: true, id: String(p.id), token: x.token, profile: p };
    } catch (e) {
      return { ok: false, error: "Không thể xác thực tài khoản khách." };
    }
  }

  window.getCustomerId = function () {
    var x = localIdentity();
    var stored = localStorage.getItem("choco_user_id") || "";
    return x.id && stored === x.id && localStorage.getItem("choco_role") === "customer" ? x.id : "";
  };
  window.chocoResolveCustomer = resolveCustomer;

  (async function () {
    var result = await resolveCustomer();
    if (!result.ok) console.warn("[CHOCO SHIP] customer identity:", result.error);
  })();

  if (!window.__chocoCustomerOrderIdentityInstalled) {
    window.__chocoCustomerOrderIdentityInstalled = true;
    window.fetch = async function (input, init) {
      init = init || {};
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var method = String(init.method || (input && input.method) || "GET").toUpperCase();

      if (method === "POST" && /\/rest\/v1\/orders(?:\?|$)/i.test(url) && init.body) {
        var result = await resolveCustomer();
        if (!result.ok) {
          throw new Error(result.error);
        }
        var payload;
        try { payload = typeof init.body === "string" ? JSON.parse(init.body) : null; } catch (e) { payload = null; }
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Dữ liệu đơn hàng không hợp lệ.");
        payload.customer_id = result.id;
        init = Object.assign({}, init, { body: JSON.stringify(payload) });
        var headers = new Headers(init.headers || {});
        headers.set("Content-Type", "application/json");
        headers.set("apikey", SUPABASE_KEY);
        headers.set("Authorization", "Bearer " + result.token);
        init.headers = headers;
      }
      return originalFetch(input, init);
    };
  }

  /* Keep GPS/address helper from the previous version. */
  var originalGetGPS = window.getGPS;
  if (typeof originalGetGPS !== "function") return;
  var REVERSE_URL = SUPABASE_URL + "/functions/v1/reverse-geocode";

  function setText(id, value) { var el = document.getElementById(id); if (el) el.innerText = value; }
  function setAddress(value) { var el = document.getElementById("address"); if (el && value) { el.value = value; el.dispatchEvent(new Event("input", {bubbles:true})); el.dispatchEvent(new Event("change", {bubbles:true})); } }
  function gpsText(lat,lng) { return Number(lat).toFixed(6)+", "+Number(lng).toFixed(6); }

  async function reverseViaSupabase(lat,lng) {
    var token = localStorage.getItem("choco_access_token") || "";
    var r = await originalFetch(REVERSE_URL, { method:"POST", headers:{"Content-Type":"application/json",apikey:SUPABASE_KEY, ...(token ? {Authorization:"Bearer "+token}: {})}, body:JSON.stringify({lat:lat,lng:lng}) });
    if (!r.ok) throw new Error("HTTP "+r.status);
    var d = await r.json();
    return d && d.ok && d.address ? d.address : null;
  }

  async function reverseBigDataCloud(lat,lng) {
    try {
      var r = await originalFetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude="+encodeURIComponent(lat)+"&longitude="+encodeURIComponent(lng)+"&localityLanguage=vi", {headers:{Accept:"application/json"}});
      if (!r.ok) return null;
      var d = await r.json(), parts=[];
      if (d.locality) parts.push(d.locality);
      if (d.city && !parts.includes(d.city)) parts.push(d.city);
      if (d.principalSubdivision && !parts.includes(d.principalSubdivision)) parts.push(d.principalSubdivision);
      if (d.countryName && !parts.includes(d.countryName)) parts.push(d.countryName);
      return parts.length ? parts.join(", ") : null;
    } catch (e) { return null; }
  }

  async function reverseGeocode(lat,lng) {
    try { return await reverseViaSupabase(lat,lng); } catch(e) { return await reverseBigDataCloud(lat,lng); }
  }

  function finish(lat,lng) {
    lat=Number(lat); lng=Number(lng); if(!Number.isFinite(lat)||!Number.isFinite(lng)) return;
    setAddress("GPS: "+gpsText(lat,lng));
    setText("cartGpsText","📍 GPS giao hàng: "+gpsText(lat,lng)+"\n⏳ Đang tìm địa chỉ...");
    reverseGeocode(lat,lng).then(function(a){
      if(a){ var el=document.getElementById("address"); if(el && (!el.value || el.value.indexOf("GPS:")===0)) setAddress(a); setText("cartGpsText","📍 "+a+"\nGPS: "+gpsText(lat,lng)); }
      else setText("cartGpsText","📍 GPS: "+gpsText(lat,lng)+"\n⚠️ Chưa tìm được tên địa chỉ tự động.");
    }).catch(function(){});
  }

  function extractGPS() {
    var els=[document.getElementById("selectedGPS"),document.getElementById("cartGpsText"),document.getElementById("locationText")];
    for(var i=0;i<els.length;i++){
      var text=els[i] ? els[i].innerText||"" : "", m=text.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
      if(m) return {lat:Number(m[1]),lng:Number(m[2])};
    }
    return null;
  }

  function watchGPS(){
    var tries=0, timer=setInterval(function(){ var g=extractGPS(); if(g){clearInterval(timer);finish(g.lat,g.lng);} else if(++tries>=100) clearInterval(timer); },250);
  }

  window.getGPS=function(){ originalGetGPS(); watchGPS(); };
})();