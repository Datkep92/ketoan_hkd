'use strict';

/* ============================================================
   actions.js — mọi thao tác của người dùng: biểu mẫu, bấm nút,
   nhập liệu, phím tắt và khởi động. Dùng chung core.js + views.js.
   ============================================================ */

/* ---------------------------- biểu mẫu trong cửa sổ ---------------------------- */
function productForm(p){
  p = p || {};
  const h = hh();
  return '<h2>' + (p.id ? 'Sửa hàng hóa' : 'Thêm hàng hóa') + '</h2>'
    + '<label class="f"><span>Tên hàng *</span><input type="text" id="gName" value="' + esc(p.name || '') + '"></label>'
    + '<div class="grid2">'
    + '<label class="f"><span>Đơn vị tính</span><input type="text" id="gUnit" value="' + esc(p.unit || '') + '" placeholder="cái, kg, ly..."></label>'
    + '<label class="f"><span>Nhóm thuế</span><select id="gGroup">' + GROUPS.map(g =>
        '<option value="' + g.k + '"' + ((p.group || (h && h.group) || 'goods') === g.k ? ' selected' : '') + '>' + esc(g.n) + '</option>').join('') + '</select></label>'
    + '</div><div class="grid2">'
    + '<label class="f"><span>Giá bán</span><input type="number" inputmode="numeric" id="gPrice" value="' + n0(p.price || 0) + '"></label>'
    + '<label class="f"><span>Giá vốn</span><input type="number" inputmode="numeric" id="gCost" value="' + n0(p.cost || 0) + '"></label>'
    + '</div><div class="grid2">'
    + '<label class="f"><span>Tồn kho hiện tại</span><input type="number" inputmode="numeric" id="gStock" value="' + n0(p.stock || 0) + '"></label>'
    + '<label class="f"><span>Tồn tối thiểu (cảnh báo)</span><input type="number" inputmode="numeric" id="gMinStock" value="' + n0(p.minStock || 0) + '"></label>'
    + '</div>'
    + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="saveProduct" data-id="' + esc(p.id || '') + '">Lưu</button> '
    + '<button class="btn" data-act="closeSheet">Hủy</button>'
    + (p.id ? ' <button class="btn danger" data-act="delProduct" data-id="' + esc(p.id) + '">Xóa hàng</button>' : '')
    + '</div>';
}

function customerForm(c){
  c = c || {};
  return '<h2>' + (c.id ? 'Sửa khách hàng' : 'Thêm khách hàng') + '</h2>'
    + '<label class="f"><span>Tên khách *</span><input type="text" id="kName" value="' + esc(c.name || '') + '"></label>'
    + '<label class="f"><span>Điện thoại</span><input type="text" inputmode="tel" id="kPhone" value="' + esc(c.phone || '') + '"></label>'
    + '<label class="f"><span>Công nợ hiện tại (đồng)</span><input type="number" inputmode="numeric" id="kDebt" value="' + n0(c.debt || 0) + '"></label>'
    + '<input type="hidden" id="kId" value="' + esc(c.id || '') + '">'
    + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="saveCust">Lưu</button> '
    + '<button class="btn" data-act="closeSheet">Hủy</button></div>';
}

function expenseForm(e){
  e = e || {};
  return '<h2>' + (e.id ? 'Sửa chi phí' : 'Thêm chi phí') + '</h2>'
    + '<label class="f"><span>Nội dung *</span><input type="text" id="eName" value="' + esc(e.name || '') + '" placeholder="mặt bằng, điện nước, lương..."></label>'
    + '<div class="grid2">'
    + '<label class="f"><span>Số tiền</span><input type="number" inputmode="numeric" id="eAmount" value="' + n0(e.amount || 0) + '"></label>'
    + '<label class="f"><span>Ngày</span><input type="date" id="eDate" value="' + esc(e.date || todayISO()) + '"></label>'
    + '</div>'
    + '<label class="f"><span>Ghi chú</span><input type="text" id="eNote" value="' + esc(e.note || '') + '"></label>'
    + '<input type="hidden" id="eId" value="' + esc(e.id || '') + '">'
    + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="saveExpense">Lưu</button> '
    + '<button class="btn" data-act="closeSheet">Hủy</button></div>';
}

function paymentForm(c){
  const list = custs();
  return '<h2>Thu nợ</h2>'
    + '<label class="f"><span>Khách hàng *</span><select id="dCustomer">' + list.map(x =>
        '<option value="' + esc(x.id) + '"' + (c && x.id === c.id ? ' selected' : '') + '>' + esc(x.name) + ' · nợ ' + money(x.debt || 0) + '</option>').join('') + '</select></label>'
    + '<div class="grid2">'
    + '<label class="f"><span>Số tiền thu</span><input type="number" inputmode="numeric" id="dAmount" value="' + n0(c ? c.debt : 0) + '"></label>'
    + '<label class="f"><span>Ngày</span><input type="date" id="dDate" value="' + todayISO() + '"></label>'
    + '</div>'
    + (list.length ? '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="savePayment">Lưu</button> '
        + '<button class="btn" data-act="closeSheet">Hủy</button></div>'
      : '<p class="muted small">Chưa có khách hàng để thu nợ.</p>');
}

function supplierForm(s){
  s = s || {};
  return '<h2>' + (s.id ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp') + '</h2>'
    + '<label class="f"><span>Tên nhà cung cấp *</span><input type="text" id="sName" value="' + esc(s.name || '') + '"></label>'
    + '<div class="grid2">'
    + '<label class="f"><span>Điện thoại</span><input type="text" inputmode="tel" id="sPhone" value="' + esc(s.phone || '') + '"></label>'
    + '<label class="f"><span>Địa chỉ</span><input type="text" id="sAddress" value="' + esc(s.address || '') + '"></label></div>'
    + '<label class="f"><span>Công nợ hiện tại (đồng)</span><input type="number" inputmode="numeric" id="sDebt" value="' + n0(s.debt || 0) + '"></label>'
    + '<input type="hidden" id="sId" value="' + esc(s.id || '') + '">'
    + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="saveSupplier">Lưu</button> '
    + '<button class="btn" data-act="closeSheet">Hủy</button></div>';
}

function supplierPayForm(s){
  return '<h2>Trả nợ nhà cung cấp</h2>'
    + '<p class="muted small">' + esc(s.name || '') + ' · còn nợ ' + money(s.debt || 0) + '</p>'
    + '<div class="grid2">'
    + '<label class="f"><span>Số tiền trả</span><input type="number" inputmode="numeric" id="spAmount" value="' + n0(s.debt || 0) + '"></label>'
    + '<label class="f"><span>Ngày</span><input type="date" id="spDate" value="' + todayISO() + '"></label></div>'
    + '<label class="f"><span>Ghi chú</span><input type="text" id="spNote" placeholder="số biên lai, chuyển khoản..."></label>'
    + '<input type="hidden" id="spId" value="' + esc(s.id || '') + '">'
    + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="doPaySupplier">Lưu</button> '
    + '<button class="btn" data-act="closeSheet">Hủy</button></div>';
}

function purchaseForm(){
  const names = prods().map(p => p.name || '').filter(Boolean);
  const supNames = sups().map(s => s.name || '').filter(Boolean);
  let rows = '';
  for (let i = 0; i < 5; i++){
    rows += '<tr><td><input type="text" id="plName' + i + '" list="purProds" placeholder="Tên hàng"></td>'
      + '<td><input type="number" inputmode="numeric" id="plQty' + i + '" value="1" min="0"></td>'
      + '<td><input type="number" inputmode="numeric" id="plPrice' + i + '" placeholder="Đơn giá"></td></tr>';
  }
  return '<h2>Phiếu nhập hàng</h2>'
    + '<div class="grid2">'
    + '<label class="f"><span>Nhà cung cấp</span><input type="text" id="purSupplier" list="purSupList" placeholder="Tên nhà cung cấp"></label>'
    + '<label class="f"><span>Ngày nhập</span><input type="date" id="purDate" value="' + todayISO() + '"></label></div>'
    + '<datalist id="purSupList">' + supNames.map(n => '<option value="' + esc(n) + '"></option>').join('') + '</datalist>'
    + '<datalist id="purProds">' + names.map(n => '<option value="' + esc(n) + '"></option>').join('') + '</datalist>'
    + '<div class="grid2"><label class="f"><span>Thanh toán</span><select id="purPay">'
    + '<option value="cash">Tiền mặt</option><option value="bank">Chuyển khoản</option>'
    + '<option value="debt">Ghi nợ nhà cung cấp</option></select></label>'
    + '<label class="f"><span>Ghi chú</span><input type="text" id="purNote" placeholder="Không bắt buộc"></label></div>'
    + '<h3 style="margin:14px 0 6px">Hàng nhập</h3>'
    + '<div class="tablewrap"><table class="tbl"><tr><th>Tên hàng</th><th style="width:80px">SL</th><th style="width:130px">Đơn giá</th></tr>'
    + rows + '</table></div>'
    + '<p class="muted small">Tồn và giá vốn sẽ được cập nhật theo giá vốn bình quân. '
    + 'Mặt hàng chưa có sẽ được thêm tự động.</p>'
    + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="savePurchase">Lưu phiếu nhập</button> '
    + '<button class="btn" data-act="closeSheet">Hủy</button></div>';
}

function stockAdjustForm(p){
  return '<h2>Kiểm kê tồn kho</h2>'
    + '<p class="muted small">' + esc(p.name || '') + ' · tồn hiện tại ' + fmt(p.stock) + ' ' + esc(p.unit || '') + '</p>'
    + '<div class="grid2">'
    + '<label class="f"><span>Tồn thực tế sau kiểm kê</span><input type="number" inputmode="numeric" id="adjStock" value="' + n0(p.stock) + '"></label>'
    + '<label class="f"><span>Ngày</span><input type="date" id="adjDate" value="' + todayISO() + '"></label></div>'
    + '<label class="f"><span>Lý do</span><input type="text" id="adjReason" placeholder="kiểm kê, hư hỏng, trả lại..."></label>'
    + '<input type="hidden" id="adjId" value="' + esc(p.id || '') + '">'
    + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="saveStockAdj">Lưu</button> '
    + '<button class="btn" data-act="closeSheet">Hủy</button></div>';
}

function bridgeOut(text, ok){
  const box = $('#bridgeOut');
  if (box) box.innerHTML = '<pre class="' + (ok ? 'ok' : 'warn') + '">' + esc(text) + '</pre>';
}

function printPurchase(p){
  const rows = (p.lines || []).map(l =>
    '<tr><td>' + esc(l.name) + '</td><td class="r">' + fmt(l.qty) + '</td>'
    + '<td class="r num">' + money(l.price) + '</td><td class="r num">' + money(n0(l.qty) * n0(l.price)) + '</td></tr>').join('');
  printHtml(docHead('PHIẾU NHẬP HÀNG', 'Số: ' + esc(p.code || '') + ' · Ngày: ' + dmy(p.date))
    + '<div class="small">Nhà cung cấp: ' + esc(p.supplier || '') + '</div>'
    + '<table><tr><th>Hàng hóa</th><th class="r">SL</th><th class="r">Đơn giá</th><th class="r">Thành tiền</th></tr>' + rows
    + '<tr><th colspan="3">Cộng tiền hàng</th><th class="r num">' + money(p.subtotal) + '</th></tr>'
    + (p.discount ? '<tr><td colspan="3">Giảm trừ</td><td class="r num">-' + money(p.discount) + '</td></tr>' : '')
    + '<tr><th colspan="3">Phải trả nhà cung cấp</th><th class="r num">' + money(p.total) + '</th></tr></table>'
    + '<div class="small">Thanh toán: ' + payLabel(p.pay) + (p.note ? ' · Ghi chú: ' + esc(p.note) : '') + '</div>'
    + docFoot());
}

function printBookSheet(k){
  const b = bookRows(k, S.bookMonth);
  const head = '<tr>' + b.head.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr>';
  const rows = b.rows.map(r => '<tr>' + r.map(v => '<td>' + esc(v) + '</td>').join('') + '</tr>').join('');
  printHtml(docHead(b.title, 'Lập từ dữ liệu đã ghi trong phần mềm')
    + '<table>' + head + rows + '</table>'
    + '<div class="small">Sổ theo dõi nội bộ; số liệu cần đối chiếu trước khi quyết toán thuế. '
    + 'Không thay thế hóa đơn điện tử hay tờ khai chính thức.</div>' + docFoot());
}

/* ---------------------------- in ấn ---------------------------- */
function printInvoice(inv){
  const h = hh() || {};
  const rows = (inv.lines || []).map(l =>
    '<tr><td>' + esc(l.name) + '</td><td class="r">' + fmt(l.qty) + '</td>'
    + '<td class="r num">' + money(l.price) + '</td><td class="r num">' + money(l.qty * l.price) + '</td></tr>').join('');
  const pay = inv.pay === 'debt' ? 'Ghi nợ' : inv.pay === 'bank' ? 'Chuyển khoản' : 'Tiền mặt';
  printHtml(docHead('PHIẾU BÁN HÀNG', 'Số: ' + esc(inv.code) + ' · Ngày: ' + dmy(inv.date))
    + '<div class="small">Khách hàng: ' + esc(inv.customer || 'Khách lẻ') + '</div>'
    + '<table><tr><th>Hàng hóa</th><th class="r">SL</th><th class="r">Đơn giá</th><th class="r">Thành tiền</th></tr>' + rows
    + '<tr><th colspan="3">Cộng tiền hàng</th><th class="r num">' + money(inv.subtotal) + '</th></tr>'
    + (inv.discount ? '<tr><td colspan="3">Chiết khấu</td><td class="r num">-' + money(inv.discount) + '</td></tr>' : '')
    + '<tr><th colspan="3">Khách phải trả</th><th class="r num">' + money(inv.total) + '</th></tr></table>'
    + '<div class="small">Thu bằng: ' + pay + (inv.note ? ' · Ghi chú: ' + esc(inv.note) : '')
    + '<br>Phiếu này không thay thế hóa đơn điện tử.</div>'
    + docFoot());
}

function printBook(){
  const m = S.bookMonth, y = Number(m.slice(0, 4)), mo = Number(m.slice(5));
  const from = m + '-01', to = m + '-' + daysInMonth(y, mo);
  const by = revByGroup(from, to);
  const rows = GROUPS.filter(g => by[g.k] > 0).map(g =>
    '<tr><td>' + esc(g.n) + '</td><td class="r num">' + money(by[g.k]) + '</td></tr>').join('');
  printHtml(docHead('BẢNG KÊ DOANH THU THEO NHÓM NGÀNH', 'Kỳ: tháng ' + mo + '/' + y)
    + '<table><tr><th>Nhóm ngành</th><th class="r">Doanh thu</th></tr>' + rows
    + '<tr><th>Tổng cộng</th><th class="r num">' + money(sum(Object.values(by))) + '</th></tr></table>'
    + '<div class="small">Người lập bảng kê cam đoan số liệu trên là đúng.</div>' + docFoot());
}

function printExpense(e){
  printHtml(docHead('PHIẾU CHI PHÍ', 'Ngày: ' + dmy(e.date))
    + '<table><tr><th>Nội dung</th><th class="r">Số tiền</th></tr>'
    + '<tr><td>' + esc(e.name) + '</td><td class="r num">' + money(e.amount) + '</td></tr></table>'
    + (e.note ? '<div class="small">Ghi chú: ' + esc(e.note) + '</div>' : '') + docFoot());
}

function printTax(){
  const r = taxCalc(S.hid, S.taxYear, S.taxMonth);
  const per = r.isYear ? 'Cả năm ' + S.taxYear : 'Tháng ' + S.taxMonth + '/' + S.taxYear;
  printHtml(docHead('TƯ VẤN THUẾ', 'Kỳ: ' + per)
    + '<table><tr><th>Chỉ tiêu</th><th class="r">Số tiền</th></tr>'
    + '<tr><td>Doanh thu kỳ</td><td class="r num">' + money(r.revPeriod) + '</td></tr>'
    + '<tr><td>Doanh thu lũy kế năm</td><td class="r num">' + money(r.revYear) + '</td></tr>'
    + '<tr><td>Chi phí trong năm</td><td class="r num">' + money(r.expYear) + '</td></tr>'
    + '<tr><td>Thuế GTGT</td><td class="r num">' + money(r.vat) + '</td></tr>'
    + '<tr><td>Thuế TNCN cách A</td><td class="r num">' + money(r.tncnA) + '</td></tr>'
    + '<tr><td>Thuế TNCN cách B</td><td class="r num">' + money(r.tncnB) + '</td></tr>'
    + '<tr><th>Tổng theo cách A</th><th class="r num">' + money(r.totalA) + '</th></tr>'
    + '<tr><th>Tổng theo cách B</th><th class="r num">' + money(r.totalB) + '</th></tr>'
    + '<tr><td>Đã nộp</td><td class="r num">' + money(r.paid) + '</td></tr></table>'
    + '<div class="small">Số liệu lập từ phiếu bán ghi trong phần mềm, là ước tính tham khảo. '
    + 'Không thay thế hóa đơn điện tử hay tờ khai chính thức.</div>' + docFoot());
}

/* ---------------------------- bấm nút ---------------------------- */
document.addEventListener('click', (e) => {
  if (e.target.id === 'sheet'){ closeSheet(); return; }
  const t = e.target.closest('[data-act]');
  if (!t){
    const tab = e.target.closest('[data-route]');
    if (tab && tab.dataset && tab.dataset.route) go(tab.dataset.route);
    return;
  }
  const act = t.dataset.act, id = t.dataset.id;

  switch (act){
    case 'route': go(t.dataset.route); break;
    case 'closeSheet': closeSheet(); break;
    case 'help': go('help'); break;

    case 'preset': {
      const target = !S.data.settings.onboarded ? $('#setThreshold') : $('#pThreshold');
      if (target) target.value = t.dataset.v;
      break;
    }

    case 'doSetup': {
      S.data.policy = Object.assign(JSON.parse(JSON.stringify(DEFAULT_POLICY)), {
        threshold: numv('setThreshold'), period: val('setPeriod') || 'month'
      });
      const h = {
        id: uid(), name: val('setName') || 'Hộ kinh doanh của tôi', taxCode: val('setTax'),
        owner: '', address: '', group: val('setGroup') || 'goods',
        color: PALETTE[0], startDate: todayISO()
      };
      S.data.households.push(h);
      S.hid = h.id;
      S.data.settings.onboarded = true;
      saveAll(); go('home'); toast('Đã cài đặt xong');
      break;
    }

    /* hộ kinh doanh */
    case 'switchHH': {
      const list = hhs();
      sheet('<h2>Chọn hộ kinh doanh</h2>'
        + (list.length ? '<div class="list">' + list.map(h =>
            '<button class="li' + (h.id === S.hid ? ' sel' : '') + '" data-act="pickHH" data-id="' + esc(h.id) + '">'
            + '<span class="dot" style="background:' + esc(h.color || PALETTE[0]) + '"></span>'
            + '<div class="main"><div class="name">' + esc(h.name) + '</div>'
            + '<div class="sub">' + esc(h.taxCode || 'chưa có MST') + '</div></div>'
            + (h.id === S.hid ? '<span class="muted">đang dùng</span>' : '') + '</button>').join('') + '</div>'
        : '<p class="muted">Chưa có hộ kinh doanh nào.</p>')
        + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="addHH">＋ Thêm hộ</button> '
        + '<button class="btn" data-act="closeSheet">Đóng</button></div>');
      break;
    }
    case 'pickHH': S.hid = id; S.cart = []; saveAll(); closeSheet(); render(); break;
    case 'addHH': closeSheet(); sheet(hhForm(null)); break;
    case 'saveHH': {
      const name = val('hhNameInput');
      if (!name){ toast('Cần nhập tên hộ'); break; }
      const data = {
        name, taxCode: val('hhTax'), owner: val('hhOwner'), address: val('hhAddress'),
        group: val('hhGroup') || 'goods', color: val('hhColor') || PALETTE[hhs().length % PALETTE.length]
      };
      const hid = val('hhId');
      if (hid){
        const h = hhs().find(x => x.id === hid);
        if (h) Object.assign(h, data);
      } else {
        const h = Object.assign({ id: uid(), startDate: todayISO() }, data);
        hhs().push(h); S.hid = h.id;
      }
      S.data.settings.onboarded = true;
      saveAll(); closeSheet(); render(); toast('Đã lưu hồ sơ hộ');
      break;
    }
    case 'delHH': {
      if (!confirm('Xóa hộ này cùng toàn bộ dữ liệu của hộ? Không khôi phục được.')) break;
      const total = hhs().length;
      S.data.households = hhs().filter(x => x.id !== id);
      ['products','invoices','customers','expenses','payments','taxpay',
       'suppliers','purchases','supplierPayments','stockAdj'].forEach(k => {
        S.data[k] = S.data[k].filter(x => x.hid !== id);
      });
      if (S.hid === id) S.hid = hhs().length ? hhs()[0].id : null;
      S.cart = [];
      saveAll(); closeSheet(); go(S.hid ? 'home' : 'setup'); toast('Đã xóa hộ');
      break;
    }

    /* hàng hóa */
    case 'addProduct': sheet(productForm(null)); break;
    case 'editProduct': {
      const p = S.data.products.find(x => x.id === id);
      if (p) sheet(productForm(p));
      break;
    }
    case 'saveProduct': {
      const name = val('gName');
      if (!name){ toast('Cần nhập tên hàng'); break; }
      const data = {
        name, unit: val('gUnit'), group: val('gGroup') || 'goods',
        price: numv('gPrice'), cost: numv('gCost'), stock: numv('gStock'),
        minStock: numv('gMinStock')
      };
      if (id){
        const p = S.data.products.find(x => x.id === id);
        if (p) Object.assign(p, data);
      } else {
        S.data.products.push(Object.assign({ id: uid(), hid: S.hid }, data));
      }
      saveAll(); closeSheet(); render(); toast('Đã lưu hàng hóa');
      break;
    }
    case 'delProduct': {
      if (!confirm('Xóa mặt hàng này?')) break;
      S.data.products = S.data.products.filter(x => x.id !== id);
      saveAll(); closeSheet(); render();
      break;
    }

    /* giỏ hàng và bán hàng */
    case 'add': {
      const p = S.data.products.find(x => x.id === id);
      if (!p) break;
      const line = S.cart.find(l => l.pid === p.id);
      if (line) line.qty++;
      else S.cart.push({ pid:p.id, name:p.name, price:n0(p.price), qty:1, group:p.group || 'goods', unit:p.unit || '' });
      render();
      break;
    }
    case 'inc': { if (S.cart[Number(t.dataset.i)]) S.cart[Number(t.dataset.i)].qty++; render(); break; }
    case 'dec': {
      const i = Number(t.dataset.i);
      if (S.cart[i] && --S.cart[i].qty <= 0) S.cart.splice(i, 1);
      render();
      break;
    }
    case 'del': { S.cart.splice(Number(t.dataset.i), 1); render(); break; }

    case 'saveInvoice': {
      if (!S.cart.length){ toast('Giỏ hàng đang trống'); break; }
      const subtotal = sum(S.cart.map(l => l.qty * l.price));
      const discount = Math.min(Math.max(0, numv('discount')), subtotal);
      const pay = val('payMethod') || 'cash';
      const name = val('custName');
      const cust = name ? custs().find(c => (c.name || '').toLowerCase() === name.toLowerCase()) : null;
      if (pay === 'debt' && !cust){ toast('Ghi nợ cần chọn khách hàng có trong danh sách'); break; }
      const inv = {
        id: uid(), hid: S.hid, code: 'HD' + String(invs().length + 1).padStart(3, '0'),
        date: todayISO(),
        lines: S.cart.map(l => ({ pid:l.pid, name:l.name, qty:l.qty, price:l.price, group:l.group })),
        subtotal, discount, total: subtotal - discount, pay,
        customer: cust ? cust.name : name, customerId: cust ? cust.id : '', note: val('note')
      };
      S.data.invoices.push(inv);
      applySale(inv);
      saveAll();
      S.cart = [];
      render(); printInvoice(inv); toast('Đã lưu phiếu ' + inv.code);
      break;
    }
    case 'printInvoice': {
      const inv = S.data.invoices.find(x => x.id === id);
      if (inv) printInvoice(inv);
      break;
    }
    case 'delInvoice': {
      const inv = S.data.invoices.find(x => x.id === id);
      if (!inv) break;
      if (!confirm('Xóa phiếu ' + inv.code + '? Tồn kho và công nợ sẽ được trả lại.')) break;
      inv.lines.forEach(l => {
        const p = S.data.products.find(x => x.id === l.pid);
        if (p && p.stock != null) p.stock = n0(p.stock) + l.qty;
      });
      if (inv.pay === 'debt' && inv.customerId){
        const c = S.data.customers.find(x => x.id === inv.customerId);
        if (c) c.debt = Math.max(0, n0(c.debt) - inv.total);
      }
      S.data.invoices = S.data.invoices.filter(x => x.id !== id);
      saveAll(); render(); toast('Đã xóa phiếu');
      break;
    }
    case 'exportBook': {
      const m = S.bookMonth;
      const list = invs().filter(i => i.date.slice(0, 7) === m);
      const rows = [['Ngày','Khách hàng','Hình thức','Thành tiền']].concat(
        list.map(i => [dmy(i.date), i.customer || 'Khách lẻ', i.pay || 'cash', i.total])
      );
      const csv = '\ufeff' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
      downloadText('sach-' + m + '.csv', csv, 'text/csv;charset=utf-8');
      toast('Đã xuất tệp CSV tháng ' + m);
      break;
    }
    case 'printBook': printBook(); break;
    case 'bookInfo': {
      const b = BOOKS.find(x => x.k === id);
      if (!b) break;
      const d = bookRows(b.k, S.bookMonth);
      sheet('<h2>' + esc(b.code + ' — ' + b.name) + '</h2>'
        + '<p class="muted small">' + esc(b.sub) + ' · tháng ' + esc(S.bookMonth) + ' · '
        + fmt(d.rows.length) + ' dòng</p>'
        + '<div class="tablewrap"><table class="tbl"><tr>' + d.head.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr>'
        + d.rows.slice(0, 10).map(r => '<tr>' + r.map(v => '<td>' + esc(v) + '</td>').join('') + '</tr>').join('')
        + '</table></div>'
        + (d.rows.length > 10 ? '<p class="muted small">Xem trước 10 dòng đầu.</p>' : '')
        + '<div class="row" style="margin-top:12px">'
        + '<button class="btn primary" data-act="bookPrint" data-id="' + b.k + '">In sổ</button> '
        + '<button class="btn" data-act="bookExport" data-id="' + b.k + '">Xuất Excel</button> '
        + '<button class="btn" data-act="closeSheet">Đóng</button></div>');
      break;
    }
    case 'bookPrint': printBookSheet(id); break;
    case 'bookExport': {
      const b = BOOKS.find(x => x.k === id);
      if (!b) break;
      const d = bookRows(b.k, S.bookMonth);
      downloadText('so-' + b.k + '-' + S.bookMonth + '.xml', excelSheet(d.title, d.head, d.rows),
        'application/vnd.ms-excel;charset=utf-8');
      toast('Đã xuất sổ ' + b.code);
      break;
    }

    /* mua hàng và nhà cung cấp */
    case 'saveCashStart': {
      S.data.settings.cashStart = Math.max(0, numv('cashStart'));
      saveAll(); render(); toast('Đã lưu số dư quỹ đầu kỳ');
      break;
    }
    case 'addPurchase': sheet(purchaseForm()); break;
    case 'savePurchase': {
      const lines = [];
      for (let i = 0; i < 5; i++){
        const name = val('plName' + i);
        if (!name) continue;
        const qty = Math.max(0, numv('plQty' + i) || 1);
        const known = prods().find(x => (x.name || '').toLowerCase() === name.toLowerCase()) || {};
        const price = numv('plPrice' + i) || n0(known.cost);
        if (qty > 0 && price > 0) lines.push({ pid:'', name, qty, price, group:known.group || 'goods' });
      }
      if (!lines.length){ toast('Cần ít nhất một dòng hàng có tên và đơn giá'); break; }
      const nm = val('purSupplier').trim();
      let s = nm ? sups().find(x => (x.name || '').toLowerCase() === nm.toLowerCase()) : null;
      if (!s && nm){
        s = { id:uid(), hid:S.hid, name:nm, phone:'', address:'', debt:0 };
        S.data.suppliers.push(s);
      }
      const subtotal = sum(lines.map(l => l.qty * l.price));
      const p = { id:uid(), hid:S.hid, code:purCode(), date:val('purDate') || todayISO(),
        supplierId:s ? s.id : '', supplier:s ? s.name : nm, lines, subtotal, discount:0,
        total:subtotal, pay:val('purPay') || 'cash', note:val('purNote') };
      S.data.purchases.push(p);
      applyPurchase(p);
      saveAll(); closeSheet(); render(); toast('Đã lưu phiếu nhập ' + p.code);
      break;
    }
    case 'printPurchase': {
      const p = purs().find(x => x.id === id);
      if (p) printPurchase(p);
      break;
    }
    case 'returnPurchase': {
      const p = purs().find(x => x.id === id);
      if (!p || p.returned) break;
      if (!confirm('Trả hàng phiếu ' + p.code + '? Tồn và công nợ sẽ được hoàn lại.')) break;
      undoPurchase(p);
      p.returned = true;
      saveAll(); render(); toast('Đã đánh dấu trả hàng phiếu ' + p.code);
      break;
    }
    case 'delPurchase': {
      const p = purs().find(x => x.id === id);
      if (!p) break;
      if (!confirm('Xóa phiếu nhập ' + p.code + '? Tồn và công nợ sẽ được hoàn lại.')) break;
      undoPurchase(p);
      S.data.purchases = S.data.purchases.filter(x => x.id !== id);
      saveAll(); render(); toast('Đã xóa phiếu nhập');
      break;
    }
    case 'addSupplier': sheet(supplierForm(null)); break;
    case 'editSupplier': {
      const s = sups().find(x => x.id === id);
      if (s) sheet(supplierForm(s));
      break;
    }
    case 'saveSupplier': {
      const name = val('sName');
      if (!name){ toast('Cần nhập tên nhà cung cấp'); break; }
      const data = { name, phone:val('sPhone'), address:val('sAddress'), debt:numv('sDebt') };
      const sid = val('sId');
      if (sid){
        const s = sups().find(x => x.id === sid);
        if (s) Object.assign(s, data);
      } else {
        S.data.suppliers.push(Object.assign({ id:uid(), hid:S.hid }, data));
      }
      saveAll(); closeSheet(); render(); toast('Đã lưu nhà cung cấp');
      break;
    }
    case 'delSupplier': {
      if (!confirm('Xóa nhà cung cấp này? Các phiếu nhập cũ vẫn giữ tên.')) break;
      S.data.suppliers = S.data.suppliers.filter(x => x.id !== id);
      saveAll(); closeSheet(); render();
      break;
    }
    case 'paySupplier': {
      const s = sups().find(x => x.id === id);
      if (s) sheet(supplierPayForm(s));
      break;
    }
    case 'doPaySupplier': {
      const s = sups().find(x => x.id === val('spId'));
      if (!s){ toast('Cần chọn nhà cung cấp'); break; }
      const amt = Math.min(Math.max(0, numv('spAmount')), n0(s.debt));
      if (amt <= 0){ toast('Số tiền không hợp lệ'); break; }
      s.debt = n0(s.debt) - amt;
      S.data.supplierPayments.push({ id:uid(), hid:S.hid, supplierId:s.id, supplier:s.name,
        amount:amt, date:val('spDate') || todayISO(), note:val('spNote') });
      saveAll(); closeSheet(); render(); toast('Đã trả ' + money(amt));
      break;
    }

    /* kiểm kê tồn kho */
    case 'stockAdjust': {
      const p = prods().find(x => x.id === id);
      if (p) sheet(stockAdjustForm(p));
      break;
    }
    case 'saveStockAdj': {
      const p = prods().find(x => x.id === val('adjId'));
      if (!p){ toast('Cần chọn hàng hóa'); break; }
      const now = Math.max(0, numv('adjStock')), delta = now - n0(p.stock);
      p.stock = now;
      S.data.stockAdj.push({ id:uid(), hid:S.hid, productId:p.id, product:p.name,
        delta, reason:val('adjReason'), date:val('adjDate') || todayISO() });
      saveAll(); closeSheet(); render(); toast('Đã kiểm kê tồn kho');
      break;
    }
    case 'delStockAdj': {
      const a = S.data.stockAdj.find(x => x.id === id);
      if (!a) break;
      if (!confirm('Bỏ lần kiểm kê này? Tồn sẽ được trả về số cũ.')) break;
      const p = S.data.products.find(x => x.id === a.productId);
      if (p) p.stock = Math.max(0, n0(p.stock) - n0(a.delta));
      S.data.stockAdj = S.data.stockAdj.filter(x => x.id !== id);
      saveAll(); render();
      break;
    }

    /* cổng dữ liệu hóa đơn */
    case 'bridgeSampleSale': {
      const f = $('#bridgeInput');
      if (f) f.value = JSON.stringify(Bridge.sample('sale'), null, 1);
      bridgeOut('Đã điền mẫu hóa đơn bán ra. Nhấn Kiểm tra trước khi nạp.', true);
      break;
    }
    case 'bridgeSamplePur': {
      const f = $('#bridgeInput');
      if (f) f.value = JSON.stringify(Bridge.sample('purchase'), null, 1);
      bridgeOut('Đã điền mẫu hóa đơn mua vào. Nhấn Kiểm tra trước khi nạp.', true);
      break;
    }
    case 'bridgePreview': {
      try {
        const p = Bridge.parse(val('bridgeInput')), list = p.batch || [p.one];
        const msg = list.map((x, i) => (i + 1) + '. ' + (x.kind === 'purchase' ? 'Mua' : 'Bán')
          + ' ' + x.code + ' · ' + x.date + ' · ' + x.partner + ' · '
          + x.lines.length + ' dòng · ' + money(x.total)).join('\n');
        bridgeOut(msg, true);
      } catch (err){ bridgeOut('Dữ liệu chưa đúng: ' + err.message, false); }
      break;
    }
    case 'bridgeImport': {
      const text = val('bridgeInput');
      try {
        const p = Bridge.parse(text), list = p.batch || [p.one];
        const dup = list.find(x => (x.kind === 'purchase' ? purs() : invs())
          .some(y => y.code === x.code));
        if (dup) throw new Error('mã chứng từ ' + dup.code + ' đã tồn tại');
        if (!confirm('Nạp ' + fmt(list.length) + ' chứng từ vào hộ này?')) break;
        Bridge.importData(text);
        render();
        const f = $('#bridgeInput'); if (f) f.value = text;
        bridgeOut('Đã nạp ' + fmt(list.length) + ' chứng từ. Kiểm lại tồn kho và công nợ.', true);
        toast('Đã nạp dữ liệu hóa đơn');
      } catch (err){ bridgeOut('Không nạp được: ' + err.message, false); }
      break;
    }
    case 'bridgeExportJson': {
      const kind = val('bridgeKind') || 'sale';
      const o = Bridge.exportData(kind);
      downloadText('hoadon-' + kind + '-' + todayISO() + '.json', JSON.stringify(o, null, 1));
      toast('Đã xuất ' + fmt(o.invoices.length) + ' chứng từ ra JSON');
      break;
    }
    case 'bridgeExportXml': {
      const kind = val('bridgeKind') || 'sale';
      const o = Bridge.exportData(kind);
      const xml = '<invoices>' + o.invoices.map(x => Bridge.toXML(x)).join('') + '</invoices>';
      downloadText('hoadon-' + kind + '-' + todayISO() + '.xml', xml, 'application/xml;charset=utf-8');
      toast('Đã xuất ' + fmt(o.invoices.length) + ' chứng từ ra XML');
      break;
    }

    /* khách hàng */
    case 'addCust': sheet(customerForm(null)); break;
    case 'addCustomerFromSell': sheet(customerForm(null)); break;
    case 'editCust': {
      const c = S.data.customers.find(x => x.id === id);
      if (c) sheet(customerForm(c));
      break;
    }
    case 'saveCust': {
      const name = val('kName');
      if (!name){ toast('Cần nhập tên khách'); break; }
      const data = { name, phone:val('kPhone'), debt:numv('kDebt') };
      const cid = val('kId');
      if (cid){
        const c = S.data.customers.find(x => x.id === cid);
        if (c) Object.assign(c, data);
      } else {
        S.data.customers.push(Object.assign({ id:uid(), hid:S.hid }, data));
      }
      saveAll(); closeSheet(); render();
      if (S.route === 'sell'){ const f = $('#custName'); if (f) f.value = name; }
      toast('Đã lưu khách hàng');
      break;
    }
    case 'delCust': {
      if (!confirm('Xóa khách hàng này? Công nợ của khách sẽ bị bỏ qua.')) break;
      S.data.customers = S.data.customers.filter(x => x.id !== id);
      saveAll(); closeSheet(); render();
      break;
    }
    case 'payDebt': {
      const c = S.data.customers.find(x => x.id === id);
      if (c) sheet(paymentForm(c));
      break;
    }
    case 'addPayment': sheet(paymentForm(null)); break;
    case 'savePayment': {
      const c = S.data.customers.find(x => x.id === val('dCustomer'));
      if (!c){ toast('Cần chọn khách hàng'); break; }
      const amt = Math.min(Math.max(0, numv('dAmount')), n0(c.debt));
      if (amt <= 0){ toast('Số tiền không hợp lệ'); break; }
      c.debt = n0(c.debt) - amt;
      S.data.payments.push({ id:uid(), hid:S.hid, customerId:c.id, customer:c.name,
        amount:amt, date:val('dDate') || todayISO() });
      saveAll(); closeSheet(); render(); toast('Đã thu ' + money(amt));
      break;
    }
    case 'delPayment': {
      const p = S.data.payments.find(x => x.id === id);
      if (!p) break;
      if (!confirm('Xóa lần thu nợ này? Công nợ sẽ được cộng lại.')) break;
      const c = S.data.customers.find(x => x.id === p.customerId);
      if (c) c.debt = n0(c.debt) + p.amount;
      S.data.payments = S.data.payments.filter(x => x.id !== id);
      saveAll(); render();
      break;
    }

    /* chi phí */
    case 'addExpense': sheet(expenseForm(null)); break;
    case 'editExpense': {
      const e = S.data.expenses.find(x => x.id === id);
      if (e) sheet(expenseForm(e));
      break;
    }
    case 'saveExpense': {
      const name = val('eName');
      if (!name){ toast('Cần nhập nội dung chi phí'); break; }
      const amount = numv('eAmount');
      if (amount <= 0){ toast('Cần nhập số tiền'); break; }
      const data = { name, amount, date:val('eDate') || todayISO(), note:val('eNote') };
      const eid = val('eId');
      if (eid){
        const e = S.data.expenses.find(x => x.id === eid);
        if (e) Object.assign(e, data);
      } else {
        S.data.expenses.push(Object.assign({ id:uid(), hid:S.hid }, data));
      }
      saveAll(); closeSheet(); render(); toast('Đã lưu chi phí');
      break;
    }
    case 'delExpense': {
      if (!confirm('Xóa khoản chi phí này?')) break;
      S.data.expenses = S.data.expenses.filter(x => x.id !== id);
      saveAll(); render();
      break;
    }
    case 'printExpense': {
      const e = S.data.expenses.find(x => x.id === id);
      if (e) printExpense(e);
      break;
    }

    /* thuế */
    case 'printTax': printTax(); break;
    case 'saveTaxPay': {
      const r = taxCalc(S.hid, S.taxYear, S.taxMonth);
      sheet('<h2>Ghi nhận số đã nộp</h2>'
        + '<div class="card"><div class="muted small">Còn phải nộp theo cách A</div>'
        + '<b>' + money(Math.max(0, r.totalA - r.paid)) + '</b></div>'
        + '<label class="f"><span>Số tiền đã nộp</span><input type="number" inputmode="numeric" id="tAmount" value="' + Math.max(0, r.totalA - r.paid) + '"></label>'
        + '<div class="grid2"><label class="f"><span>Ngày nộp</span><input type="date" id="tDate" value="' + todayISO() + '"></label>'
        + '<label class="f"><span>Ghi chú</span><input type="text" id="tNote" placeholder="số biên lai..."></label></div>'
        + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="doSaveTaxPay">Lưu</button> '
        + '<button class="btn" data-act="closeSheet">Hủy</button></div>');
      break;
    }
    case 'doSaveTaxPay': {
      const amt = numv('tAmount');
      if (amt <= 0){ toast('Cần nhập số tiền'); break; }
      S.data.taxpay.push({ id:uid(), hid:S.hid, year:S.taxYear, month:S.taxMonth,
        amount:amt, date:val('tDate') || todayISO(), note:val('tNote') });
      saveAll(); closeSheet(); render(); toast('Đã ghi nhận số đã nộp');
      break;
    }

    /* chính sách thuế */
    case 'savePolicy': {
      const p = JSON.parse(JSON.stringify(DEFAULT_POLICY));
      Object.assign(p, S.data.policy || {});
      p.threshold = numv('pThreshold');
      p.period = val('pPeriod') || 'month';
      p.bracketBase = val('pBracketBase') || 'income';
      p.reduce30 = checked('pReduce30');
      p.reduceLimit = numv('pReduceLimit');
      p.reduceYears = val('pReduceYears').split(',').map(s => Number(s.trim())).filter(n => n > 0);
      GROUPS.forEach((g, i) => {
        p.vat[g.k] = Number(($('#pVat' + i) || {}).value || 0);
        p.tncn[g.k] = Number(($('#pTncn' + i) || {}).value || 0);
      });
      p.brackets = [
        { max:numv('pBracket1Max'), rate:Number(($('#pBracket1Rate') || {}).value || 0) },
        { max:numv('pBracket2Max'), rate:Number(($('#pBracket2Rate') || {}).value || 0) },
        { max:0, rate:Number(($('#pBracket3Rate') || {}).value || 0) }
      ];
      S.data.policy = p;
      saveAll(); render(); toast('Đã lưu chính sách thuế');
      break;
    }
    case 'resetPolicy': {
      if (!confirm('Khôi phục chính sách thuế về mặc định?')) break;
      S.data.policy = JSON.parse(JSON.stringify(DEFAULT_POLICY));
      saveAll(); render(); toast('Đã khôi phục mặc định');
      break;
    }

    /* sao lưu và nhập lại */
    case 'backup': {
      const text = JSON.stringify({ app:'quan-ly-hkd', version:1, exportedAt:new Date().toISOString(), data:S.data }, null, 1);
      downloadText('sao-luu-hkd-' + todayISO() + '.json', text);
      S.data.settings.backupAt = new Date().toISOString();
      saveAll(); render(); toast('Đã tạo tệp sao lưu — hãy cất vào nơi an toàn');
      break;
    }
    case 'restore': {
      sheet('<h2>Nhập dữ liệu đã sao lưu</h2>'
        + '<p class="muted small">Chọn tệp .json đã sao lưu. Dữ liệu hiện có sẽ bị thay thế sau khi xác nhận.</p>'
        + '<input type="file" id="restoreFile" accept=".json,application/json">'
        + '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="doRestore">Nhập</button> '
        + '<button class="btn" data-act="closeSheet">Hủy</button></div>');
      break;
    }
    case 'doRestore': {
      const f = $('#restoreFile');
      if (!f || !f.files || !f.files[0]){ toast('Chưa chọn tệp'); break; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result);
          const d = obj && obj.data ? obj.data : obj;
          if (!d || !Array.isArray(d.households)) throw new Error('bad file');
          if (!confirm('Thay thế toàn bộ dữ liệu hiện tại bằng dữ liệu trong tệp?')) return;
          S.data = Object.assign(S.data, d);
          S.hid = hhs().length ? hhs()[0].id : null;
          S.cart = [];
          saveAll(); closeSheet(); go(S.hid ? 'home' : 'setup'); toast('Đã nhập dữ liệu');
        } catch (err){ toast('Tệp không hợp lệ'); }
      };
      reader.readAsText(f.files[0]);
      break;
    }
  }
});

/* ---------------------------- nhập liệu ---------------------------- */
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'sellSearch'){
    S._sellQ = t.value;
    render();
    const s = $('#sellSearch');
    if (s){ s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    return;
  }
  if (t.id === 'prodSearch'){
    S._prodQ = t.value;
    render();
    const s = $('#prodSearch');
    if (s){ s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    return;
  }
  if (t.id === 'bookMonth'){ S.bookMonth = t.value || S.bookMonth; render(); return; }
  if (t.id === 'taxYear'){ S.taxYear = Number(t.value) || new Date().getFullYear(); render(); return; }
  if (t.id === 'taxMonth'){ S.taxMonth = Number(t.value) || 0; render(); return; }
});

/* ---------------------------- phím tắt trên máy tính ---------------------------- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){ closeSheet(); return; }
  if (!e.altKey) return;
  const routes = ['home', 'sell', 'book', 'tax', 'menu', 'purchases', 'stock', 'data'];
  const i = Number(e.key) - 1;
  if (i >= 0 && i < routes.length){ e.preventDefault(); go(routes[i]); }
});

document.querySelectorAll('#tabs .tab').forEach(b => {
  b.addEventListener('click', () => go(b.dataset.route));
});

/* ---------------------------- khởi động ---------------------------- */
(async function init(){
  await Persist.init();
  const d = await Persist.load();
  if (d && d.households){
    S.data = Object.assign(S.data, d);
    S.data.settings = Object.assign({ backupAt:null, onboarded:false }, d.settings || {});
    S.hid = hhs().length ? hhs()[0].id : null;
  }
  if (!S.data.policy) S.data.policy = JSON.parse(JSON.stringify(DEFAULT_POLICY));
  if (hhs().length) S.data.settings.onboarded = true;
  if (!S.data.settings.onboarded || !hhs().length) S.route = 'setup';
  render();
})();
