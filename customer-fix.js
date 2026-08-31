/* CHOCO SHIP - CUSTOMER FIX
   Loaded AFTER customer.html's main script.
   Fixes: one-click order, validation, GPS/address sync, double-submit.
*/
(function () {
  "use strict";

  let orderSubmitting = false;
  let addressManuallyEdited = false;
  let pendingDeliveryLocation = null;

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

  function formatDeliveryAddress(lat, lng, addressText) {
    const gpsText = "📍 GPS: " + Number(lat).toFixed(6) + ", " + Number(lng).toFixed(6);
    const cleanAddress = String(addressText || "").trim();
    return cleanAddress && !cleanAddress.startsWith("📍 GPS:")
      ? gpsText + " | 🏠 " + cleanAddress
      : gpsText;
  }

  function syncAddressField(text, markAsManual) {
    const address = document.getElementById("address");
    if (!address || !text) return false;

    address.value = text;
    addressManuallyEdited = !!markAsManual;
    address.style.borderColor = markAsManual ? "#ddd" : "#22c55e";

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
    pendingDeliveryLocation = {
      lat: Number(lat),
      lng: Number(lng),
      address: ""
    };

    const address = document.getElementById("address");
    if (address) {
      address.placeholder = "⏳ Đang lấy GPS + địa chỉ...";
      syncAddressField(formatDeliveryAddress(lat, lng, "Đang lấy địa chỉ..."), false);
    }

    const text = await reverseAddress(lat, lng);
    const finalText = formatDeliveryAddress(lat, lng, text || "Chưa xác định được địa chỉ");

    pendingDeliveryLocation.address = finalText;
    saveDeliveryAddress(finalText);
    syncAddressField(finalText, false);

    if (address) address.placeholder = "Ví dụ: 123 đường Trần Hưng Đạo...";

    window.dispatchEvent(new CustomEvent("choco:delivery-location-updated", {
      detail: {
        lat: Number(lat),
        lng: Number(lng),
        address: finalText
      }
    }));
  }

  function restoreSavedDeliveryAddress() {
    const address = document.getElementById("address");
    if (!address) return;

    try {
      const savedGPS = JSON.parse(localStorage.getItem("choco_ship_delivery_gps") || "null");
      const savedAddress = localStorage.getItem("choco_ship_delivery_address") || "";

      if (savedGPS && Number.isFinite(Number(savedGPS.lat)) && Number.isFinite(Number(savedGPS.lng))) {
        let readable = savedAddress;
        readable = readable.replace(/^📍 GPS:\s*[-0-9.]+,\s*[-0-9.]+\s*\|\s*🏠\s*/i, "");
        readable = readable.replace(/^📍 GPS:\s*[-0-9.]+,\s*[-0-9.]+\s*$/i, "");

        const combined = formatDeliveryAddress(savedGPS.lat, savedGPS.lng, readable);
        syncAddressField(combined, false);
        saveDeliveryAddress(combined);
        return;
      }

      if (savedAddress) syncAddressField(savedAddress, false);
    } catch (e) {
      console.warn("Không khôi phục được địa chỉ/GPS:", e);
    }

    if (pendingDeliveryLocation && pendingDeliveryLocation.address) {
      syncAddressField(pendingDeliveryLocation.address, false);
    }
  }

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
    await updateAddressFromGPS(currentGPS.lat, currentGPS.lng);
    updateCartGPSBox();
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

  function updateCartGPSBox() {
    const address = document.getElementById("address");
    if (!address) return;

    let box = document.getElementById("cartGPSBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "cartGPSBox";
      box.style.cssText = "background:#eff6ff;border:1px solid #93c5fd;padding:12px;border-radius:10px;margin:8px 0 4px;";
      address.parentNode.insertBefore(box, address);
    }

    const hasGPS = currentGPS && Number.isFinite(Number(currentGPS.lat)) && Number.isFinite(Number(currentGPS.lng));
    box.innerHTML = hasGPS
      ? "📍 <b>GPS giao hàng</b><br><span style='font-size:14px'>" + Number(currentGPS.lat).toFixed(6) + ", " + Number(currentGPS.lng).toFixed(6) + "</span>"
      : "📍 <b>Chưa lấy vị trí GPS</b>";
  }

  function ensureCartGPSButton() {
    const address = document.getElementById("address");
    if (!address) return;

    let button = document.getElementById("cartGPSButton");
    if (!button) {
      button = document.createElement("button");
      button.id = "cartGPSButton";
      button.type = "button";
      button.className = "location";
      button.style.marginTop = "8px";
      button.innerHTML = "📍 LẤY / CẬP NHẬT GPS GIAO HÀNG";
      button.addEventListener("click", function () {
        window.getGPS();
      });
      address.parentNode.insertBefore(button, address);
    }

    updateCartGPSBox();
  }

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
      alert("📍 Vui lòng bấm LẤY / CẬP NHẬT GPS GIAO HÀNG hoặc chạm vào bản đồ để chọn vị trí giao hàng.");
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
    restoreSavedDeliveryAddress();

    const observer = new MutationObserver(function () {
      restoreSavedDeliveryAddress();

      const address = document.getElementById("address");
      if (address && !address.dataset.chocoAddressBound) {
        address.dataset.chocoAddressBound = "1";
        address.addEventListener("input", function () {
          addressManuallyEdited = true;
          address.style.borderColor = "#ddd";
          saveDeliveryAddress(address.value.trim());
        });
      }

      ensureCartGPSButton();
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    ensureCartGPSButton();
  });
})();
