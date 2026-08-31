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

  async function reverseNominatim(lat, lng) {
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
      encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) +
      "&zoom=18&addressdetails=1&accept-language=vi";

    try {
      var response = await fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();

      if (data && data.display_name) return data.display_name;
      return null;
    } catch (e) {
      console.warn("CHOCO SHIP Nominatim reverse geocode:", e);
      return null;
    }
  }

  async function reverseGeocode(lat, lng) {
    // Ưu tiên API không cần key, sau đó dùng Nominatim làm dự phòng.
    var address = await reverseBigDataCloud(lat, lng);
    if (address) return address;
    return await reverseNominatim(lat, lng);
  }

  function finish(lat, lng) {
    lat = Number(lat);
    lng = Number(lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // Hiện GPS ngay lập tức, không chờ reverse geocode.
    setAddressFromGPS(lat, lng);
    setText(
      "cartGpsText",
      "📍 GPS giao hàng: " + gpsText(lat, lng) + "\n⏳ Đang tìm địa chỉ..."
    );

    reverseGeocode(lat, lng).then(function (addressText) {
      var address = document.getElementById("address");

      if (addressText) {
        // Chỉ thay nếu người dùng chưa tự sửa địa chỉ.
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

      // Cho GPS iPhone đủ thời gian trả kết quả.
      if (tries >= 100) clearInterval(timer);
    }, 250);
  }

  // Không lấy GPS lần 2; chỉ bổ sung địa chỉ sau khi GPS gốc trả kết quả.
  window.getGPS = function () {
    originalGetGPS();
    watchForGPSAndAddress();
  };

  // Nếu đã có GPS lưu từ trước thì tự đồng bộ địa chỉ khi mở giỏ hàng.
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
