/* CHOCO SHIP - GPS + ADDRESS FIX
   Dùng GPS gốc của customer.html để cập nhật đúng biến currentGPS.
   Không thay thế logic đặt đơn, không polling liên tục.
*/
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
    // Điền ngay lập tức, không chờ API địa chỉ.
    address.value = "GPS: " + coords;
    address.dispatchEvent(new Event("input", { bubbles: true }));
    address.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function reverseGeocode(lat, lng) {
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
      encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) +
      "&zoom=18&addressdetails=1&accept-language=vi";

    try {
      var response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();
      return data && data.display_name ? data.display_name : null;
    } catch (e) {
      console.warn("CHOCO SHIP reverse geocode:", e);
      return null;
    }
  }

  function watchForGPSAndAddress() {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;

      var gps = window.currentGPS;
      var selected = document.getElementById("selectedGPS");

      // customer.html giữ currentGPS bằng biến global lexical; lấy tọa độ từ ô hiển thị.
      var text = selected ? selected.innerText : "";
      var match = text.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);

      if (gps && Number.isFinite(Number(gps.lat)) && Number.isFinite(Number(gps.lng))) {
        clearInterval(timer);
        finish(Number(gps.lat), Number(gps.lng));
        return;
      }

      if (match) {
        clearInterval(timer);
        finish(Number(match[1]), Number(match[2]));
        return;
      }

      if (tries >= 40) clearInterval(timer);
    }, 250);
  }

  function finish(lat, lng) {
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

  // Chỉ bọc nút gốc: GPS được lấy đúng 1 lần, sau đó bổ sung địa chỉ.
  window.getGPS = function () {
    originalGetGPS();
    watchForGPSAndAddress();
  };

  // Không tự gọi GPS khi mở trang. Chỉ khôi phục địa chỉ nếu đã có GPS cũ.
  try {
    var saved = JSON.parse(localStorage.getItem("choco_ship_delivery_gps") || "null");
    if (saved && Number.isFinite(Number(saved.lat)) && Number.isFinite(Number(saved.lng))) {
      finish(Number(saved.lat), Number(saved.lng));
    }
  } catch (e) {}
})();
