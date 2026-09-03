# CHOCO FOOD APP — LAB Catalog

## Mục đích
Catalog của app không hard-code trực tiếp trong màn hình. UI sẽ đọc qua `loadCatalog()`.

## Hiện tại
`catalog.mock.js` chỉ là dữ liệu LAB để dựng UI và test luồng. Không đọc/ghi bảng `orders`, `profiles` hay hệ thống Push production.

## Kiến trúc đích
Khi database catalog LAB được tạo và kiểm tra RLS, chỉ cần thay implementation của `loadCatalog()` để đọc:

- categories
- restaurants
- foods
- food_options
- promotions

UI, tìm kiếm, bộ lọc và giỏ hàng không cần viết lại.

## Nguyên tắc an toàn
- Không sửa branch `main`.
- Không ghi vào production `orders`.
- Không chạm OneSignal/Push production.
- Không dùng `service_role` trong client.
- Catalog public chỉ được đọc các món/quán đang được phép hiển thị.
