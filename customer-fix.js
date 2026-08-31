/* CHOCO SHIP - CUSTOMER FIX - SAFE VERSION
   GPS/address persistence only. No MutationObserver or polling.
*/
(function () {
  "use strict";

  const GPS_KEY = "choco_ship_delivery_gps";
  const ADDRESS_KEY = "choco_ship_delivery_address";

  function saveGPS(lat, lng) {
    try {
      localStorage.setItem(GPS_KEY, JSON.stringify({
        lat: Number(lat), lng: Number(lng), updated_at: new Date().toISOString()
      }));
    } catch (e) {}
  }

  function saveAddress(value) {
    try {
      if (value) localStorage.setItem(ADDRESS_KEY, value);
    } catch (e) {}
  }

  function combined(lat, lng, text) {
    const gps = "📍 GPS: " + Number(lat).toFixed(6) + ", " + Number(lng).toFixed(6);
    const t = String(text || "").trim()
      .replace(/^📍 GPS:\s*[-0-9.]+,\s*[-0-9.]+\s*\|\s*🏠\s*/i, "")
      .replace(/^📍 GPS:\s*[-0-9.]+,\s*[-0-9.]+\s*$/i, "");
    return t ? gps + " | 🏠 " + t : gps;
  }

  async function reverse(lat, lng) {
    try {
      const r = await fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
        encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) + "&zoom=18&addressdetails=1");
      if (!r.ok) return "";
      const d = await r.json();
      return d.display_name || "";
    } catch (e) {
      return "";
    }
  }

  async function syncAddress(lat, lng) {
    const el = document.getElementById("address");
    if (!el) return;

    const old = el.value || "";
    el.value = combined(lat, lng, old);
    const readable = await reverse(lat, lng);
    el.value = combined(lat, lng, readable || old);
    saveAddress(el.value);
  }

  function restore() {
    try {
      const gps = JSON.parse(localStorage.getItem(GPS_KEY) || "null");
      const address = localStorage.getItem(ADDRESS_KEY) || "";
      if (gps && Number.isFinite(Number(gps.lat)) && Number.isFinite(Number(gps.lng))) {
        currentGPS.lat = Number(gps.lat);
        currentGPS.lng = Number(gps.lng);
        if (typeof updateShippingDisplay === "function") updateShippingDisplay();
      }
      const el = document.getElementById("address");
      if (el && address) el.value = address;
    } catch (e) {}
  }

  function install() {
    if (typeof window.setDeliveryLocation !== "function") return;
    if (window.setDeliveryLocation.__chocoSafe) return;

    const original = window.setDeliveryLocation;
    const wrapped = function (lat, lng, message) {
      const result = original(lat, lng, message);
      saveGPS(lat, lng);
      syncAddress(lat, lng).catch(function () {});
      return result;
    };
    wrapped.__chocoSafe = true;
    window.setDeliveryLocation = wrapped;
  }

  // customer.html defines these functions before loading this file.
  install();
  restore();
})();
