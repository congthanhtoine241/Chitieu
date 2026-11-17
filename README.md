# Sổ Thu Chi Cá Nhân (Personal Finance Web App)

Ứng dụng web quản lý chi tiêu cá nhân đơn giản, vào thẳng giao diện chính mà **không cần đăng nhập hay nhập mật khẩu**. Dữ liệu được quản lý bằng **các Class OOP (`Category`, `Transaction`, `Budget`) và các Mảng (`categories[]`, `transactions[]`, `budgets[]`)** trong [`assets/js/storage.js`](./assets/js/storage.js), đồng thời tự động đồng bộ vào `localStorage` của trình duyệt để không bị mất khi tải lại trang.

---

## 1. Cấu trúc Lưu trữ bằng Class và Mảng (`assets/js/storage.js`)

Trong tệp [`assets/js/storage.js`](./assets/js/storage.js), toàn bộ dữ liệu được tổ chức bằng lập trình hướng đối tượng (OOP) và mảng:
- **`class Category`**: Đại diện cho 1 danh mục Thu hoặc Chi (`id`, `name`, `type`, `icon`, `color`).
- **`class Transaction`**: Đại diện cho 1 khoản giao dịch (`id`, `category_id`, `type`, `amount`, `description`, `payment_method`, `transaction_date`).
- **`class Budget`**: Đại diện cho 1 hạn mức ngân sách tháng (`id`, `category_id`, `amount`, `month`, `year`).
- **`class LocalFinanceStorage`**: Quản lý 3 mảng chính trong bộ nhớ:
  - `this.categories = []`
  - `this.transactions = []`
  - `this.budgets = []`
  và tự động lưu xuống `localStorage` của trình duyệt mỗi khi thêm/sửa/xóa.

---

## 2. Hướng dẫn Cách Chạy Ứng dụng

Vì dự án sử dụng JavaScript chuẩn **ES Modules (`import` / `export`)**, trình duyệt yêu cầu mở qua một máy chủ tĩnh cục bộ (Local HTTP Server) hoặc mở qua **GitHub Pages** (nếu nhấp đúp trực tiếp vào file `index.html` theo đường dẫn `file:///...` thì trình duyệt sẽ chặn module JS vì chính sách CORS).

Bạn có thể chọn **1 trong 3 cách chạy cực kỳ đơn giản** sau:

### Cách 1: Chạy bằng tiện ích Live Server trên VS Code (Nhanh nhất trên máy tính)
1. Mở thư mục `chitieu` trong phần mềm **VS Code**.
2. Nhấp chuột phải vào file [`index.html`](./index.html) → chọn **"Open with Live Server"** (hoặc nhấn nút **Go Live** ở góc dưới bên phải VS Code).
3. Trình duyệt sẽ tự mở địa chỉ `http://127.0.0.1:5500/index.html` và vào thẳng ứng dụng.

### Cách 2: Chạy bằng dòng lệnh (Node.js hoặc Python)
Mở Terminal / PowerShell tại thư mục `chitieu` và chạy:
```powershell
npx serve .
```
*(Hoặc nếu dùng Python: `python -m http.server 8080` rồi mở `http://localhost:8080` trên trình duyệt).*

### Cách 3: Đẩy lên GitHub Pages để dùng trên Điện thoại
1. Đẩy code lên kho lưu trữ (Repository) GitHub của bạn:
   ```powershell
   git add .
   git commit -m "Cap nhat ung dung So Thu Chi"
   git push origin main
   ```
2. Trên GitHub, vào **Settings -> Pages** -> tại phần **Source**, chọn **GitHub Actions** (hoặc chọn nhánh `main`).
3. Mở đường link `https://TEN-GITHUB-CUA-BAN.github.io/TEN-REPO/` trên điện thoại là vào thẳng sổ thu chi của bạn!
