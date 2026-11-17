# Mô tả phong cách trình bày (Design Style Description)

Tài liệu HTML được thiết kế theo phong cách **Học thuật cổ điển kết hợp hiện đại (Editorial / Academic Paper Style)**, tạo cảm giác giống như một tài liệu giấy cao cấp, trang trọng và chuyên nghiệp (phù hợp cho các báo cáo đồ án, đặc tả phần mềm).

## 1. Bảng màu (Color Palette)
Hệ thống màu sắc sử dụng biến CSS (`:root`) với các tông màu ấm, gợi nhớ đến giấy thủ công và mực in cổ điển:
- **Màu nền trang (`--paper`, `--paper-2`):** Sắc giấy ngà vàng nhạt (`#faf6ef`, `#f4ecdf`), giảm độ chói, tạo cảm giác dễ chịu khi đọc lâu.
- **Màu văn bản/mực (`--ink`):** Nâu sẫm ấm (`#2e251f`), dịu hơn màu đen tuyền.
- **Màu tiêu đề (`h1`, `h2`, `h3`):** Nâu đậm (`#4a2d1e`), mang phong cách trang trọng.
- **Màu điểm nhấn (`--accent`, `--accent-soft`):** Nâu cam ấm (`#a86632`) kết hợp với nền phụ mềm mại (`#f5e9d9`) dùng cho các nhãn, đường viền nhấn hoặc mã lệnh.
- **Hiệu ứng nổi (`--shadow`):** Đổ bóng mềm mại tông nâu nhạt (`0 10px 30px rgba(74, 52, 36, .08)`).

## 2. Kiểu chữ (Typography)
- **Tiêu đề (`h1`, `h2`, `h3`):** Sử dụng font chữ có chân cổ điển (`"Times New Roman", serif`), mang đậm tính chất tài liệu nghiên cứu học thuật. Tiêu đề chính (`h1`) có kích thước linh hoạt theo màn hình (`clamp`) và không xuống dòng (`white-space: nowrap`).
- **Nội dung văn bản (`body`):** Sử dụng font không chân phổ biến (`"Segoe UI", Arial, sans-serif`) với khoảng cách dòng (`line-height: 1.6`) thoáng đãng, dễ đọc.
- **Mã lệnh (`code`):** Sử dụng font đơn không chân (`Consolas, monospace`) với chữ nhỏ hơn một chút (`.92em`) và được bao bọc bởi nền màu mềm.
- **Tiêu đề phụ / Nhãn phân mục (`.eyebrow`, `.section-kicker`):** Viết hoa toàn bộ (`text-transform: uppercase`), khoảng cách chữ rộng (`letter-spacing`), kích thước nhỏ, sử dụng màu nhấn để tạo điểm mốc thị giác rõ ràng cho từng phần.

## 3. Cấu trúc và Thành phần giao diện (Layout & UI Components)
- **Khung trang chính (`.page`):** Được căn giữa với chiều rộng tối đa thông minh (`min(1240px, calc(100% - 36px))`), có khoảng đệm biên rộng rãi.
- **Thẻ nội dung (`.card`):** Các bảng biểu hoặc khối nội dung được đặt trong khung thẻ có bo góc lớn (`border-radius: 18px`), viền mảnh tinh tế (`--line`), nền mờ nhẹ và đổ bóng mềm.
- **Bảng biểu (`table`):** 
  - Thiết kế bảng sạch sẽ với các đường viền ô rõ ràng.
  - Phần tiêu đề bảng (`th`) có nền màu be nhạt (`--head`), chữ viết hoa, tạo sự tách biệt chuyên nghiệp.
  - Cột đầu tiên của bảng được làm nổi bật với chữ đậm (`font-weight: 700`).
- **Hộp chú ý (`.callout`, `.reason`):** 
  - `.callout` có đường viền trái dày (4px) màu điểm nhấn (`--accent`) kết hợp nền mềm.
  - `.reason` có nền màu be đậm hơn một chút (`#f1eadf`) dùng để giải thích hoặc làm nổi bật các ghi chú lý do.
- **Khung sơ đồ (`.diagram-shell`):** 
  - Bao bọc sơ đồ SVG bên trong một khung có nền trắng tinh khiết, bo góc, đổ bóng và hỗ trợ cuộn ngang (`overflow: auto`) khi màn hình nhỏ để tránh vỡ bố cục.

## 4. Khả năng thích ứng (Responsive & Print Design)
- **Thiết bị di động (`@media (max-width: 760px)`):** Tự động điều chỉnh khoảng đệm trang, kích thước chữ và độ rộng cột trong bảng để hiển thị tối ưu trên màn hình nhỏ.
- **In ấn (`@media print`):** Tối ưu hóa cho việc in thành tài liệu giấy (loại bỏ hiệu ứng bóng đổ `.card`, `.diagram-shell`, đưa màu nền về trắng sạch sẽ và tránh ngắt trang giữa các section (`break-inside: avoid`)).