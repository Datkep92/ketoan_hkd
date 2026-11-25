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
  setVal('gMinStock', '5'); click('saveProduct');
  ck('lưu mặt hàng thứ nhất', g('S.data.products.length') === 1);
  ck('tên hàng đúng', g('S.data.products[0].name') === 'Gạo');
  ck('giá bán đúng', g('S.data.products[0].price') === 25000);
  ck('nhóm thuế đúng', g('S.data.products[0].group') === 'goods');
  ck('tồn kho đúng', g('S.data.products[0].stock') === 100);
  ck('mức tối thiểu đúng', g('S.data.products[0].minStock') === 5);
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

  console.log('== Mua hàng, nhà cung cấp và tồn kho ==');
  g("go('purchases')");
  ck('màn mua có nút tạo phiếu', el('app').innerHTML.includes('data-act="addPurchase"'));
  click('addPurchase');
  ck('mở cửa sổ phiếu nhập', el('sheetBox').innerHTML.includes('id="plName0"'));
  setVal('purSupplier', 'Công ty ABC'); setVal('purDate', g('todayISO()')); setVal('purPay', 'debt');
  setVal('plName0', 'Gạo'); setVal('plQty0', '10'); setVal('plPrice0', '15000');
  setVal('plName1', 'Bột mì'); setVal('plQty1', '5'); setVal('plPrice1', '20000');
  click('savePurchase');
  ck('lưu phiếu nhập', g('S.data.purchases.length') === 1);
  ck('mã phiếu nhập tự tăng', g('S.data.purchases[0].code') === 'PN001');
  ck('tổng phiếu nhập', g('S.data.purchases[0].total') === 250000);
  ck('cộng tồn hàng cũ', g('S.data.products[0].stock') === 109);
  ck('giá vốn bình quân', g('S.data.products[0].cost') === 17725);
  ck('tạo hàng mới khi nhập', g('S.data.products.length') === 3 && g('S.data.products[2].name') === 'Bột mì');
  ck('tạo nhà cung cấp', g('S.data.suppliers.length') === 1 && g('S.data.suppliers[0].name') === 'Công ty ABC');
  ck('ghi nợ nhà cung cấp', g('S.data.suppliers[0].debt') === 250000);
  const pur1 = g('S.data.purchases[0].id'), sup1 = g('S.data.suppliers[0].id');
  await sleep(80); click('printPurchase', pur1); await sleep(80);
  ck('in phiếu nhập', printed[printed.length - 1].includes('PHIẾU NHẬP HÀNG'));
  g("go('suppliers')");
  ck('danh sách nhà cung cấp', el('app').innerHTML.includes('Công ty ABC'));
  click('paySupplier', sup1);
  ck('mở cửa sổ trả nợ', el('sheetBox').innerHTML.includes('id="spAmount"'));
  setVal('spId', sup1); setVal('spAmount', '100000'); setVal('spDate', '2026-03-06'); click('doPaySupplier');
  ck('ghi nhận trả nợ nhà cung cấp', g('S.data.supplierPayments.length') === 1);
  ck('giảm công nợ nhà cung cấp', g('S.data.suppliers[0].debt') === 150000);
  g("go('stock')");
  ck('màn tồn có giá trị ước tính', el('app').innerHTML.includes('Giá trị tồn ước tính'));
  click('stockAdjust', pid1);
  setVal('adjId', pid1); setVal('adjStock', '3'); setVal('adjReason', 'kiểm kê tháng 3'); click('saveStockAdj');
  ck('kiểm kê đổi tồn', g('S.data.products[0].stock') === 3);
  ck('ghi lịch sử kiểm kê', g('S.data.stockAdj.length') === 1 && g('S.data.stockAdj[0].delta') === -106);
  ck('cảnh báo tồn dưới mức tối thiểu', g('lowStocks().length') === 1);
  g("go('home')");
  ck('trang chủ hiện cảnh báo tồn', el('app').innerHTML.includes('mặt hàng tồn dưới mức tối thiểu'));
  g("go('stock')"); click('delStockAdj', g('S.data.stockAdj[0].id'));
  ck('bỏ kiểm kê thì hoàn tồn', g('S.data.products[0].stock') === 109);
  click('addPurchase'); setVal('purSupplier', 'Công ty ABC'); setVal('purPay', 'cash');
  setVal('plName0', 'Bột mì'); setVal('plQty0', '3'); setVal('plPrice0', '20000');
  setVal('plName1', ''); setVal('plQty1', '0'); setVal('plPrice1', '');
  click('savePurchase');
  ck('lưu phiếu nhập tiền mặt', g('S.data.purchases.length') === 2 && g('S.data.purchases[1].pay') === 'cash');
  ck('phiếu mới cộng tồn', g('S.data.products[2].stock') === 8);
  const pur2 = g('S.data.purchases[1].id');
  click('delPurchase', pur2);
  ck('xóa phiếu nhập', g('S.data.purchases.length') === 1);
  ck('xóa phiếu hoàn tồn', g('S.data.products[2].stock') === 5);
  g("go('home')"); setVal('cashStart', '500000'); click('saveCashStart');
  ck('lưu số dư đầu kỳ', g('S.data.settings.cashStart') === 500000);
  ck('quỹ tiền mặt ước tính', g('cashOnHand()') === 420000);
  confirmAnswer = true; click('returnPurchase', pur1);
  ck('đánh dấu trả hàng', g('S.data.purchases[0].returned') === true);
  ck('trả hàng hoàn tồn', g('S.data.products[0].stock') === 99);
  ck('trả hàng hoàn công nợ', g('S.data.suppliers[0].debt') === 0);

  console.log('== Sản xuất, tính giá thành ==');
  g("go('production')");
  ck('màn sản xuất có nút thêm', el('app').innerHTML.includes('data-act="addProduction"'));
  click('addProduction');
  ck('mở cửa sổ lô sản xuất', el('sheetBox').innerHTML.includes('id="prQty"'));
  const fgStock = g('S.data.products[0].stock'), rmStock = g('S.data.products[2].stock');
  const matPid = g('S.data.products[2].id');
  setVal('prDate', g('todayISO()')); setVal('prProduct', pid1); setVal('prQty', '10');
  setVal('prM1Pid', matPid); setVal('prM1Name', ''); setVal('prM1Qty', '2'); setVal('prM1Price', '20000');
  setVal('prLabor', '50000'); setVal('prOverhead', '10000');
  click('saveProduction');
  ck('lưu lô sản xuất', g('S.data.production.length') === 1);
  ck('mã lô tự tăng', g('S.data.production[0].code') === 'SX001');
  const batchId = g('S.data.production[0].id');
  ck('tính đúng tiền nguyên liệu', g('prodBatchCost(S.data.production[0]).materials') === 40000);
  ck('tính đúng thành tiền', g('prodBatchCost(S.data.production[0]).total') === 100000);
  ck('đơn giá thành phẩm', g('prodBatchCost(S.data.production[0]).unit') === 10000);
  ck('đã nhập kho thành phẩm', g('S.data.production[0].applied') === true);
  ck('cộng tồn thành phẩm', g('S.data.products[0].stock') === fgStock + 10);
  ck('trừ tồn nguyên liệu (không âm)', g('S.data.products[2].stock') === Math.max(0, rmStock - 2));
  ck('chi phí sản xuất lũy kế', g('productionCostYear(S.hid, new Date().getFullYear())') === 100000);
  ck('chi phí sản xuất vào thuế cách A',
    g('taxCalc(S.hid, new Date().getFullYear(), 0).expAll') === g('taxCalc(S.hid, new Date().getFullYear(), 0).expYear') + 100000);
  await sleep(80); click('printProduction', batchId); await sleep(80);
  ck('in phiếu sản xuất', printed[printed.length - 1].includes('PHIẾU SẢN XUẤT'));

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
  click('bookInfo', 's1c');
  ck('xem trước sổ mua hàng', el('sheetBox').innerHTML.includes('Sổ mua hàng và chi phí'));
  ck('sổ mua hàng có phiếu nhập', el('sheetBox').innerHTML.includes('PN001'));
  click('bookPrint', 's1c');
  await sleep(80);
  ck('in sổ mua hàng', printed[printed.length - 1].includes('SỔ MUA HÀNG VÀ CHI PHÍ'));
  click('bookExport', 's1c');
  await sleep(20);
  ck('xuất sổ ra tệp Excel', lastAnchor.download === 'so-s1c-' + month + '.xml');
  click('closeSheet');
  click('printInvoice', g('S.data.invoices[0].id'));
  await sleep(80);
  ck('in lại phiếu bán cũ', printed[printed.length - 1].includes('PHIẾU BÁN HÀNG'));
  g("go('tax')");
  click('printTax');
  await sleep(80);
  ck('in tư vấn thuế', printed[printed.length - 1].includes('TƯ VẤN THUẾ'));
  ck('bản in có hai cách tính', printed[printed.length - 1].includes('cách A') && printed[printed.length - 1].includes('cách B'));

  console.log('== Tờ khai 01/CNKD ==');
  ck('màn thuế có lối lên tờ khai', el('app').innerHTML.includes('data-route="declaration"'));
  g("go('declaration')");
  ck('màn tờ khai có đúng mẫu', el('app').innerHTML.includes('Mẫu số 01/CNKD'));
  ck('tờ khai có đủ chỉ tiêu',
    ['[08]','[09]','[10]','[11]','[12]','[13]','[14]','[18]','[19]','[20]'].every(x => el('app').innerHTML.includes(x)));
  setVal('declYear', '2026'); dispatch('input', { id:'declYear', value:'2026' });
  setVal('declMethod', 'A'); dispatch('input', { id:'declMethod', value:'A' });
  ck('đổi cách tính TNCN trên tờ khai', g('S._declMethod') === 'A');
  ck('tờ khai có sáu nhóm ngành', g("declarationData(S.hid, 2026, S.taxMonth, 'A').groups.length") === 6);
  ck('tổng doanh thu tờ khai khớp tính thuế',
    g("declarationData(S.hid, 2026, S.taxMonth, 'A').totals.rev") === g('taxCalc(S.hid, 2026, S.taxMonth).revPeriod'));
  const vatTruoc = g("declarationData(S.hid, 2026, S.taxMonth, 'A').groups[0].vat");
  setVal('dEx_goods', '1000'); dispatch('input', { id:'dEx_goods', value:'1000' });
  click('saveDeclAdj');
  ck('lưu điều chỉnh doanh thu không chịu thuế',
    g("declAdjGet(S.hid, 2026, S.taxMonth, 'goods').exempt") === 1000);
  ck('điều chỉnh làm giảm thuế GTGT',
    g("declarationData(S.hid, 2026, S.taxMonth, 'A').groups[0].vat") < vatTruoc);
  click('printDeclaration'); await sleep(80);
  ck('in tờ khai 01/CNKD', printed[printed.length - 1].toUpperCase().includes('MẪU SỐ 01/CNKD')
    && printed[printed.length - 1].includes('không thay thế tờ khai chính thức'));
  click('exportDeclaration'); await sleep(20);
  ck('xuất JSON tờ khai', lastAnchor.download.startsWith('to-khai-01-CNKD-'));
  ck('JSON tờ khai có số liệu', downloads[downloads.length - 1].text.includes('"totals"'));
  click('delProduction', batchId);
  ck('xóa lô sản xuất', g('S.data.production.length') === 0);
  ck('xóa lô hoàn tồn thành phẩm', g('S.data.products[0].stock') === fgStock);
  ck('xóa lô hoàn tồn nguyên liệu', g('S.data.products[2].stock') === rmStock);

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

  console.log('== Cổng dữ liệu hóa đơn ==');
  g("go('data')");
  ck('màn cổng có ô dán dữ liệu', el('app').innerHTML.includes('id="bridgeInput"'));
  click('bridgeSampleSale');
  ck('điền mẫu hóa đơn bán', el('bridgeInput').value.includes('HD-BR-001'));
  click('bridgePreview');
  ck('xem trước dữ liệu mẫu bán', el('bridgeOut').innerHTML.includes('HD-BR-001'));
  click('bridgeImport');
  await sleep(20);
  ck('nạp hóa đơn bán từ JSON', g('S.data.invoices.length') === 3);
  click('bridgeSamplePur');
  click('bridgePreview');
  ck('xem trước dữ liệu mẫu mua', el('bridgeOut').innerHTML.includes('PN-BR-001'));
  click('bridgeImport');
  await sleep(20);
  ck('nạp hóa đơn mua từ JSON', g('S.data.purchases.length') === 2);
  click('bridgeImport');
  ck('từ chối mã chứng từ trùng', el('bridgeOut').innerHTML.includes('đã tồn tại'));
  setVal('bridgeKind', 'sale'); click('bridgeExportJson');
  await sleep(20);
  const bridgeJson = downloads[downloads.length - 1].text;
  ck('xuất JSON có định dạng riêng', JSON.parse(bridgeJson).app === 'quan-ly-hkd');
  ck('xuất JSON có đủ phiếu', JSON.parse(bridgeJson).invoices.length === 3);
  click('bridgeExportXml');
  await sleep(20);
  ck('xuất XML có thẻ hóa đơn', downloads[downloads.length - 1].text.includes('<invoice>'));

  console.log('== Vẽ mọi màn hình ==');
  const routes = {
    setup:'Cài đặt lần đầu', home:'Doanh thu tháng này', sell:'Bán hàng',
    products:'Quản lý hàng hóa', purchases:'Phiếu nhập hàng', suppliers:'Nhà cung cấp',
    stock:'Tồn kho', data:'Cổng dữ liệu hóa đơn', book:'Sổ sách', tax:'Tính thuế ước tính',
    customers:'Khách hàng', expenses:'Chi phí', policy:'Chính sách thuế',
    production:'Quản lý sản xuất', declaration:'Mẫu số 01/CNKD', menu:'Menu', help:'Trợ giúp'
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
  ck('có đủ màn hình chính', ['setup','home','sell','products','purchases','suppliers','stock','data',
    'book','tax','customers','expenses','policy','production','declaration','menu','help'].every(k => viewKeys.includes(k)));
  const navRoutes = [...viewsHtml.matchAll(/nav\('(\w+)'/g)].map(m => m[1]).concat(
    [...shellHtml.matchAll(/data-route="(\w+)"/g)].map(m => m[1]));
  ck('mọi mục Menu trỏ tới màn có thật', navRoutes.every(r => viewKeys.includes(r) || r === 'setup'));
  ck('Menu có đủ mục quản lý', ['products','customers','expenses','policy','production'].every(r => navRoutes.includes(r)));
  ck('Menu có lối vào tờ khai', navRoutes.includes('declaration'));
  const acts = new Set([...viewsHtml.matchAll(/data-act="(\w+)"/g)].map(m => m[1])
    .concat([...viewsHtml.matchAll(/item\('(\w+)'/g)].map(m => m[1])));
  const cases = new Set([...code.matchAll(/case '(\w+)':/g)].map(m => m[1]));
  const missing = [...acts].filter(a => !cases.has(a));
  ck('mọi nút đều có xử lý (' + missing.join(',') + ')', missing.length === 0);
  ['sellSearch','prodSearch','bookMonth','taxYear','taxMonth','declYear','declMonth','declMethod'].forEach(id =>
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
  dispatch('keydown', { key:'6', altKey:true });
  ck('Alt+6 mở Mua hàng', g('S.route') === 'purchases');
  dispatch('keydown', { key:'7', altKey:true });
  ck('Alt+7 mở Tồn kho', g('S.route') === 'stock');
  dispatch('keydown', { key:'8', altKey:true });
  ck('Alt+8 mở Cổng dữ liệu', g('S.route') === 'data');
  dispatch('keydown', { key:'9', altKey:true });
  ck('Alt+9 mở Sản xuất', g('S.route') === 'production');
  dispatch('keydown', { key:'0', altKey:true });
  ck('Alt+0 mở Tờ khai', g('S.route') === 'declaration');

  console.log('== Dữ liệu mẫu ==');
  g("go('setup')");
  ck('màn cài đặt có nút nạp mẫu', el('app').innerHTML.includes('data-act="loadDemo"'));
  g("go('menu')");
  ck('Menu có nút nạp mẫu', el('app').innerHTML.includes('data-act="loadDemo"'));
  const beforeDemo = g('S.data.households.length');
  confirmAnswer = false; click('loadDemo');
  ck('từ chối thì giữ nguyên dữ liệu', g('S.data.households.length') === beforeDemo);
  confirmAnswer = true; click('loadDemo');
  ck('nạp mẫu xong về màn hôm nay', g('S.route') === 'home');
  ck('có hai hộ mẫu', g('S.data.households.length') === 2);
  ck('có đủ hàng hóa mẫu', g('S.data.products.length') === 13);
  ck('có đủ phiếu bán mẫu', g('S.data.invoices.length') === 28);
  ck('có đủ phiếu nhập mẫu', g('S.data.purchases.length') === 5);
  ck('có đủ khách mẫu', g('S.data.customers.length') === 6);
  ck('có đủ nhà cung cấp mẫu', g('S.data.suppliers.length') === 4);
  ck('có đủ chi phí mẫu', g('S.data.expenses.length') === 8);
  ck('có thu nợ và trả nợ mẫu', g('S.data.payments.length') === 2 && g('S.data.supplierPayments.length') === 2);
  ck('có kiểm kê và số đã nộp mẫu', g('S.data.stockAdj.length') === 1 && g('S.data.taxpay.length') === 1);
  ck('có lô sản xuất mẫu đã nhập kho', g('S.data.production.length') === 1 && g('S.data.production[0].applied') === true);
  ck('ngưỡng mẫu được áp dụng', g('P().threshold') === 50000000);
  ck('doanh thu mẫu đủ lớn để tính thuế', g('S.data.invoices.reduce((a,i) => a + i.total, 0)') > 50000000);
  ck('tính thuế chạy được với dữ liệu mẫu', g('taxCalc(S.hid, new Date().getFullYear(), 0).revYear') > 0);
  ck('có cảnh báo trên trang chủ', g('alerts().length') >= 1);
  ck('không tồn kho âm', g('S.data.products.every(p => p.stock >= 0)'));
  ck('giỏ hàng được dọn', g('S.cart.length') === 0 && g('S.purCart.length') === 0);
  g("S.hid = 'demo-h2'; render()");
  ck('chuyển sang hộ mẫu thứ hai', g('hh().name') === 'Quán cà phê Sáng sớm');
  g("S.hid = 'demo-h1'; render()");
  for (const r of Object.keys(routes)){
    g('go(' + JSON.stringify(r) + ')');
    ck('màn ' + r + ' vẽ được với dữ liệu mẫu', el('app').innerHTML.length > 100);
  }

  console.log('\n' + pass + ' điều đúng, ' + fail + ' điều sai');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('✗ LỖI CHẠY:', e && e.stack || e); process.exit(1); });
