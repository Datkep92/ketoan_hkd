# Hướng dẫn sử dụng — Phần mềm quản lý hộ kinh doanh

## 1. Mở phần mềm lần đầu

Phần mềm là **một thư mục gồm** `index.html`, `css/style.css` và ba tệp trong
`js/`. Giữ nguyên cấu trúc đó, rồi mở `index.html` bằng trình duyệt. Không cần
cài đặt, không cần mạng, không có tài khoản. Nếu có mạng, có thể mở sẵn bản công
khai tại `https://datkep92.github.io/ketoan_hkd/`; dù mở từ web hay từ tệp,
dữ liệu vẫn chỉ nằm trong trình duyệt của chính máy bạn.

- Trên máy tính: nháy đúp `index.html` để mở bằng Chrome/Edge/Safari.
- Trên iPhone/iPad: lưu cả thư mục vào Ứng dụng **Tệp**, rồi mở `index.html`
  bằng trình duyệt. Nếu Safari không tải được CSS/JS từ tệp_local, hãy dùng
  trình duyệt hỗ trợ tệp_local hoặc một máy chủ nội bộ trong cùng máy — không
  cần Internet. Nên mở bằng trình duyệt thật, không xem qua bản xem trước, để in
  và lưu dữ liệu hoạt động đầy đủ.

> **Điều quan trọng nhất:** dữ liệu nằm trong trình duyệt của chính máy đó. Mở tệp
> bằng trình duyệt khác hoặc máy khác là thấy dữ liệu khác (trống). Vì vậy hãy
> **sao lưu hằng tuần** (mục 11) và đừng xóa "dữ liệu trang web" của trình duyệt.

## 2. Cài đặt khi mở lần đầu

Phần mềm hỏi ba thứ, mỗi thứ một lần:

1. **Ngưỡng doanh thu không phải nộp thuế.** Bấm một trong các mốc có sẵn
   (1 tỷ đồng/năm, 500 triệu/năm, 100 triệu/năm) hoặc tự nhập số của mình. Nếu
   chưa chắc, cứ chọn 1 tỷ rồi sửa sau ở mục 9.
2. **Kỳ kê khai:** theo tháng hoặc theo quý.
3. **Hộ kinh doanh đầu tiên:** tên hộ, mã số thuế (nếu đã có), ngành chính.

Bấm **Bắt đầu sử dụng**. Cần thêm hộ nữa thì làm ở mục 10.

**Muốn xem thử ngay:** ở màn cài đặt bấm **Nạp dữ liệu mẫu đầy đủ** (hoặc vào
Menu → cùng tên). Sau khi bạn xác nhận, phần mềm nạp hai hộ kinh doanh với đủ
hàng hóa, phiếu bán, phiếu nhập, khách nợ, chi phí và số liệu thuế để thao tác
thử. Việc này **thay toàn bộ dữ liệu hiện có**; nếu đã có dữ liệu thật, hãy sao
lưu trước (mục 11). Dữ liệu mẫu chỉ để làm quen, không phải số liệu của hộ bạn.

## 3. Màn hình "Hôm nay"

Hiện doanh thu hôm nay, doanh thu tháng, doanh thu cả năm; thanh tiến độ so với
ngưỡng doanh thu (màu vàng khi gần tới, màu đỏ khi đã vượt); quỹ tiền mặt ước
tính, nhắc sao lưu khi quá 7 ngày chưa sao lưu; cảnh báo khách nợ lâu, hàng tồn
dưới mức tối thiểu và nợ nhà cung cấp; và bốn lối tắt: Sổ sách, Tính thuế, Khách
nợ, Hàng hóa. Có ô đặt **Số dư quỹ đầu kỳ** nếu bạn đã có tiền mặt trước khi dùng
phần mềm.

## 4. Bán hàng

Ở đáy màn hình chọn thẻ **Bán hàng**.

- Chưa có mặt hàng: bấm **+** cạnh ô tìm kiếm để thêm mặt hàng đầu tiên.
- Bấm vào một mặt hàng để đưa vào giỏ; trong giỏ dùng **−**, **+**, **✕** để sửa.
- Ô tìm kiếm lọc theo tên hoặc mã hàng.
- Bấm **Thu tiền**, chọn:
  - **Giảm giá** (đồng) nếu có — số giảm không vượt quá tiền hàng.
  - **Hình thức:** Tiền mặt, Chuyển khoản hoặc Ghi nợ (ghi nợ thì bắt buộc chọn
    khách hàng; có nút **+ Thêm khách mới** ngay tại đây).
  - **Ghi chú** nếu cần.
- Bấm **Lưu & in phiếu**, phần mềm hỏi in **phiếu bán hàng**; bấm In để mở hộp
  thoại in của trình duyệt (chọn máy in AirPrint hoặc **Lưu thành PDF**).

Bán xong, **tồn kho tự trừ** (với mặt hàng có theo dõi tồn kho). Mã hóa đơn tự
tăng dần.

## 5. Hàng hóa

Menu → **Hàng hóa**. Mỗi mặt hàng gồm: **Tên hàng**, **Đơn vị tính** (cái, kg, ly…),
**Nhóm thuế** (quyết định tỷ lệ thuế), **Giá bán**, **Giá vốn**, **Tồn kho hiện
tại** (để trống hoặc 0 nếu không theo dõi tồn) và **Tồn tối thiểu (cảnh báo)** —
khi tồn xuống dưới mức này, màn Hôm nay sẽ nhắc nhập hàng. Nút **Sửa** để sửa
hoặc xóa.

## 6. Sổ sách

Thẻ **Sổ sách**. Chọn **Kỳ** (tháng) để xem:

- Doanh thu cả kỳ và số hóa đơn.
- **Doanh thu theo nhóm thuế** — đây là căn cứ tính thuế GTGT.
- **In bảng kê doanh thu** để lưu hoặc đối chiếu.
- **Sổ theo dõi** gồm sáu sổ: nhật ký chung, doanh thu bán hàng, mua hàng và
  chi phí, quỹ tiền mặt, công nợ, tồn kho. Bấm một sổ để xem trước, rồi in ra
  giấy hoặc xuất tệp Excel.
- Danh sách hóa đơn trong kỳ: bấm **In** để in lại phiếu cũ, **Xóa** để bỏ hóa đơn
  ghi nhầm.

## 7. Khách hàng và công nợ

Menu → **Khách hàng**.

- **+ Thêm**: tên khách, điện thoại, nợ hiện tại (nhập 0 nếu chưa nợ).
- Khi bán hàng chọn hình thức **Ghi nợ**, số tiền tự cộng vào nợ của khách.
- Khách có nợ hiện nút **Thu nợ**: nhập **số tiền thu** và **ngày**, phần mềm ghi
  lại phiếu thu và trừ vào nợ.

## 8. Chi phí

Menu → **Chi phí**. Ghi danh mục, ngày, số tiền, ghi chú. Chi phí chỉ có tác dụng
khi ở mục 9 bạn chọn cách tính TNCN **trên thu nhập sau chi phí**; hãy giữ chứng
từ hợp lệ để đối chiếu khi kê khai.

## 9. Tính thuế

Thẻ **Thuế**. Chọn **Năm** và **Kỳ** (Cả năm hoặc từng tháng), rồi xem:

- **Doanh thu kỳ** và **lũy kế cả năm** so với ngưỡng. Chưa vượt ngưỡng thì phần
  mềm nói rõ là chưa phát sinh GTGT và TNCN (nhưng vẫn phải kê khai).
- **Thuế giá trị gia tăng:** bảng doanh thu theo nhóm ngành × tỷ lệ % → số phải nộp.
- **Thuế thu nhập cá nhân — hai cách tính**:
  - **Cách A:** theo bậc thuế suất của cả năm, tính trên thu nhập sau chi phí
    (hoặc trên doanh thu, tùy cấu hình).
  - **Cách B:** theo tỷ lệ % của ngành, chỉ được chọn khi doanh thu cả năm từ 1 đến
    3 tỷ; số tính trên phần doanh thu vượt ngưỡng.
  - Phần mềm hiện **cả hai số** và tổng phải nộp theo từng cách để bạn chọn cách
    có lợi và đúng quy định.
- **Đã nộp** và **Còn phải nộp** nhờ nút **Ghi nhận đã nộp**: nhập **số tiền đã
  nộp**, **ngày nộp** và **ghi chú** (số biên lai, kênh nộp) cho kỳ đang xem.
- **In bảng tính** để lưu bản giấy, và khối **Căn cứ pháp lý** ghi rõ các văn bản
  đang dùng.

## 10. Nhiều hộ kinh doanh

Menu hiện hộ đang làm việc với mã số thuế và địa chỉ, kèm ba nút:

- **Thêm hộ** — tạo hộ mới (dữ liệu hoàn toàn tách riêng).
- **Sửa hồ sơ** — sửa tên hộ, chủ hộ, mã số thuế, địa chỉ, điện thoại, ngành chính
  (ngành chính quyết định tỷ lệ thuế mặc định ban đầu).
- **Chuyển hộ** — chọn hộ khác để làm việc.

Mọi số liệu (hàng hóa, hóa đơn, khách, chi phí, thuế) đều theo hộ đang chọn.

## 11. Sao lưu và nhập lại

Hiện phần mềm **chưa tích hợp Google Drive**. Dữ liệu chỉ nằm trong trình duyệt
của máy; cách sao lưu duy nhất là tệp JSON:

- **Sao lưu dữ liệu:** Menu → Sao lưu dữ liệu. Trình duyệt tải về tệp
  `sao-luu-hkd-<ngày>.json`. Cất tệp ở nơi an toàn (iCloud Drive, email cho chính
  mình). **Làm mỗi tuần.**
- **Nhập dữ liệu đã sao lưu:** Menu → Nhập dữ liệu đã sao lưu → chọn tệp `.json`.
  Lưu ý: thao tác này **thay thế toàn bộ** dữ liệu đang có, nên chỉ làm khi chắc
  chắn (thường là khi đổi máy hoặc dữ liệu bị lỗi).

## 12. Cấu hình chính sách thuế

Menu → **Chính sách thuế** (màn hình **Cấu hình chính sách thuế**). Đây là chỗ duy nhất để sửa các con số luật,
khi quy định thay đổi thì sửa ở đây chứ không phải sửa phần mềm:

- **Ngưỡng doanh thu** (đồng/năm; 0 = chưa đặt, có nút chọn nhanh 1 tỷ / 500 triệu
  / 100 triệu và ô tự nhập).
- **Tỷ lệ thuế GTGT (%)** cho từng nhóm ngành.
- **Tỷ lệ thuế TNCN (%)** cho từng nhóm ngành.
- **Cách tính TNCN theo bậc → Tính trên:** thu nhập sau chi phí, hoặc doanh thu;
  cùng ba bậc thuế suất (đến 3 tỷ / trên 3 đến 50 tỷ / trên 50 tỷ).
- **Giảm 30% thuế TNCN:** bật/tắt, và mức doanh thu tối đa được giảm.
- **Kỳ kê khai:** theo tháng hoặc theo quý.
- **Khôi phục mặc định** để quay về bộ số gốc.

Bấm **Lưu cấu hình** sau khi sửa.

## 13. Mua hàng, nhà cung cấp và tồn kho

Menu → **Mua hàng** (phím tắt Alt+6). Mỗi phiếu nhập có nhà cung cấp, ngày,
hình thức thanh toán (tiền mặt, chuyển khoản hoặc ghi nợ) và tối đa năm dòng
hàng: tên hàng, số lượng, đơn giá. Hàng chưa có sẽ được thêm tự động; tồn kho
và **giá vốn bình quân** được cập nhật ngay. Mã phiếu tự tăng `PN...`.

- Trong danh sách phiếu: **In** phiếu nhập, **Trả hàng** (hoàn tồn và công nợ)
  hoặc **Xóa** phiếu ghi nhầm (đều có xác nhận).
- Menu → **Nhà cung cấp**: thêm, sửa, xóa, ghi nợ sẵn; nút **Trả nợ** ghi nhận
  tiền đã trả và trừ vào nợ.
- Menu → **Tồn kho**: xem số lượng, giá vốn, giá trị tồn ước tính và lịch sử
  kiểm kê. Nút **Kiểm kê** đặt lại tồn thực tế; phần mềm ghi chênh lệch và cho
  phép bỏ lần kiểm kê để trả về số cũ.
- Sáu sổ theo dõi ở mục 6 đã gồm cả phiếu nhập, trả nợ nhà cung cấp và kiểm kê.

## 14. Cổng dữ liệu hóa đơn

Menu → **Cổng dữ liệu** (phím tắt Alt+8). Đây là chỗ **đối chiếu và nạp dữ
liệu** JSON/XML từ phần mềm khác; **không phải phát hành hóa đơn điện tử**,
không gửi dữ liệu đi đâu.

- Bấm **Mẫu bán** hoặc **Mẫu mua** để có ví dụ, bấm **Kiểm tra** để xem trước,
  rồi bấm **Nạp vào app**. Phần mềm chặn mã trùng và báo số chứng từ đã nạp;
  nên sao lưu (mục 11) trước khi nạp.
- Chọn **Hóa đơn bán ra** hoặc **Hóa đơn mua vào**, rồi **Xuất JSON** hoặc
  **Xuất XML** để đối chiếu hoặc đưa sang phần mềm khác. Tệp xuất không ghi đè
  tệp sao lưu.
- Một phiếu là một đối tượng `invoice`, hoặc nhiều phiếu nằm trong mảng
  `invoices`; mỗi phiếu có `code`, `date`, `partner`, `pay`, `lines` (tên hàng,
  nhóm thuế, số lượng, đơn giá). Trang này có sẵn ví dụ để copy.

## 15. Phần mềm không làm gì (giới hạn)

- Không phát hành **hóa đơn điện tử** và không **nộp tờ khai** thay bạn; việc đó
  vẫn phải qua kênh chính thức của cơ quan thuế.
- Không tự cập nhật luật: quy định đổi thì bạn phải sửa ở mục 12 và đối chiếu với
  văn bản hiện hành.
- Số thuế là **con số ước tính từ hóa đơn đã ghi** trong phần mềm. Hóa đơn ghi
  thiếu thì số thuế cũng thiếu.
- **In ấn** dùng hộp thoại in của trình duyệt: máy in AirPrint hoặc Lưu thành PDF.
  Chưa hỗ trợ máy in hóa đơn **khổ nhiệt 58/80 mm**.
- Dữ liệu nằm trong trình duyệt của máy. Xóa "dữ liệu trang web" trong cài đặt
  trình duyệt là mất sạch — hãy sao lưu (mục 11).

## 16. Khi có trục trặc

| Hiện tượng | Cách xử lý |
|---|---|
| Mở lên thấy trống, mất dữ liệu | Kiểm tra tệp có đang mở bằng đúng trình duyệt, đúng máy đã dùng trước đó. Nếu vẫn trống, dùng mục 11 để nhập lại tệp sao lưu gần nhất. |
| Nút Menu không mở gì | Đóng tệp rồi mở lại; nếu vẫn vậy, báo lại để sửa (đây là lỗi đã từng gặp và đã sửa). |
| Máy chạy chậm | Vào Sổ sách xuất dữ liệu, sao lưu rồi xóa bớt hóa đơn rất cũ. |
| Không in ra giấy | Trong hộp thoại in, chọn **Lưu thành PDF** rồi in tệp PDF đó; cách này chắc chắn chạy cho mọi máy in. |
| Số tiền thuế khác số của cơ quan thuế | So lại ngưỡng, tỷ lệ, cách tính ở mục 12 và các hóa đơn đã ghi; phần mềm không thay thế số liệu kê khai chính thức. |
