/* CHOCO SHIP - GPS FIX
   GPS duy nhất cho trang khách.
   Không polling, không OneSignal, không vòng lặp.
*/
(function () {
  "use strict";

  function text(id, value) {
    var el = document.getElementById(id);
    if (el) el.innerText = value;
  }

  function buttons(value, disabled) {
    ["gpsButton", "cartGpsButton"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.innerText = value;
        el.disabled = !!disabled;
      }
    });
  }

  async function reverseGeocode(lat, lng) {
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) + "&zoom=18&addressdetails=1&accept-language=vi";
    try {
      var response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();
      if (data && data.display_name) return data.display_name;
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    }
    return "GPS: " + lat.toFixed(6) + ", " + lng.toFixed(6);
  }

  function sync(lat, lng) {
    lat = Number(lat);
    lng = Number(lng);

    if (!window.currentGPS) window.currentGPS = { lat: null, lng: null };
    window.currentGPS.lat = lat;
    window.currentGPS.lng = lng;

    var coords = lat.toFixed(6) + ", " + lng.toFixed(6);

    var address = document.getElementById("address");
    if (address && (!address.value.trim() || address.value.indexOf("GPS:") === 0)) {
      address.value = "GPS: " + coords;
    }

    text("locationText", "📍 Vị trí giao hàng:\n" + coords);
    text("cartGpsText", "📍 GPS giao hàng: " + coords);
    text("selectedGPS", coords);

    try {
      if (window.marker && window.map) window.map.removeLayer(window.marker);
      if (window.L && window.map) {
        window.marker = L.marker([lat, lng]).addTo(window.map).bindPopup("📍 Vị trí giao hàng").openPopup();
        window.map.setView([lat, lng], 16);
      }
    } catch (e) {
      console.warn("GPS map sync:", e);
    }

    if (typeof window.updateShippingDisplay === "function") {
      window.updateShippingDisplay();
    }

    try {
      localStorage.setItem("choco_ship_delivery_gps", JSON.stringify({
        lat: lat,
        lng: lng,
        saved_at: new Date().toISOString()
      }));
    } catch (e) {}

    buttons("📍 CẬP NHẬT GPS", false);

    // Đổi GPS thành địa chỉ dễ đọc; nếu dịch vụ lỗi vẫn giữ GPS.
    reverseGeocode(lat, lng).then(function (addressText) {
      var address = document.getElementById("address");
      if (address && (!address.value.trim() || address.value.indexOf("GPS:") === 0)) {
        address.value = addressText;
      }
      text("cartGpsText", "📍 " + addressText + "\nGPS: " + coords);
      text("locationText", "📍 " + addressText + "\n" + coords);
    });
  }

  function getGPSFixed() {
    if (!window.isSecureContext) {
      alert("❌ GPS cần HTTPS. Hãy mở CHOCO SHIP bằng link GitHub Pages.");
      return;
    }

    if (!navigator.geolocation) {
      alert("❌ iPhone/trình duyệt không hỗ trợ GPS.");
      return;
    }

    buttons("⏳ ĐANG LẤY GPS...", true);
    text("locationText", "📍 Đang xin quyền và lấy vị trí iPhone...");
    text("cartGpsText", "📍 Đang lấy GPS...");

    navigator.geolocation.getCurrentPosition(
      function (position) {
        sync(position.coords.latitude, position.coords.longitude);
      },
      function (error) {
        console.error("GPS ERROR:", error);
        buttons("📍 LẤY / CẬP NHẬT GPS GIAO HÀNG", false);

        var msg = "❌ Không lấy được vị trí.";
        if (error && error.code === 1) {
          msg = "❌ iPhone chưa cho phép trang web sử dụng vị trí. Hãy bật Quyền vị trí cho Safari.";
        } else if (error && error.code === 2) {
          msg = "❌ Không xác định được vị trí. Hãy bật Dịch vụ định vị trên iPhone.";
        } else if (error && error.code === 3) {
          msg = "❌ GPS hết thời gian chờ. Hãy thử lại.";
        }
        text("locationText", msg);
        text("cartGpsText", msg);
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  }

  window.getGPS = getGPSFixed;

  try {
    var saved = JSON.parse(localStorage.getItem("choco_ship_delivery_gps") || "null");
    if (saved && Number.isFinite(Number(saved.lat)) && Number.isFinite(Number(saved.lng))) {
      sync(saved.lat, saved.lng);
    }
  } catch (e) {}
})();
