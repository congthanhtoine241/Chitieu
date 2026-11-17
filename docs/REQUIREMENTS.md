# Đặc Tả Yêu Cầu Hệ Thống (`REQUIREMENTS.md`)

## 1. Tổng quan dự án
**Tên dự án:** Sổ Thu Chi Cá Nhân (Personal Finance Management Web Application)  
**Mục tiêu:** Xây dựng ứng dụng web quản lý tài chính cá nhân hiện đại, đáp ứng (responsive), an toàn với xác thực người dùng thực tế, cơ sở dữ liệu lưu trữ bền vững trên **Supabase (PostgreSQL + RLS)** và triển khai tĩnh hoàn toàn trên **GitHub Pages**.

---

## 2. Yêu cầu chức năng (Functional Requirements)

### FR-01: Xác thực & Quản lý phiên (Authentication)
- **FR-01.1:** Đăng ký tài khoản mới bằng Email, Mật khẩu (tối thiểu 6 ký tự) và Tên hiển thị.
- **FR-01.2:** Đăng nhập bằng Email và Mật khẩu qua Supabase Auth.
- **FR-01.3:** Đăng xuất an toàn, xóa trạng thái phiên hiện tại và chuyển về màn hình xác thực.
- **FR-01.4:** Khôi phục mật khẩu (Password Reset) qua email xác nhận của Supabase.
- **FR-01.5:** Tự động duy trì phiên đăng nhập (Session Persistence) và lắng nghe sự kiện `onAuthStateChange`.
- **FR-01.6:** Bảo vệ các màn hình nghiệp vụ (Protected Views) — người dùng chưa đăng nhập không thể xem hoặc thao tác dữ liệu.
- **FR-01.7:** Khi người dùng mới đăng ký thành công, hệ thống tự động khởi tạo hồ sơ (`profiles`) và 15 danh mục mặc định (5 Thu nhập, 10 Chi tiêu).

### FR-02: Tổng quan tài chính (Dashboard)
- **FR-02.1:** Hiển thị 4 chỉ số KPI chính: Tổng thu nhập, Tổng chi tiêu, Số dư hiện tại, Tiết kiệm ròng & Tỷ lệ tiết kiệm (%).
- **FR-02.2:** Bộ lọc thời gian linh hoạt: Hôm nay (`today`), Tuần này (`week`), Tháng này (`month`), Tháng trước (`last_month`), Năm nay (`year`), và Khoảng ngày tùy chỉnh (`custom`).
- **FR-02.3:** Biểu đồ so sánh Thu nhập và Chi tiêu theo xu hướng thời gian.
- **FR-02.4:** Biểu đồ phân bổ chi tiêu theo danh mục (Doughnut Chart).
- **FR-02.5:** Danh sách các giao dịch gần đây và cảnh báo ngân sách ngay trên Dashboard.

### FR-03: Quản lý Giao dịch Thu Chi (Transaction Management - CRUD)
- **FR-03.1:** Thêm mới giao dịch (`INCOME` hoặc `EXPENSE`) với các trường: Số tiền (VND), Danh mục, Ngày giao dịch, Phương thức thanh toán (Tiền mặt, Chuyển khoản, Thẻ tín dụng, Ví điện tử), và Mô tả.
- **FR-03.2:** Xem danh sách giao dịch có phân trang (Pagination), sắp xếp theo ngày/số tiền.
- **FR-03.3:** Tìm kiếm theo từ khóa mô tả và lọc theo loại giao dịch, danh mục, phương thức thanh toán, khoảng thời gian.
- **FR-03.4:** Chỉnh sửa thông tin giao dịch hiện có.
- **FR-03.5:** Xóa giao dịch có hộp thoại xác nhận (Confirmation Dialog) trước khi thực hiện.
- **FR-03.6:** Xử lý số học chính xác cho tiền tệ VND (số nguyên lớn `BigInt` / `Number.isSafeInteger`, tuyệt đối không dùng phép cộng số thực dấu phẩy động gây sai số).

### FR-04: Quản lý Danh mục (Category Management)
- **FR-04.1:** Cung cấp sẵn danh mục mặc định:
  - **Thu nhập (5):** Lương (`Salary`), Thưởng (`Bonus`), Kinh doanh (`Business`), Đầu tư (`Investment`), Thu nhập khác (`Other income`).
  - **Chi tiêu (10):** Ăn uống (`Food and drinks`), Di chuyển (`Transportation`), Mua sắm (`Shopping`), Giải trí (`Entertainment`), Giáo dục (`Education`), Y tế (`Healthcare`), Nhà ở (`Housing`), Hóa đơn (`Bills`), Cá nhân (`Personal expenses`), Chi tiêu khác (`Other expenses`).
- **FR-04.2:** Tạo mới, chỉnh sửa danh mục (tên, loại Thu/Chi, màu sắc, biểu tượng Lucide).
- **FR-04.3:** Ngăn chặn xóa danh mục đang có giao dịch tham chiếu (`ON DELETE RESTRICT`), hoặc cho phép người dùng chuyển giao dịch sang danh mục khác trước khi xóa.

### FR-05: Quản lý Ngân sách (Budget Management)
- **FR-05.1:** Thiết lập ngân sách tổng hàng tháng (Overall Monthly Budget, `category_id = NULL`) và ngân sách cho từng danh mục chi tiêu theo Tháng/Năm.
- **FR-05.2:** Tính toán số tiền đã chi, ngân sách còn lại và phần trăm đã sử dụng thực tế từ bảng `transactions`.
- **FR-05.3:** Hiển thị cảnh báo trực quan:
  - **An toàn (< 80%):** Màu xanh lá.
  - **Sắp chạm ngưỡng (80% – 99.9%):** Cảnh báo vàng cam (`WARNING: Đã dùng ≥ 80% ngân sách`).
  - **Vượt ngân sách (≥ 100%):** Cảnh báo đỏ (`DANGER: Đã vượt ngân sách!`).

### FR-06: Báo cáo & Phân tích (Financial Reports)
- **FR-06.1:** Báo cáo thu nhập & chi tiêu theo từng tháng trong năm (12 tháng).
- **FR-06.2:** Biểu đồ xu hướng tiết kiệm ròng (Savings Trend) qua các tháng.
- **FR-06.3:** Bảng xếp hạng các danh mục chi tiêu lớn nhất (Top Spending Categories) kèm tỷ trọng %.
- **FR-06.4:** Xuất dữ liệu báo cáo / lịch sử giao dịch ra CSV (hỗ trợ UTF-8 BOM cho tiếng Việt trên Excel).

### FR-07: Cài đặt Người dùng (User Settings)
- **FR-07.1:** Cập nhật tên hiển thị (`display_name`), xem email tài khoản.
- **FR-07.2:** Tùy chỉnh định dạng tiền tệ (mặc định: `VND`) và giao diện Sáng / Tối (Light Editorial Paper / Dark Financial Slate).
- **FR-07.3:** Quản lý kết nối Supabase (cho phép cấu hình URL & Publishable Key hoặc chạy chế độ Kiểm thử E2E cô lập).

---

## 3. Yêu cầu phi chức năng (Non-Functional Requirements)
- **NFR-01 (Bảo mật & Phân quyền):** Bật Row Level Security (RLS) bắt buộc trên tất cả các bảng (`profiles`, `categories`, `transactions`, `budgets`). Tài khoản A tuyệt đối không thể đọc, thêm, sửa, xóa dữ liệu của Tài khoản B.
- **NFR-02 (Kiến trúc Tĩnh):** Chạy hoàn toàn dưới dạng ứng dụng web tĩnh trên GitHub Pages (`https://USERNAME.github.io/REPOSITORY/`), sử dụng đường dẫn tương đối (`./assets/...`).
- **NFR-03 (Hiệu năng):** Phân trang truy vấn giao dịch, tránh tải toàn bộ lịch sử không cần thiết, chống gửi biểu mẫu trùng lặp (Duplicate Submission Prevention).
- **NFR-04 (Trải nghiệm & Accessibility):** Giao diện tối giản, sang trọng, chuẩn tương phản WCAG AA, hỗ trợ điều hướng bàn phím và màn hình di động (Mobile-First).
