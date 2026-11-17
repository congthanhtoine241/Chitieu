# Báo Cáo Khám Phá và Ứng Dụng Agent Skills (`SKILL_USAGE.md`)

## 1. Danh sách Agent Skills đã khám phá (Skills Discovered)

Qua quá trình khảo sát môi trường phát triển, các Agent Skills sau đã được phát hiện:

| STT | Tên Skill | Đường dẫn | Nhóm chuyên môn |
|-----|-----------|-----------|-----------------|
| 1 | `planning-and-task-breakdown` | `C:\Users\ADMIN\.gemini\config\skills\planning-and-task-breakdown\SKILL.md` | Lập kế hoạch & Phân rã công việc |
| 2 | `software-architecture` | `C:\Users\ADMIN\.gemini\config\skills\software-architecture\SKILL.md` | Kiến trúc phần mềm & Clean Code |
| 3 | `relational-data-modeling` | `C:\Users\ADMIN\.gemini\config\skills\relational-data-modeling\SKILL.md` | Thiết kế CSDL quan hệ, FD, Chuẩn hóa BCNF |
| 4 | `sql-pro` | `C:\Users\ADMIN\.gemini\config\skills\sql-pro\SKILL.md` | Tối ưu hóa PostgreSQL, RLS, Analytical SQL |
| 5 | `sql-optimization-patterns` | `C:\Users\ADMIN\.gemini\config\skills\sql-optimization-patterns\SKILL.md` | Indexing, Query Plan, N+1 Prevention |
| 6 | `security-auditor` | `C:\Users\ADMIN\.gemini\config\skills\security-auditor\SKILL.md` | Bảo mật ứng dụng, OWASP Top 10, IDOR, RLS |
| 7 | `modern-web-guidance` | `C:\Users\ADMIN\.gemini\config\plugins\modern-web-guidance-plugin\skills\modern-web-guidance\SKILL.md` | Tiêu chuẩn HTML5/CSS3/JS hiện đại |
| 8 | `ui-ux-pro-max` | `C:\Users\ADMIN\.gemini\config\skills\ui-ux-pro-max\SKILL.md` | Hệ thống thiết kế UI/UX, Accessibility, Charts |
| 9 | `design-taste-frontend` | `C:\Users\ADMIN\.gemini\config\skills\design-taste-frontend\SKILL.md` | Tiêu chuẩn thẩm mỹ giao diện chống rập khuôn |
| 10 | `testing-patterns` | `C:\Users\ADMIN\.gemini\config\skills\testing-patterns\SKILL.md` | Mô hình kiểm thử, Data Factory, Behavior Testing |
| 11 | `systematic-debugging` | `C:\Users\ADMIN\.gemini\config\skills\systematic-debugging\SKILL.md` | Quy trình gỡ lỗi có hệ thống |
| 12 | `verification-before-completion` | `C:\Users\ADMIN\.gemini\config\skills\verification-before-completion\SKILL.md` | Kiểm chứng thực tế trước khi xác nhận hoàn thành |
| 13 | `lint-and-validate` | `C:\Users\ADMIN\.gemini\config\skills\lint-and-validate\SKILL.md` | Kiểm tra cú pháp và chất lượng mã nguồn |

*(Các skill không liên quan như `docker-expert`, `figma-*`, `python-fastapi-development`, `chrome-extensions` đã được loại trừ theo quy tắc không áp dụng gượng ép).*

---

## 2. Danh sách Skills được lựa chọn và lý do (Selected Skills & Relevance)

### 2.1. `planning-and-task-breakdown`
- **Lý do lựa chọn:** Dự án có quy mô đầy đủ từ Database, RLS, Auth, CRUD, Analytics đến Security Testing. Cần phân rã theo 4 giai đoạn (Foundation → Core Features → Analytics → Security & Testing) với tiêu chí nghiệm thu rõ ràng.
- **Nơi áp dụng:** `docs/REQUIREMENTS.md`, cấu trúc phát triển 4 giai đoạn.

### 2.2. `software-architecture`
- **Lý do lựa chọn:** Đảm bảo tách biệt trách nhiệm (Separation of Concerns) giữa tầng giao diện (UI), tầng nghiệp vụ (Domain Logic), và tầng dữ liệu (Supabase Client). Áp dụng Early Return, hàm nhỏ gọn, dễ bảo trì.
- **Nơi áp dụng:** `docs/ARCHITECTURE.md` và toàn bộ các module ES6 trong `assets/js/`.

### 2.3. `relational-data-modeling` & `sql-pro` & `sql-optimization-patterns`
- **Lý do lựa chọn:** Thiết kế lược đồ cơ sở dữ liệu chuẩn hóa 3NF/BCNF, chứng minh khóa ứng viên, phụ thuộc hàm, thiết lập ràng buộc toàn vẹn (`CHECK`, `FOREIGN KEY`, `UNIQUE` partial index cho ngân sách tổng và theo danh mục), và tối ưu hóa composite index cho truy vấn theo `user_id` + `transaction_date`.
- **Nơi áp dụng:** `docs/DATABASE_DESIGN.md`, `supabase/schema.sql`, `supabase/policies.sql`, `supabase/seed.sql`.

### 2.4. `security-auditor`
- **Lý do lựa chọn:** Kiểm soát truy cập (Broken Access Control - OWASP A01), chống IDOR thông qua Supabase Row Level Security (`auth.uid() = user_id`), chống XSS bằng DOM sanitization (`textContent` và bộ lọc an toàn), bảo vệ khóa cấu hình trên GitHub Pages.
- **Nơi áp dụng:** `docs/SECURITY.md`, `supabase/policies.sql`, `assets/js/utils.js`, và bộ kiểm thử 2 tài khoản ở Giai đoạn 4.

### 2.5. `ui-ux-pro-max` & `modern-web-guidance` & `design-taste-frontend`
- **Lý do lựa chọn:** Thiết kế giao diện tài chính tối giản, sang trọng (kết hợp bảng màu Editorial Paper sáng ấm từ `style.md` và chế độ Dark Mode chuyên nghiệp từ `ui-ux-pro-max`), đảm bảo khả năng tiếp cận (WCAG AA contrast, `role="alert"`, `aria-describedby` cho lỗi biểu mẫu, quản lý tiêu điểm bàn phím trong hộp thoại `<dialog>`).
- **Nơi áp dụng:** `index.html`, `assets/css/variables.css`, `assets/css/main.css`, `assets/css/components.css`, `assets/css/responsive.css`.

### 2.6. `testing-patterns` & `verification-before-completion` & `lint-and-validate`
- **Lý do lựa chọn:** Xây dựng các test case tự động sử dụng Data Factory (`createMockUser`, `createMockTransaction`, `createMockBudget`), kiểm thử cách ly dữ liệu giữa **Tài khoản A** và **Tài khoản B**, kiểm thử ràng buộc số học tiền tệ (VND nguyên, số dương), và chạy kiểm chứng thực tế bằng cả Node.js lẫn trình duyệt.
- **Nơi áp dụng:** `docs/TESTING.md`, `tests/security-and-crud.test.mjs`, `test-runner.html`.
