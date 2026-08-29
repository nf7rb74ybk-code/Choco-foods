# CHOCO SHIP V2

Khu vực phát triển/test riêng, không thay thế production.

## Nguyên tắc
- Production ở branch `main` giữ nguyên.
- V2 phát triển trên branch `choco-ship-v2`.
- Không sửa trực tiếp các file production trong V2.
- Không thay đổi database production khi chưa có xác nhận.
- Mọi module V2 phải test OK trước khi xem xét đưa vào production.

## Modules
- Customer V2
- Shipper V2
- Admin V2
- POS V2
- Backend/Push V2

## Trạng thái
Scaffold only — chưa kết nối thao tác ghi vào production.
