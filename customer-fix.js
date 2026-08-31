/* CHOCO SHIP - GPS + ADDRESS FIX */
(function () {
  "use strict";

  var originalGetGPS = window.getGPS;
  if (typeof originalGetGPS !== "function") {
    console.warn("CHOCO SHIP: getGPS gốc chưa tồn tại.");
    return;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.innerText = value;
  }

  function setAddressFromGPS(lat, lng) {
    var address = document.getElementById("address");
    if (!address) return;
    var coords = Number(lat).toFixed(6) + ", " + Number(lng).toFixed(6);
    address.value = "GPS: " + coords;
    address.dispatchEvent(new Event("input", { bubbles: true }));
    address.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function reverseGeocode(lat, lng) {
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
      encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) +
      "&zoom=18&addressdetails=1&accept-language=vi";
    try {
      var response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();
      return data && data.display_name ? data.display_name : null;
    } catch (e) {
      console.warn("CHOCO SHIP reverse geocode:", e);
      return null;
    }
  }

  function finish(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setAddressFromGPS(lat, lng);
    setText("cartGpsText", "📍 GPS giao hàng: " + lat.toFixed(6) + ", " + lng.toFixed(6));

    reverseGeocode(lat, lng).then(function (addressText) {
      if (!addressText) return;
      var address = document.getElementById("address");
      if (address && address.value.indexOf("GPS:") === 0) {
        address.value = addressText;
        address.dispatchEvent(new Event("input", { bubbles: true }));
        address.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setText("cartGpsText", "📍 " + addressText + "\nGPS: " + lat.toFixed(6) + ", " + lng.toFixed(6));
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
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat: lat, lng: lng };
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
      // Cho đủ thời gian cho GPS iPhone trả kết quả.
      if (tries >= 100) clearInterval(timer);
    }, 250);
  }

  // Không lấy GPS lần 2; chỉ bổ sung địa chỉ sau khi GPS gốc trả kết quả.
  window.getGPS = function () {
    originalGetGPS();
    watchForGPSAndAddress();
  };

  try {
    var saved = JSON.parse(localStorage.getItem("choco_ship_delivery_gps") || "null");
    if (saved && Number.isFinite(Number(saved.lat)) && Number.isFinite(Number(saved.lng))) {
      finish(Number(saved.lat), Number(saved.lng));
    }
  } catch (e) {}
})();
