# Ý tưởng & đặc tả: Phần mềm quản lý hộ kinh doanh (1 tệp HTML)

Tài liệu này chốt ý tưởng, phạm vi, kiến trúc và cách làm đúng luật cho phần mềm
quản lý **nhiều hộ kinh doanh (HKD)** dưới dạng **một tệp HTML duy nhất**, chạy
được trên iPhone/iPad và máy tính, không cần mạng, không cần cài đặt.

Cập nhật: 2026 — bám theo chính sách thuế HKD áp dụng từ 01/01/2026.

---

## 1. Người dùng & mục tiêu

Ba kiểu người dùng, một phần mềm:

| Kiểu người dùng | Cần gì nhất |
|---|---|
| Chủ 1 hộ kinh doanh (tạp hóa, ăn uống, salon, bán online...) | Bán hàng nhanh, biết lời/lỗ, biết sắp phải nộp bao nhiêu thuế, không bị phạt |
| Chủ 2–10 hộ (chuỗi nhỏ, nhiều điểm bán, nhiều ngành) | Tách sổ từng hộ, gộp báo cáo, so sánh |
| Người làm dịch vụ kê khai thuế / kế toán thuê ngoài | Giữ hồ sơ nhiều hộ, tính thuế đúng ngành, xuất số liệu để kê khai, nhắc hạn |

Mục tiêu số 1: **đúng luật** — doanh thu, ngành nghề, ngưỡng miễn thuế, tỷ lệ thuế,
sổ sách, chứng từ, hạn kê khai.
Mục tiêu số 2: **dùng được thật** — mở là chạy, bán hàng 3 cú chạm, in được.

---

## 2. Nguyên tắc thiết kế

1. **Một tệp HTML duy nhất**, mở bằng trình duyệt có sẵn (Safari/Chrome). Không
   cài đặt, không máy chủ, không tài khoản, không quảng cáo.
2. **Chạy hoàn toàn offline.** Mọi mã và giao diện nằm trong tệp; không tải
   thư viện từ Internet.
3. **Dữ liệu thuộc về người dùng**: lưu trong máy (IndexedDB), không gửi đi đâu.
   Xuất/nhập một tệp sao lưu để đổi máy, cất giữ.
4. **In được**: phiếu bán, sổ sách, bảng kê, báo cáo — khổ A4 và khổ in nhiệt
   58/80mm.
5. **Luật là dữ liệu, không phải mã**: ngưỡng miễn thuế, tỷ lệ thuế, bậc thuế,
   giảm thuế đều là **bảng cấu hình có ngày hiệu lực**, sửa được trong phần mềm
   khi luật đổi — không phải sửa code.
6. **Không thay thế nghĩa vụ pháp lý**: phần mềm tính và chuẩn bị số liệu; việc
   phát hành hóa đơn điện tử và nộp tờ khai vẫn qua hệ thống/kênh chính thức.

---

## 3. Căn cứ pháp lý đang dùng

| Văn bản | Nội dung ảnh hưởng phần mềm | Độ chắc chắn |
|---|---|---|
| **NĐ 68/2026/NĐ-CP** (hiệu lực 05/3/2026, 5 chương 19 điều) | Chính sách thuế GTGT, TNCN cho HKD; doanh thu tính thuế; chi phí được trừ; khai và nộp thuế; hóa đơn điện tử | Chắc (đọc cấu trúc toàn văn trên Cổng Chính phủ) |
| **NĐ 141/2026/NĐ-CP** (sửa đổi NĐ 68/2026) | Nâng ngưỡng doanh thu không phải nộp thuế lên **1 tỷ đồng/năm**; kèm Sổ tay hướng dẫn thực hiện nghĩa vụ thuế | Trung bình — **phải đối chiếu toàn văn** trước khi dùng chính thức |
| **NQ 198/2025/QH15** | Bỏ phương pháp khoán từ 01/01/2026; HKD chuyển sang kê khai | Chắc |
| **Bỏ lệ phí môn bài từ 01/01/2026** | Không còn mục "thuế môn bài" trong phần mềm | Chắc |
| **NĐ 70/2025/NĐ-CP** | HKD doanh thu **≥ 1 tỷ/năm** phải dùng hóa đơn điện tử (từ máy tính tiền kết nối cơ quan thuế) | Chắc |
| **NQ 43/2026/QH16 + NĐ 398/2026/NĐ-CP** | Giảm **30% thuế TNCN** kỳ 2026–2027 cho HKD doanh thu dưới 10 tỷ | Trung bình |
| **NĐ 168/2025/NĐ-CP** | Đăng ký HKD: hồ sơ, mã số thuế, thay đổi, tạm ngừng, chấm dứt | Chắc (mức khung) |
| **TT 18/2026/TT-BTC** | Hồ sơ, thủ tục quản lý thuế với hộ, cá nhân kinh doanh | Cần đối chiếu |
| **Luật Quản lý thuế 2025** (hiệu lực 01/7/2026) | Hạn khai, nộp, xử phạt, miễn/giảm | Cần đối chiếu |
| **TT 88/2021/TT-BTC** | Chế độ kế toán HKD: hệ thống sổ, mẫu sổ | Cần xác nhận còn hiệu lực 2026 |

### Bảng tỷ lệ thuế mặc định (sẽ để ở dạng cấu hình sửa được)

| Nhóm ngành | GTGT | TNCN (chọn tỷ lệ %) | Ghi chú |
|---|---|---|---|
| Phân phối, cung cấp hàng hóa | 1% | 0,5% | Tạp hóa, bán online, bán buôn |
| Sản xuất, vận tải, dịch vụ gắn hàng hóa, xây dựng bao thầu vật tư | 3% | 1,5% | Gia công, chế biến |
| Dịch vụ, xây dựng không bao thầu nguyên vật liệu | 5% | 2% | Ăn uống, sửa chữa, đào tạo |
| Cho thuê tài sản, đại lý xổ số/bảo hiểm, bán hàng đa cấp | 5% | 5% | Nhà, mặt bằng, xe |
| Hoạt động kinh doanh khác | 2% | 1% | |

Bậc TNCN theo doanh thu năm (khi không chọn tỷ lệ %): **trên 1–3 tỷ: 15%**,
**trên 3–50 tỷ: 17%**, **trên 50 tỷ: 20%**.
Quyền chọn tỷ lệ % chỉ dành cho hộ doanh thu **1–3 tỷ**.

> Mọi con số trên nằm trong màn hình **Cấu hình chính sách**, mỗi dòng có nguồn
> và ngày hiệu lực. Khi luật đổi, người dùng sửa số, phần mềm tính lại toàn bộ.

---

## 4. Kiến trúc chức năng (10 phân hệ)

```
┌──────────────────────────────────────────────────────────┐
│ 0. Trang chủ hôm nay (việc cần làm, cảnh báo, số nhanh)  │
├──────────────────────────────────────────────────────────┤
│ 1. Hồ sơ hộ kinh doanh (nhiều hộ, chuyển đổi nhanh)      │
│ 2. Hàng hóa & dịch vụ, tồn kho                            │
│ 3. Bán hàng (POS) & hóa đơn bán                           │
│ 4. Mua hàng, nhà cung cấp, chi phí                        │
│ 5. Khách hàng & công nợ (thu – trả)                       │
│ 6. Sổ sách kế toán hộ kinh doanh                          │
│ 7. Thuế: doanh thu, GTGT, TNCN, tạm nộp, dự báo           │
│ 8. Tuân thủ: hóa đơn điện tử, giấy phép, hạn, lưu trữ     │
│ 9. Báo cáo & phân tích                                    │
│ 10. Hệ thống: sao lưu, nhập/xuất, cấu hình chính sách     │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Chi tiết từng phân hệ

### 0. Trang chủ "Hôm nay"
- Doanh thu hôm nay / tháng này / năm nay của hộ đang chọn.
- Việc cần làm: hóa đơn chưa thanh toán, công nợ quá hạn, hàng sắp hết, giấy
  phép sắp hết hạn, hạn nộp thuế, sao lưu quá 7 ngày.
- Cảnh báo ngưỡng: "Doanh thu lũy kế 999.500.000 đ — còn 500.000 đ tới ngưỡng
  1 tỷ" kèm giải thích hậu quả (vượt ngưỡng là cả năm chịu thuế).
- Biểu đồ 30 ngày gần nhất (vẽ bằng SVG thuần).

### 1. Hồ sơ hộ kinh doanh (đa hộ)
- Danh sách hộ + nút chuyển hộ (ngay trên thanh trên cùng); mỗi hộ có màu và mã
  riêng để không nhầm sổ.
- Thông tin hộ: tên hộ, tên chủ hộ, CCCD/ngày cấp/nơi cấp, địa chỉ (tỉnh/xã 2
  cấp), mã số thuế (10 số hoặc 13 ký tự có gạch), mã địa điểm kinh doanh, ngày
  bắt đầu, loại hình (hộ kinh doanh cá nhân / nhóm cá nhân / hộ gia đình), ngành
  nghề chính + phụ (chọn theo danh mục VSIC 2018 rút gọn), vốn, số lao động,
  tài khoản ngân hàng, người đại diện nộp thuế.
- Chọn **nhóm thuế cho từng ngành** (1 trong 5 nhóm ở mục 3) — đây là chìa khóa
  tính đúng thuế về sau.
- Ghi nhận thay đổi hồ sơ theo thời gian (đổi địa chỉ, thêm ngành) để lịch sử
  đúng tại thời điểm phát sinh.
- Tạm ngừng kinh doanh: ngày bắt đầu – ngày kết thúc, doanh thu kỳ đó xử lý riêng.
- Chế độ nhiều hộ: báo cáo gộp, tổng hợp thuế phải nộp toàn bộ hộ.

### 2. Hàng hóa & dịch vụ, tồn kho
- Danh mục: mã, tên, đơn vị tính, giá bán, giá vốn, mã vạch, nhóm hàng, **nhóm
  thuế** (kế thừa từ hộ nhưng sửa được từng mặt hàng cho hộ kinh doanh đa ngành).
- Tồn kho: nhập, xuất, tồn theo từng kho/điểm bán; kiểm kê (đếm thực tế) và
  chênh lệch; giá vốn bình quân.
- Cảnh báo tồn thấp, hàng bán chạy, hàng chết.
- Dịch vụ: không quản lý tồn, chỉ có giá và đơn vị tính.

### 3. Bán hàng & hóa đơn bán
- Màn hình bán nhanh: chọn hàng (ô tìm/lưới), số lượng, chiết khấu, khách quen,
  tiền khách đưa – tiền thừa; bàn phím số to, dùng một tay.
- Thanh toán: tiền mặt, chuyển khoản, ví điện tử, ghi nợ, trả một phần.
- Trả lại hàng / đổi hàng; giảm giá; bán theo đơn đặt trước; tạm ứng/đặt cọc.
- Hóa đơn: đánh số theo mẫu ký hiệu người dùng khai (ví dụ `C26TAA-0000001`),
  trạng thái (nháp/đã phát hành/đã hủy/thay thế), ghi số hóa đơn điện tử do nhà
  cung cấp cấp nếu có.
- **In phiếu bán** (khổ nhiệt và A5) — ghi rõ đây là phiếu bán hàng, không phải
  hóa đơn điện tử.
- Ca làm việc: mở ca – đóng ca, đối chiếu tiền mặt cuối ca.

### 4. Mua hàng, nhà cung cấp, chi phí
- Phiếu nhập hàng: nhà cung cấp, chứng từ (hóa đơn đầu vào nếu có), chiết khấu,
  thuế GTGT đầu vào (ghi nhận để biết chi phí thực, không khấu trừ với HKD).
- Chi phí theo nhóm: mặt bằng, điện nước, lương, vận chuyển, nguyên liệu, khác.
- Công nợ phải trả, hạn thanh toán, nhắc trả.

### 5. Khách hàng & công nợ
- Khách lẻ / khách quen / khách doanh nghiệp (có MST).
- Công nợ phải thu, tuổi nợ (0–30/31–60/61–90/>90), phiếu thu, nhắc nợ (in hoặc
  chia sẻ văn bản).
- Hình thức bán chịu giới hạn theo hạn mức từng khách (tùy chọn).

### 6. Sổ sách kế toán hộ kinh doanh
- Bộ sổ theo chế độ kế toán HKD: **Sổ chi tiết doanh thu**, **Sổ chi tiết chi
  phí**, **Sổ quỹ tiền mặt**, **Sổ tiền gửi ngân hàng**, **Sổ chi tiết thanh
  toán công nợ**, **Sổ chi tiết vật tư/hàng hóa**, **Sổ cái** (tùy chọn).
- **Bảng kê hàng hóa tồn kho** cuối kỳ và **bảng kê doanh thu theo nhóm ngành
  thuế** — hai bảng cơ quan thuế hay yêu cầu.
- Mỗi sổ in ra được theo kỳ (tháng/quý/năm), có dòng tổng, ký tên chủ hộ.
- Mọi bút toán sinh tự động từ bán hàng/mua hàng/thu chi, nhưng vẫn cho nhập tay
  bút toán điều chỉnh; **không cho sửa bút toán đã khóa kỳ** (khóa sổ theo
  tháng) và ghi rõ ai/bao giờ sửa.

### 7. Thuế — phần cốt lõi "chuẩn luật"
Màn hình **Tính thuế theo kỳ** (tháng/quý/năm):

1. **Doanh thu tính thuế**: tự gom từ hóa đơn bán + doanh thu khác (kể cả tiền
   gia công, hoa hồng, phụ thu, chiết khấu), **tách riêng theo nhóm ngành thuế**
   vì mỗi nhóm một tỷ lệ.
2. **Kiểm ngưỡng**: lũy kế doanh thu năm so với ngưỡng không phải nộp thuế
   (mặc định 1 tỷ). Dưới ngưỡng → số thuế = 0, kèm ghi chú "vẫn phải kê khai,
   vẫn phải dùng hóa đơn khi khách yêu cầu".
3. **GTGT** = Σ (doanh thu nhóm × tỷ lệ GTGT nhóm).
4. **TNCN**: hai cách —
   - theo **bậc doanh thu** (15/17/20%), hoặc
   - theo **tỷ lệ % ngành** (0,5/1,5/2/1/5%) **chỉ khi doanh thu 1–3 tỷ**.
   Phần mềm tính **cả hai** và chỉ ra cách nào ít thuế hơn, kèm câu giải thích
   bằng tiếng Việt dễ hiểu và cảnh báo "chỉ được chọn khi doanh thu trong khoảng
   1–3 tỷ".
5. **Giảm 30% TNCN** kỳ 2026–2027 (hộ doanh thu < 10 tỷ) — bật/tắt trong cấu
   hình, hiện rõ trên bảng tính.
6. **Kết quả**: bảng doanh thu – GTGT – TNCN – tổng phải nộp, so với kỳ trước,
   số đã tạm nộp, số còn lại; nút **in bảng tính** và **xuất số liệu CSV** để
   nhập vào tờ khai.
7. **Dự báo cuối năm**: với nhịp doanh thu hiện tại, dự kiến doanh thu năm, có
   vượt ngưỡng không, dự kiến thuế cả năm; mô phỏng "nếu doanh thu thêm X thì
   thuế tăng bao nhiêu".
8. **Nhật ký nghĩa vụ**: hạn kê khai/nộp theo kỳ, đánh dấu đã nộp, nhắc trước
   hạn, ghi số tiền đã nộp và chứng từ.
9. **Hộ đa ngành**: bắt buộc khai tách doanh thu từng ngành; nếu người dùng gộp,
   phần mềm cảnh báo và gợi ý cách phân bổ đã đăng ký.

### 8. Tuân thủ
- **Hóa đơn điện tử**: theo dõi hộ có thuộc diện bắt buộc (doanh thu ≥ 1 tỷ)
  hay không; ghi nhận từng hóa đơn điện tử đã phát hành (số, ngày, mã tra cứu);
  danh sách hóa đơn bán chưa có hóa đơn điện tử để nhắc bổ sung.
- **Giấy tờ**: đăng ký kinh doanh, giấy ATTP, PCCC, giấy phép ngành nghề có điều
  kiện — ngày cấp, ngày hết hạn, nhắc trước 30/60 ngày, đính kèm ảnh (lưu trong
  máy).
- **Lưu trữ chứng từ**: nhắc thời hạn lưu (theo luật kế toán/thuế), đánh dấu hồ sơ
  nào đã số hóa.
- **Lao động**: danh sách nhân viên, hợp đồng, lương, ngày công đơn giản; nhắc
  nghĩa vụ BHXH nếu có.

### 9. Báo cáo & phân tích
- Doanh thu theo ngày/tuần/tháng/quý/năm, theo ngành, theo mặt hàng, theo nhân
  viên, theo kênh (cửa hàng/online).
- Lãi gộp, chi phí, **lãi lỗ ước tính** (dùng cho quản trị, không phải báo cáo
  thuế).
- Dòng tiền: thu – chi – tồn quỹ, công nợ.
- So sánh giữa các hộ trong cùng tài khoản.
- Mọi báo cáo: lọc kỳ, in, xuất CSV.

### 10. Hệ thống
- **Sao lưu**: xuất toàn bộ dữ liệu ra 1 tệp JSON; nhập lại để khôi phục/đổi máy;
  nhắc sao lưu định kỳ; nhật ký sao lưu.
- **Cấu hình chính sách**: bảng ngưỡng – tỷ lệ – bậc – giảm thuế, có ngày hiệu
  lực, có nút "khôi phục mặc định".
- **Cấu hình chung**: đơn vị tiền tệ, làm tròn, mẫu số hóa đơn, tên cửa hàng in
  trên phiếu, mật khẩu mở phần mềm (tùy chọn, chỉ là rào chắn nhẹ).
- **Nhật ký thao tác**: ai sửa gì, lúc nào (một máy nhiều người dùng chung).
- **Trợ giúp tại chỗ**: mỗi màn hình có nút "?" giải thích bằng tiếng Việt và
  trích dẫn điều luật liên quan.

---

## 6. Luồng nghiệp vụ chính (kịch bản)

**A. Ngày đầu dùng phần mềm**
Tạo hộ → nhập MST, ngành nghề, nhóm thuế → nhập tồn kho đầu kỳ và công nợ đầu kỳ
→ chọn kỳ kê khai (tháng/quý) → in bảng kê tồn kho đầu kỳ.

**B. Một ngày bán hàng**
Mở ca → bán (mỗi đơn vài giây) → thu tiền/ghi nợ → cuối ngày đóng ca, in tổng
kết ca, đối chiếu tiền mặt.

**C. Cuối tháng**
Xem sổ chi tiết doanh thu → bảng kê doanh thu theo ngành → màn hình tính thuế →
in bảng tính → kê khai trên kênh chính thức → ghi nhận đã nộp → khóa sổ tháng →
sao lưu.

**D. Cuối năm**
Chốt doanh thu năm, xác định có vượt 1 tỷ không, chọn phương pháp TNCN (nếu
1–3 tỷ), kiểm tra nghĩa vụ hóa đơn điện tử, in bộ sổ cả năm, sao lưu lần cuối.

**E. Nhiều hộ**
Chuyển hộ bằng một chạm → mỗi hộ một màu → bảng "thuế phải nộp tất cả hộ" theo
tháng → nhắc hạn riêng từng hộ.

---

## 7. Mô hình dữ liệu (lưu trong máy)

Các bảng chính (mỗi bản ghi có `id`, `householdId`, `createdAt`, `updatedAt`,
`deletedAt` để xóa mềm và phục hồi):

`households`, `household_history`, `sectors` (ngành + nhóm thuế), `products`,
`stock_moves`, `stock_counts`, `customers`, `suppliers`, `invoices`,
`invoice_lines`, `payments`, `purchases`, `purchase_lines`, `expenses`,
`journal_entries`, `journal_lines`, `tax_periods`, `tax_payments`,
`einvoices`, `licenses`, `employees`, `attendance`, `policies`, `settings`,
`audit_log`, `backups`.

Nguyên tắc: số tiền lưu bằng **số nguyên đồng** (không dùng số thực) để tránh
sai số làm tròn; mọi phép tính thuế làm tròn đến đồng theo quy tắc cấu hình.

---

## 8. Giao diện & in ấn

- Bố cục dọc cho điện thoại, thanh điều hướng dưới 5 mục: **Hôm nay – Bán hàng –
  Sổ sách – Thuế – Menu**; trên máy tính chuyển thành thanh bên.
- Tiếng Việt toàn bộ, số tiền định dạng `1.234.567 đ`, ngày `dd/mm/yyyy`.
- Chữ to, nút to, tương phản cao (dùng ngoài trời, người lớn tuổi).
- In: CSS riêng cho A4 (sổ, báo cáo) và khổ 58/80mm (phiếu bán); ẩn menu khi in;
  tiêu đề có tên hộ, MST, kỳ, người lập.
- Không dùng biểu tượng mơ hồ: mỗi nút có chữ.

---

## 9. Lộ trình xây dựng

**Giai đoạn 1 — Bộ khung chạy được (bản dùng thử nội bộ)**
Tệp HTML + lưu trữ trong máy + đa hộ + hồ sơ hộ + hàng hóa + bán hàng + in phiếu
bán + sao lưu/nhập.

**Giai đoạn 2 — Thuế**
Cấu hình chính sách, doanh thu theo nhóm ngành, tính GTGT/TNCN hai phương án,
ngưỡng, giảm 30%, bảng tính in được, nhật ký hạn nộp, dự báo.

**Giai đoạn 3 — Sổ sách & tuân thủ**
Bộ sổ, bảng kê tồn kho, khóa sổ, hóa đơn điện tử, giấy phép, nhắc việc.

**Giai đoạn 4 — Báo cáo, nhiều hộ, hoàn thiện**
Báo cáo phân tích, gộp nhiều hộ, nhật ký thao tác, mật khẩu, hướng dẫn trong app,
tối ưu in ấn.

Mỗi giai đoạn đều có bản chạy được và được thử thật trên máy trước khi sang giai
đoạn sau.

---

## 10. Giới hạn & rủi ro (nói rõ ngay từ đầu)

1. **Không phát hành hóa đơn điện tử**: việc cấp hóa đơn điện tử phải qua nhà
   cung cấp được cơ quan thuế chấp nhận; phần mềm chỉ ghi nhận và nhắc.
2. **Không nộp tờ khai thay**: phần mềm xuất số liệu để người dùng kê khai trên
   kênh chính thức.
3. **Con số pháp lý có thể thay đổi**: ngưỡng 1 tỷ và biểu tỷ lệ 2026 lấy từ
   nguồn thứ cấp; trước khi dùng chính thức nên đối chiếu toàn văn NĐ 68/2026 và
   NĐ 141/2026. Vì vậy mọi tham số nằm ở màn hình cấu hình, không nằm trong mã.
4. **Dữ liệu trong trình duyệt có thể mất** nếu người dùng xóa dữ liệu trang
   web hoặc đổi máy → phải nhắc sao lưu và kiểm tra tệp sao lưu khi nhập lại.
5. **Số liệu chỉ đúng khi nhập đúng**: phần mềm có kiểm tra chéo (doanh thu bán
   hàng so với sổ quỹ, tồn kho so với kiểm kê) và cảnh báo chỗ lệch.