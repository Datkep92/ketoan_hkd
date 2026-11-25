'use strict';

/* ============================================================
   views.js — mọi màn hình và phần khung hiển thị.
   Mỗi VIEWS.<tên> trả về một chuỗi HTML; render() đưa vào #app.
   ============================================================ */

const VIEWS = {};

function nav(route, title, sub){
  return '<button class="li" data-act="route" data-route="' + route + '">'
    + '<div class="main"><div class="name">' + title + '</div>'
    + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><span class="car">›</span></button>';
}
function item(act, title, sub, id){
  return '<button class="li" data-act="' + act + '"' + (id ? ' data-id="' + esc(id) + '"' : '') + '>'
    + '<div class="main"><div class="name">' + title + '</div>'
    + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><span class="car">›</span></button>';
}

function payLabel(p){
  return p === 'debt' ? 'Ghi nợ' : p === 'bank' ? 'Chuyển khoản' : 'Tiền mặt';
}

/* ---------------------------- cài đặt ---------------------------- */
VIEWS.setup = function(){
  const pol = P();
  const preset = [
    { v:1000000000, t:'1 tỷ đồng/năm' },
    { v:500000000,  t:'500 triệu/năm' },
    { v:100000000,  t:'100 triệu/năm' }
  ];
  return '<div class="pad">'
    + '<div class="grid2">'
    + '<div class="card"><h2>Cài đặt lần đầu</h2>'
    + '<p class="muted">Mọi dữ liệu nằm trong máy này. Không có máy chủ, không có tài khoản, không cần mạng.</p>'
    + '<h3>2. Kỳ kê khai</h3>'
    + '<label class="f"><span>Kỳ</span><select id="setPeriod">'
    + '<option value="month">Theo tháng</option><option value="quarter">Theo quý</option>'
    + '</select></label></div>'
    + '<div class="card"><h3>1. Ngưỡng doanh thu không phải nộp thuế</h3>'
    + '<p class="muted small">Chọn theo quy định đang áp dụng với hộ của Sếp, hoặc tự nhập. Có thể sửa lại bất cứ lúc nào.</p>'
    + preset.map(p => '<button class="btn wide" style="margin-bottom:8px" data-act="preset" data-v="' + p.v + '">' + p.t + '</button>').join('')
    + '<label class="f" style="margin-top:6px"><span>Tự nhập (đồng)</span>'
    + '<input type="number" inputmode="numeric" id="setThreshold" value="' + (pol.threshold || '') + '" placeholder="ví dụ 1000000000"></label>'
    + '</div></div>'
    + '<div class="card"><h3>3. Hộ kinh doanh đầu tiên</h3>'
    + '<div class="grid3">'
    + '<label class="f"><span>Tên hộ kinh doanh</span><input type="text" id="setName" placeholder="Hộ kinh doanh ..."></label>'
    + '<label class="f"><span>Mã số thuế (nếu đã có)</span><input type="text" id="setTax" inputmode="numeric" placeholder="10 số hoặc 13 ký tự"></label>'
    + '<label class="f"><span>Ngành chính</span><select id="setGroup">'
    + GROUPS.map(g => '<option value="' + g.k + '">' + esc(g.n) + '</option>').join('')
    + '</select></label></div>'
    + '<button class="btn primary" data-act="doSetup">Bắt đầu sử dụng</button>'
    + '<p class="muted small" style="margin-top:10px">Bản đầu tiên — số liệu thuế chỉ để tham khảo, cần đối chiếu với quy định hiện hành.</p>'
    + '</div></div>';
};

/* ---------------------------- hôm nay ---------------------------- */
VIEWS.home = function(){
  const h = hh(), y = new Date().getFullYear(), m = new Date().getMonth() + 1;
  const from = y + '-' + String(m).padStart(2, '0') + '-01', to = monthEnd(y, m);
  const rev = revIn(from, to), exp = expIn(from, to);
  const debt = sum(custs().map(c => c.debt || 0));
  const pol = P();
  const ratio = pol.threshold > 0 ? Math.min(100, revYearNow(h ? h.id : null) / pol.threshold * 100) : 0;
  const warn = pol.threshold > 0 && revYearNow(h ? h.id : null) > pol.threshold * 0.8;
  const todayInv = invs().filter(i => i.date === todayISO());
  return '<div class="pad">'
    + '<div class="card"><div class="row wrap"><div><h2>' + (h ? 'Xin chào, ' + esc(h.name) : 'Chưa có hộ kinh doanh') + '</h2>'
    + '<div class="muted">' + dmy(todayISO()) + ' · ' + (h ? SHORT[h.group] || 'Hộ kinh doanh' : 'Hãy cài đặt để bắt đầu') + '</div></div>'
    + '<div class="sp"></div>'
    + '<button class="btn primary" data-act="route" data-route="sell">＋ Bán hàng</button> '
    + '<button class="btn" data-act="route" data-route="purchases">Mua hàng</button> '
    + '<button class="btn" data-act="route" data-route="book">Xem sổ sách</button></div></div>'
    + '<div class="kpi">'
    + '<div><div class="muted">Doanh thu tháng này</div><div class="big">' + money(rev) + '</div></div>'
    + '<div><div class="muted">Chi phí tháng này</div><div class="big">' + money(exp) + '</div></div>'
    + '<div><div class="muted">Tạm tính lãi</div><div class="big">' + money(rev - exp) + '</div></div>'
    + '<div><div class="muted">Khách còn nợ</div><div class="big">' + money(debt) + '</div></div>'
    + '<div><div class="muted">Nợ nhà cung cấp</div><div class="big">' + money(sum(sups().map(s => s.debt || 0))) + '</div></div>'
    + '<div><div class="muted">Quỹ tiền mặt ước tính</div><div class="big">' + money(cashOnHand()) + '</div></div>'
    + '</div>'
    + (pol.threshold > 0
      ? '<div class="card ' + (warn ? 'warn' : '') + '"><div class="row"><b>Doanh thu năm so với ngưỡng ' + money(pol.threshold) + '</b>'
        + '<div class="sp"></div><span class="muted">' + fmt(ratio.toFixed ? Math.round(ratio) : ratio) + '%</span></div>'
        + '<div class="bar"><i class="' + (warn ? 'warn' : '') + '" style="width:' + ratio + '%"></i></div>'
        + '<div class="muted small">' + money(revYearNow(h ? h.id : null)) + ' đã ghi nhận trong năm ' + y + '.</div></div>'
      : '<div class="card warn">Chưa đặt ngưỡng doanh thu. Vào <b>Chính sách thuế</b> để đặt trước khi tính thuế.</div>')
    + (alerts().length
      ? '<div class="card warn"><b>Cảnh báo</b>'
        + alerts().map(a => '<div class="alertline">• ' + esc(a.t) + '</div>').join('') + '</div>'
      : '')
    + '<div class="grid2">'
    + '<div class="card"><div class="row wrap"><h3 style="margin:0">Doanh thu 6 tháng</h3><div class="sp"></div>'
    + '<span class="muted small">Đơn vị: đồng</span></div>'
    + '<div class="spark">' + monthlyRev(6).map(x => {
        const hi = Math.max(1, ...monthlyRev(6).map(z => z.value));
        return '<div><i style="height:' + Math.max(3, Math.round(x.value / hi * 100)) + '%"></i>'
          + '<small>' + esc(x.label) + '</small></div>';
      }).join('') + '</div></div>'
    + '<div class="card"><h3 style="margin:0 0 10px">Số dư quỹ đầu kỳ</h3>'
    + '<div class="row wrap"><label class="f" style="margin:0"><span>Số tiền (đồng)</span>'
    + '<input type="number" inputmode="numeric" id="cashStart" value="' + n0((S.data.settings || {}).cashStart) + '"></label>'
    + '<button class="btn sm" data-act="saveCashStart">Lưu</button></div>'
    + '<p class="muted small">Quỹ ước tính từ các phiếu đã ghi; không thay cho sổ quỹ và sao kê ngân hàng.</p></div>'
    + '</div>'
    + '<div class="grid2">'
    + '<div class="card"><h3>Bán trong hôm nay</h3>'
    + (todayInv.length
      ? '<div class="tblwrap"><table class="tbl"><tr><th>Khách</th><th class="r">Thành tiền</th></tr>'
        + todayInv.slice(0, 6).map(i => '<tr><td>' + esc(i.customer || 'Khách lẻ') + '</td><td class="r num">' + money(i.total) + '</td></tr>').join('')
        + '</table></div>'
      : '<div class="empty">Chưa có phiếu bán nào hôm nay.</div>')
    + '</div>'
    + '<div class="card"><h3>Thao tác nhanh</h3>'
    + nav('products', 'Hàng hóa', 'Thêm, sửa giá, theo dõi tồn')
    + nav('customers', 'Khách hàng', 'Ghi nợ, thu nợ')
    + nav('purchases', 'Mua hàng', 'Nhập kho, trả nợ nhà cung cấp')
    + nav('stock', 'Tồn kho', 'Kiểm kê, mức tối thiểu')
    + nav('data', 'Cổng dữ liệu', 'Nhập/xuất hóa đơn JSON, XML')
    + nav('expenses', 'Chi phí', 'Ghi chi phí, in phiếu')
    + nav('policy', 'Chính sách thuế', 'Ngưỡng, thuế suất, giảm thuế')
    + '</div></div>'
    + '<div class="card muted small">Phần mềm chỉ ghi sổ và ước tính thuế. Không phát hành hóa đơn điện tử, không nộp tờ khai thay, không tự cập nhật luật.</div>'
    + '</div>';
};

function revYearNow(hid){
  const y = new Date().getFullYear();
  return revIn(y + '-01-01', y + '-12-31', hid);
}

/* ---------------------------- bán hàng ---------------------------- */
VIEWS.sell = function(){
  const q = S._sellQ.trim().toLowerCase();
  const list = prods().filter(p => !q || (p.name || '').toLowerCase().indexOf(q) >= 0);
  const cart = S.cart;
  const gross = sum(cart.map(l => l.qty * l.price));
  const disc = Math.min(gross, n0(val('discount') || 0));
  const pay = '<div class="paybar"><div class="sp"><div class="muted small">Tổng</div><b>' + money(Math.max(0, gross - disc)) + '</b></div>'
    + '<button class="btn primary" data-act="saveInvoice">Lưu phiếu</button></div>';
  return '<div class="pad"><div class="sell-layout">'
    + '<div>'
    + '<div class="card"><div class="row wrap"><h2 style="margin:0">Bán hàng</h2><div class="sp"></div>'
    + '<button class="btn sm" data-act="route" data-route="products">Quản lý hàng hóa</button></div>'
    + '<div class="search"><input type="search" id="sellSearch" value="' + esc(S._sellQ) + '" placeholder="Tìm hàng theo tên ..."></div>'
    + (list.length
      ? '<div class="pgrid">' + list.map(p =>
          '<button class="pbtn" data-act="add" data-id="' + p.id + '">'
          + '<div class="pn">' + esc(p.name) + '</div>'
          + '<div class="muted small">' + esc(p.unit || 'Cái') + (p.stock != null ? ' · tồn ' + fmt(p.stock) : '') + '</div>'
          + '<div class="pp">' + money(p.price) + '</div></button>').join('') + '</div>'
      : '<div class="empty">' + (q ? 'Không tìm thấy hàng.' : 'Chưa có hàng hóa. Vào Quản lý hàng hóa để thêm.') + '</div>')
    + '</div></div>'
    + '<div class="cart-panel"><div class="card"><h3>Giỏ hàng</h3>'
    + (cart.length
      ? cart.map((l, i) => '<div class="cartrow"><div class="cn"><div class="name">' + esc(l.name) + '</div>'
          + '<div class="muted small">' + money(l.price) + ' × ' + l.qty + '</div></div>'
          + '<div class="qty"><button data-act="dec" data-i="' + i + '">−</button><b>' + l.qty + '</b>'
          + '<button data-act="inc" data-i="' + i + '">＋</button>'
          + '<button class="btn ghost sm" data-act="del" data-i="' + i + '">×</button></div></div>').join('')
      : '<div class="empty">Chưa có hàng trong giỏ.</div>')
    + '<div style="margin-top:12px"><label class="f"><span>Khách hàng (để trống = khách lẻ)</span>'
    + '<input type="text" id="custName" list="custList" placeholder="Tên khách"></label>'
    + '<datalist id="custList">' + custs().map(c => '<option value="' + esc(c.name) + '"></option>').join('') + '</datalist>'
    + '<button class="btn sm" data-act="addCustomerFromSell">＋ Thêm khách</button></div>'
    + '<div class="grid2" style="margin-top:12px">'
    + '<label class="f"><span>Chiết khấu (đồng)</span><input type="number" id="discount" value="' + esc(val('discount') || '') + '"></label>'
    + '<label class="f"><span>Thu bằng</span><select id="payMethod">'
    + '<option value="cash">Tiền mặt</option><option value="bank">Chuyển khoản</option>'
    + '<option value="debt">Ghi nợ</option></select></label></div>'
    + '<label class="f"><span>Ghi chú</span><input type="text" id="note" placeholder="Không bắt buộc"></label>'
    + '</div>' + pay + '</div>'
    + '</div></div>';
};

/* ---------------------------- hàng hóa ---------------------------- */
VIEWS.products = function(){
  const q = S._prodQ.trim().toLowerCase();
  const list = prods().filter(p => !q || (p.name || '').toLowerCase().indexOf(q) >= 0);
  return '<div class="pad"><div class="card"><div class="row wrap"><div><h2>Quản lý hàng hóa</h2>'
    + '<div class="muted">' + fmt(prods().length) + ' mặt hàng của hộ này.</div></div><div class="sp"></div>'
    + '<button class="btn primary" data-act="addProduct">＋ Thêm hàng</button></div>'
    + '<div class="search" style="margin-top:12px"><input type="search" id="prodSearch" value="' + esc(S._prodQ) + '" placeholder="Tìm hàng ..."></div>'
    + '</div>'
    + (list.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Tên hàng</th><th>Nhóm thuế</th><th>Đơn vị</th>'
        + '<th class="r">Giá</th><th class="r">Tồn</th><th class="r">Tối thiểu</th><th class="act">Thao tác</th></tr>'
        + list.map(p => '<tr><td><b>' + esc(p.name) + '</b></td><td>' + esc(SHORT[p.group] || 'Khác') + '</td>'
          + '<td>' + esc(p.unit || 'Cái') + '</td><td class="r num">' + money(p.price) + '</td>'
          + '<td class="r num' + (n0(p.minStock) > 0 && n0(p.stock) < n0(p.minStock) ? ' low' : '') + '">'
          + (p.stock != null ? fmt(p.stock) : '—') + '</td>'
          + '<td class="r num">' + (n0(p.minStock) > 0 ? fmt(p.minStock) : '—') + '</td>'
          + '<td class="act"><button class="btn sm" data-act="stockAdjust" data-id="' + p.id + '">Kiểm kê</button> '
          + '<button class="btn sm" data-act="editProduct" data-id="' + p.id + '">Sửa</button> '
          + '<button class="btn sm danger" data-act="delProduct" data-id="' + p.id + '">Xóa</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="card empty">' + (q ? 'Không tìm thấy hàng.' : 'Chưa có hàng hóa. Nhấn Thêm hàng để bắt đầu.') + '</div>')
    + '</div>';
};

/* ---------------------------- mua hàng ---------------------------- */
VIEWS.purchases = function(){
  const list = purs().slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const total = sum(list.filter(p => !p.returned).map(p => p.total));
  const sd = sum(sups().map(s => s.debt || 0));
  return '<div class="pad">'
    + '<div class="card"><div class="row wrap"><div><h2 style="margin:0">Mua hàng</h2>'
    + '<div class="muted">Lập phiếu nhập, cập nhật tồn kho và công nợ nhà cung cấp.</div></div><div class="sp"></div>'
    + '<button class="btn primary" data-act="addPurchase">＋ Phiếu nhập</button> '
    + '<button class="btn sm" data-act="route" data-route="suppliers">Nhà cung cấp</button> '
    + '<button class="btn sm" data-act="route" data-route="stock">Tồn kho</button></div></div>'
    + '<div class="kpi"><div><div class="muted">Tổng mua còn hiệu lực</div><div class="big">' + money(total) + '</div></div>'
    + '<div><div class="muted">Nợ nhà cung cấp</div><div class="big">' + money(sd) + '</div></div>'
    + '<div><div class="muted">Số phiếu</div><div class="big">' + fmt(list.length) + '</div></div></div>'
    + '<div class="card"><h3 style="margin:0 0 10px">Phiếu nhập hàng</h3>'
    + (list.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Ngày</th><th>Mã</th><th>Nhà cung cấp</th>'
        + '<th class="r">Thành tiền</th><th>Trả</th><th class="act">Thao tác</th></tr>'
        + list.map(p => '<tr><td>' + dmy(p.date) + '</td><td>' + esc(p.code || '') + '</td>'
          + '<td>' + esc(p.supplier || '') + (p.returned ? ' <span class="warn">đã trả</span>' : '') + '</td>'
          + '<td class="r num">' + money(p.total) + '</td><td>' + esc(payLabel(p.pay)) + '</td><td class="act">'
          + '<button class="btn sm" data-act="printPurchase" data-id="' + p.id + '">In</button> '
          + (p.returned ? '' : '<button class="btn sm" data-act="returnPurchase" data-id="' + p.id + '">Trả hàng</button> ')
          + '<button class="btn sm danger" data-act="delPurchase" data-id="' + p.id + '">Xóa</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="empty">Chưa có phiếu nhập. Nhấn Phiếu nhập để ghi hàng mua vào kho.</div>')
    + '</div>'
    + '<div class="card"><div class="row wrap"><h3 style="margin:0">Nhà cung cấp nợ nhiều</h3><div class="sp"></div>'
    + '<button class="btn sm" data-act="route" data-route="suppliers">Xem tất cả</button></div>'
    + (sups().filter(s => n0(s.debt) > 0).length
      ? sups().filter(s => n0(s.debt) > 0).slice(0, 5).map(s => '<div class="cartrow">'
        + '<div class="cn"><div class="name">' + esc(s.name) + '</div><div class="muted small">Còn nợ</div></div>'
        + '<b class="num">' + money(s.debt) + '</b> <button class="btn sm" data-act="paySupplier" data-id="' + s.id + '">Trả nợ</button></div>').join('')
      : '<div class="empty">Không còn nợ nhà cung cấp.</div>')
    + '</div></div>';
};

VIEWS.suppliers = function(){
  const list = sups();
  return '<div class="pad"><div class="card"><div class="row wrap"><div><h2 style="margin:0">Nhà cung cấp</h2>'
    + '<div class="muted">' + fmt(list.length) + ' nhà cung cấp của hộ này.</div></div><div class="sp"></div>'
    + '<button class="btn primary" data-act="addSupplier">＋ Thêm</button></div>'
    + (list.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Tên</th><th>Điện thoại</th><th>Địa chỉ</th>'
        + '<th class="r">Còn nợ</th><th class="act">Thao tác</th></tr>'
        + list.map(s => '<tr><td><b>' + esc(s.name) + '</b></td><td>' + esc(s.phone || '') + '</td>'
          + '<td>' + esc(s.address || '') + '</td><td class="r num">' + money(s.debt || 0) + '</td><td class="act">'
          + '<button class="btn sm" data-act="paySupplier" data-id="' + s.id + '">Trả nợ</button> '
          + '<button class="btn sm" data-act="editSupplier" data-id="' + s.id + '">Sửa</button> '
          + '<button class="btn sm danger" data-act="delSupplier" data-id="' + s.id + '">Xóa</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="empty">Chưa có nhà cung cấp. Nhấn Thêm để bắt đầu.</div>')
    + '</div></div>';
};

VIEWS.stock = function(){
  const list = prods(), low = lowStocks(), logs = stockLogs().slice().reverse();
  const value = sum(list.map(p => n0(p.stock) * n0(p.cost)));
  return '<div class="pad">'
    + '<div class="card"><div class="row wrap"><div><h2 style="margin:0">Tồn kho</h2>'
    + '<div class="muted">Tồn được cập nhật khi bán, nhập hàng và kiểm kê.</div></div><div class="sp"></div>'
    + '<button class="btn sm" data-act="route" data-route="purchases">Nhập hàng</button></div></div>'
    + '<div class="kpi"><div><div class="muted">Mặt hàng</div><div class="big">' + fmt(list.length) + '</div></div>'
    + '<div><div class="muted">Giá trị tồn ước tính</div><div class="big">' + money(value) + '</div></div>'
    + '<div><div class="muted">Dưới mức tối thiểu</div><div class="big">' + fmt(low.length) + '</div></div></div>'
    + (low.length ? '<div class="card warn"><b>Cần nhập thêm</b>'
      + low.map(p => '<div class="alertline">• ' + esc(p.name) + ': tồn ' + fmt(p.stock) + ', tối thiểu ' + fmt(p.minStock) + '</div>').join('')
      + '</div>' : '')
    + '<div class="card"><h3 style="margin:0 0 10px">Danh sách tồn kho</h3>'
    + (list.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Hàng hóa</th><th class="r">Tồn</th><th class="r">Giá vốn</th>'
        + '<th class="r">Giá trị</th><th class="act">Thao tác</th></tr>'
        + list.map(p => '<tr><td>' + esc(p.name) + '</td><td class="r num">' + fmt(p.stock) + '</td>'
          + '<td class="r num">' + money(p.cost) + '</td><td class="r num">' + money(n0(p.stock) * n0(p.cost)) + '</td>'
          + '<td class="act"><button class="btn sm" data-act="stockAdjust" data-id="' + p.id + '">Kiểm kê</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="empty">Chưa có hàng hóa.</div>')
    + '</div>'
    + '<div class="card"><h3 style="margin:0 0 10px">Lịch sử kiểm kê</h3>'
    + (logs.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Ngày</th><th>Hàng hóa</th><th class="r">Thay đổi</th><th>Lý do</th><th class="act"></th></tr>'
        + logs.map(a => '<tr><td>' + dmy(a.date) + '</td><td>' + esc(a.product || '') + '</td>'
          + '<td class="r num">' + (n0(a.delta) > 0 ? '+' : '') + fmt(a.delta) + '</td><td>' + esc(a.reason || '') + '</td>'
          + '<td class="act"><button class="btn sm danger" data-act="delStockAdj" data-id="' + a.id + '">×</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="empty">Chưa có lần kiểm kê nào.</div>')
    + '</div></div>';
};

VIEWS.data = function(){
  return '<div class="pad"><div class="card"><div><h2 style="margin:0">Cổng dữ liệu hóa đơn</h2>'
    + '<p class="muted">Nhận dữ liệu JSON/XML từ phần mềm khác, hoặc xuất dữ liệu để đối chiếu. '
    + 'Dữ liệu chỉ nạp vào trình duyệt này; không gửi đi đâu.</p></div>'
    + '<div class="row wrap"><label class="f" style="margin:0"><span>Loại phiếu để xuất</span><select id="bridgeKind">'
    + '<option value="sale">Hóa đơn bán ra</option><option value="purchase">Hóa đơn mua vào</option></select></label>'
    + '<button class="btn sm" data-act="bridgeSampleSale">Mẫu bán</button> '
    + '<button class="btn sm" data-act="bridgeSamplePur">Mẫu mua</button> '
    + '<button class="btn sm" data-act="bridgePreview">Kiểm tra</button> '
    + '<button class="btn primary sm" data-act="bridgeImport">Nạp vào app</button></div>'
    + '<div class="row wrap" style="margin-top:10px"><button class="btn sm" data-act="bridgeExportJson">Xuất JSON</button> '
    + '<button class="btn sm" data-act="bridgeExportXml">Xuất XML</button></div>'
    + '<label class="f" style="margin-top:12px"><span>Dán JSON/XML vào đây</span>'
    + '<textarea id="bridgeInput" spellcheck="false" placeholder=\'{"kind":"sale","code":"HD-001",...}\'></textarea></label>'
    + '<div id="bridgeOut" class="bridgeout"></div></div>'
    + '<div class="card"><h3 style="margin:0 0 10px">Quy ước dữ liệu</h3>'
    + '<p class="muted small">Một phiếu là một đối tượng <b>invoice</b>, hoặc nhiều phiếu nằm trong mảng <b>invoices</b>. '
    + 'Tên trường chấp nhận cả tiếng Anh và tiếng Việt; loại phiếu là <b>sale</b> hoặc <b>purchase</b> (mua/nhập).</p>'
    + '<pre class="code">'
    + '{ "kind":"sale", "code":"HD-001", "date":"2026-03-05",\n'
    + '  "partner":"Khách lẻ", "pay":"cash", "discount":0,\n'
    + '  "lines":[ { "name":"Gạo", "qty":2, "price":18000 } ] }</pre>'
    + '<p class="muted small">Mã phiếu trùng sẽ bị từ chối. Phiếu mua tự tạo nhà cung cấp và hàng hóa nếu chưa có; '
    + 'phiếu bán ghi nợ nếu chọn thanh toán <b>debt</b>. App không phát hành hóa đơn điện tử, không nộp tờ khai thay.</p></div>'
    + '</div>';
};

/* ---------------------------- sổ sách ---------------------------- */
VIEWS.book = function(){
  const m = S.bookMonth;
  const list = invs().filter(i => i.date.slice(0, 7) === m).slice().sort((a, b) => b.date.localeCompare(a.date));
  const exps = S.data.expenses.filter(e => e.hid === S.hid && (e.date || '').slice(0, 7) === m)
    .slice().sort((a, b) => b.date.localeCompare(a.date));
  const pays = S.data.payments.filter(p => p.hid === S.hid).slice().reverse();
  return '<div class="pad"><div class="card"><div class="row wrap"><div><h2>Sổ sách</h2>'
    + '<div class="muted">Xem theo tháng, in bảng kê và xuất ra tệp CSV.</div></div><div class="sp"></div>'
    + '<label class="f" style="margin:0"><span>Tháng</span><input type="month" id="bookMonth" value="' + esc(m) + '"></label></div></div>'
    + '<div class="card book-list list-card"><div class="row wrap"><h3 style="margin:0">Sổ theo dõi</h3><div class="sp"></div>'
    + '<span class="muted small">In hoặc xuất ra tệp Excel</span></div>'
    + BOOKS.map(b => item('bookInfo', b.code + ' — ' + b.name, b.sub, b.k)).join('') + '</div>'
    + '<div class="card"><div class="row wrap"><h3 style="margin:0">Lịch sử bán hàng</h3><div class="sp"></div>'
    + '<button class="btn sm" data-act="exportBook">Xuất CSV</button> '
    + '<button class="btn sm" data-act="printBook">In bảng kê</button></div>'
    + (list.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Ngày</th><th>Khách hàng</th><th>Thu</th>'
        + '<th class="r">Thành tiền</th><th class="act">Thao tác</th></tr>'
        + list.map(i => '<tr><td>' + dmy(i.date) + '</td><td>' + esc(i.customer || 'Khách lẻ') + '</td>'
          + '<td>' + esc(i.pay || 'cash') + '</td><td class="r num">' + money(i.total) + '</td>'
          + '<td class="act"><button class="btn sm" data-act="printInvoice" data-id="' + i.id + '">In</button> '
          + '<button class="btn sm danger" data-act="delInvoice" data-id="' + i.id + '">Xóa</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="empty">Tháng này chưa có phiếu bán.</div>')
    + '</div>'
    + '<div class="grid2">'
    + '<div class="card"><div class="row wrap"><h3 style="margin:0">Lịch sử chi phí</h3><div class="sp"></div>'
    + '<button class="btn sm" data-act="addExpense">＋ Thêm</button></div>'
    + (exps.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Ngày</th><th>Nội dung</th><th class="r">Số tiền</th><th class="act"></th></tr>'
        + exps.map(e => '<tr><td>' + dmy(e.date) + '</td><td>' + esc(e.name) + '</td>'
          + '<td class="r num">' + money(e.amount) + '</td><td class="act">'
          + '<button class="btn sm" data-act="printExpense" data-id="' + e.id + '">In</button> '
          + '<button class="btn sm danger" data-act="delExpense" data-id="' + e.id + '">×</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="empty">Tháng này chưa có chi phí.</div>')
    + '</div>'
    + '<div class="card"><div class="row wrap"><h3 style="margin:0">Thu nợ gần đây</h3><div class="sp"></div>'
    + '<button class="btn sm" data-act="addPayment">＋ Thu nợ</button></div>'
    + (pays.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Ngày</th><th>Khách</th><th class="r">Số tiền</th><th class="act"></th></tr>'
        + pays.map(p => '<tr><td>' + dmy(p.date) + '</td><td>' + esc(p.customer || '') + '</td>'
          + '<td class="r num">' + money(p.amount) + '</td><td class="act">'
          + '<button class="btn sm danger" data-act="delPayment" data-id="' + p.id + '">×</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="empty">Chưa có lần thu nợ nào.</div>')
    + '</div></div>'
    + '</div>';
};

/* ---------------------------- thuế ---------------------------- */
VIEWS.tax = function(){
  const r = taxCalc(S.hid, S.taxYear, S.taxMonth);
  const months = Array.from({ length:12 }, (_, i) => i + 1);
  const years = Array.from({ length:5 }, (_, i) => S.taxYear - 2 + i);
  return '<div class="pad">'
    + '<div class="card"><div class="row wrap"><h2 style="margin:0">Tính thuế ước tính</h2><div class="sp"></div>'
    + '<label class="f" style="margin:0"><span>Năm</span><select id="taxYear">'
    + years.map(y => '<option value="' + y + '"' + (y === S.taxYear ? ' selected' : '') + '>' + y + '</option>').join('')
    + '</select></label>'
    + '<label class="f" style="margin:0"><span>Kỳ</span><select id="taxMonth">'
    + '<option value="0"' + (S.taxMonth === 0 ? ' selected' : '') + '>Cả năm</option>'
    + months.map(m => '<option value="' + m + '"' + (m === S.taxMonth ? ' selected' : '') + '>Tháng ' + m + '</option>').join('')
    + '</select></label></div>'
    + '<p class="muted small">Từ ' + dmy(r.from) + ' đến ' + dmy(r.to) + '. Số liệu lấy từ các phiếu bán đã ghi, chưa đối chiếu với cơ quan thuế.</p>'
    + '</div>'
    + (r.branchNote ? '<div class="card warn">' + esc(r.branchNote) + '</div>' : '')
    + '<div class="kpi">'
    + '<div><div class="muted">Doanh thu kỳ</div><div class="big">' + money(r.revPeriod) + '</div></div>'
    + '<div><div class="muted">GTGT phải nộp</div><div class="big">' + money(r.vat) + '</div></div>'
    + '<div><div class="muted">TNCN (cách A)</div><div class="big">' + money(r.tncnA) + '</div></div>'
    + '<div><div class="muted">TNCN (cách B)</div><div class="big">' + money(r.tncnB) + '</div></div>'
    + '</div>'
    + '<div class="grid2">'
    + '<div class="card"><h3>Cơ sở tính</h3>'
    + '<div class="tablewrap"><table class="tbl">'
    + '<tr><td>Doanh thu năm</td><td class="r num">' + money(r.revYear) + '</td></tr>'
    + '<tr><td>Chi phí năm</td><td class="r num">' + money(r.expYear) + '</td></tr>'
    + '<tr><td>Ngưỡng miễn</td><td class="r num">' + (r.thresholdSet ? money(r.threshold) : 'Chưa đặt') + '</td></tr>'
    + '<tr><td>Vượt ngưỡng</td><td class="r">' + (r.overThreshold ? 'Có' : 'Không') + '</td></tr>'
    + '<tr><td>Thuế suất bậc (A)</td><td class="r">' + fmt(r.rateA) + '%</td></tr>'
    + '<tr><td>Đã nộp trong kỳ</td><td class="r num">' + money(r.paid) + '</td></tr>'
    + '</table></div>'
    + (r.reduceOn ? '<p class="muted small">Đã áp dụng giảm 30% TNCN theo Nghị quyết 43/2026/QH16 và Nghị định 398/2026/NĐ-CP (doanh thu đến 10 tỷ, năm ' + S.taxYear + ').</p>' : '')
    + '</div>'
    + '<div class="card"><h3>Doanh thu theo nhóm</h3>'
    + '<div class="tablewrap"><table class="tbl"><tr><th>Nhóm</th><th class="r">Doanh thu kỳ</th><th class="r">GTGT</th></tr>'
    + GROUPS.map(g => '<tr><td>' + esc(SHORT[g.k]) + '</td><td class="r num">' + money(r.byGroup[g.k])
      + '</td><td class="r num">' + (r.overThreshold ? money(r.byGroup[g.k] * (Number(P().vat[g.k]) || 0) / 100) : '0 đ') + '</td></tr>').join('')
    + '</table></div>'
    + '</div></div>'
    + '<div class="card"><h3>Tư vấn thuế</h3>'
    + '<p><b>Cách A — theo bậc doanh thu năm:</b> ' + (r.overThreshold
      ? 'thu nhập năm ' + money(r.baseA) + ' × ' + fmt(r.rateA) + '% × tỷ lệ kỳ/năm = ' + money(r.tncnA) + '. Tổng GTGT + TNCN = <b>' + money(r.totalA) + '</b>.'
      : 'chưa vượt ngưỡng, tạm tính 0 đồng.') + '</p>'
    + '<p><b>Cách B — tỷ lệ từng ngành trên phần vượt ngưỡng:</b> ' + (r.allowB
      ? 'phần vượt ngưỡng ' + money(r.baseB) + ' phân bổ theo nhóm hàng, thuế TNCN = ' + money(r.tncnB) + '. Tổng GTGT + TNCN = <b>' + money(r.totalB) + '</b>. Theo Điều 7 Luật Thuế TNCN 109/2025.'
      : (r.overThreshold ? 'không áp dụng cho năm có doanh thu trên 3 tỷ.' : 'chưa vượt ngưỡng, tạm tính 0 đồng.')) + '</p>'
    + '<p class="muted small">Hai cách trên là ước tính để tham khảo. Phương pháp tính và kỳ kê khai phải giữ ổn định theo quy định; hãy đối chiếu với quy định hiện hành trước khi nộp.</p>'
    + '</div>'
    + '<div class="row wrap"><button class="btn" data-act="printTax">In tư vấn thuế</button> '
    + '<button class="btn primary" data-act="saveTaxPay">Ghi số đã nộp</button></div>'
    + '</div>';
};

/* ---------------------------- khách hàng ---------------------------- */
VIEWS.customers = function(){
  const list = custs();
  return '<div class="pad"><div class="card"><div class="row wrap"><div><h2>Khách hàng</h2>'
    + '<div class="muted">Ghi nợ và thu nợ. Bấm vào tên khách để xem chi tiết.</div></div><div class="sp"></div>'
    + '<button class="btn primary" data-act="addCust">＋ Thêm khách</button></div></div>'
    + (list.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Tên khách</th><th>Điện thoại</th><th class="r">Công nợ</th><th class="act">Thao tác</th></tr>'
        + list.map(c => '<tr><td><button class="btn ghost" data-act="editCust" data-id="' + c.id + '">' + esc(c.name) + '</button></td>'
          + '<td>' + esc(c.phone || '—') + '</td><td class="r num">' + money(c.debt || 0) + '</td>'
          + '<td class="act"><button class="btn sm" data-act="payDebt" data-id="' + c.id + '">Thu nợ</button> '
          + '<button class="btn sm danger" data-act="delCust" data-id="' + c.id + '">Xóa</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="card empty">Chưa có khách hàng. Nhấn Thêm khách để bắt đầu.</div>')
    + '</div>';
};

/* ---------------------------- chi phí ---------------------------- */
VIEWS.expenses = function(){
  const list = S.data.expenses.filter(e => e.hid === S.hid).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return '<div class="pad"><div class="card"><div class="row wrap"><div><h2>Chi phí</h2>'
    + '<div class="muted">' + fmt(list.length) + ' khoản đã ghi.</div></div><div class="sp"></div>'
    + '<button class="btn primary" data-act="addExpense">＋ Thêm chi phí</button></div></div>'
    + (list.length
      ? '<div class="tablewrap"><table class="tbl"><tr><th>Ngày</th><th>Nội dung</th><th class="r">Số tiền</th><th class="act">Thao tác</th></tr>'
        + list.map(e => '<tr><td>' + dmy(e.date) + '</td><td>' + esc(e.name) + '</td>'
          + '<td class="r num">' + money(e.amount) + '</td><td class="act">'
          + '<button class="btn sm" data-act="editExpense" data-id="' + e.id + '">Sửa</button> '
          + '<button class="btn sm" data-act="printExpense" data-id="' + e.id + '">In</button> '
          + '<button class="btn sm danger" data-act="delExpense" data-id="' + e.id + '">Xóa</button></td></tr>').join('')
        + '</table></div>'
      : '<div class="card empty">Chưa có chi phí. Nhấn Thêm chi phí để bắt đầu.</div>')
    + '</div>';
};

/* ---------------------------- chính sách thuế ---------------------------- */
VIEWS.policy = function(){
  const p = P();
  const groups = GROUPS.map((g, i) => '<div class="grid2" style="margin-bottom:8px">'
    + '<div><div class="muted small">' + esc(g.n) + '</div></div>'
    + '<div class="row"><label class="f" style="flex:1;margin:0"><span>GTGT %</span>'
    + '<input type="number" step="0.1" id="pVat' + i + '" value="' + (p.vat[g.k] || 0) + '"></label>'
    + '<label class="f" style="flex:1;margin:0"><span>TNCN %</span>'
    + '<input type="number" step="0.1" id="pTncn' + i + '" value="' + (p.tncn[g.k] || 0) + '"></label></div></div>').join('');
  const br = p.brackets;
  return '<div class="pad"><div class="card"><h2>Chính sách thuế</h2>'
    + '<p class="muted">Các số này được dùng để <b>ước tính</b>. Thay đổi khi quy định áp dụng với hộ của Sếp thay đổi. App không tự cập nhật luật.</p></div>'
    + '<div class="grid2">'
    + '<div class="card"><h3>Ngưỡng và kỳ</h3>'
    + '<label class="f"><span>Ngưỡng doanh thu không chịu thuế (đồng/năm)</span>'
    + '<input type="number" id="pThreshold" value="' + (p.threshold || '') + '" placeholder="0 = chưa đặt"></label>'
    + '<label class="f"><span>Kỳ kê khai</span><select id="pPeriod">'
    + '<option value="month"' + (p.period === 'month' ? ' selected' : '') + '>Theo tháng</option>'
    + '<option value="quarter"' + (p.period === 'quarter' ? ' selected' : '') + '>Theo quý</option>'
    + '</select></label>'
    + '<label class="f"><span>Căn cứ tính thuế TNCN theo bậc (A)</span><select id="pBracketBase">'
    + '<option value="income"' + (p.bracketBase === 'income' ? ' selected' : '') + '>Thu nhập (doanh thu − chi phí)</option>'
    + '<option value="revenue"' + (p.bracketBase === 'revenue' ? ' selected' : '') + '>Doanh thu</option>'
    + '</select></label></div>'
    + '<div class="card"><h3>Giảm thuế TNCN</h3>'
    + '<label class="row"><input type="checkbox" id="pReduce30"' + (p.reduce30 ? ' checked' : '') + '>'
    + '<span>Giảm 30% (Nghị quyết 43/2026/QH16)</span></label>'
    + '<label class="f" style="margin-top:8px"><span>Giới hạn doanh thu (đồng)</span>'
    + '<input type="number" id="pReduceLimit" value="' + (p.reduceLimit || 0) + '"></label>'
    + '<label class="f"><span>Các năm áp dụng (cách nhau bằng dấu phẩy)</span>'
    + '<input type="text" id="pReduceYears" value="' + esc((p.reduceYears || []).join(', ')) + '"></label>'
    + '</div></div>'
    + '<div class="card"><h3>Thuế suất theo nhóm hàng</h3>' + groups + '</div>'
    + '<div class="card"><h3>Bậc thuế TNCN theo doanh thu năm</h3>'
    + '<div class="grid3">'
    + '<label class="f"><span>Bậc 1 — đến (đồng)</span><input type="number" id="pBracket1Max" value="' + (br[0].max || 0) + '"></label>'
    + '<label class="f"><span>Bậc 1 — suất %</span><input type="number" id="pBracket1Rate" value="' + br[0].rate + '"></label>'
    + '<label class="f"><span>Bậc 2 — đến (đồng)</span><input type="number" id="pBracket2Max" value="' + (br[1].max || 0) + '"></label>'
    + '<label class="f"><span>Bậc 2 — suất %</span><input type="number" id="pBracket2Rate" value="' + br[1].rate + '"></label>'
    + '<label class="f"><span>Trên bậc 2 — suất %</span><input type="number" id="pBracket3Rate" value="' + br[2].rate + '"></label>'
    + '</div></div>'
    + '<div class="row wrap"><button class="btn primary" data-act="savePolicy">Lưu chính sách</button> '
    + '<button class="btn" data-act="resetPolicy">Về mặc định</button></div>'
    + '</div>';
};

/* ---------------------------- menu ---------------------------- */
VIEWS.menu = function(){
  const h = hh();
  return '<div class="pad"><div class="card"><h2>Menu</h2>'
    + '<div class="muted">' + (h ? esc(h.name) : 'Chưa có hộ kinh doanh') + '</div></div>'
    + '<div class="grid2">'
    + '<div class="card list-card"><h3>Quản lý</h3>'
    + nav('sell', 'Bán hàng', 'Lập phiếu, in, ghi nợ')
    + nav('products', 'Hàng hóa', 'Thêm, sửa, xóa mặt hàng')
    + nav('purchases', 'Mua hàng', 'Phiếu nhập, nhà cung cấp')
    + nav('stock', 'Tồn kho', 'Kiểm kê, cảnh báo tồn thấp')
    + nav('customers', 'Khách hàng', 'Ghi nợ, thu nợ')
    + nav('expenses', 'Chi phí', 'Ghi chép và in phiếu chi')
    + nav('book', 'Sổ sách', 'Sáu sổ, in và xuất Excel')
    + nav('tax', 'Thuế', 'Ước tính GTGT và TNCN')
    + nav('policy', 'Chính sách thuế', 'Ngưỡng, thuế suất, giảm 30%')
    + '</div>'
    + '<div class="card list-card"><h3>Dữ liệu và hỗ trợ</h3>'
    + nav('data', 'Cổng dữ liệu hóa đơn', 'Nhập/xuất JSON, XML')
    + item('backup', 'Sao lưu ra tệp JSON', 'Lưu định kỳ ở nơi an toàn')
    + item('restore', 'Nhập từ tệp JSON', 'Ghi đè dữ liệu hiện có sau khi xác nhận')
    + item('switchHH', 'Đổi hộ kinh doanh', 'Thêm hộ mới, chuyển hộ, xóa hộ')
    + nav('help', 'Hướng dẫn', 'Cách dùng và giới hạn của app')
    + '</div></div>'
    + '<div class="card"><h3>Phím tắt trên máy tính</h3>'
    + '<div class="muted"><b>Alt + 1…5</b> — chuyển giữa Hôm nay, Bán hàng, Sổ sách, Thuế, Menu.<br>'
    + '<b>Esc</b> — đóng cửa sổ đang mở.</div></div>'
    + '</div>';
};

/* ---------------------------- trợ giúp ---------------------------- */
VIEWS.help = function(){
  return '<div class="pad"><div class="card"><h2>Trợ giúp</h2>'
    + '<p>App chạy ngay trong trình duyệt, không cần máy chủ hay tài khoản. Dữ liệu lưu trong trình duyệt của chính máy này.</p>'
    + '<h3>Cách dùng nhanh</h3>'
    + '<p>1. Cài đặt ngưỡng doanh thu và thêm hộ kinh doanh.<br>'
    + '2. Vào Hàng hóa để thêm mặt hàng và nhóm thuế.<br>'
    + '3. Vào Bán hàng: chọn hàng, nhập khách, chọn hình thức thu, nhấn Lưu phiếu.<br>'
    + '4. Vào Mua hàng để ghi phiếu nhập, Nhà cung cấp để trả nợ, Tồn kho để kiểm kê.<br>'
    + '5. Vào Sổ sách để xem, in, xuất Excel sáu sổ; vào Thuế để xem số ước tính.<br>'
    + '6. Vào Cổng dữ liệu nếu cần nhận hóa đơn JSON/XML từ phần mềm khác.</p>'
    + '<h3>Giới hạn cần nhớ</h3>'
    + '<p class="muted">App <b>không</b> phát hành hóa đơn điện tử, <b>không</b> nộp tờ khai thay, <b>không</b> tự cập nhật luật. Số thuế chỉ là ước tính từ các phiếu đã ghi, cần đối chiếu với quy định hiện hành.</p>'
    + '<p class="muted">In ấn dùng hộp thoại in của trình duyệt (AirPrint hoặc Lưu thành PDF). Chưa hỗ trợ máy in hóa đơn khổ nhiệt 58/80 mm.</p>'
    + '<h3>Giữ dữ liệu an toàn</h3>'
    + '<p class="muted">Vào Menu ▸ Sao lưu ra tệp JSON thường xuyên. Khi mở trên máy khác, dùng Nhập từ tệp JSON. Xóa dữ liệu trình duyệt sẽ làm mất dữ liệu nếu chưa sao lưu.</p>'
    + '</div>'
    + '<div class="row"><button class="btn" data-act="route" data-route="menu">← Về Menu</button> '
    + '<button class="btn primary" data-act="backup">Sao lưu ngay</button></div>'
    + '</div>';
};

/* ---------------------------- khung hiển thị ---------------------------- */
function render(){
  const h = hh();
  const nameEl = $('#hhName');
  nameEl.textContent = h ? h.name : 'Chưa có hộ';
  const dot = $('#hhDot');
  dot.style.background = h ? (h.color || PALETTE[0]) : '#999';
  $('#today').textContent = dmy(todayISO());
  const foot = $('#sideFoot');
  foot.textContent = fmt(hhs().length) + ' hộ · lưu trong máy (' + Persist.mode().toUpperCase() + ')';

  document.querySelectorAll('#tabs .tab').forEach(b => {
    b.classList.toggle('on', b.dataset.route === S.route);
  });
  $('#app').innerHTML = S.route === 'setup' ? VIEWS.setup()
    : (VIEWS[S.route] ? VIEWS[S.route]() : (S.route = 'home', VIEWS.home()));
}

function go(route){
  S.route = route === 'setup' ? 'setup' : (VIEWS[route] ? route : 'home');
  closeSheet();
  render();
  window.scrollTo(0, 0);
}
function sheet(html){
  $('#sheetBox').innerHTML = html;
  $('#sheet').classList.add('on');
}
function closeSheet(){ $('#sheet').classList.remove('on'); }

function hhForm(h){
  h = h || {};
  return '<h2>' + (h.id ? 'Sửa hộ kinh doanh' : 'Thêm hộ kinh doanh') + '</h2>'
    + '<label class="f"><span>Tên hộ *</span><input type="text" id="hhNameInput" value="' + esc(h.name || '') + '" placeholder="Hộ kinh doanh ..."></label>'
    + '<div class="grid2">'
    + '<label class="f"><span>Mã số thuế</span><input type="text" id="hhTax" value="' + esc(h.taxCode || '') + '" placeholder="10 số hoặc 13 ký tự"></label>'
    + '<label class="f"><span>Chủ hộ</span><input type="text" id="hhOwner" value="' + esc(h.owner || '') + '" placeholder="Họ tên chủ hộ"></label>'
    + '</div>'
    + '<label class="f"><span>Địa chỉ</span><input type="text" id="hhAddress" value="' + esc(h.address || '') + '" placeholder="Địa chỉ kinh doanh"></label>'
    + '<div class="grid2">'
    + '<label class="f"><span>Ngành chính</span><select id="hhGroup">'
    + GROUPS.map(g => '<option value="' + g.k + '"' + (h.group === g.k ? ' selected' : '') + '>' + esc(g.n) + '</option>').join('')
    + '</select></label>'
    + '<label class="f"><span>Màu nhận diện</span><select id="hhColor">'
    + PALETTE.map(c => '<option value="' + c + '"' + (h.color === c ? ' selected' : '') + '>' + c + '</option>').join('')
    + '</select></label></div>'
    + '<input type="hidden" id="hhId" value="' + esc(h.id || '') + '">'
    + '<div class="row"><button class="btn primary" data-act="saveHH">Lưu</button> '
    + '<button class="btn" data-act="closeSheet">Hủy</button>'
    + (h.id ? ' <button class="btn danger" data-act="delHH" data-id="' + h.id + '">Xóa hộ này</button>' : '')
    + '</div>';
}
