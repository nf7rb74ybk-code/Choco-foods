# CHOCO SHIP V2

Khu vực phát triển riêng trên branch `choco-ship-v2`. Production branch `main` không bị thay đổi.

## Modules
- Customer V2: đăng nhập, giỏ hàng, tạo đơn, thông tin giao hàng.
- Admin V2: thống kê, lọc đơn, xác nhận/huỷ đơn, theo dõi shipper.
- Shipper V2: nhận đơn, cập nhật trạng thái, GPS và push.
- POS V2: tạo đơn tại quầy và lịch sử POS.
- Auth/Backend: Supabase Auth + role profile + data layer.

## Trạng thái
V2 đã được nối các luồng chính. Phần còn lại là kiểm thử end-to-end trên thiết bị thật và rà soát bảo mật trước khi xem xét merge production.

## Nguyên tắc an toàn
- Không merge vào `main` trong giai đoạn test.
- Không đổi Push/OneSignal/VAPID đang hoạt động của production.
- Không thêm cột giả vào production để che lỗi frontend/cache.
