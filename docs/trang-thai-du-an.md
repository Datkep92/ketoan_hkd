# Trạng thái dự án

Cập nhật: 12/11/2026. Phần mềm: `app/quan-ly-hkd.html` (một tệp, 69.977 ký tự),
chạy bằng trình duyệt, không build, không máy chủ.

## Đã xong và đã kiểm

| Việc | Kiểm bằng gì |
|---|---|
| Thiết lập lần đầu: ngưỡng, kỳ kê khai, hộ đầu tiên | `Scripts/smoke_app.mjs` — mục 1, 2 |
| Hàng hóa: thêm/sửa, giá, tồn kho, đưa vào giỏ | mục 3 |
| Bán hàng: thu tiền mặt, chuyển khoản, ghi nợ; giảm giá; in phiếu; tự trừ tồn kho | mục 4 |
| Khách hàng: công nợ, thu nợ | mục 5 |
| Chi phí: thêm/xóa | mục 6 |
| Sổ sách: doanh thu kỳ, doanh thu theo nhóm thuế, in bảng kê, in lại hóa đơn | mục 7 |
| Thuế: GTGT theo nhóm, TNCN hai cách A/B, giảm 30%, đổi kỳ, ghi nhận đã nộp | mục 7, 13 |
| Số liệu thuế theo ví dụ văn bản luật (1,8 tỷ; 2,2 tỷ; 2,5 tỷ; sát ngưỡng; trên 3 tỷ; trên 10 tỷ) | mục 13 — 27 phép kiểm |
| Cấu hình chính sách thuế: lưu không mất số, chọn nhanh ngưỡng, khôi phục mặc định | mục 8 |
| Nhiều hộ kinh doanh: thêm, chuyển hộ, dữ liệu tách riêng | mục 9 |
| Lưu trữ trong máy (IndexedDB, có đường lui localStorage) | mục 10 |
| Sao lưu ra tệp JSON và nhập lại | mục 11 |
| Mọi màn hình vẽ được | mục 12 |
| Menu và mọi liên kết màn hình trỏ đúng (lỗi cũ: 4 mục Menu không mở được — đã sửa) | mục 14 |

Kết quả lần chạy gần nhất: **124/124 điều đúng**, `python3 Scripts/check_app.py`
cũng đạt. Cách chạy: xem `AGENTS.md`.

## Chưa kiểm trên máy thật

- **Mở tệp bằng Safari trên chính máy này**: mới thử mở qua máy chủ nội bộ, Safari
  không tải trang (nhật ký máy chủ không nhận yêu cầu nào), nên **chưa có bằng
  chứng bằng mắt**. Cần một lần mở thật và bấm thử vài mục Menu, vài lần lưu dữ
  liệu.
- **Hộp thoại in và bản in**: phần mềm có gọi lệnh in (đã kiểm là được gọi), nhưng
  chưa in thật ra máy in hoặc ra PDF trên máy này. Bố cục bản in A4 chưa được xem.
- **Máy in khổ nhiệt 58/80 mm**: **chưa hỗ trợ**, trong tệp không có quy tắc in
  khổ hẹp nào. Nếu cần, đây là việc phải làm thêm.
- **Dữ liệu lớn** (hàng nghìn hóa đơn): chưa đo tốc độ trên máy thật.

## Còn lại (chưa làm)

- In khổ nhiệt 58/80 mm nếu Sếp dùng máy in hóa đơn.
- Xem trước và lưu bản in PDF trực tiếp trong app (hiện dùng hộp thoại in của
  trình duyệt).
- Kiểm tra thật trên Safari (mục trên) trước khi giao cho người dùng cuối.

## Giới hạn cố định (không đổi theo yêu cầu)

Không phát hành hóa đơn điện tử, không nộp tờ khai thay, không tự cập nhật luật;
số thuế là ước tính từ hóa đơn đã ghi; dữ liệu chỉ nằm trong trình duyệt của máy.

## Tệp trong dự án

Xem bảng ở `AGENTS.md`. Ý tưởng, phạm vi và căn cứ pháp lý:
`docs/y-tuong-phan-mem-hkd.md`. Hướng dẫn dùng: `docs/huong-dan-su-dung.md`.
