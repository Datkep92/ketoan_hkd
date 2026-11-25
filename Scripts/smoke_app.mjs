/* Kiểm tra hành vi của app desktop: nạp core.js + views.js + actions.js vào DOM giả,
   rồi bấm thử mọi luồng chính. Chạy: node_real --jitless --no-expose-wasm Scripts/smoke_app.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const shellHtml = fs.readFileSync(htmlPath, 'utf8');
const jsFiles = ['js/core.js', 'js/views.js', 'js/actions.js'];
const code = jsFiles.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const viewsHtml = code.slice(code.indexOf('const VIEWS'), code.indexOf('function render()'));

let pass = 0, fail = 0;
function ck(name, ok){
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}
function assert(cond, msg){ if (!cond) throw new Error(msg); }

/* -------------------------- DOM tối thiểu -------------------------- */
let lastTarget = null;
let lastAnchor = null;
let confirmAnswer = true;
const els = {};
const printed = [];
const downloads = [];

function el(id){
  if (!els[id]) els[id] = {
    id: id || '', value: '', checked: false, textContent: '', innerHTML: '',
    files: [], style: {}, dataset: {}, _listeners: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    addEventListener(t, fn){ (this._listeners[t] = this._listeners[t] || []).push(fn); },
    focus(){}, setSelectionRange(){}, click(){}, remove(){}, appendChild(){}
  };
  return els[id];
}

const tabEls = ['home','sell','book','tax','menu'].map(r => {
  const b = el('tab-' + r);
  b.dataset.route = r;
  return b;
});

const doc = {
  body: el('body'),
  getElementById: id => els[id] || el(id),
  querySelector: sel => el(sel.replace(/^#/, '')),
  querySelectorAll: sel => (sel === '#tabs .tab' ? tabEls : []),
  createElement: tag => { const a = el(tag + '-' + Math.random()); if (tag === 'a') lastAnchor = a; return a; },
  addEventListener(type, fn){ (this._listeners[type] = this._listeners[type] || []).push(fn); },
  _listeners: {}
};
function dispatch(type, ev){
  const e = Object.assign({ preventDefault(){} }, ev || {});
  if (!e.target) e.target = e;
  (doc._listeners[type] || []).forEach(fn => fn(e));
}
function click(act, id, route, v){
  lastTarget = {
    id: '', dataset: { act: act || '', id: id || '', i: id, route: route || '', v: v || '' },
    closest: () => lastTarget
  };
  dispatch('click', lastTarget);
}
function setVal(id, v){ const e = doc.getElementById(id); assert(!!e, 'thiếu ô ' + id); e.value = String(v); }
function setCheck(id, v){ doc.getElementById(id).checked = !!v; }

const store = {};
class FileReaderStub {
  readAsText(f){ this.result = f.content; if (this.onload) this.onload(); }
}
const win = {
  document: doc,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  confirm: () => confirmAnswer,
  prompt: () => '',
  print: () => { printed.push(el('print').innerHTML); },
  scrollTo: () => {},
  FileReader: FileReaderStub,
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: id => clearTimeout(id),
  Blob: class { constructor(parts, opts){ this.parts = parts; this.type = (opts || {}).type || ''; this.text = parts.join(''); } },
  URL: { createObjectURL: b => { downloads.push(b); return 'blob:test'; }, revokeObjectURL(){} }
};
win.window = win;
const ctx = vm.createContext(win);
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async function main(){
  console.log('== Nạp và khởi động ==');
  vm.runInContext(code, ctx, { filename: 'app.js' });
  ck('nạp đủ ba tệp JS', vm.runInContext('typeof VIEWS === "object" && typeof taxCalc === "function" && typeof Persist === "object"', ctx));
  ck('khung có 3 script theo thứ tự',
    shellHtml.indexOf('js/core.js') < shellHtml.indexOf('js/views.js')
    && shellHtml.indexOf('js/views.js') < shellHtml.indexOf('js/actions.js')
    && (shellHtml.match(/<script src=/g) || []).length === 3);
  ck('khung có các vùng hiển thị chính',
    ['id="app"','id="sheet"','id="print"','id="toast"','id="tabs"','id="hhName"'].every(x => shellHtml.includes(x)));
  await sleep(20);
  const g = expr => vm.runInContext(expr, ctx);
  ck('khởi động ở màn cài đặt', g('S.route') === 'setup');
  ck('chưa có hộ kinh doanh', g('S.data.households.length') === 0);
  ck('chính sách mặc định có sẵn', g('P().threshold') === 0 && g('P().vat.goods') === 1);
  ck('lưu trữ dự phòng localStorage', g('Persist.mode()') === 'ls');

  console.log('== Cài đặt lần đầu ==');
  g("go('setup')");
  ck('màn cài đặt có nội dung', el('app').innerHTML.includes('Cài đặt lần đầu'));
  setVal('setThreshold', '200000000');
  click('preset', '', '', '500000000');
  ck('chọn mức ngưỡng nhanh', el('setThreshold').value === '500000000');
  setVal('setThreshold', '200000000');
  setVal('setPeriod', 'month');
  setVal('setName', 'Hộ kinh doanh A');
  setVal('setTax', '0123456789');
  setVal('setGroup', 'goods');
  click('doSetup');
  ck('tạo hộ đầu tiên', g('S.data.households.length') === 1);
  ck('tên hộ đúng', g('hh().name') === 'Hộ kinh doanh A');
  ck('đã đánh dấu cài đặt xong', g('S.data.settings.onboarded') === true);
  ck('ngưỡng được lưu', g('P().threshold') === 200000000);
  ck('chuyển về màn hôm nay', g('S.route') === 'home');
  ck('trang hôm nay có chỉ số', el('app').innerHTML.includes('Doanh thu tháng này'));

  console.log('== Hàng hóa ==');
  g("go('products')");
  ck('màn hàng hóa có nút thêm', el('app').innerHTML.includes('Thêm hàng'));
  click('addProduct');
  ck('mở cửa sổ thêm hàng', el('sheetBox').innerHTML.includes('id="gName"'));
  setVal('gName', 'Gạo'); setVal('gUnit', 'kg'); setVal('gGroup', 'goods');
  setVal('gPrice', '25000'); setVal('gCost', '18000'); setVal('gStock', '100');
  click('saveProduct');
  ck('lưu mặt hàng thứ nhất', g('S.data.products.length') === 1);
  ck('tên hàng đúng', g('S.data.products[0].name') === 'Gạo');
  ck('giá bán đúng', g('S.data.products[0].price') === 25000);
  ck('nhóm thuế đúng', g('S.data.products[0].group') === 'goods');
  ck('tồn kho đúng', g('S.data.products[0].stock') === 100);
  click('addProduct');
  setVal('gName', 'Cà phê'); setVal('gUnit', 'ly'); setVal('gGroup', 'service');
  setVal('gPrice', '30000'); setVal('gCost', '10000'); setVal('gStock', '50');
  click('saveProduct');
  ck('lưu mặt hàng thứ hai', g('S.data.products.length') === 2);
  const pid1 = g('S.data.products[0].id');
  let pid2 = g('S.data.products[1].id');
  click('editProduct', pid2);
  ck('mở cửa sổ sửa hàng', el('sheetBox').innerHTML.includes('Sửa hàng hóa'));
  setVal('gName', 'Cà phê sữa'); click('saveProduct', pid2);
  ck('sửa tên hàng', g('S.data.products[1].name') === 'Cà phê sữa');
  confirmAnswer = false; click('delProduct', pid2);
  ck('hủy xóa hàng', g('S.data.products.length') === 2);
  confirmAnswer = true; click('delProduct', pid2);
  ck('xóa hàng', g('S.data.products.length') === 1);
  click('addProduct');
  setVal('gName', 'Cà phê'); setVal('gGroup', 'service'); setVal('gPrice', '30000');
  setVal('gStock', '50'); click('saveProduct');
  pid2 = g('S.data.products[1].id');
  ck('thêm lại hàng để bán', g('S.data.products.length') === 2);

  console.log('== Bán hàng ==');
  g("go('sell')");
  ck('màn bán có ô tìm kiếm', el('app').innerHTML.includes('id="sellSearch"'));
  ck('màn bán có danh sách hàng', el('app').innerHTML.includes('data-act="add"'));
  click('add', pid1);
  ck('thêm hàng vào giỏ', g('S.cart.length') === 1 && g('S.cart[0].qty') === 1);
  click('add', pid1);
  ck('cùng hàng được gộp', g('S.cart[0].qty') === 2);
  click('inc', 0);
  ck('tăng số lượng', g('S.cart[0].qty') === 3);
  click('dec', 0);
  ck('giảm số lượng', g('S.cart[0].qty') === 2);
  click('dec', 0); click('dec', 0);
  ck('giảm về 0 thì xóa dòng', g('S.cart.length') === 0);
  click('add', pid1);
  setVal('discount', '5000'); setVal('payMethod', 'cash');
  setVal('custName', 'Khách lẻ'); setVal('note', 'mua buổi sáng');
  click('saveInvoice');
  await sleep(80);
  ck('lưu phiếu bán', g('S.data.invoices.length') === 1);
  ck('mã phiếu tự tăng', g('S.data.invoices[0].code') === 'HD001');
  ck('thành tiền trừ chiết khấu', g('S.data.invoices[0].total') === 20000);
  ck('trừ tồn kho', g('S.data.products[0].stock') === 99);
  ck('giỏ hàng được dọn', g('S.cart.length') === 0);
  ck('phiếu in có câu giới hạn', printed[printed.length - 1].includes('Phiếu này không thay thế hóa đơn điện tử.'));
  ck('đã gọi hộp thoại in', printed.length >= 1);
  ck('ghi chú được lưu', g('S.data.invoices[0].note') === 'mua buổi sáng');

  console.log('== Khách hàng và công nợ ==');
  g("go('customers')");
  click('addCust');
  ck('mở cửa sổ thêm khách', el('sheetBox').innerHTML.includes('id="kName"'));
  setVal('kName', 'Cô Lan'); setVal('kPhone', '0912345678'); setVal('kDebt', '0');
  click('saveCust');
  ck('lưu khách hàng', g('S.data.customers.length') === 1);
  const cid = g('S.data.customers[0].id');
  ck('khách mới hiện trong danh sách', el('app').innerHTML.includes('Cô Lan'));
  g("go('sell')"); click('add', pid2);
  setVal('custName', 'Cô Lan'); setVal('payMethod', 'debt'); setVal('discount', '0');
  click('saveInvoice');
  await sleep(80);
  ck('lưu phiếu ghi nợ', g('S.data.invoices.length') === 2);
  ck('công nợ tăng', g('S.data.customers[0].debt') === 30000);
  ck('phiếu ghi rõ hình thức nợ', g('S.data.invoices[1].pay') === 'debt');
  g("go('customers')"); click('payDebt', cid);
  ck('mở cửa sổ thu nợ', el('sheetBox').innerHTML.includes('id="dAmount"'));
  setVal('dCustomer', cid); setVal('dAmount', '10000'); setVal('dDate', '2026-03-05');
  click('savePayment');
  ck('ghi nhận lần thu nợ', g('S.data.payments.length') === 1);
  ck('công nợ giảm', g('S.data.customers[0].debt') === 20000);
  ck('tính đúng số thu tối đa', g('S.data.payments[0].amount') === 10000);
  click('delPayment', g('S.data.payments[0].id'));
  ck('xóa lần thu nợ', g('S.data.payments.length') === 0);
  ck('hoàn lại công nợ', g('S.data.customers[0].debt') === 30000);

  console.log('== Chi phí ==');
  g("go('expenses')");
  click('addExpense');
  ck('mở cửa sổ thêm chi phí', el('sheetBox').innerHTML.includes('id="eName"'));
  setVal('eName', 'Tiền điện'); setVal('eAmount', '1200000'); setVal('eDate', '2026-03-04');
  click('saveExpense');
  ck('lưu chi phí', g('S.data.expenses.length') === 1);
  ck('số tiền chi phí đúng', g('S.data.expenses[0].amount') === 1200000);
  const eid = g('S.data.expenses[0].id');
  await sleep(80);
  click('printExpense', eid);
  await sleep(80);
  ck('in phiếu chi phí', printed[printed.length - 1].includes('PHIẾU CHI PHÍ'));
  click('editExpense', eid);
  setVal('eId', eid); setVal('eName', 'Tiền điện tháng 3'); click('saveExpense', eid);
  ck('sửa chi phí', g('S.data.expenses[0].name') === 'Tiền điện tháng 3');
  confirmAnswer = false; click('delExpense', eid);
  ck('hủy xóa chi phí', g('S.data.expenses.length') === 1);
  confirmAnswer = true; click('delExpense', eid);
  ck('xóa chi phí', g('S.data.expenses.length') === 0);

  console.log('== Sổ sách và in ấn ==');
  g("go('book')");
  const month = new Date().toISOString().slice(0, 7);
  setVal('bookMonth', month); dispatch('input', { id:'bookMonth', value:month });
  ck('đổi tháng xem sổ', g('S.bookMonth') === month);
  ck('sổ có lịch sử bán hàng', el('app').innerHTML.includes('Lịch sử bán hàng'));
  ck('sổ có lịch sử chi phí', el('app').innerHTML.includes('Lịch sử chi phí'));
  click('exportBook');
  await sleep(20);
  ck('xuất tệp CSV', downloads.length > 0);
  ck('tên tệp CSV đúng tháng', lastAnchor.download === 'sach-' + month + '.csv');
  ck('CSV có dòng tiêu đề', downloads[downloads.length - 1].text.includes('"Ngày","Khách hàng"'));
  click('printBook');
  await sleep(80);
  ck('in bảng kê doanh thu', printed[printed.length - 1].includes('BẢNG KÊ DOANH THU'));
  click('printInvoice', g('S.data.invoices[0].id'));
  await sleep(80);
  ck('in lại phiếu bán cũ', printed[printed.length - 1].includes('PHIẾU BÁN HÀNG'));
  g("go('tax')");
  click('printTax');
  await sleep(80);
  ck('in tư vấn thuế', printed[printed.length - 1].includes('TƯ VẤN THUẾ'));
  ck('bản in có hai cách tính', printed[printed.length - 1].includes('cách A') && printed[printed.length - 1].includes('cách B'));

  console.log('== Chính sách thuế ==');
  g("go('policy')");
  ck('màn chính sách có ô ngưỡng', el('app').innerHTML.includes('id="pThreshold"'));
  setVal('pThreshold', '200000000'); setVal('pPeriod', 'month');
  setVal('pBracketBase', 'income'); setVal('pVat0', '1'); setVal('pVat1', '5');
  setVal('pTncn0', '0.5'); setVal('pTncn1', '2');
  setCheck('pReduce30', true); setVal('pReduceLimit', '10000000000');
  setVal('pReduceYears', '2026, 2027');
  setVal('pBracket1Max', '3000000000'); setVal('pBracket1Rate', '15');
  setVal('pBracket2Max', '50000000000'); setVal('pBracket2Rate', '17');
  setVal('pBracket3Rate', '20');
  click('savePolicy');
  ck('lưu ngưỡng doanh thu', g('P().threshold') === 200000000);
  ck('lưu thuế suất GTGT', g('P().vat.goods') === 1 && g('P().vat.service') === 5);
  ck('lưu thuế suất TNCN', g('P().tncn.goods') === 0.5 && g('P().tncn.service') === 2);
  ck('lưu bậc thuế', g('P().brackets[0].rate') === 15 && g('P().brackets[2].rate') === 20);
  ck('lưu các năm giảm thuế', g('P().reduceYears.join("-")') === '2026-2027');
  ck('lưu cờ giảm 30%', g('P().reduce30') === true);
  confirmAnswer = false; click('resetPolicy');
  ck('hủy khôi phục mặc định', g('P().threshold') === 200000000);
  confirmAnswer = true; click('resetPolicy');
  ck('khôi phục mặc định', g('P().threshold') === 0);
  g("go('policy')");
  setVal('pThreshold', '200000000'); setVal('pVat0', '1'); setVal('pVat1', '5');
  setVal('pTncn0', '0.5'); setVal('pTncn1', '2'); setVal('pBracketBase', 'income');
  setCheck('pReduce30', true); setVal('pReduceYears', '2026, 2027');
  setVal('pBracket1Max', '3000000000'); setVal('pBracket1Rate', '15');
  setVal('pBracket2Max', '50000000000'); setVal('pBracket2Rate', '17');
  setVal('pBracket3Rate', '20'); click('savePolicy');
  ck('đặt lại ngưỡng để tính thuế', g('P().threshold') === 200000000);

  console.log('== Nhiều hộ kinh doanh ==');
  g("go('menu')");
  click('switchHH');
  ck('mở danh sách hộ', el('sheetBox').innerHTML.includes('Chọn hộ kinh doanh'));
  click('addHH');
  ck('mở cửa sổ thêm hộ', el('sheetBox').innerHTML.includes('id="hhNameInput"'));
  setVal('hhNameInput', 'Hộ kinh doanh B'); setVal('hhTax', '9876543210');
  setVal('hhOwner', 'Anh B'); setVal('hhAddress', '01 Đường X');
  setVal('hhGroup', 'service'); click('saveHH');
  ck('thêm hộ thứ hai', g('S.data.households.length') === 2);
  ck('chuyển sang hộ mới', g('hh().name') === 'Hộ kinh doanh B');
  ck('hộ mới chưa có hàng', g('S.data.products.filter(p => p.hid === S.hid).length') === 0);
  click('switchHH');
  const h1 = g('S.data.households[0].id'), h2 = g('S.data.households[1].id');
  ck('danh sách có cả hai hộ', el('sheetBox').innerHTML.includes('Hộ kinh doanh A') && el('sheetBox').innerHTML.includes('Hộ kinh doanh B'));
  click('pickHH', h1);
  ck('chuyển về hộ cũ', g('S.hid') === h1 && g('hh().name') === 'Hộ kinh doanh A');
  confirmAnswer = false; click('switchHH'); click('delHH', h2);
  ck('hủy xóa hộ', g('S.data.households.length') === 2);
  confirmAnswer = true;

  console.log('== Lưu trữ và sao lưu ==');
  g('saveAll()');
  await sleep(260);
  ck('ghi dữ liệu vào bộ nhớ', !!store.hkd1);
  const saved = JSON.parse(store.hkd1);
  ck('bản lưu có hai hộ', saved.households.length === 2);
  ck('bản lưu có phiếu bán', saved.invoices.length === 2);
  const reload = g('Persist.load()');
  ck('đọc lại dữ liệu', reload && typeof reload.then === 'function');
  click('backup');
  await sleep(20);
  const backup = downloads[downloads.length - 1];
  ck('tạo tệp sao lưu JSON', !!backup && backup.type.includes('json'));
  const obj = JSON.parse(backup.text);
  ck('tệp sao lưu đúng định dạng', obj.app === 'quan-ly-hkd' && obj.version === 1);
  ck('tệp sao lưu có dữ liệu', obj.data.households.length === 2);
  ck('ghi thời điểm sao lưu', !!g('S.data.settings.backupAt'));
  click('restore');
  ck('mở cửa sổ nhập dữ liệu', el('sheetBox').innerHTML.includes('id="restoreFile"'));
  const bad = el('restoreFile'); bad.files = [{ content: '{"x":1}' }];
  click('doRestore');
  ck('từ chối tệp sai định dạng', el('toast').textContent.includes('Tệp không hợp lệ'));
  const good = el('restoreFile'); good.files = [{ content: backup.text }];
  confirmAnswer = false; click('doRestore');
  ck('hủy nhập khi người dùng từ chối', g('S.data.households.length') === 2);
  confirmAnswer = true; click('doRestore');
  ck('nhập lại dữ liệu', g('S.data.households.length') === 2);
  ck('dữ liệu sau nhập đúng', g('hh().name') === 'Hộ kinh doanh A');

  console.log('== Vẽ mọi màn hình ==');
  const routes = {
    setup:'Cài đặt lần đầu', home:'Doanh thu tháng này', sell:'Bán hàng',
    products:'Quản lý hàng hóa', book:'Sổ sách', tax:'Tính thuế ước tính',
    customers:'Khách hàng', expenses:'Chi phí', policy:'Chính sách thuế',
    menu:'Menu', help:'Trợ giúp'
  };
  for (const r of Object.keys(routes)){
    g('go(' + JSON.stringify(r) + ')');
    ck('màn ' + r + ' vẽ ra nội dung', el('app').innerHTML.includes(routes[r]));
  }
  ck('màn lạ quay về hôm nay', (g("go('khong-co-that')"), g('S.route') === 'home'));
  ck('thanh dưới có 5 mục', tabEls.length === 5);
  ck('thanh dưới đủ tên', ['home','sell','book','tax','menu'].every(r => tabEls.some(b => b.dataset.route === r)));

  console.log('== Số liệu thuế theo ví dụ ==');
  g('S.data.invoices = []; S.data.expenses = []; S.data.taxpay = [];');
  const addInv = (ymd, lines, discount) => {
    const sub = lines.reduce((a, l) => a + l.qty * l.price, 0);
    g('S.data.invoices.push(' + JSON.stringify({ id:'inv-' + ymd + '-' + Math.random(), hid:h1, date:ymd,
      lines, subtotal:sub, discount:discount || 0, total:sub - (discount || 0), pay:'cash', customer:'A' }) + ')');
  };
  const line = (group, qty, price) => ({ pid:'p', name:'hàng', group, qty, price });
  ck('dưới ngưỡng thì thuế bằng 0', (addInv('2026-01-05', [line('goods', 1, 100000000)]),
    g('taxCalc(S.hid, 2026, 1).vat') === 0));
  g('S.data.invoices = [];');
  addInv('2026-02-10', [line('goods', 1, 300000000)]);
  ck('vượt ngưỡng tính GTGT 1%', g('taxCalc(S.hid, 2026, 2).vat') === 3000000);
  ck('vượt ngưỡng mới tính TNCN cách B', g('taxCalc(S.hid, 2026, 2).allowB') === true);
  ck('TNCN cách B tính trên phần vượt ngưỡng, giảm 30%', g('taxCalc(S.hid, 2026, 2).tncnB') === 350000);
  addInv('2026-02-20', [line('goods', 1, 300000000)]);
  ck('tháng bằng năm khi chọn cả năm', g('taxCalc(S.hid, 2026, 0).revPeriod') === g('taxCalc(S.hid, 2026, 0).revYear'));
  ck('có ghi chú khi doanh thu trên 3 tỷ', (addInv('2026-03-01', [line('goods', 1, 3000000000)]),
    g('taxCalc(S.hid, 2026, 3).branchNote.length') > 0));
  ck('trên 3 tỷ thì không dùng cách B', g('taxCalc(S.hid, 2026, 3).allowB') === false);
  g('S.taxYear = 2026; S.taxMonth = 2;');
  g("go('tax')");
  click('saveTaxPay');
  ck('mở cửa sổ ghi số đã nộp', el('sheetBox').innerHTML.includes('id="tAmount"'));
  setVal('tAmount', '1000000'); setVal('tDate', '2026-02-28');
  click('doSaveTaxPay');
  ck('lưu số đã nộp', g('S.data.taxpay.length') === 1 && g('S.data.taxpay[0].amount') === 1000000);
  ck('số kỳ được lưu', g('S.data.taxpay[0].month') === 2);

  console.log('== Kiểm tra cấu trúc điều hướng ==');
  const viewKeys = [...code.matchAll(/VIEWS\.(\w+)\s*=\s*function/g)].map(m => m[1]);
  ck('có đủ màn hình chính', ['setup','home','sell','products','book','tax','customers','expenses','policy','menu','help']
    .every(k => viewKeys.includes(k)));
  const navRoutes = [...viewsHtml.matchAll(/nav\('(\w+)'/g)].map(m => m[1]).concat(
    [...shellHtml.matchAll(/data-route="(\w+)"/g)].map(m => m[1]));
  ck('mọi mục Menu trỏ tới màn có thật', navRoutes.every(r => viewKeys.includes(r) || r === 'setup'));
  ck('Menu có bốn mục quản lý', ['products','customers','expenses','policy'].every(r => navRoutes.includes(r)));
  const acts = new Set([...viewsHtml.matchAll(/data-act="(\w+)"/g)].map(m => m[1])
    .concat([...viewsHtml.matchAll(/item\('(\w+)'/g)].map(m => m[1])));
  const cases = new Set([...code.matchAll(/case '(\w+)':/g)].map(m => m[1]));
  const missing = [...acts].filter(a => !cases.has(a));
  ck('mọi nút đều có xử lý (' + missing.join(',') + ')', missing.length === 0);
  ['sellSearch','prodSearch','bookMonth','taxYear','taxMonth'].forEach(id =>
    ck('ô ' + id + ' có bộ lọc nhập liệu', code.includes("t.id === '" + id + "'")));
  ck('xử lý tab dưới cùng', code.includes('tab.dataset.route'));
  ck('không vẽ trùng hai lần lúc nạp', !/render\(\);\s*render\(\);/.test(code));
  ck('có hàm tính thuế và in tư vấn', code.includes('function taxCalc(') && code.includes("case 'printTax':"));

  console.log('== Phím tắt ==');
  dispatch('keydown', { key:'2', altKey:true });
  ck('Alt+2 mở bán hàng', g('S.route') === 'sell');
  click('addPayment');
  dispatch('keydown', { key:'Escape', altKey:false });
  ck('Esc đóng cửa sổ', !el('sheet').classList.contains('on'));
  dispatch('keydown', { key:'5', altKey:true });
  ck('Alt+5 mở Menu', g('S.route') === 'menu');

  console.log('\n' + pass + ' điều đúng, ' + fail + ' điều sai');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('✗ LỖI CHẠY:', e && e.stack || e); process.exit(1); });
