# API Summary (Bus Booking)

## Customer
Base paths: `/api/customers`, `/api/trips`, `/api/bookings`

1. `POST /api/customers/register` — Đăng ký
2. `POST /api/customers/login` — Đăng nhập
3. `GET /api/customers/me` — Lấy thông tin cá nhân
4. `PUT /api/customers/profile` — Cập nhật hồ sơ
5. `PUT /api/customers/password` — Đổi mật khẩu
6. `GET /api/trips/search` — Tìm chuyến (from/to/date)
7. `GET /api/trips/:id` — Chi tiết chuyến
8. `GET /api/trips/:id/seats` — Danh sách ghế
9. `GET /api/trips/:id/seat-map` — Sơ đồ ghế
10. `POST /api/bookings` — Đặt vé
11. `GET /api/bookings/me` — Lịch sử vé (có filter status)
12. `GET /api/bookings/:id` — Chi tiết booking
13. `POST /api/bookings/:id/cancel` — Hủy vé
14. `POST /api/bookings/:id/pay` — Thanh toán mô phỏng

## Admin (Bus Company)
Base path: `/api/admin`

1. `POST /api/admin/auth/login` — Đăng nhập admin
2. `GET /api/admin/bus-types` — Danh sách loại xe
3. `GET /api/admin/buses` — Danh sách xe
4. `POST /api/admin/buses` — Thêm xe
5. `PUT /api/admin/buses/:id` — Sửa xe
6. `DELETE /api/admin/buses/:id` — Ngừng hoạt động xe
7. `GET /api/admin/routes` — Danh sách tuyến
8. `POST /api/admin/routes` — Thêm tuyến
9. `PUT /api/admin/routes/:id` — Sửa tuyến
10. `DELETE /api/admin/routes/:id` — Ngừng hoạt động tuyến
11. `GET /api/admin/trips` — Danh sách chuyến
12. `POST /api/admin/trips` — Tạo chuyến
13. `GET /api/admin/trips/:id/seats` — Ghế theo chuyến
14. `GET /api/admin/trips/:tripId/bookings` — Booking theo chuyến
15. `GET /api/admin/trips/:tripId/seats` — Ghế theo chuyến (view admin)
16. `PUT /api/admin/update-profile` — Cập nhật hồ sơ admin

## Super Admin
Base path: `/api/superadmin`

1. `POST /api/superadmin/login` — Đăng nhập
2. `POST /api/superadmin/create-admin` — Tạo admin + nhà xe
3. `GET /api/superadmin/companies` — Danh sách nhà xe
4. `GET /api/superadmin/companies/:id` — Chi tiết nhà xe
5. `PUT /api/superadmin/companies/:id` — Cập nhật nhà xe
6. `PUT /api/superadmin/companies/:id/active` — Khóa/mở nhà xe
7. `GET /api/superadmin/admins` — Danh sách admin
8. `GET /api/superadmin/admins/:id` — Chi tiết admin
9. `PUT /api/superadmin/admins/:id/active` — Khóa/mở admin
