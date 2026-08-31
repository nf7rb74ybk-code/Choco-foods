/* CHOCO SHIP - CUSTOMER FIX
   Loaded AFTER customer.html's main script.
   Fixes: one-click order, validation, GPS/address sync, double-submit.
*/
(function () {
  "use strict";

  let orderSubmitting = false;
  let addressManuallyEdited = false;

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

  function saveDeliveryGPS(lat, lng) {
    try {
      localStorage.setItem("choco_ship_delivery_gps", JSON.stringify({
        lat: Number(lat),
        lng: Number(lng),
        updated_at: new Date().toISOString()
      }));
    } catch (e) {
      console.warn("Không lưu được GPS vào localStorage:", e);
    }
  }

  function saveDeliveryAddress(text) {
    try {
      if (text) localStorage.setItem("choco_ship_delivery_address", text);
      else localStorage.removeItem("choco_ship_delivery_address");
    } catch (e) {
      console.warn("Không lưu được địa chỉ vào localStorage:", e);
    }
  }

  function syncAddressField(text, markAsManual) {
    const address = document.getElementById("address");
    if (!address || !text) return false;

    address.value = text;
    addressManuallyEdited = !!markAsManual;
    address.style.borderColor = markAsManual ? "#ddd" : "#22c55e";

    // Tell the original customer page/cart that the value changed.
    try {
      address.dispatchEvent(new Event("input", { bubbles: true }));
      address.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (e) {}

    return true;
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

  async function updateAddressFromGPS(lat, lng) {
    const address = document.getElementById("address");
    if (!address) return;

    address.placeholder = "⏳ Đang lấy địa chỉ từ vị trí...";
    const text = await reverseAddress(lat, lng);

    // GPS update is authoritative: replace the previous cart address.
    if (text) {
      syncAddressField(text, false);
      saveDeliveryAddress(text);
    } else {
      const fallback = "📍 GPS: " + Number(lat).toFixed(6) + ", " + Number(lng).toFixed(6);
      syncAddressField(fallback, false);
      saveDeliveryAddress(fallback);
    }

    address.placeholder = "Ví dụ: 123 đường Trần Hưng Đạo...";

    window.dispatchEvent(new CustomEvent("choco:delivery-location-updated", {
      detail: {
        lat: Number(lat),
        lng: Number(lng),
        address: text || ""
      }
    }));
  }

  // GPS setter: GPS is the source of coordinates AND updates the cart address.
  window.setDeliveryLocation = async function (lat, lng, message) {
    currentGPS.lat = Number(lat);
    currentGPS.lng = Number(lng);
    addressManuallyEdited = false;
    saveDeliveryGPS(currentGPS.lat, currentGPS.lng);

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

    // IMPORTANT: always synchronize the latest GPS position into the cart address.
    await updateAddressFromGPS(currentGPS.lat, currentGPS.lng);
  };

  // Override GPS button so the existing UI works with the new setter.
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

  // One-click order. The Supabase INSERT happens exactly once per click.
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
      // IMPORTANT: exactly one order INSERT.
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

      // Notification is best-effort. Never ask customer to submit again.
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

      // Close cart after successful single submission.
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

  // Keep the cart address synchronized even if the cart input is rendered later.
  function restoreSavedDeliveryAddress() {
    const saved = localStorage.getItem("choco_ship_delivery_address");
    if (saved && document.getElementById("address") && !document.getElementById("address").value.trim()) {
      syncAddressField(saved, false);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const address = document.getElementById("address");
    if (address) {
      address.addEventListener("input", function () {
        addressManuallyEdited = true;
        address.style.borderColor = "#ddd";
        saveDeliveryAddress(address.value.trim());
      });
    }

    restoreSavedDeliveryAddress();

    // Some cart UIs create/recreate #address after page load.
    const observer = new MutationObserver(function () {
      restoreSavedDeliveryAddress();
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
})();
