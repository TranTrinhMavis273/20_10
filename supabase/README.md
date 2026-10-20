# Dữ liệu dùng chung

1. Tạo dự án Supabase. Trong **SQL Editor → New query**, chạy toàn bộ `setup.sql`.
2. Trên Vercel, thêm `SUPABASE_URL` và `SUPABASE_SECRET_KEY` cho Production/Preview. Giữ `SITE_PASSWORD` và `SESSION_SECRET` đã có. Không dùng tiền tố `VITE_` cho các biến bí mật.
3. Deploy mã mới. Truy cập `/admin` bằng **đúng trình duyệt và tên miền từng nhập hồ sơ**.
4. Bấm **Chuyển dữ liệu cũ lên Supabase**. Chờ thông báo hoàn tất. Bản cũ không bị xoá; chạy lại sẽ bỏ qua các hồ sơ đã có, không ghi đè nội dung trên Supabase. Nếu import báo lỗi giữa chừng, sửa lỗi rồi thử lại để hoàn tất các phần còn thiếu.
5. Nếu hồ sơ trước đây nằm trên tên miền Lovable hoặc localhost, cần mở phiên bản có chức năng chuyển dữ liệu trên chính tên miền đó; localStorage và IndexedDB không đọc chéo tên miền.
6. Sau khi chuyển, chỉnh sửa hồ sơ trong quản trị mới. Thử mở bằng trình duyệt khác/ẩn danh, nhập họ tên và từ khoá, gửi lời nhắn, rồi kiểm tra hộp thư quản trị.

Các bảng không có quyền đọc/ghi dành cho trình duyệt. Chỉ backend dùng secret key; mọi API quản trị kiểm tra cookie HttpOnly. Người nhận chỉ nhận lời chào/câu hỏi trước khi xác minh từ khoá trên máy chủ. Sau xác minh, phiên được giới hạn ở đúng hồ sơ; đổi nội dung hoặc tắt hồ sơ sẽ vô hiệu phiên cũ. Ảnh được cấp URL tạm thời 8 giờ sau xác minh hoặc đăng nhập quản trị.

Lượt mở được tăng nguyên tử một lần cho mỗi phiên; gửi lại cùng yêu cầu lời nhắn không tạo bản trùng. Giới hạn tra tên, thử từ khoá và gửi lời nhắn được lưu trong database để có tác dụng trên nhiều Vercel instances. Nhạc riêng hiện dùng URL HTTPS trực tiếp, vẫn dùng được trên thiết bị khác.

Hồ sơ, cài đặt, lời nhắn không tự tạo dữ liệu mẫu khi database trống. Tạo hồ sơ mới hoặc chuyển bản cũ. Bản nháp lời nhắn và tiến trình nhận quà chỉ tồn tại trong phiên trang đang mở; tải lại sẽ yêu cầu xác minh lại.
