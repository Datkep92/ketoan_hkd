#!/usr/bin/env node
/*
 * Kiểm thử tự động app/quan-ly-hkd.html — chạy bằng Node, không cần trình duyệt.
 *
 *   node Scripts/smoke_app.mjs
 *
 * Cách làm: dựng một DOM tối thiểu (đủ cho app dùng), nạp đoạn <script> trong app vào
 * một ngữ cảnh Node, rồi bấm thử các luồng chính như người dùng:
 * thiết lập hộ → hàng hóa → bán hàng → ghi nợ → thu nợ → chi phí → in → thuế →
 * cấu hình chính sách → thêm hộ thứ hai → lưu trữ → sao lưu/nhập lại → vẽ mọi màn hình.
 *
 * Kết quả: mỗi dòng "✓" là một điều đã kiểm và đúng, "✗" là lỗi (mã thoát 1).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'app', 'quan-ly-hkd.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) { console.error('Không tìm thấy đoạn <script> trong ' + htmlPath); process.exit(2); }
const code = scripts.sort((a, b) => b.length - a.length)[0];

let pass = 0;
const fails = [];
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fails.push(name + (extra ? ' — ' + extra : '')); console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
const eq = (got, want, name) => ok(String(got) === String(want), name, 'nhận ' + JSON.stringify(got) + ', mong ' + JSON.stringify(want));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Lấy các thuộc tính data-… của mọi thẻ trong một đoạn HTML. */
const attrsFromHtml = text => {
  const out = [];
  for (const m of String(text).matchAll(/<[a-zA-Z]+[^>]*>/g)) {
    if (!/data-(act|route)=/.test(m[0])) continue;
    const a = { tag: m[0].match(/^<([a-zA-Z]+)/)[1].toUpperCase() };
    for (const x of m[0].matchAll(/data-([a-zA-Z]+)="([^"]*)"/g)) a[x[1]] = x[2];
    const idm = m[0].match(/\sid="([^"]*)"/);
    a.id = idm ? idm[1] : '';
    out.push(a);
  }
  return out;
};

/* ---------------------------- DOM giả ---------------------------- */
class El {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase();
    this.id = '';
    this.value = '';
    this.checked = false;
    this.files = null;
    this.textContent = '';
    this._html = '';
    this.style = {};
    this.dataset = {};
    this.children = [];
    this._cls = new Set();
    this.classList = {
      add: (...c) => c.forEach(x => this._cls.add(x)),
      remove: (...c) => c.forEach(x => this._cls.delete(x)),
      contains: c => this._cls.has(c),
      toggle: (c, on) => { (on === undefined ? !this._cls.has(c) : on) ? this._cls.add(c) : this._cls.delete(c); }
    };
  }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); }
  addEventListener() {}
  removeEventListener() {}
  closest() { return null; }
  querySelector(sel) { return doc.querySelector(sel); }
  querySelectorAll() { return []; }
  appendChild(c) { this.children.push(c); return c; }
  remove() {}
  click() {}
  focus() {}
  blur() {}
  setSelectionRange() {}
  getContext() { return null; }
  scrollIntoView() {}
  getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; }
}

const registry = new Map();
const doc = {
  querySelector(sel) {
    if (!registry.has(sel)) {
      const e = new El();
      if (sel.startsWith('#')) e.id = sel.slice(1);
      registry.set(sel, e);
    }
    return registry.get(sel);
  },
  querySelectorAll(sel) {
    if (sel === '#tabs .tab') {
      return ['home', 'sell', 'book', 'tax', 'menu'].map(r => { const e = new El('button'); e.dataset.route = r; return e; });
    }
    return [];
  },
  getElementById(id) { return doc.querySelector('#' + id); },
  createElement(tag) { return new El(tag); },
  addEventListener(type, fn) { (doc._l[type] = doc._l[type] || []).push(fn); },
  removeEventListener() {},
  _l: {},
  body: new El('body'),
  documentElement: new El('html')
};

const store = new Map();
const localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: k => { store.delete(k); },
  clear: () => store.clear(),
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; }
};

let printCalls = 0;
let lastBlobText = '';
let confirmAnswer = true;
let promptAnswer = '';
const windowStub = { scrollTo() {}, print() { printCalls++; }, matchMedia: () => ({ matches: false, addListener() {}, addEventListener() {} }) };

class BlobStub { constructor(parts) { this.text = (parts || []).join(''); lastBlobText = this.text; } }
class FileReaderStub {
  readAsText(file) { this.result = file && file.__text != null ? file.__text : ''; setTimeout(() => { if (this.onload) this.onload(); }, 0); }
  readAsDataURL(file) { this.readAsText(file); }
}

const sandbox = {
  document: doc,
  window: windowStub,
  localStorage,
  Blob: BlobStub,
  FileReader: FileReaderStub,
  URL: { createObjectURL: () => 'blob:gia-lap', revokeObjectURL() {} },
  confirm: () => confirmAnswer,
  prompt: () => promptAnswer,
  alert: () => {},
  setTimeout, clearTimeout, setInterval, clearInterval,
  requestAnimationFrame: cb => setTimeout(cb, 0),
  navigator: { userAgent: 'node-test', language: 'vi-VN', onLine: true },
  console
};
sandbox.window.document = doc;
sandbox.window.localStorage = localStorage;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

/* ---------------------------- nạp app ---------------------------- */
let loadError = null;
try { vm.runInContext(code, ctx, { filename: 'app/quan-ly-hkd.html' }); }
catch (e) { loadError = e; }

const ev = expr => vm.runInContext(expr, ctx);
const setVal = (id, v) => { const e = doc.querySelector('#' + id); e.value = String(v); return e; };
const setChecked = (id, v) => { doc.querySelector('#' + id).checked = !!v; };
const htmlOf = sel => doc.querySelector(sel).innerHTML;
const click = async (act, data = {}) => {
  const target = { id: '', closest: () => ({ dataset: Object.assign({ act }, data) }) };
  for (const fn of doc._l.click || []) await fn({ target, preventDefault() {} });
};
const input = async (id, value) => {
  const el = doc.querySelector('#' + id); el.value = String(value);
  for (const fn of doc._l.input || []) await fn({ target: el });
};
const headName = () => String(doc.querySelector('#hhName').textContent || '');
/* Màn hình cấu hình thuế tự vẽ các ô nhập từ chính sách đang dùng. Bản giả lập không vẽ
   được HTML, nên ở đây điền sẵn đúng như màn hình thật rồi mới bấm Lưu. */
const fillPolicyForm = (over = {}) => {
  const p = JSON.parse(ev('JSON.stringify(P())'));
  for (const k of ['goods', 'service', 'produce', 'other', 'rent']) {
    setVal('pVat_' + k, p.vat[k]); setVal('pTncn_' + k, p.tncn[k]);
  }
  setVal('pThreshold', p.threshold);
  setVal('pBase', p.bracketBase);
  setVal('pRate1', p.brackets[0].rate); setVal('pRate2', p.brackets[1].rate); setVal('pRate3', p.brackets[2].rate);
  setChecked('pReduce30', p.reduce30);
  setVal('pReduceLimit', p.reduceLimit);
  setVal('pPeriod', p.period);
  for (const [k, v] of Object.entries(over)) { if (typeof v === 'boolean') setChecked(k, v); else setVal(k, v); }
};

async function section(title, fn) {
  console.log('\n' + title);
  try { await fn(); }
  catch (e) { fails.push(title + ' — lỗi khi chạy: ' + e.message); console.log('  ✗ lỗi khi chạy: ' + e.message); }
}

/* ---------------------------- nội dung kiểm ---------------------------- */
console.log('Kiểm thử app: app/quan-ly-hkd.html (' + html.length + ' ký tự)');
ok(!loadError, 'nạp script không lỗi cú pháp', loadError && loadError.message);
if (loadError) { console.log('\nKhông chạy tiếp được.'); process.exit(1); }
await sleep(80);

await section('1. Khởi động', async () => {
  ok(typeof ev('VIEWS') === 'object', 'có đối tượng màn hình VIEWS');
  ok(ev('VIEWS.setup') !== undefined, 'có màn hình thiết lập ban đầu');
  ok(htmlOf('#app').includes('Bắt đầu sử dụng'), 'mở lần đầu hiện màn hình thiết lập', htmlOf('#app').slice(0, 80));
  eq(ev('S.data.households.length'), 0, 'chưa có hộ kinh doanh nào');
  ok(htmlOf('#app').includes('1 tỷ'), 'màn hình thiết lập có sẵn mốc ngưỡng 1 tỷ để chọn');
});

await section('2. Thiết lập hộ kinh doanh đầu tiên', async () => {
  setVal('setThreshold', 1000000000);
  setVal('setName', 'Tạp hóa Bảy');
  setVal('setTax', '0312345678');
  setVal('setGroup', 'goods');
  setVal('setPeriod', 'month');
  await click('doSetup');
  eq(ev('S.data.households.length'), 1, 'đã tạo 1 hộ kinh doanh');
  eq(ev('S.data.policy.threshold'), 1000000000, 'ngưỡng doanh thu đã lưu đúng 1 tỷ');
  ok(!!ev('S.hid'), 'hộ đang làm việc đã được chọn');
  ok(headName().includes('Tạp hóa Bảy'), 'tên hộ hiện ở đầu trang', 'nhận ' + JSON.stringify(headName()));
  eq(ev('S.data.settings.onboarded'), true, 'đã đánh dấu hoàn tất thiết lập');
});

await section('3. Hàng hóa', async () => {
  await click('route', { route: 'sell' });
  await click('addProduct');
  setVal('g_name', 'Nước ngọt lon');
  setVal('g_unit', 'lon');
  setVal('g_price', '10000');
  setVal('g_cost', '7000');
  setVal('g_stock', '100');
  setVal('g_group', 'goods');
  await click('saveProduct');
  eq(ev('S.data.products.length'), 1, 'đã lưu 1 mặt hàng');
  eq(ev('S.data.products[0].price'), 10000, 'giá bán đúng');
  eq(ev('S.data.products[0].stock'), 100, 'tồn kho ban đầu đúng');
  const pid = ev('S.data.products[0].id');
  await click('add', { id: pid });
  eq(ev('S.cart.length'), 1, 'bấm mặt hàng là vào giỏ');
  await click('inc', { i: '0' });
  eq(ev('S.cart[0].qty'), 2, 'nút + tăng số lượng');
  await click('dec', { i: '0' });
  eq(ev('S.cart[0].qty'), 1, 'nút − giảm số lượng');
});

await section('4. Bán hàng — thu tiền mặt', async () => {
  await click('checkout');
  ok(htmlOf('#sheetBox').includes('Thu tiền'), 'mở được ô thu tiền');
  setVal('c_discount', '5000');
  setVal('c_method', 'cash');
  setVal('c_cust', '');
  setVal('c_note', 'bán thử');
  await click('saveInvoice');
  eq(ev('S.data.invoices.length'), 1, 'đã lưu 1 hóa đơn');
  eq(ev('S.data.invoices[0].total'), 5000, 'tổng tiền = giá bán trừ giảm giá');
  eq(ev('S.data.invoices[0].code'), 'HD001', 'mã hóa đơn tự tăng');
  eq(ev('S.data.products[0].stock'), 99, 'tồn kho tự trừ khi bán');
  eq(ev('S.cart.length'), 0, 'giỏ hàng tự xóa sau khi lưu');
  ok(htmlOf('#print').includes('không thay thế hóa đơn điện tử'), 'phiếu bán hàng đã được dựng để in');
  await sleep(90);
  ok(printCalls > 0, 'đã gọi lệnh in sau khi lưu hóa đơn');
});

await section('5. Khách hàng — ghi nợ và thu nợ', async () => {
  await click('addCustomer');
  setVal('k_name', 'Chị Lan');
  setVal('k_phone', '0900111222');
  setVal('k_debt', '0');
  await click('saveCustomer');
  eq(ev('S.data.customers.length'), 1, 'đã thêm khách hàng');
  const cid = ev('S.data.customers[0].id');

  await click('route', { route: 'sell' });
  await click('add', { id: ev('S.data.products[0].id') });
  await click('checkout');
  setVal('c_discount', '0');
  setVal('c_method', 'debt');
  setVal('c_cust', cid);
  await click('saveInvoice');
  eq(ev('S.data.customers[0].debt'), 10000, 'ghi nợ cộng vào công nợ khách');
  eq(ev('S.data.invoices.length'), 2, 'hóa đơn ghi nợ đã lưu');

  await click('route', { route: 'customers' });
  ok(htmlOf('#app').includes('Chị Lan'), 'màn hình khách nợ hiện tên khách');
  await click('payDebt', { id: cid });
  setVal('d_amount', '4000');
  await click('savePay', { id: cid });
  eq(ev('S.data.customers[0].debt'), 6000, 'thu nợ trừ đúng số tiền');
  eq(ev('S.data.payments.length'), 1, 'có ghi lại phiếu thu nợ');
});

await section('6. Chi phí', async () => {
  await click('route', { route: 'expenses' });
  await click('addExpense');
  setVal('e_cat', 'mặt bằng');
  setVal('e_amount', '500000');
  setVal('e_note', 'tháng này');
  await click('saveExpense');
  eq(ev('S.data.expenses.length'), 1, 'đã lưu chi phí');
  eq(ev('S.data.expenses[0].amount'), 500000, 'số tiền chi phí đúng');
  await click('delExpense', { id: ev('S.data.expenses[0].id') });
  eq(ev('S.data.expenses.length'), 0, 'xóa được chi phí');
  await click('addExpense');
  setVal('e_cat', 'mặt bằng'); setVal('e_amount', '500000');
  await click('saveExpense');
});

await section('7. Sổ sách và bảng in', async () => {
  await click('route', { route: 'book' });
  ok(htmlOf('#app').includes('HD001'), 'sổ sách liệt kê hóa đơn');
  await click('printBook');
  ok(htmlOf('#print').includes('BẢNG KÊ DOANH THU'), 'in được bảng kê doanh thu');
  await click('printInvoice', { id: ev('S.data.invoices[0].id') });
  ok(htmlOf('#print').includes('Nước ngọt lon'), 'in lại được một hóa đơn cũ');
  await click('route', { route: 'tax' });
  ok(htmlOf('#app').includes('GTGT phải nộp'), 'màn hình thuế hiện số thuế GTGT');
  await click('printTax');
  ok(htmlOf('#print').includes('BẢNG TÍNH THUẾ'), 'in được bảng tính thuế');
  setVal('taxYear', 2026); await input('taxYear', 2026);
  setVal('taxMonth', 0); await input('taxMonth', 0);
  eq(ev('S.taxYear'), 2026, 'đổi năm tính thuế được');
});

await section('8. Cấu hình chính sách thuế', async () => {
  await click('route', { route: 'policy' });
  fillPolicyForm({ pThreshold: 500000000 });
  await click('savePolicy');
  eq(ev('S.data.policy.threshold'), 500000000, 'lưu được ngưỡng mới');
  eq(ev('S.data.policy.vat.goods'), 1, 'lưu cấu hình không làm mất tỷ lệ GTGT hàng hóa 1%');
  eq(ev('S.data.policy.tncn.service'), 2, 'lưu cấu hình không làm mất tỷ lệ TNCN dịch vụ 2%');
  eq(ev('S.data.policy.bracketBase'), 'income', 'cách tính bậc giữ nguyên là thu nhập sau chi phí');
  eq(ev('S.data.policy.brackets[0].rate'), 15, 'bậc 1 giữ 15%');
  eq(ev('S.data.policy.reduce30'), true, 'giảm 30% vẫn bật sau khi lưu');
  eq(ev('S.data.policy.reduceYears.join()'), '2026,2027', 'năm áp dụng giảm 30% giữ nguyên');

  await click('preset', { v: '1000000000' });
  eq(doc.querySelector('#pThreshold').value, '1000000000', 'nút chọn nhanh 1 tỷ điền vào ô ngưỡng');
  await click('savePolicy');
  eq(ev('S.data.policy.threshold'), 1000000000, 'bấm Lưu sau khi chọn nhanh thì ngưỡng thành 1 tỷ');
  await click('preset', { v: '500000000' });
  await click('savePolicy');
  eq(ev('S.data.policy.threshold'), 500000000, 'chọn nhanh 500 triệu cũng lưu được');

  confirmAnswer = true;
  await click('resetPolicy');
  eq(ev('S.data.policy.threshold'), 0, 'khôi phục mặc định trả ngưỡng về 0');
  eq(ev('S.data.policy.vat.goods'), 1, 'khôi phục mặc định trả lại tỷ lệ thuế gốc');
  fillPolicyForm({ pThreshold: 1000000000 });
  await click('savePolicy');
  eq(ev('S.data.policy.threshold'), 1000000000, 'đặt lại ngưỡng 1 tỷ');
});

await section('9. Nhiều hộ kinh doanh', async () => {
  await click('route', { route: 'menu' });
  await click('addHH');
  setVal('f_name', 'Quán ăn Cô Tư');
  setVal('f_owner', 'Trần Thị Tư');
  setVal('f_group', 'service');
  setVal('f_addr', '12 Lê Lợi');
  await click('saveHH');
  eq(ev('S.data.households.length'), 2, 'đã thêm hộ thứ hai');
  await click('switchHH');
  ok(htmlOf('#sheetBox').includes('Quán ăn Cô Tư'), 'danh sách chuyển hộ có hộ mới');
  const h2 = ev('S.data.households[1].id');
  await click('pickHH', { id: h2 });
  eq(ev('S.hid'), h2, 'chuyển sang hộ thứ hai được');
  eq(ev('S.data.products.filter(p => p.hid === S.hid).length'), 0, 'hộ mới chưa có hàng hóa của hộ cũ');
  await click('pickHH', { id: ev('S.data.households[0].id') });
  eq(ev('S.data.products.length'), 1, 'quay lại hộ cũ vẫn còn dữ liệu');
});

await section('10. Lưu trữ trong máy', async () => {
  await click('route', { route: 'home' });
  await sleep(300);
  ok(store.has('hkd1'), 'dữ liệu đã được ghi xuống bộ nhớ máy', 'khóa: ' + [...store.keys()].join(','));
  const raw = store.get('hkd1') || '{}';
  let saved = null; try { saved = JSON.parse(raw); } catch (e) {}
  ok(saved && Array.isArray(saved.households), 'bản lưu đọc lại được và có dữ liệu hộ');
  eq(saved.households.length, 2, 'bản lưu giữ đủ 2 hộ');
  await click('route', { route: 'menu' });
  ok(htmlOf('#app').includes('Lưu trữ:'), 'menu có dòng cho biết dữ liệu đang lưu ở đâu');
});

await section('11. Sao lưu và nhập lại', async () => {
  await click('route', { route: 'menu' });
  await click('backup');
  ok(lastBlobText.includes('"households"'), 'tệp sao lưu có dữ liệu hộ kinh doanh');
  const backup = JSON.parse(lastBlobText);
  eq(backup.app, 'quan-ly-hkd', 'tệp sao lưu ghi đúng tên app');
  ok(!!ev('S.data.settings.backupAt'), 'ghi nhận thời điểm sao lưu');

  backup.data.households[0].name = 'Tạp hóa Bảy (nhập lại)';
  await click('restore');
  doc.querySelector('#restoreFile').files = [{ name: 'sao-luu.json', __text: JSON.stringify(backup) }];
  confirmAnswer = true;
  await click('doRestore');
  await sleep(30);
  eq(ev('S.data.households[0].name'), 'Tạp hóa Bảy (nhập lại)', 'nhập lại tệp sao lưu thay được dữ liệu');
  eq(ev('S.data.invoices.length'), 2, 'nhập lại giữ đủ hóa đơn');
  ok(htmlOf('#app').includes('Tạp hóa Bảy (nhập lại)'), 'màn hình cập nhật theo dữ liệu vừa nhập');

  confirmAnswer = false;
  await click('restore');
  doc.querySelector('#restoreFile').files = [{ name: 'sao-luu.json', __text: JSON.stringify(backup) }];
  await click('doRestore');
  await sleep(30);
  eq(ev('S.data.households[0].name'), 'Tạp hóa Bảy (nhập lại)', 'bấm Hủy khi nhập thì dữ liệu không đổi');
  confirmAnswer = true;
});

await section('12. Mọi màn hình vẽ được', async () => {
  for (const r of ['home', 'sell', 'products', 'customers', 'expenses', 'book', 'tax', 'policy', 'menu', 'help', 'setup']) {
    let err = null, len = 0;
    try { await click('route', { route: r }); len = htmlOf('#app').length; } catch (e) { err = e; }
    ok(!err && len > 200, 'màn hình "' + r + '" vẽ được nội dung', err ? err.message : 'độ dài ' + len);
  }
  await ev('go("home")');
  ok(headName().includes('Tạp hóa Bảy'), 'quay về trang chính hiện đúng tên hộ ở đầu trang');
});

await section('13. Số liệu thuế theo ví dụ luật', async () => {
  // Mỗi ca: doanh thu năm theo một nhóm ngành, chi phí năm, cách tính như luật.
  const calcCase = (rev, exp, group, year, reduce30) => JSON.parse(vm.runInContext(`
    (function(){
      const hid = S.hid;
      S.data.invoices = [{ id:'th1', hid:hid, code:'HD999', date:'${year}-03-10', subtotal:${rev}, discount:0, total:${rev},
        lines:[{ pid:'p1', name:'x', qty:1, price:${rev}, group:'${group}' }] }];
      S.data.expenses = [{ id:'te1', hid:hid, category:'cp', amount:${exp}, date:'${year}-03-10' }];
      S.data.taxpay = [];
      S.data.policy.threshold = 1000000000;
      S.data.policy.bracketBase = 'income';
      S.data.policy.reduce30 = ${reduce30};
      const r = taxCalc(hid, ${year}, 0);
      return JSON.stringify({ vat:r.vat, a:r.tncnA, b:r.tncnB, allowB:r.allowB, rateA:r.rateA,
        over:r.overThreshold, totalA:r.totalA, totalB:r.totalB, note:!!r.branchNote, baseB:r.baseB });
    })()`, ctx));

  // Dịch vụ 1,8 tỷ, chi phí 1,5 tỷ → GTGT 5% = 90 triệu
  let c = calcCase(1800000000, 1500000000, 'service', 2026, false);
  eq(c.over, true, '1,8 tỷ/năm là vượt ngưỡng 1 tỷ');
  eq(c.vat, 90000000, 'GTGT dịch vụ 1,8 tỷ = 90.000.000');
  eq(c.a, 45000000, 'TNCN cách A (thu nhập 300 triệu × 15%) = 45.000.000');
  eq(c.b, 16000000, 'TNCN cách B (800 triệu vượt ngưỡng × 2%) = 16.000.000');
  eq(c.allowB, true, 'doanh thu dưới 3 tỷ nên được chọn cách B');

  // Hàng hóa 2,2 tỷ, chi phí 2,05 tỷ → GTGT 1% = 22 triệu
  c = calcCase(2200000000, 2050000000, 'goods', 2026, false);
  eq(c.vat, 22000000, 'GTGT hàng hóa 2,2 tỷ = 22.000.000');
  eq(c.a, 22500000, 'TNCN cách A (thu nhập 150 triệu × 15%) = 22.500.000');
  eq(c.b, 6000000, 'TNCN cách B (1,2 tỷ vượt ngưỡng × 0,5%) = 6.000.000');

  // Dịch vụ 2,5 tỷ, chi phí 2,45 tỷ
  c = calcCase(2500000000, 2450000000, 'service', 2026, false);
  eq(c.vat, 125000000, 'GTGT dịch vụ 2,5 tỷ = 125.000.000');
  eq(c.a, 7500000, 'TNCN cách A (thu nhập 50 triệu × 15%) = 7.500.000');
  eq(c.b, 30000000, 'TNCN cách B (1,5 tỷ vượt ngưỡng × 2%) = 30.000.000');

  // Ngưỡng: đúng 1 tỷ thì không phải nộp
  c = calcCase(1000000000, 100000000, 'service', 2026, false);
  eq(c.over, false, 'đúng 1 tỷ/năm là chưa vượt ngưỡng');
  eq(c.totalA, 0, 'chưa vượt ngưỡng thì không phải nộp thuế');
  eq(c.totalB, 0, 'chưa vượt ngưỡng thì cách B cũng bằng 0');
  c = calcCase(1000000001, 100000000, 'service', 2026, false);
  eq(c.over, true, 'hơn 1 tỷ một đồng là đã vượt ngưỡng');

  // Giảm 30% thuế TNCN trong 2026–2027 cho hộ doanh thu đến 10 tỷ
  const off = calcCase(5000000000, 0, 'service', 2026, false);
  const on = calcCase(5000000000, 0, 'service', 2026, true);
  eq(on.a, Math.round(off.a * 0.7), 'bật giảm 30% đúng cho phần TNCN cách A');
  eq(on.b, Math.round(off.b * 0.7), 'bật giảm 30% đúng cho phần TNCN cách B');
  const bigOff = calcCase(15000000000, 0, 'service', 2026, false);
  const bigOn = calcCase(15000000000, 0, 'service', 2026, true);
  eq(bigOn.a, bigOff.a, 'doanh thu trên 10 tỷ thì không giảm 30% (cách A)');
  eq(bigOn.b, bigOff.b, 'doanh thu trên 10 tỷ thì không giảm 30% (cách B)');
  const y30 = calcCase(5000000000, 0, 'service', 2030, false);
  const y30on = calcCase(5000000000, 0, 'service', 2030, true);
  eq(y30on.a, y30.a, 'năm 2030 không còn trong diện giảm nên số thuế không đổi');
  ok(off.a > 0, 'doanh thu 5 tỷ vẫn phát sinh thuế TNCN', 'nhận ' + off.a);

  // Trên 3 tỷ: không được chọn cách B, có nhắc chuyển sang tính trên thu nhập
  c = calcCase(3500000000, 100000000, 'service', 2026, false);
  eq(c.allowB, false, 'doanh thu trên 3 tỷ thì không áp dụng cách B');
  eq(c.rateA, 17, 'doanh thu trên 3 tỷ chuyển bậc 17%');
  eq(c.note, true, 'có nhắc chuyển sang tính trên thu nhập từ năm sau');

  // Tính theo kỳ tháng: chia theo tỷ lệ doanh thu kỳ/năm
  const r = JSON.parse(vm.runInContext(`
    (function(){
      const hid = S.hid;
      S.data.invoices = [
        { id:'m1', hid:hid, code:'HD901', date:'2026-01-15', subtotal:100000000, discount:0, total:100000000,
          lines:[{ pid:'p1', name:'x', qty:1, price:100000000, group:'service' }] },
        { id:'m2', hid:hid, code:'HD902', date:'2026-02-15', subtotal:1200000000, discount:0, total:1200000000,
          lines:[{ pid:'p1', name:'x', qty:1, price:1200000000, group:'service' }] }];
      S.data.expenses = []; S.data.taxpay = [];
      S.data.policy.reduce30 = false;
      const j = taxCalc(hid, 2026, 1), y = taxCalc(hid, 2026, 0);
      return JSON.stringify({ jRev:j.revPeriod, jVat:j.vat, jA:j.tncnA, yRev:y.revPeriod, yVat:y.vat });
    })()`, ctx));
  eq(r.jRev, 100000000, 'doanh thu tháng 1 chỉ tính hóa đơn tháng 1');
  eq(r.yRev, 1300000000, 'doanh thu cả năm cộng đủ hai hóa đơn');
  eq(r.jVat, 5000000, 'GTGT tháng 1 = 5% của 100 triệu');
  ok(r.jA > 0 && r.jA < 150000000, 'TNCN tháng 1 được chia theo tỷ lệ doanh thu kỳ/năm', 'nhận ' + r.jA);
});

await section('14. Menu và các liên kết màn hình', async () => {
  /* Đọc thẳng HTML đã vẽ để lấy đúng các thuộc tính mà app gắn cho từng nút:
     bấm bằng thuộc tính thật, không bấm bằng dữ liệu tự nghĩ ra. */
  const dataAttrs = sel => attrsFromHtml(String(doc.querySelector(sel).innerHTML));
  const routes = Object.keys(ev('VIEWS'));

  await ev('go("menu")');
  const menuItems = dataAttrs('#app').filter(a => a.act === 'route');
  for (const r of ['products', 'customers', 'expenses', 'policy']) {
    ok(menuItems.some(a => a.route === r), 'Menu có mục mở màn hình "' + r + '"');
  }
  for (const r of ['products', 'customers', 'expenses', 'policy']) {
    const it = menuItems.find(a => a.route === r);
    if (!it) continue;
    await click(it.act, it);
    eq(ev('S.route'), r, 'bấm mục Menu "' + r + '" mở đúng màn hình');
    ok(htmlOf('#app').length > 200, 'màn hình "' + r + '" mở từ Menu có nội dung');
    await ev('go("menu")');
  }

  // Mọi nút trên mọi màn hình phải trỏ tới màn hình có thật
  const badRoute = [], seenEls = [];
  for (const r of routes) {
    await ev('go("' + r + '")');
    for (const a of dataAttrs('#app')) {
      seenEls.push(a);
      if (a.route && !routes.includes(a.route)) badRoute.push(r + ' → ' + String(a.route));
    }
  }
  /* Thẻ chuyển màn hình ở đáy (Hôm nay / Bán hàng / Sổ sách / Thuế / Menu) là phần HTML tĩnh. */
  const tabsHtml = (html.match(/<nav id="tabs">([\s\S]*?)<\/nav>/) || ['', ''])[1];
  const tabs = attrsFromHtml(tabsHtml).filter(a => a.route);
  for (const t of tabs) seenEls.push(t);
  ok(tabs.length === 5, 'đáy màn hình có đủ 5 thẻ chuyển màn hình', 'nhận ' + tabs.length);
  for (const t of tabs) if (!routes.includes(t.route)) badRoute.push('thẻ đáy → ' + String(t.route));
  ok(!badRoute.length, 'mọi nút mở màn hình đều trỏ tới màn hình có thật', badRoute.join(', '));

  // Mọi thứ gắn hành động trên giao diện đều phải có xử lý trong mã:
  // nút bấm đi theo bộ xử lý "case", ô nhập/ô chọn đi theo bộ xử lý sự kiện nhập liệu.
  const byCase = new Set([...String(code).matchAll(/case '([a-zA-Z]+)'/g)].map(m => m[1]));
  const byInputId = new Set([...String(code).matchAll(/t\.id === '([a-zA-Z]+)'/g)].map(m => m[1]));
  const missing = [];
  for (const a of seenEls) {
    if (!a.act) {
      if (a.route && !/dataset\.route/.test(String(code))) missing.push('thẻ ' + a.route + ' (không có xử lý bấm thẻ)');
      continue;
    }
    const isClick = a.tag === 'BUTTON' || a.tag === 'DIV' || a.tag === 'A';
    if (isClick) { if (!byCase.has(a.act)) missing.push(a.act + ' (bấm)'); }
    else if (!byInputId.has(a.id)) missing.push(a.act + ' (ô nhập ' + String(a.id) + ')');
  }
  ok(!missing.length, 'mọi nút bấm và ô nhập đều có xử lý trong mã', missing.length ? 'thiếu: ' + [...new Set(missing)].join(', ') : '');
  await ev('go("home")');
});

console.log('\n———————————————————————————————');
console.log(fails.length ? 'KẾT QUẢ: ' + pass + ' điều đúng, ' + fails.length + ' điều SAI:' : 'KẾT QUẢ: tất cả ' + pass + ' điều đều đúng.');
fails.forEach(f => console.log('  ✗ ' + f));
process.exit(fails.length ? 1 : 0);
