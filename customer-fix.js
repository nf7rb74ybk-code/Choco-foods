/* CHOCO SHIP - CUSTOMER FIX
   Loaded AFTER customer.html's main script.
   Fixes: one-click order, validation, GPS/address sync, double-submit.
*/
(function () {
  "use strict";

  let orderSubmitting = false;

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setInvalid(id, message) {
    const el = document.getElementById(id);
    if (el) {
      el.style.borderColor = "#ef4444";
      el.focus();
    }
    alert(message);
    return false;
  }

  function clearInvalid() {
    ["name", "phone", "address"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.borderColor = "#ddd";
    });
  }

  function validPhone(phone) {
    return /^(03|05|07|08|09)[0-9]{8}$/.test(phone.replace(/\s+/g, ""));
  }

  async function reverseAddress(lat, lng) {
    try {
      const url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
        encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) + "&zoom=18&addressdetails=1";
      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("Reverse geocoding failed");
      const data = await response.json();
      return data.display_name || "";
    } catch (e) {
      console.warn("Không lấy được địa chỉ tự động:", e);
      return "";
    }
  }

  window.setDeliveryLocation = async function (lat, lng, message) {
    currentGPS.lat = Number(lat);
    currentGPS.lng = Number(lng);

    if (marker) map.removeLayer(marker);

    marker = L.marker([currentGPS.lat, currentGPS.lng])
      .addTo(map)
      .bindPopup(message || "📍 Vị trí giao hàng")
      .openPopup();

    map.setView([currentGPS.lat, currentGPS.lng], 16);

    const locationText = document.getElementById("locationText");
    if (locationText) {
      locationText.innerHTML = "📍 <b>Vị trí giao hàng:</b><br>" +
        currentGPS.lat.toFixed(6) + ", " + currentGPS.lng.toFixed(6);
    }

    updateShippingDisplay();

    const address = document.getElementById("address");
    if (address && !address.value.trim()) {
      address.placeholder = "⏳ Đang lấy địa chỉ từ vị trí...";
      const text = await reverseAddress(currentGPS.lat, currentGPS.lng);
      if (text && !address.value.trim()) {
        address.value = text;
        address.style.borderColor = "#22c55e";
      }
      address.placeholder = "Ví dụ: 123 đường Trần Hưng Đạo...";
    }
  };

  window.getGPS = function () {
    if (!navigator.geolocation) {
      alert("❌ Thiết bị không hỗ trợ GPS.");
      return;
    }

    const button = document.getElementById("gpsButton");
    if (button) {
      button.disabled = true;
      button.innerText = "⏳ ĐANG LẤY VỊ TRÍ...";
    }

    const locationText = document.getElementById("locationText");
    if (locationText) locationText.innerText = "📍 Đang lấy vị trí...";

    navigator.geolocation.getCurrentPosition(
      async function (position) {
        await window.setDeliveryLocation(
          position.coords.latitude,
          position.coords.longitude,
          "📍 Vị trí GPS hiện tại"
        );
        if (button) {
          button.disabled = false;
          button.innerText = "📍 CẬP NHẬT VỊ TRÍ";
        }
      },
      function (error) {
        let text = "Không lấy được GPS.";
        if (error.code === 1) text = "Bạn chưa cho phép trình duyệt sử dụng vị trí.";
        if (error.code === 2) text = "Không xác định được vị trí.";
        if (error.code === 3) text = "GPS hết thời gian chờ.";
        alert("⚠️ " + text);
        if (locationText) locationText.innerText = "⚠️ " + text;
        if (button) {
          button.disabled = false;
          button.innerText = "📍 LẤY VỊ TRÍ HIỆN TẠI";
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  window.createOrder = async function () {
    if (orderSubmitting) return;

    clearInvalid();

    if (!Array.isArray(cart) || cart.length === 0) {
      alert("⚠️ Bạn chưa chọn món.");
      return;
    }

    const name = val("name");
    const phone = val("phone").replace(/\s+/g, "");
    const address = val("address");
    const note = val("note");
    const payment = document.getElementById("payment")?.value || "cash";

    if (name.length < 2) return setInvalid("name", "⚠️ Vui lòng nhập họ tên hợp lệ.");
    if (!validPhone(phone)) return setInvalid("phone", "⚠️ Số điện thoại phải có 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.");
    if (address.length < 5) return setInvalid("address", "⚠️ Vui lòng nhập/chọn địa chỉ giao hàng.");

    if (currentGPS.lat === null || currentGPS.lng === null ||
        !Number.isFinite(Number(currentGPS.lat)) || !Number.isFinite(Number(currentGPS.lng))) {
      alert("📍 Vui lòng bấm LẤY VỊ TRÍ hoặc chạm vào bản đồ để chọn vị trí giao hàng.");
      return;
    }

    const foodTotal = getFoodTotal();
    const shippingFee = calculateShippingFee();
    const total = foodTotal + shippingFee;
    const distance = calculateDistance(10.2899, 103.9840, currentGPS.lat, currentGPS.lng);
    const code = "CS" + Date.now().toString().slice(-6);

    const order = {
      code,
      name,
      phone,
      address,
      note,
      payment,
      items: JSON.stringify(cart),
      food_total: foodTotal,
      shipping_fee: shippingFee,
      total,
      status: "Chờ xác nhận",
      time: new Date().toISOString(),
      latitude: Number(currentGPS.lat),
      longitude: Number(currentGPS.lng),
      distance_km: Number(distance.toFixed(2))
    };

    const button = document.getElementById("orderButton");
    orderSubmitting = true;
    if (button) {
      button.disabled = true;
      button.innerText = "⏳ ĐANG GỬI ĐƠN...";
    }

    try {
      const response = await fetch(SUPABASE_URL + "/rest/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(order)
      });

      const resultText = await response.text();
      console.log("SUPABASE ORDER STATUS:", response.status, resultText);

      if (!response.ok) throw new Error(resultText || "Supabase từ chối đơn hàng.");

      localStorage.setItem("choco_ship_last_order", JSON.stringify(order));

      try {
        const pushResponse = await fetch(SUPABASE_URL + "/functions/v1/send-push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + SUPABASE_KEY
          },
          body: JSON.stringify({
            order_id: code,
            code,
            title: "🚚 CHOCO SHIP - ĐƠN MỚI",
            message: "📦 " + name + " vừa đặt đơn " + code + " • " + money(total)
          })
        });
        const pushText = await pushResponse.text();
        console.log("SEND PUSH STATUS:", pushResponse.status, pushText);
      } catch (pushError) {
        console.warn("SEND PUSH WARNING (order already created):", pushError);
      }

      const successBox = document.getElementById("successBox");
      if (successBox) {
        successBox.style.display = "block";
        successBox.innerHTML = "<strong>🎉 ĐẶT ĐƠN THÀNH CÔNG</strong><br><br>" +
          "📦 Mã đơn: <strong>" + code + "</strong><br>" +
          "🍔 Tiền món: <strong>" + money(foodTotal) + "</strong><br>" +
          "📏 Khoảng cách: <strong>" + distance.toFixed(1) + " km</strong><br>" +
          "🛵 Phí ship: <strong>" + money(shippingFee) + "</strong><br>" +
          "💰 Tổng tiền: <strong>" + money(total) + "</strong><br>" +
          "📍 GPS: <strong>" + Number(currentGPS.lat).toFixed(6) + ", " + Number(currentGPS.lng).toFixed(6) + "</strong><br><br>" +
          "🟢 Đơn đang chờ CHOCO SHIP xác nhận.";
      }

      alert("🎉 ĐẶT ĐƠN THÀNH CÔNG!\n\nMã đơn: " + code + "\nTổng tiền: " + money(total));

      cart = [];
      updateCart();
      renderCart();

      ["name", "phone", "address", "note"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      const paymentEl = document.getElementById("payment");
      if (paymentEl) paymentEl.value = "cash";

      setTimeout(() => {
        if (typeof closeCart === "function") closeCart();
      }, 300);

    } catch (error) {
      console.error("CHOCO SHIP ORDER ERROR:", error);
      alert("❌ KHÔNG GỬI ĐƯỢC ĐƠN.\n\nLỗi Supabase:\n\n" + error.message);
    } finally {
      orderSubmitting = false;
      if (button) {
        button.disabled = false;
        button.innerText = "🚀 ĐẶT ĐƠN";
      }
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    const address = document.getElementById("address");
    if (address) {
      address.addEventListener("input", function () {
        address.style.borderColor = "#ddd";
      });
    }

    // Customer tracking shortcut: only appears for an authenticated customer.
    const token = localStorage.getItem("choco_access_token");
    const role = localStorage.getItem("choco_role");
    if (token && role === "customer") {
      const bottom = document.querySelector(".bottom");
      if (bottom && !document.getElementById("trackingShortcut")) {
        const btn = document.createElement("button");
        btn.id = "trackingShortcut";
        btn.innerHTML = "<span>🚚</span>Theo dõi";
        btn.onclick = function () {
          const last = localStorage.getItem("choco_ship_last_order");
          let code = "";
          try { code = JSON.parse(last || "null")?.code || ""; } catch {}
          location.href = "./tracking.html" + (code ? "?code=" + encodeURIComponent(code) : "");
        };
        bottom.appendChild(btn);
      }
    }
  });
})();