/* CHOCO SHIP - GPS + ADDRESS FIX + CUSTOMER ID */
(function () {
  "use strict";

  var SUPABASE_URL = "https://guwdswqaqnhzqapflvey.supabase.co";
  var SUPABASE_KEY = "sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9";

  function decodeJwt(token) {
    try {
      var parts = String(token || "").split(".");
      if (parts.length !== 3) return null;
      var b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      b64 += "=".repeat((4 - b64.length % 4) % 4);
      return JSON.parse(atob(b64));
    } catch (e) {
      return null;
    }
  }

  function getCustomerId() {
    var uid = localStorage.getItem("choco_user_id") || "";
    var token = localStorage.getItem("choco_access_token") || "";

    /* Existing login value wins, but validate it as a UUID-like value. */
    if (uid && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(uid)) return uid;

    /* Recover the authenticated Supabase user id directly from the access token. */
    var claims = decodeJwt(token);
    if (claims && typeof claims.sub === "string" && claims.sub) {
      uid = claims.sub;
      localStorage.setItem("choco_user_id", uid);
      localStorage.setItem("choco_access_token", token);
      return uid;
    }

    return "";
  }

  /* Make the helper used by customer.html use the same robust identity logic. */
  window.getCustomerId = getCustomerId;

  /*
   * If a valid Supabase access token exists but choco_user_id was lost,
   * recover it from /auth/v1/user as a second, authoritative fallback.
   */
  async function restoreCustomerSession() {
    var token = localStorage.getItem("choco_access_token") || "";
    if (!token) return "";

    var uid = getCustomerId();
    if (uid) return uid;

    try {
      var r = await fetch(SUPABASE_URL + "/auth/v1/user", {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + token,
          Accept: "application/json"
        }
      });
      if (!r.ok) return "";
      var user = await r.json();
      if (user && user.id) {
        localStorage.setItem("choco_user_id", String(user.id));
        if (user.email) localStorage.setItem("choco_email", user.email);
        console.log("[CHOCO SHIP] customer session restored:", user.id);
        return String(user.id);
      }
    } catch (e) {
      console.warn("[CHOCO SHIP] customer session restore failed:", e);
    }
    return "";
  }

  restoreCustomerSession();

  /*
   * Attach customer_id to every order POST and, importantly, send the real
   * Supabase access token instead of using the publishable key as the bearer.
   * This makes the request compatible with authenticated RLS policies.
   */
  if (!window.__chocoCustomerOrderIdentityInstalled) {
    window.__chocoCustomerOrderIdentityInstalled = true;
    var originalFetchForIdentity = window.fetch.bind(window);

    window.fetch = function (input, init) {
      init = init || {};

      try {
        var url = typeof input === "string" ? input : (input && input.url) || "";
        var method = String(
          init.method ||
          (typeof input !== "string" && input && input.method) ||
          "GET"
        ).toUpperCase();

        if (method === "POST" && /\/rest\/v1\/orders(?:\?|$)/i.test(url) && init.body) {
          var uid = getCustomerId();
          var token = localStorage.getItem("choco_access_token") || "";
          var payload = null;

          if (typeof init.body === "string") {
            try { payload = JSON.parse(init.body); } catch (e) {}
          }

          if (uid && payload && typeof payload === "object" && !Array.isArray(payload)) {
            payload.customer_id = uid;
            init = Object.assign({}, init, { body: JSON.stringify(payload) });

            var headers = new Headers(init.headers || {});
            headers.set("Content-Type", "application/json");
            if (token) headers.set("Authorization", "Bearer " + token);
            headers.set("apikey", SUPABASE_KEY);
            init.headers = headers;

            console.log("[CHOCO SHIP] order customer_id attached:", uid);
          } else if (token && payload && typeof payload === "object") {
            /* If JWT parsing is temporarily unavailable, don't downgrade to the publishable key. */
            var headersFallback = new Headers(init.headers || {});
            headersFallback.set("Content-Type", "application/json");
            headersFallback.set("Authorization", "Bearer " + token);
            headersFallback.set("apikey", SUPABASE_KEY);
            init.headers = headersFallback;
          }
        }
      } catch (e) {
        console.warn("[CHOCO SHIP] customer identity hook:", e);
      }

      return originalFetchForIdentity(input, init);
    };
  }

  var originalGetGPS = window.getGPS;
  if (typeof originalGetGPS !== "function") {
    console.warn("CHOCO SHIP: getGPS gốc chưa tồn tại.");
    return;
  }

  var REVERSE_URL = SUPABASE_URL + "/functions/v1/reverse-geocode";

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.innerText = value;
  }

  function setAddress(value) {
    var address = document.getElementById("address");
    if (!address || !value) return;
    address.value = value;
    address.dispatchEvent(new Event("input", { bubbles: true }));
    address.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function gpsText(lat, lng) {
    return Number(lat).toFixed(6) + ", " + Number(lng).toFixed(6);
  }

  function setAddressFromGPS(lat, lng) {
    setAddress("GPS: " + gpsText(lat, lng));
  }

  async function reverseViaSupabase(lat, lng) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 8000);

    try {
      var token = localStorage.getItem("choco_access_token") || "";
      var headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = "Bearer " + token;
      headers.apikey = SUPABASE_KEY;

      var response = await fetch(REVERSE_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ lat: lat, lng: lng }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();
      return data && data.ok && data.address ? data.address : null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function reverseBigDataCloud(lat, lng) {
    var url = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
      encodeURIComponent(lat) + "&longitude=" + encodeURIComponent(lng) +
      "&localityLanguage=vi";

    try {
      var response = await fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();

      var parts = [];
      if (data.locality) parts.push(data.locality);
      if (data.city && parts.indexOf(data.city) === -1) parts.push(data.city);
      if (data.principalSubdivision && parts.indexOf(data.principalSubdivision) === -1) {
        parts.push(data.principalSubdivision);
      }
      if (data.countryName && parts.indexOf(data.countryName) === -1) {
        parts.push(data.countryName);
      }

      return parts.length ? parts.join(", ") : null;
    } catch (e) {
      console.warn("CHOCO SHIP BigDataCloud reverse geocode:", e);
      return null;
    }
  }

  async function reverseGeocode(lat, lng) {
    try {
      var address = await reverseViaSupabase(lat, lng);
      if (address) return address;
    } catch (e) {
      console.warn("CHOCO SHIP Supabase reverse geocode:", e);
    }

    return await reverseBigDataCloud(lat, lng);
  }

  function finish(lat, lng) {
    lat = Number(lat);
    lng = Number(lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setAddressFromGPS(lat, lng);
    setText(
      "cartGpsText",
      "📍 GPS giao hàng: " + gpsText(lat, lng) + "\n⏳ Đang tìm địa chỉ..."
    );

    reverseGeocode(lat, lng).then(function (addressText) {
      var address = document.getElementById("address");

      if (addressText) {
        if (address && (!address.value || address.value.indexOf("GPS:") === 0)) {
          setAddress(addressText);
        }
        setText(
          "cartGpsText",
          "📍 " + addressText + "\nGPS: " + gpsText(lat, lng)
        );
      } else {
        setText(
          "cartGpsText",
          "📍 GPS: " + gpsText(lat, lng) + "\n⚠️ Chưa tìm được tên địa chỉ tự động."
        );
      }
    }).catch(function (e) {
      console.warn("CHOCO SHIP address lookup:", e);
    });
  }

  function extractGPS() {
    var sources = [
      document.getElementById("selectedGPS"),
      document.getElementById("cartGpsText"),
      document.getElementById("locationText")
    ];

    for (var i = 0; i < sources.length; i++) {
      var text = sources[i] ? sources[i].innerText || "" : "";
      var match = text.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);

      if (match) {
        var lat = Number(match[1]);
        var lng = Number(match[2]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat: lat, lng: lng };
        }
      }
    }

    return null;
  }

  function watchForGPSAndAddress() {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var gps = extractGPS();

      if (gps) {
        clearInterval(timer);
        finish(gps.lat, gps.lng);
        return;
      }

      if (tries >= 100) clearInterval(timer);
    }, 250);
  }

  window.getGPS = function () {
    originalGetGPS();
    watchForGPSAndAddress();
  };

  try {
    var saved = JSON.parse(
      localStorage.getItem("choco_ship_delivery_gps") || "null"
    );

    if (
      saved &&
      Number.isFinite(Number(saved.lat)) &&
      Number.isFinite(Number(saved.lng))
    ) {
      finish(Number(saved.lat), Number(saved.lng));
    }
  } catch (e) {}
})();
