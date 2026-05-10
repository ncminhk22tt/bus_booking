# HỆ THỐNG ĐẶT VÉ XE KHÁCH TRỰC TUYẾN

## Tổng hợp chức năng

## Các vai trò trong hệ thống
- Super Admin
- Admin nhà xe
- Người dùng (Khách hàng)

## Chức năng cho Super Admin
### Quản lý hệ thống (CRUD)
- Đăng nhập Super Admin
- Tạo tài khoản admin nhà xe
- Quản lý danh sách nhà xe
- Khóa / mở tài khoản admin
- Khóa / mở nhà xe
- Xóa nhà xe (có xác nhận)
- Reset mật khẩu tài khoản admin

### Quản trị vận hành
- Theo dõi trạng thái hoạt động nhà xe
- Tách dữ liệu theo từng nhà xe (admin thuộc 1 nhà xe)

## Chức năng cho Admin nhà xe
### Tài khoản quản trị
- Đăng nhập admin
- Cập nhật thông tin quản trị (số điện thoại, mật khẩu, thông tin nhà xe)

### Quản lý xe
- Thêm xe mới theo loại xe
- Upload ảnh xe lên backend và lưu DB
- Sửa thông tin xe
- Ngừng hoạt động xe
- Xem danh sách xe theo layout: ảnh bên trái, thông tin bên phải

### Quản lý tuyến
- Tạo tuyến mới (điểm đi, điểm đến, khoảng cách, thời gian dự kiến)
- Gắn điểm đón và điểm trả trực tiếp theo tuyến
- Cập nhật / ngừng hoạt động tuyến
- Xem danh sách tuyến

### Quản lý chuyến
- Tạo chuyến theo tuyến, xe, ngày giờ đi/đến, giá vé
- Chọn cặp điểm đón → điểm trả theo dữ liệu tuyến
- Cập nhật / hủy chuyến
- Xem danh sách chuyến kèm ảnh xe và thông tin chi tiết

### Quản lý ghế theo chuyến
- Xem sơ đồ ghế theo tầng
- Đánh dấu VIP cho ghế theo chuyến
- Khóa / mở ghế
- Áp dụng thao tác hàng loạt
- Quy tắc giá: ghế VIP tăng 50% so với giá gốc chuyến

### Quản lý booking
- Tra cứu booking theo tuyến rồi theo chuyến
- Xem danh sách khách đặt bên dưới khu tìm kiếm
- Hiển thị thông tin: khách hàng, số điện thoại, ngày, ghế, tổng tiền

## Chức năng cho Người dùng (Khách hàng)
### Tài khoản
- Đăng ký
- Đăng nhập
- Đăng xuất
- Cập nhật thông tin cá nhân

### Tìm và xem chuyến (chức năng cốt lõi)
- Tìm chuyến theo tỉnh/thành đi, tỉnh/thành đến, ngày đi
- Dữ liệu tỉnh/thành lấy từ bảng `cities`
- Trang danh sách chuyến có:
  - Bộ lọc bên trái
  - Thanh tìm chuyến phía trên
  - Danh sách chuyến phía dưới
- Bộ lọc hỗ trợ:
  - Giờ đi (khoảng từ giờ đến giờ)
  - Nhà xe (chọn nhiều, có ô tìm)
  - Giá vé (min-max, slider)
  - Điểm đón
  - Điểm trả
  - Loại xe / loại ghế
- Tự động reload kết quả khi đổi điều kiện lọc

### Đặt ghế và thanh toán
- Xem chi tiết chuyến và sơ đồ ghế
- Chọn tối đa 6 ghế
- Xác nhận đặt ghế
- Nếu chưa đăng nhập:
  - Hiện cảnh báo ngay trong giao diện (không dùng alert trình duyệt)
  - Hiện link đăng nhập để bấm thủ công
- Sau đăng nhập từ trang đặt vé:
  - Quay lại đúng trang đang đặt
- Nhập thông tin thanh toán:
  - Họ tên
  - Số điện thoại
  - Phương thức thanh toán
  - Ngân hàng
- Thông tin nhập ở form thanh toán được lưu vào booking

### Quản lý vé
- Xem vé đã đặt
- Xem lịch sử booking
- Hủy booking

## Ghi chú dữ liệu và phân quyền (theo code hiện tại)
- Mỗi admin gắn với một `bus_company_id`
- Admin chỉ thao tác dữ liệu thuộc nhà xe của mình
- Super Admin quản trị toàn cục
- Ảnh xe lưu ở backend, đường dẫn lưu trong DB
- Trạng thái ghế và trạng thái booking được quản lý theo chuyến
