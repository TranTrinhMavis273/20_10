# Gửi những người phụ nữ của TranTrinh

Mã nguồn xuất từ Lovable ngày 20/10/2026, đã chuyển cấu hình sang Vercel và đưa ảnh/nhạc vào `public/media/`. Không cần Lovable credits để chạy hoặc sửa dự án này.

## Cài đặt và chạy

Yêu cầu Node.js 24 LTS (hoặc Node >=22.12) và npm.

```bash
npm ci
```

Sao chép `.env.example` thành `.env`, thay `SITE_PASSWORD` bằng mật khẩu quản trị bạn muốn dùng. Tạo `SESSION_SECRET` bằng lệnh:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Dán chuỗi đó vào `SESSION_SECRET`. Thêm `SUPABASE_URL` và `SUPABASE_SECRET_KEY` theo [hướng dẫn Supabase](supabase/README.md), rồi chạy `supabase/setup.sql`. Không chia sẻ/commit `.env`; không thêm tiền tố `VITE_` cho các biến bí mật.

```bash
npm run dev
```

Mở địa chỉ Vite in ra trên terminal. Trang quản trị là `/admin`. Các chức năng cookie phiên cần HTTPS khi triển khai.

## Deploy trên Vercel

1. Giải nén, đưa nội dung thư mục này lên một repository GitHub của bạn.
2. Vercel → Add New → Project → Import repository.
3. Chọn Node.js 24.x. Giữ Root Directory ở thư mục chứa `package.json`.
4. Framework: TanStack Start nếu được nhận diện. File `vercel.json` đã đặt Install Command `npm ci` và Build Command `npm run build:vercel`. Để Output Directory mặc định, không đặt là `dist`.
5. Trong Environment Variables, thêm `SITE_PASSWORD`, `SESSION_SECRET`, `SUPABASE_URL` và `SUPABASE_SECRET_KEY` như mô tả trên, ít nhất cho Production. Nếu muốn dùng Preview, bật cả Preview.
6. Deploy; sau khi đổi biến môi trường cần Redeploy để áp dụng.
7. Mở `/` để thử luồng khách; mở `/admin` để đăng nhập.

Có thể deploy bằng Vercel CLI từ thư mục dự án với `npx vercel`, sau khi đăng nhập tài khoản Vercel của bạn.

Tài liệu: https://vercel.com/docs/frameworks/full-stack/tanstack-start

## Nội dung đã có

- Họ tên + nickname → câu hỏi keyword theo hồ sơ → kiểm tra keyword của đúng người → chọn meme mèo → lời chúc → gửi lời nhắn lại.
- Bảng màu hồng; Fraunces, Be Vietnam Pro và Dancing Script (Google Fonts được tải khi truy cập mạng).
- Bài Love Like You lặp, âm lượng mặc định 20%, trình phát chung xuyên suốt hành trình. Trình duyệt có thể chặn phát lúc vừa mở trang; lần tương tác đầu sẽ thử phát lại.
- Ba ảnh mèo gốc, ba bản nhạc demo WAV và MP3 đã lưu thật trong `public/media/`.
- Khung ảnh người nhận với tulip, hoa hồng và lá; tải ảnh riêng lên private Supabase Storage, tối đa 8MB trước xử lý; URL ảnh tạm thời được cấp sau xác minh.
- Quản trị kiểm tra mật khẩu phía server; cookie HttpOnly/Secure; mật khẩu lấy từ biến môi trường.

## Dữ liệu dùng chung

Hồ sơ, cài đặt, lượt mở và lời nhắn được lưu trên Supabase. Người nhận dùng cùng dữ liệu trên mọi thiết bị. Nhạc riêng hiện dùng URL HTTPS trực tiếp. Tiến trình nhận quà và lời nhắn chưa gửi nằm trong bộ nhớ của trang; mỗi lần tải lại phải xác minh lại.

Chạy `supabase/setup.sql` trước khi dùng. Database mới không tự tạo hồ sơ mẫu. Đăng nhập `/admin` để thêm hồ sơ hoặc bấm **Chuyển dữ liệu cũ lên Supabase** bằng đúng trình duyệt/tên miền từng tạo quà. Dữ liệu cũ và ảnh IndexedDB được giữ lại; import không ghi đè hồ sơ trên Supabase. Chi tiết: [supabase/README.md](supabase/README.md).

Mọi API quản trị xác thực phiên HttpOnly trên máy chủ. Từ khoá được kiểm tra trên máy chủ; lời chúc và media chỉ được trả về sau khi đúng từ khoá. Các bảng bật RLS và không cấp quyền cho trình duyệt; secret key chỉ tồn tại phía máy chủ.

## Kiểm tra đã chạy trên bản Vercel

```bash
npm test
npx tsc --noEmit
npm run build:vercel
```

Kết quả: 12/12 tests đạt; TypeScript không lỗi; tạo thành công `.vercel/output` gồm static assets và server function. Chưa triển khai vào tài khoản Vercel của bạn, chưa kiểm thử trình duyệt trên bản Vercel thực tế.

## Cấu trúc

- `src/routes/index.tsx`: hành trình nhận thư.
- `src/routes/admin.tsx`: quản trị.
- `src/lib/store.ts`: hồ sơ, lời nhắn và dữ liệu demo.
- `src/lib/admin-gate.functions.ts`: đăng nhập server.
- `src/lib/portraits.ts`: tải ảnh vào IndexedDB.
- `src/lib/gift-assets.ts`: ảnh, nhạc và chú thích.
- `src/components/GlobalMusic.tsx`: trình phát chung.
- `public/media/`: toàn bộ ảnh/nhạc dùng trong app.
- `vite.config.ts`, `vercel.json`: cấu hình deploy độc lập.
- `vite.config.lovable.txt`: cấu hình Lovable ban đầu để tham khảo.
- `EXPORT_INFO.json`: commit gốc và thay đổi trong quá trình xuất.

Chỉ chia sẻ/gia công khai ảnh và nhạc khi bạn có quyền sử dụng tương ứng.
