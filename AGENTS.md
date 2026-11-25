# Ghi chú cho lần làm việc sau (đọc trước khi sửa)

## Phần mềm này là gì

Phần mềm quản lý nhiều hộ kinh doanh, gồm **một trang và ba tệp tĩnh**:
`index.html`, `css/style.css`, `js/core.js`, `js/views.js`, `js/actions.js`.
Mở `index.html` bằng trình duyệt (Safari/Chrome trên iPhone, iPad, máy tính).
Không máy chủ, không cài đặt, không mạng, không tài khoản, **không có bước build**.
Dữ liệu nằm trong trình duyệt của máy (IndexedDB, có đường lui localStorage),
xuất/nhập qua tệp JSON sao lưu.

Web công khai: `https://datkep92.github.io/ketoan_hkd/` — GitHub Pages bật từ
nhánh `main` ngày 25/11/2026; khi đẩy commit mới, Pages tự cập nhật.

Sếp đã yêu cầu tái cấu trúc từ bản một tệp sang như trên và **tối ưu cho máy tính**:
bố cục có thanh bên khi màn hình rộng (xem `css/style.css`, mục `.shell`,
`@media (max-width:900px)`). Giữ nguyên cách chạy: sửa tệp là xong, mở lại trang
trong trình duyệt để thấy thay đổi. Đừng đưa ES modules hay CDN vào app: dùng
classic `<script src>` để mở được cả bằng `file://`.

## Kiểm tra trước khi coi là xong

```sh
python3 Scripts/check_app.py     # cấu trúc: thẻ, thứ tự script, cú pháp, invariants
```

Trên máy này `node` trong PATH là script bọc `#!/bin/sh`, mà `/bin/sh` không có
(jailbreak rootless), nên gọi thẳng chương trình thật:

```sh
NODE_REAL="$(dirname "$(which node)")/node.real"
"$NODE_REAL" --jitless --no-expose-wasm Scripts/smoke_app.mjs
```

Lần chạy gần nhất: **267 điều đúng, 0 sai**. `Scripts/smoke_app.mjs` dựng DOM
tối thiểu, nạp `index.html` + ba tệp JS vào Node rồi bấm thử: thiết lập hộ →
hàng hóa → bán/giảm giá/tồn kho/in → khách nợ/thu nợ → chi phí → mua/trả hàng,
nhà cung cấp, kiểm kê → sản xuất (trừ tồn, nhập kho, hoàn tồn khi xóa) → sổ
sách → thuế, bản nháp 01/CNKD và cấu hình chính sách → nhiều hộ → lưu trữ →
sao lưu/nhập → vẽ mọi màn hình → số liệu thuế theo ví dụ luật → Menu, liên kết,
phím tắt. Mỗi dòng `✓` là một điều đã kiểm; mã thoát 1 khi có dòng `✗`.

Hai phép kiểm đáng giữ, vì bắt được lỗi thật đã từng xảy ra:

- **Mọi nút mở màn hình phải trỏ tới màn hình có thật** — lỗi cũ: 4 mục Menu
  thiếu cả `data-act` lẫn `data-route`. Khi thêm mục điều hướng trong
  `VIEWS.menu`, dùng `nav(route, tên, phụ)`, đừng dùng `item()`.
- **Mọi thứ gắn hành động phải có xử lý trong mã** — nút bấm theo `case` trong
  bộ xử lý `click` ở `js/actions.js`, ô nhập theo `t.id === '...'` trong bộ xử
  lý `input`.

## Kiểm trên Safari thật (25/11/2026)

Máy chủ tạm phải **tách hẳn khỏi tiến trình của lệnh gọi** (double fork +
`setsid`), nếu không nó chết ngay khi lệnh kết thúc:

```sh
python3 .tmp/serve_app.py "<gốc dự án>" 8770 "<gốc dự án>/.tmp/serve.log"
icli url open http://127.0.0.1:8770/index.html
```

Dừng máy chủ: `pkill -f 'http.server 8770'`.

Bằng chứng đã có: nhật ký máy chủ ghi `200` cho `index.html`, `css/style.css`
và cả ba tệp JS. Một bản dò (`code_run` tạo `.tmp/probe.html` từ `index.html`,
chèn thêm đoạn gửi kết quả về `/__probe`) báo: 11 màn hình nạp được, năm thẻ
đủ, bảy mục Menu đủ, màn `home` vẽ ra 553 ký tự, IndexedDB ở chế độ `idb`,
bấm Menu → `menu`, bấm Bán hàng → `sell`, **không lỗi JavaScript**.

`apelin_screen_read_tree` đôi khi vẫn lỗi "frontmost application could not be
verified" (RunningBoard báo nhiều app cùng ở trước). Khi đó muốn xem bố cục
bằng mắt thì xin Sếp cho chụp một ảnh màn hình. **Chưa in thử** ra máy in/PDF,
nên bố cục bản in A4 chưa ai xem. Bố cục desktop (màn hình ≥900px) cũng chưa
xem bằng mắt trên máy tính.

## Bản đồ tệp

| Tệp | Nội dung |
|---|---|
| `index.html` | Khung trang, thanh bên/thẻ điều hướng, chỗ chứa màn hình |
| `css/style.css` | Toàn bộ giao diện, in ấn và bố cục desktop/mobile |
| `js/core.js` | Tiện ích, hằng số, `Persist`, trạng thái `S`, `P()`, `taxCalc()`, in |
| `js/views.js` | `VIEWS.<tên>`, `render()`, `go()` |
| `js/actions.js` | Bộ xử lý click/input/keydown, forms, in phiếu, khởi động |
| `Scripts/check_app.py` | Kiểm cấu trúc và cú pháp |
| `Scripts/smoke_app.mjs` | Kiểm hành vi trong Node |
| `docs/y-tuong-phan-mem-hkd.md` | Ý tưởng, phạm vi, căn cứ pháp lý |
| `docs/huong-dan-su-dung.md` | Hướng dẫn dùng cho người bán hàng |
| `docs/trang-thai-du-an.md` | Việc đã xong / đang dở / còn lại |
| `.tmp/` | Chỗ nháp, không đưa vào git |

## Trong app: chỗ nào ở đâu

- `VIEWS.<tên>`: một màn hình (`setup`, `home`, `sell`, `products`, `purchases`,
  `suppliers`, `stock`, `data`, `book`, `tax`, `customers`, `expenses`, `policy`,
  `production`, `declaration`, `menu`, `help`) — nằm trong `js/views.js`.
- `render()` vẽ màn hình hiện tại; `go(route)` đổi màn hình, route không có thì
  quay về `home`.
- Bộ xử lý bấm (`js/actions.js`): mọi hành động nằm trong `switch (act)`, `act`
  lấy từ `data-act`.
- Bộ xử lý nhập liệu: ô nhập/ô chọn theo `id`; thẻ điều hướng theo `data-route`;
  phím tắt Alt+1…Alt+9, Alt+0, Esc.
- `P()` đọc chính sách thuế, `S.data` giữ dữ liệu, `Persist` lo lưu trữ,
  `taxCalc(hid, năm, kỳ)` tính thuế, `printHtml()`/`printInvoice()` lo in.

## Quy ước

- **Tiếng Việt** mọi thứ người dùng đọc; tên hàm/biến không dấu, ngắn gọn
  (`taxCalc`, `hhs`).
- Tệp ở dạng **NFC**. Nếu đoạn cần thay báo "không tìm thấy" dù nhìn thấy trong
  tệp, kiểm bằng `python3 -c "print(repr(...))"`: lỗi thuộc về chuỗi gửi vào.
- Không thư viện ngoài, không CDN, không gọi mạng từ app.
- Tiền dùng `money()` (đồng), ngày dùng `dmy()` (dd/mm/yyyy).
- Sửa ở đâu thì chạy lại `Scripts/smoke_app.mjs`; thêm luồng mới thì thêm phép
  kiểm vào đó, không kiểm bằng mắt.

## Giới hạn phải giữ đúng lời

App **không** phát hành hóa đơn điện tử, **không** nộp tờ khai thay, **không** tự
cập nhật luật. Số thuế là ước tính từ hóa đơn đã ghi. In qua hộp thoại in của
trình duyệt (AirPrint hoặc Lưu thành PDF); **chưa hỗ trợ máy in khổ nhiệt
58/80 mm**. Đừng hứa những thứ này trong giao diện hay tài liệu.

## Git

Nhánh `main`, repo public `Datkep92/ketoan_hkd`. Commit ngay khi app hoặc tài
liệu đã kiểm xong; thông điệp commit tiếng Việt, gọn, nói rõ thay đổi cho người
dùng. Đẩy lên GitHub khi Sếp yêu cầu hoặc khi đã thống nhất quy trình.
