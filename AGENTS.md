# Ghi chú cho lần làm việc sau (đọc trước khi sửa)

## Phần mềm này là gì

Một **tệp HTML duy nhất**: `app/quan-ly-hkd.html`. Người dùng mở tệp bằng trình
duyệt (Safari/Chrome trên iPhone, iPad, máy tính). Không máy chủ, không cài đặt,
không mạng, không tài khoản. Dữ liệu nằm trong trình duyệt của máy (IndexedDB,
có đường lui localStorage) và xuất/nhập được qua tệp JSON sao lưu.

**Không có bước build.** Sửa tệp là xong: mở lại tệp trong trình duyệt để thấy
thay đổi. Đừng dựng thêm hệ thống build, đừng tách tệp thành nhiều tệp: tính
"một tệp, mở là chạy" là yêu cầu của phần mềm, không phải sở thích.

## Kiểm tra trước khi coi là xong

```sh
python3 Scripts/check_app.py     # cấu trúc tệp: thẻ, script, kích thước
```

Trên máy này `node` trong PATH chỉ là script bọc `#!/bin/sh`, mà `/bin/sh` không có
(jailbreak rootless), nên gọi thẳng chương trình thật cùng thư mục:

```sh
NODE_REAL="$(dirname "$(which node)")/node.real"
"$NODE_REAL" --jitless --no-expose-wasm Scripts/smoke_app.mjs
```

(`--jitless --no-expose-wasm` cho chắc trên thiết bị này.) Lần chạy gần nhất:
**124 điều đúng, 0 sai**, khoảng 1,3 giây.

`Scripts/smoke_app.mjs` dựng một DOM tối thiểu, nạp đoạn `<script>` của app vào
ngữ cảnh Node rồi bấm thử: thiết lập hộ → hàng hóa → bán → ghi nợ/thu nợ → chi phí
→ in → thuế → cấu hình chính sách → nhiều hộ → lưu trữ → sao lưu/nhập → vẽ mọi màn
hình → số liệu thuế theo ví dụ luật → mục Menu và các liên kết màn hình.
Mỗi dòng `✓` là một điều đã kiểm; mã thoát 1 khi có dòng `✗`.

Hai phép kiểm đáng giữ, vì chúng bắt được lỗi thật đã từng xảy ra:

- **Mọi nút mở màn hình phải trỏ tới màn hình có thật** — lỗi cũ: 4 mục trong
  Menu thiếu cả `data-act` lẫn `data-route` nên bấm vào không mở gì. Khi thêm mục
  điều hướng, dùng hàm `nav(route, tên, phụ)` trong `VIEWS.menu`, đừng dùng
  `item()` (hàm đó dành cho nút có `data-act`).
- **Mọi thứ gắn hành động phải có xử lý trong mã** — nút bấm theo `case` trong bộ
  xử lý `click`, ô nhập/ô chọn theo `t.id === '...'` trong bộ xử lý `input`.

App cần chạy thử tay trên trình duyệt thật (Safari) trước khi báo xong: DOM giả
không thay được cảm giác bấm và bố cục trên máy.

**Đã thử mở trên máy này (12/11/2026) và chưa được:** dựng máy chủ nội bộ
(`python3 -m http.server`, cổng 8765, chạy nền, nhật ký `.tmp/serve.log`) rồi
`icli url open http://127.0.0.1:8765/app/quan-ly-hkd.html` — Safari báo mở được
nhưng nhật ký máy chủ không nhận yêu cầu nào, nên **không có bằng chứng bằng mắt**.
Lần sau thử: hỏi ý kiến Sếp trước, rồi dùng `file_show` để mở tệp HTML trong Quick
Look, hoặc lưu tệp vào Ứng dụng Tệp và nhờ Sếp mở bằng Safari. Cũng **chưa in thử**
ra máy in/PDF, nên bố cục bản in A4 chưa ai xem.

## Bản đồ tệp

| Tệp | Nội dung |
|---|---|
| `app/quan-ly-hkd.html` | Toàn bộ phần mềm: giao diện, logic, dữ liệu |
| `Scripts/check_app.py` | Kiểm cấu trúc tệp app (thẻ, script, kích thước) |
| `Scripts/smoke_app.mjs` | Kiểm hành vi: chạy app trong Node, bấm thử các luồng |
| `docs/y-tuong-phan-mem-hkd.md` | Ý tưởng, phạm vi, kiến trúc, căn cứ pháp lý |
| `docs/huong-dan-su-dung.md` | Hướng dẫn dùng cho người bán hàng |
| `docs/trang-thai-du-an.md` | Việc đã xong / đang dở / còn lại |
| `.tmp/` | Chỗ nháp, không đưa vào git |

## Trong tệp app: chỗ nào ở đâu

- `VIEWS.<tên>`: một màn hình. Hiện có `setup`, `home`, `sell`, `products`,
  `book`, `tax`, `customers`, `expenses`, `policy`, `menu`, `help`.
- `render()` quyết định vẽ màn hình nào; `go(route)` đổi màn hình (màn hình không
  có thật thì quay về `home`).
- Bộ xử lý bấm (`document.addEventListener('click', ...)`): mọi hành động nằm
  trong `switch (act)`, `act` lấy từ `data-act` trên thẻ được bấm.
- Bộ xử lý nhập liệu (`document.addEventListener('input', ...)`): các ô nhập, ô
  chọn theo `id`; thẻ đáy màn hình theo `data-route`.
- `P()` đọc cấu hình chính sách thuế, `S.data` giữ toàn bộ dữ liệu, `Persist` lo
  lưu trữ, `taxCalc(hid, năm, kỳ)` tính thuế, `printDoc` quyết định in gì.

## Quy ước

- **Tiếng Việt** cho mọi thứ người dùng đọc: nhãn, thông báo, tài liệu, tên hàm
  và biến cũng viết không dấu theo tiếng Anh ngắn gọn (ví dụ `taxCalc`, `hhs`).
- Tệp ở dạng **NFC**. Khi sửa bằng công cụ, nếu đoạn cần thay báo "không tìm
  thấy" dù nhìn thấy trong tệp, hãy kiểm bằng `python3 -c "print(repr(...))"`:
  lỗi thuộc về chuỗi gửi vào, không phải tệp.
- Không thêm thư viện ngoài, không CDN, không gọi mạng từ app.
- Số tiền dùng `money()` (đồng), ngày dùng `dmy()` (dd/mm/yyyy).
- Sửa ở đâu thì chạy lại `Scripts/smoke_app.mjs`; thêm luồng mới thì thêm phép
  kiểm vào đó, không kiểm bằng mắt.

## Giới hạn phải giữ đúng lời

App **không** phát hành hóa đơn điện tử, **không** nộp tờ khai thay, **không** tự
cập nhật luật. Số thuế là ước tính từ hóa đơn đã ghi. In ấn dùng hộp thoại in của
trình duyệt (AirPrint hoặc Lưu thành PDF); **chưa hỗ trợ máy in hóa đơn khổ nhiệt
58/80 mm**. Đừng hứa những thứ này trong giao diện hay tài liệu.

## Git

Nhánh `main`. Commit ngay khi app hoặc tài liệu đã kiểm xong; thông điệp commit
bằng tiếng Việt, gọn, nói rõ thay đổi cho người dùng.
