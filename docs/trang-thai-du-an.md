# Trạng thái dự án

Cập nhật: 25/11/2026. Phần mềm gồm `index.html`, `css/style.css` và ba tệp
`js/*.js`; chạy trong trình duyệt, không build, không máy chủ. Giao diện có
thanh bên khi dùng màn hình rộng, năm thẻ khi dùng điện thoại.

## Đã xong và đã kiểm

| Việc | Kiểm bằng gì |
|---|---|
| Thiết lập lần đầu: ngưỡng, kỳ kê khai, hộ đầu tiên | `Scripts/smoke_app.mjs` |
| Hàng hóa: thêm/sửa/xóa, giá, tồn kho, tồn tối thiểu, đưa vào giỏ | smoke |
| Bán hàng: tiền mặt, chuyển khoản, ghi nợ; giảm giá; trừ tồn; in phiếu | smoke |
| Khách hàng: công nợ, thu nợ | smoke |
| Chi phí: thêm/xóa | smoke |
| Mua hàng: phiếu nhập, giá vốn bình quân, in, trả hàng, xóa | smoke |
| Nhà cung cấp: thêm, ghi nợ, trả nợ | smoke |
| Tồn kho: kiểm kê, bỏ kiểm kê hoàn tồn, cảnh báo tồn thấp | smoke |
| Quỹ tiền mặt ước tính, số dư đầu kỳ | smoke |
| Sổ sách: bảng kê và CSV, sáu sổ xem trước/in/xuất Excel, in lại hóa đơn | smoke |
| Cổng dữ liệu: mẫu JSON, xem trước, nạp, chặn trùng mã, xuất JSON/XML | smoke |
| Thuế: GTGT theo nhóm, TNCN hai cách A/B, giảm 30%, đổi kỳ, ghi nhận đã nộp | smoke |
| Số liệu thuế theo ví dụ luật (1,8 / 2,2 / 2,5 tỷ; sát ngưỡng; trên 3 tỷ; trên 10 tỷ) | smoke |
| Cấu hình chính sách thuế: lưu không mất số, chọn nhanh ngưỡng, khôi phục mặc định | smoke |
| Nhiều hộ kinh doanh: thêm, chuyển hộ, dữ liệu tách riêng | smoke |
| Lưu trữ trong máy (IndexedDB, đường lui localStorage) | smoke + Safari |
| Sao lưu ra tệp JSON và nhập lại | smoke |
| Mọi màn hình vẽ được; mọi nút/ô có xử lý; Menu và liên kết trỏ đúng | smoke |
| Phím tắt Alt+1…Alt+8, Esc | smoke |
| Cấu trúc trang, thứ tự tải script, cú pháp | `python3 Scripts/check_app.py` |

Kết quả lần chạy gần nhất: **194 điều đúng, 0 điều sai**; kiểm cấu trúc cũng
đạt. Cách chạy: xem `AGENTS.md`.

**Kiểm trong Safari thật (25/11/2026, bản sau khi mở rộng):** máy chủ nội bộ
ghi `200` cho trang và cả bốn tệp CSS/JS. Bản dò chèn vào trang báo 15 màn hình
nạp được (mỗi màn hình có chữ), năm thẻ và mười mục Menu đầy đủ, IndexedDB hoạt
động, thanh bên hiện ra, bấm thử Mua hàng và Cổng dữ liệu chuyển đúng màn hình,
không lỗi JavaScript. Các luồng mới (mua/trả hàng, nhà cung cấp, kiểm kê, cổng
JSON/XML, sổ sách mở rộng) đã kiểm trong khung mô phỏng `Scripts/smoke_app.mjs`.

**Giao diện Sổ theo dõi và nhóm Quản lý (25/11/2026):** danh sách sổ xếp một
cột trên điện thoại, hai cột từ 1000 px; tiêu đề bảng sổ dính khi cuộn, dòng
chẵn/lẻ dễ theo dõi. Đo trên Safari qua máy chủ nội bộ: đủ sáu sổ, mười bốn mục
trong hai nhóm Menu, không lỗi JavaScript.

**Web công khai (25/11/2026):** đã bật GitHub Pages từ nhánh `main` tại
`https://datkep92.github.io/ketoan_hkd/`. Trang và cả bốn tệp CSS/JS đều trả về
`HTTP 200`; nội dung trang đúng bản đã kiểm ở trên. Chưa bấm thử trên bản công
khai bằng Safari — phần giao diện đã thử qua máy chủ nội bộ cùng một mã nguồn.

## Chưa kiểm trên máy thật

- **Bố cục bằng mắt:** `apelin_screen_read_tree` có lúc không đọc được Safari
  (nhiều app cùng ở trước). Muốn xem bố cục thì xin Sếp cho chụp ảnh màn hình.
- **Bố cục desktop (màn hình ≥900 px):** chỉ mới kiểm bằng quy tắc CSS, chưa xem
  trên máy tính thật.
- **Hộp thoại in và bản in:** phần mềm gọi lệnh in (đã kiểm là được gọi), nhưng
  chưa in ra máy in hoặc lưu PDF thật; bố cục A4 chưa ai xem.
- **Máy in khổ nhiệt 58/80 mm:** chưa hỗ trợ.
- **Dữ liệu lớn** (hàng nghìn hóa đơn): chưa đo tốc độ.

## Còn lại (chưa làm)

- Xem và thử bấm trên Safari bằng mắt, nhất là bố cục desktop.
- In thử ra PDF/A4 để xem bản in.
- In khổ nhiệt 58/80 mm nếu Sếp dùng máy in hóa đơn.
- Mở rộng Google Drive sau này (Sếp đã nêu ý định; chưa làm, app hiện chỉ lưu
  trong máy và sao lưu bằng tệp JSON).

## Giới hạn cố định (không đổi theo yêu cầu)

Không phát hành hóa đơn điện tử, không nộp tờ khai thay, không tự cập nhật luật;
số thuế là ước tính từ hóa đơn đã ghi; dữ liệu nằm trong trình duyệt của máy
đang dùng.

## Tệp trong dự án

Xem bảng ở `AGENTS.md`. Ý tưởng, phạm vi và căn cứ pháp lý:
`docs/y-tuong-phan-mem-hkd.md`. Hướng dẫn dùng: `docs/huong-dan-su-dung.md`.
