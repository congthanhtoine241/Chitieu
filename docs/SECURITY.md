# Kiến Trúc Bảo Mật & Kiểm Soát Truy Cập (`SECURITY.md`)

Tài liệu này được xây dựng theo quy chuẩn của skill `security-auditor` nhằm đảm bảo an toàn tuyệt đối cho ứng dụng Quản lý Tài chính Cá nhân khi triển khai trên môi trường tĩnh công khai (**GitHub Pages**).

---

## 1. Nguyên lý Bảo mật Cốt lõi trên GitHub Pages

GitHub Pages là dịch vụ lưu trữ tĩnh công khai (Public Static Hosting). Mọi tệp HTML, CSS, JavaScript trên trình duyệt đều có thể được đọc bởi người dùng cuối. Do đó:
1. **Không bao giờ nhúng `service_role` key hoặc khóa bí mật (Secret Keys) vào mã nguồn Frontend.**
2. **Chỉ sử dụng `SUPABASE_PUBLISHABLE_KEY` (hoặc `anon` public key) trong `assets/js/config.js`.**
3. **Toàn bộ quyền truy cập dữ liệu được cưỡng chế tại tầng cơ sở dữ liệu PostgreSQL thông qua Row Level Security (RLS)** dựa trên chữ ký JWT (`auth.uid()`).

---

## 2. Ma trận Chính sách Row Level Security (RLS Policy Matrix)

Mọi bảng lưu trữ dữ liệu người dùng đều bật `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` và `FORCE ROW LEVEL SECURITY`:

| Bảng dữ liệu | Thao tác | Điều kiện `USING` (Đọc/Sửa/Xóa) | Điều kiện `WITH CHECK` (Thêm/Cập nhật) | Mục tiêu bảo vệ |
|--------------|----------|----------------------------------|----------------------------------------|-----------------|
| `profiles` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `auth.uid() = id` | `auth.uid() = id` | Người dùng chỉ xem và cập nhật được hồ sơ của chính mình. |
| `categories` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `auth.uid() = user_id` | `auth.uid() = user_id` | Ngăn chặn đọc, sửa, xóa danh mục của tài khoản khác. |
| `transactions` | `SELECT`, `DELETE` | `auth.uid() = user_id` | — | Cô lập hoàn toàn sổ cái giao dịch giữa các tài khoản. |
| `transactions` | `INSERT`, `UPDATE` | `auth.uid() = user_id` | `auth.uid() = user_id AND EXISTS (SELECT 1 FROM categories c WHERE c.id = category_id AND c.user_id = auth.uid() AND c.type = type)` | Chặn giả mạo `user_id` VÀ chặn hành vi gắn giao dịch vào `category_id` của người dùng khác (Cross-user IDOR). |
| `budgets` | `SELECT`, `DELETE` | `auth.uid() = user_id` | — | Cô lập hạn mức ngân sách của từng cá nhân. |
| `budgets` | `INSERT`, `UPDATE` | `auth.uid() = user_id` | `auth.uid() = user_id AND (category_id IS NULL OR EXISTS (... c.user_id = auth.uid() AND c.type = 'EXPENSE'))` | Chặn đặt ngân sách lên danh mục của tài khoản khác hoặc danh mục không phải chi tiêu. |

---

## 3. Phòng chống các Lỗ hổng OWASP Top 10

### 3.1. A01:2021 – Broken Access Control & IDOR
- **Nguy cơ:** Tài khoản B biết được UUID giao dịch (`tx_id`) hoặc UUID danh mục (`category_id`) của Tài khoản A và gửi request `UPDATE` / `DELETE` trực tiếp qua API.
- **Biện pháp:** Chính sách RLS `USING (auth.uid() = user_id)` kết hợp Trigger `fn_validate_transaction_category()` kiểm tra quyền sở hữu ở cấp độ dòng trong PostgreSQL. Mọi truy vấn chéo tài khoản đều bị từ chối.

### 3.2. A03:2021 – Injection & Cross-Site Scripting (XSS)
- **Nguy cơ:** Người dùng nhập mã độc `<script>...</script>` hoặc `<img src=x onerror=...>` vào trường Mô tả giao dịch hoặc Tên danh mục.
- **Biện pháp:**
  - Mọi dữ liệu chuỗi do người dùng tạo ra đều đi qua hàm `escapeHtml()` (`assets/js/utils.js`) hoặc gán qua `textContent` trước khi hiển thị lên DOM.
  - Truy vấn cơ sở dữ liệu sử dụng tham số hóa hoàn toàn qua Supabase PostgREST client, loại bỏ nguy cơ SQL Injection.

### 3.3. A04:2021 – Insecure Design (Sai số Số học Tiền tệ)
- **Nguy cơ:** Sử dụng số thực dấu phẩy động (`float`) dẫn đến sai lệch số dư tài chính hoặc cho phép nhập số tiền âm (`-500000`) làm đảo ngược chiều Thu/Chi.
- **Biện pháp:**
  - CSDL sử dụng `NUMERIC(18, 0) NOT NULL CHECK (amount > 0)`.
  - Tầng JS sử dụng `parseExactAmount()` và cộng dồn qua `BigInt` (`sumExactAmounts()`), từ chối mọi giá trị `<= 0`, `NaN`, hoặc số thập phân lẻ.

### 3.4. A05:2021 – Security Misconfiguration (Rò rỉ thông tin lỗi nội bộ)
- **Nguy cơ:** Hiển thị nguyên văn stack trace hoặc cấu trúc bảng nội bộ khi xảy ra lỗi kết nối.
- **Biện pháp:** Hàm `normalizeError()` trong `assets/js/supabase.js` ánh xạ các mã lỗi kỹ thuật sang thông báo tiếng Việt thân thiện, an toàn cho người dùng cuối.
