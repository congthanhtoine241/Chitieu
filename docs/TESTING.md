# Báo Cáo Kiểm Thử Hệ Thống & Phân Quyền 2 Tài Khoản (`TESTING.md`)

Tài liệu này ghi nhận chi tiết **20 kịch bản kiểm thử (Test Cases)** đã được viết và thực thi thực tế để kiểm chứng toàn bộ các giai đoạn của dự án, đặc biệt là **Giai đoạn 4: Kiểm tra phân quyền bằng hai tài khoản khác nhau (`account_a@chitieu.vn` và `account_b@chitieu.vn`), kiểm thử dữ liệu và xử lý lỗi**.

---

## 1. Cách thức Chạy Kiểm thử (How to Run Tests)

Dự án cung cấp 3 phương thức kiểm thử độc lập và minh bạch:

1. **Chạy bộ kiểm thử tự động bằng Node.js CLI:**
   ```bash
   node tests/security-and-crud.test.mjs
   ```
2. **Chạy bộ kiểm thử trực quan trên Trình duyệt (Browser Test Runner):**
   - Mở tệp `test-runner.html` (hoặc nhấn nút **"Kiểm thử Bảo mật 2 Tài khoản"** trên thanh công cụ ứng dụng).
3. **Chạy kịch bản kiểm thử RLS trực tiếp trong Supabase SQL Editor:**
   - Sao chép nội dung tệp `supabase/test_rls.sql` và chạy trong Supabase SQL Editor (sử dụng `BEGIN ... ROLLBACK` để kiểm chứng `request.jwt.claims` cho User A và User B mà không làm bẩn dữ liệu thật).

---

## 2. Danh mục 20 Test Cases & Kết quả Thực thi Thực tế

### Nhóm 1: Xác thực & Khởi tạo Tài khoản (Authentication & Onboarding)

| Mã TC | Tên Kịch Bản Kiểm Thử | Đầu vào / Thao tác | Kết quả Kỳ vọng | Kết quả Thực tế |
|-------|-----------------------|--------------------|-----------------|-----------------|
| **TC-01** | Đăng ký Tài khoản A & tự động tạo danh mục mặc định | Đăng ký `account_a@chitieu.vn` | Tạo UUID hợp lệ, tạo `profiles` và đúng 15 danh mục mặc định (5 Thu, 10 Chi). | **PASS** (15 danh mục riêng) |
| **TC-02** | Đăng ký Tài khoản B độc lập | Đăng ký `account_b@chitieu.vn` | Cấp UUID khác Tài khoản A, tạo 15 danh mục có `user_id = userB.id`. | **PASS** (UUID tách biệt) |
| **TC-03** | Chặn đăng ký trùng Email & chặn sai mật khẩu | Đăng ký lại `account_a@chitieu.vn` và đăng nhập sai mật khẩu | Trả về lỗi xác thực an toàn, không cấp phiên. | **PASS** |
| **TC-04** | Chặn truy cập CSDL khi chưa đăng nhập | Gọi `getTransactions()` khi `session = null` | Bị từ chối bởi chính sách RLS (`authenticated` role required). | **PASS** |

---

### Nhóm 2: Nghiệp vụ Cốt lõi, Số học Tiền tệ & Toàn vẹn Khóa ngoại (Core CRUD & Arithmetic)

| Mã TC | Tên Kịch Bản Kiểm Thử | Đầu vào / Thao tác | Kết quả Kỳ vọng | Kết quả Thực tế |
|-------|-----------------------|--------------------|-----------------|-----------------|
| **TC-05** | Tài khoản A tạo giao dịch Thu/Chi & tính số dư VND | Thu: `+25.000.000 ₫`, Chi: `-4.500.000 ₫` & `-500.000 ₫` | Tổng thu: `25.000.000 ₫`, Tổng chi: `5.000.000 ₫`, Số dư: `20.000.000 ₫`. | **PASS** |
| **TC-06** | Tài khoản B tạo giao dịch Thu/Chi riêng biệt | Thu: `+18.000.000 ₫`, Chi: `-2.800.000 ₫` | Tài khoản B chỉ có 2 giao dịch, Số dư của B: `15.200.000 ₫`. | **PASS** |
| **TC-07** | Sửa (`UPDATE`) và Xóa (`DELETE`) giao dịch chính chủ | Tạo giao dịch nháp `120.000 ₫` → Sửa thành `180.000 ₫` → Xóa | Cập nhật đúng số tiền và xóa thành công khỏi sổ cái của A. | **PASS** |
| **TC-08** | Tìm kiếm, Lọc và Phân trang (Pagination) | Tìm từ khóa `"siêu thị"`, phân trang `limit = 2` | Trả về đúng giao dịch khớp mô tả và `count` tổng chính xác. | **PASS** |
| **TC-09** | Ràng buộc khóa ngoại `ON DELETE RESTRICT` trên danh mục | Xóa danh mục đang có giao dịch của Tài khoản A tham chiếu | Hệ thống chặn xóa và thông báo yêu cầu chuyển giao dịch trước. | **PASS** |
| **TC-10** | Quản lý Ngân sách & Cảnh báo ngưỡng 80% / 100% | Đặt ngân sách `6.000.000 ₫` (đã chi `5.000.000 ₫` = `83.3%`) + thử tạo trùng | Cảnh báo `warning` ở `83.3%`, `danger` ở `≥100%`, và chặn tạo trùng ngân sách cùng tháng. | **PASS** |

---

### Nhóm 3: Kiểm thử Phân quyền và Cô lập Dữ liệu bằng 2 Tài khoản (2-Account RLS & IDOR Security)

| Mã TC | Tên Kịch Bản Kiểm Thử | Kịch bản Tấn công / Đối chiếu giữa Tài khoản A & B | Kết quả Kỳ vọng | Kết quả Thực tế |
|-------|-----------------------|----------------------------------------------------|-----------------|-----------------|
| **TC-11** | **RLS `SELECT` Isolation** | Đăng nhập Tài khoản B, truy vấn toàn bộ `transactions`, `budgets`, `categories` | Tài khoản B nhận **0 bản ghi** nào thuộc về `user_id` của Tài khoản A. | **PASS** (0 rò rỉ) |
| **TC-12** | **RLS `INSERT` Spoofing Prevention** | Tài khoản B gửi lệnh tạo giao dịch nhưng gán `user_id = userA.id` | Bị chặn bởi `WITH CHECK (auth.uid() = user_id)`. | **PASS** (Đã chặn) |
| **TC-13** | **Cross-User Category Reference Prevention** | Tài khoản B tạo giao dịch nhưng truyền `category_id` thuộc sở hữu của Tài khoản A | Bị chặn bởi RLS & Trigger `fn_validate_transaction_category`. | **PASS** (Đã chặn) |
| **TC-14** | **RLS `UPDATE` IDOR Prevention** | Tài khoản B gọi `updateTransaction(txExpenseA.id, { amount: 1 })` | Bị chặn bởi RLS; giao dịch của Tài khoản A giữ nguyên `4.500.000 ₫`. | **PASS** (Đã chặn) |
| **TC-15** | **RLS `DELETE` IDOR Prevention** | Tài khoản B gọi `deleteTransaction(txIncomeA.id)` | Bị chặn bởi RLS; giao dịch `25.000.000 ₫` của Tài khoản A vẫn còn nguyên. | **PASS** (Đã chặn) |
| **TC-16** | **RLS Budget & Category Tampering Prevention** | Tài khoản B cố tình xóa ngân sách `budgetA.id` và sửa danh mục của Tài khoản A | Cả 2 thao tác đều bị từ chối bởi chính sách RLS. | **PASS** (Đã chặn) |
| **TC-17** | **RLS Ownership Transfer Prevention** | Thử cập nhật cột `user_id` của bản ghi hiện có sang `userB.id` | Bị chặn bởi điều kiện `WITH CHECK (auth.uid() = user_id)`. | **PASS** (Đã chặn) |

---

### Nhóm 4: Kiểm thử Dữ liệu Biên, Ràng buộc Loại & Chống XSS (Validation & Error Handling)

| Mã TC | Tên Kịch Bản Kiểm Thử | Đầu vào Kiểm thử | Kết quả Kỳ vọng | Kết quả Thực tế |
|-------|-----------------------|------------------|-----------------|-----------------|
| **TC-18** | Kiểm thử biên số tiền giao dịch | Nhập `0`, `-50000`, `125.75` (số thập phân lẻ), `"abc"`, `NaN` | Toàn bộ bị từ chối bởi `parseExactAmount` và `validateTransactionInput`. | **PASS** |
| **TC-19** | Kiểm thử lệch loại Giao dịch và Danh mục | Tạo giao dịch `type = 'INCOME'` nhưng chọn danh mục `EXPENSE` | Bị từ chối bởi Trigger kiểm tra đồng nhất loại Thu/Chi. | **PASS** |
| **TC-20** | Kiểm thử chống XSS (Cross-Site Scripting) | Nhập `<script>window.hacked=true;</script><img src="x" onerror="alert('XSS')">` | Chuỗi được mã hóa thành `&lt;script&gt;...` an toàn, không thực thi mã độc. | **PASS** |

---

## 3. Bằng chứng Thực thi Thực tế (Execution Output Log)

```text
$ node tests/security-and-crud.test.mjs
================================================================================
 BÁO CÁO KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (2-ACCOUNT RLS SECURITY & CRUD TEST SUITE)
================================================================================
[PASS] TC-01 (1. Authentication & Onboarding): Đăng ký Tài khoản A và tự động khởi tạo Profile + 15 danh mục mặc định
[PASS] TC-02 (1. Authentication & Onboarding): Đăng ký Tài khoản B độc lập và kiểm tra không gian danh mục tách biệt
[PASS] TC-03 (1. Authentication & Onboarding): Chặn đăng ký trùng Email và chặn đăng nhập sai mật khẩu
[PASS] TC-04 (1. Authentication & Onboarding): Chặn truy cập cơ sở dữ liệu khi chưa đăng nhập (Unauthenticated Access Blocked)
[PASS] TC-05 (2. Core Features & Exact Arithmetic): Tài khoản A tạo giao dịch Thu/Chi và kiểm tra tính toán số dư chính xác (VND)
[PASS] TC-06 (2. Core Features & Exact Arithmetic): Tài khoản B tạo giao dịch Thu/Chi riêng biệt và kiểm tra thống kê độc lập
[PASS] TC-07 (2. Core Features & Exact Arithmetic): Cập nhật (UPDATE) và Xóa (DELETE) giao dịch hợp lệ của chính chủ tài khoản
[PASS] TC-08 (2. Core Features & Exact Arithmetic): Tìm kiếm từ khóa, Lọc theo loại giao dịch và Phân trang (Pagination)
[PASS] TC-09 (2. Core Features & Exact Arithmetic): Bảo vệ khóa ngoại (ON DELETE RESTRICT): Chặn xóa danh mục đang có giao dịch tham chiếu
[PASS] TC-10 (2. Core Features & Exact Arithmetic): Quản lý Ngân sách & Kiểm tra ngưỡng cảnh báo 80% (Warning) và 100% (Danger)
[PASS] TC-11 (3. Two-Account RLS Isolation (Account A vs Account B)): RLS SELECT Isolation: Tài khoản B hoàn toàn không nhìn thấy giao dịch, danh mục hay ngân sách của Tài khoản A
[PASS] TC-12 (3. Two-Account RLS Isolation (Account A vs Account B)): RLS INSERT Spoofing Prevention: Tài khoản B cố tình chèn giao dịch giả mạo user_id của Tài khoản A
[PASS] TC-13 (3. Two-Account RLS Isolation (Account A vs Account B)): Cross-User Foreign Key Prevention: Tài khoản B cố tình gắn giao dịch vào category_id của Tài khoản A
[PASS] TC-14 (3. Two-Account RLS Isolation (Account A vs Account B)): RLS UPDATE IDOR Prevention: Tài khoản B cố tình sửa số tiền giao dịch của Tài khoản A
[PASS] TC-15 (3. Two-Account RLS Isolation (Account A vs Account B)): RLS DELETE IDOR Prevention: Tài khoản B cố tình xóa giao dịch của Tài khoản A
[PASS] TC-16 (3. Two-Account RLS Isolation (Account A vs Account B)): RLS Budget & Category Tampering Prevention: Tài khoản B cố tình sửa/xóa Ngân sách và Danh mục của Tài khoản A
[PASS] TC-17 (3. Two-Account RLS Isolation (Account A vs Account B)): RLS Ownership Transfer Prevention: Chặn chuyển nhượng user_id của bản ghi sang tài khoản khác
[PASS] TC-18 (4. Validation & Error Handling): Kiểm thử biên số tiền: Chặn số âm (-50000), số 0, số thập phân lẻ (12.34), chuỗi chữ ("abc")
[PASS] TC-19 (4. Validation & Error Handling): Kiểm tra toàn vẹn loại Danh mục: Chặn tạo giao dịch INCOME nhưng gắn vào danh mục EXPENSE
[PASS] TC-20 (4. Validation & Error Handling): Chống tấn công XSS (Cross-Site Scripting) khi hiển thị mô tả giao dịch hoặc tên danh mục
--------------------------------------------------------------------------------
 TỔNG KẾT: 20/20 PASS | 0 FAIL
================================================================================
```
