'use strict';

/* ============================================================
   core.js — nền tảng chung: tiện ích, cấu hình, lưu trữ, dữ liệu,
   tính toán thuế và in ấn. Không chạm giao diện lúc nạp.
   ============================================================ */

/* ---------------------------- tiện ích ---------------------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n0 = n => Math.round(Number(n) || 0);
const fmt = n => n0(n).toLocaleString('vi-VN');
const money = n => fmt(n) + ' đ';
const sum = a => a.reduce((x, y) => x + (Number(y) || 0), 0);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const csvCell = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';

function todayISO(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dmy(iso){
  if (!iso) return '';
  const p = String(iso).split('-');
  return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
}
function daysBetween(a, b){ return Math.round((new Date(b) - new Date(a)) / 86400000); }
function val(id){ const e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
function numv(id){ const e = document.getElementById(id); return e ? n0(e.value) : 0; }
function checked(id){ const e = document.getElementById(id); return !!(e && e.checked); }

function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('on'), 2200);
}
function downloadText(name, text, type){
  const blob = new Blob([text], { type: type || 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* ---------------------------- hằng số ---------------------------- */
const GROUPS = [
  { k:'goods',   n:'Phân phối, cung cấp hàng hóa' },
  { k:'service', n:'Dịch vụ, xây dựng không bao thầu NVL' },
  { k:'produce', n:'Sản xuất, vận tải, xây dựng bao thầu NVL' },
  { k:'other',   n:'Hoạt động kinh doanh khác' },
  { k:'rent',    n:'Cho thuê tài sản, đại lý xổ số/bảo hiểm, bán hàng đa cấp' }
];
const GROUP_NAME = k => (GROUPS.find(g => g.k === k) || { n:'Hoạt động kinh doanh khác' }).n;
const SHORT = { goods:'Hàng hóa', service:'Dịch vụ', produce:'Sản xuất', other:'Khác', rent:'Cho thuê' };
const PALETTE = ['#0b6bcb','#1a8f4c','#a86400','#7b3fbf','#c0272d','#0d7d8f','#5a6b00','#b5347a'];

const DEFAULT_POLICY = {
  id: 'policy',
  threshold: 0,          // đồng/năm; 0 = chưa đặt
  vat:  { goods:1, service:5, produce:3, other:2, rent:5 },
  tncn: { goods:0.5, service:2, produce:1.5, other:1, rent:5 },
  bracketBase: 'income', // income = thu nhập sau chi phí, revenue = doanh thu
  brackets: [ { max:3000000000, rate:15 }, { max:50000000000, rate:17 }, { max:0, rate:20 } ],
  reduce30: true,
  reduceLimit: 10000000000,
  reduceYears: [2026, 2027],
  period: 'month'
};

/* ---------------------------- lưu trữ ---------------------------- */
const Persist = (() => {
  const KEY = 'hkd1';
  let db = null, mode = 'ls', timer = null;

  function openDB(){
    return new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('no idb'));
      const rq = indexedDB.open('hkd-db', 1);
      rq.onupgradeneeded = () => {
        const d = rq.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error || new Error('idb'));
    });
  }
  return {
    async init(){
      try { db = await openDB(); mode = 'idb'; }
      catch (e){ mode = 'ls'; }
    },
    async load(){
      if (mode === 'idb'){
        try {
          const v = await new Promise((res, rej) => {
            const tx = db.transaction('kv', 'readonly');
            const g = tx.objectStore('kv').get(KEY);
            g.onsuccess = () => res(g.result);
            g.onerror = () => rej(g.error);
          });
          if (v) return JSON.parse(v);
        } catch (e){ /* thử localStorage */ }
      }
      try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; }
      catch (e){ return null; }
    },
    save(obj){
      const text = JSON.stringify(obj);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        let ok = false;
        if (mode === 'idb' && db){
          try {
            const tx = db.transaction('kv', 'readwrite');
            tx.objectStore('kv').put(text, KEY);
            ok = true;
          } catch (e){ ok = false; }
        }
        if (!ok){
          try { localStorage.setItem(KEY, text); }
          catch (e){ toast('Bộ nhớ đầy — hãy sao lưu rồi xóa bớt dữ liệu cũ'); }
        }
      }, 200);
    },
    mode(){ return mode; }
  };
})();

/* ---------------------------- trạng thái ---------------------------- */
const S = {
  data: {
    households: [], products: [], invoices: [], customers: [],
    expenses: [], payments: [], taxpay: [],
    suppliers: [], purchases: [], supplierPayments: [], stockAdj: [],
    policy: null, settings: { backupAt: null, onboarded: false, cashStart: 0 }
  },
  hid: null,
  route: 'home',
  cart: [],
  purCart: [],
  _purForm: {},
  bookMonth: todayISO().slice(0, 7),
  taxYear: new Date().getFullYear(),
  taxMonth: 0,
  _sellQ: '',
  _prodQ: ''
};

const P = () => Object.assign({}, DEFAULT_POLICY, S.data.policy || {});
const hhs = () => S.data.households;
const hh = () => S.data.households.find(h => h.id === S.hid) || null;
const prods = () => S.data.products.filter(p => p.hid === S.hid);
const custs = () => S.data.customers.filter(c => c.hid === S.hid);
const invs = hid => S.data.invoices.filter(i => i.hid === (hid || S.hid));
const sups = () => S.data.suppliers.filter(s => s.hid === S.hid);
const purs = hid => S.data.purchases.filter(p => p.hid === (hid || S.hid));
const purPays = () => S.data.supplierPayments.filter(p => p.hid === S.hid);
const stockLogs = () => S.data.stockAdj.filter(a => a.hid === S.hid);

function purCode(){
  const nums = purs().map(p => Number(String(p.code || '').replace(/\D/g, '')) || 0);
  return 'PN' + String(Math.max(0, ...nums) + 1).padStart(3, '0');
}

/* cập nhật tồn kho và công nợ khi ghi phiếu */
function applySale(inv){
  inv.lines.forEach(l => {
    const p = S.data.products.find(x => x.id === l.pid);
    if (p && p.stock != null) p.stock = n0(p.stock) - n0(l.qty);
  });
  if (inv.pay === 'debt' && inv.customerId){
    const c = S.data.customers.find(x => x.id === inv.customerId);
    if (c) c.debt = n0(c.debt) + n0(inv.total);
  }
}
function applyPurchase(p){
  p.lines.forEach(l => {
    let prod = l.pid ? S.data.products.find(x => x.id === l.pid) : null;
    if (!prod) prod = S.data.products.find(x => x.hid === p.hid
      && (x.name || '').toLowerCase() === (l.name || '').toLowerCase());
    if (!prod){
      prod = { id:uid(), hid:p.hid, name:l.name, unit:'', group:l.group || 'goods',
        price:n0(l.price), cost:n0(l.price), stock:0, minStock:0 };
      S.data.products.push(prod);
    }
    const qty = n0(l.qty), oldStock = n0(prod.stock), oldCost = n0(prod.cost);
    prod.stock = oldStock + qty;
    if (qty > 0) prod.cost = Math.round((oldStock * oldCost + qty * n0(l.price)) / (oldStock + qty));
    l.pid = prod.id;
  });
  if (p.pay === 'debt' && p.supplierId){
    const s = S.data.suppliers.find(x => x.id === p.supplierId);
    if (s) s.debt = n0(s.debt) + n0(p.total);
  }
}
function undoPurchase(p){
  if (p.returned) return;
  p.lines.forEach(l => {
    const prod = S.data.products.find(x => x.id === l.pid);
    if (prod) prod.stock = Math.max(0, n0(prod.stock) - n0(l.qty));
  });
  if (p.pay === 'debt' && p.supplierId){
    const s = S.data.suppliers.find(x => x.id === p.supplierId);
    if (s) s.debt = Math.max(0, n0(s.debt) - n0(p.total));
  }
}

/* quỹ tiền mặt ước tính từ các phiếu đã ghi */
function cashOnHand(){
  const start = n0((S.data.settings || {}).cashStart);
  const sale = sum(invs().filter(i => i.pay === 'cash').map(i => i.total));
  const inCust = sum(S.data.payments.filter(p => p.hid === S.hid).map(p => p.amount));
  const buy = sum(purs().filter(p => p.pay === 'cash' && !p.returned).map(p => p.total));
  const outSup = sum(purPays().map(p => p.amount));
  const exp = sum(S.data.expenses.filter(e => e.hid === S.hid).map(e => e.amount));
  const tax = sum(S.data.taxpay.filter(t => t.hid === S.hid).map(t => t.amount));
  return start + sale + inCust - buy - outSup - exp - tax;
}
function overdueCustomers(){
  const today = todayISO();
  return custs().filter(c => n0(c.debt) > 0 && S.data.invoices.some(i =>
    i.hid === S.hid && i.customerId === c.id && i.pay === 'debt'
    && i.date && daysBetween(i.date, today) > 30));
}
function lowStocks(){
  return prods().filter(p => n0(p.minStock) > 0 && n0(p.stock) < n0(p.minStock));
}
function alerts(){
  const out = [], rev = revYearNow(S.hid);
  if (rev >= 1000000000) out.push({ k:'tax',
    t:'Doanh thu năm đã từ 1 tỷ đồng: cần rà soát đăng ký nộp thuế và tài khoản ngân hàng.' });
  if (cashOnHand() >= 5000000) out.push({ k:'cash',
    t:'Quỹ tiền mặt ước tính trên 5 triệu đồng: nên gửi ngân hàng, hạn chế thu chi tiền mặt.' });
  const od = overdueCustomers();
  if (od.length) out.push({ k:'debt',
    t:fmt(od.length) + ' khách nợ quá 30 ngày, tổng ' + money(sum(od.map(c => c.debt))) + '.' });
  const ls = lowStocks();
  if (ls.length) out.push({ k:'stock',
    t:fmt(ls.length) + ' mặt hàng tồn dưới mức tối thiểu, cần nhập thêm.' });
  const sd = sum(sups().map(s => s.debt || 0));
  if (sd > 0) out.push({ k:'sup', t:'Còn nợ nhà cung cấp ' + money(sd) + ', vào Mua hàng để trả.' });
  return out;
}
function monthlyRev(n){
  const now = new Date(), out = [];
  for (let i = n - 1; i >= 0; i--){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear(), m = d.getMonth() + 1;
    out.push({ label:m + '/' + String(y).slice(2),
      value:revIn(y + '-' + String(m).padStart(2, '0') + '-01', monthEnd(y, m)) });
  }
  return out;
}

function saveAll(){ Persist.save(S.data); }
function push(store, obj){ S.data[store].push(obj); saveAll(); }

/* ---------------------------- tính toán ---------------------------- */
function revIn(from, to, hid){
  return sum(invs(hid).filter(i => i.date >= from && i.date <= to).map(i => i.total));
}
function expIn(from, to, hid){
  return sum(S.data.expenses.filter(e => e.hid === (hid || S.hid) && e.date >= from && e.date <= to).map(e => e.amount));
}
function monthEnd(y, m){
  const d = new Date(y, m, 0);
  return y + '-' + String(m).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function daysInMonth(y, m){ return new Date(y, m, 0).getDate(); }

/* doanh thu theo nhóm thuế, phân bổ chiết khấu theo tỷ lệ từng dòng */
function revByGroup(from, to, hid){
  const out = {};
  GROUPS.forEach(g => { out[g.k] = 0; });
  invs(hid).forEach(inv => {
    if (inv.date < from || inv.date > to) return;
    const gross = inv.subtotal || 0;
    const ratio = gross > 0 ? (inv.total / gross) : 1;
    (inv.lines || []).forEach(l => {
      const k = out[l.group] != null ? l.group : 'other';
      out[k] += (l.qty * l.price) * ratio;
    });
  });
  Object.keys(out).forEach(k => { out[k] = n0(out[k]); });
  return out;
}

function bracketRate(revYear){
  const pol = P();
  for (const b of pol.brackets){
    if (!b.max || revYear <= b.max) return b.rate;
  }
  return pol.brackets[pol.brackets.length - 1].rate;
}

function taxCalc(hid, year, month){
  const isYear = !month || month === 0;
  const from = isYear ? year + '-01-01' : year + '-' + String(month).padStart(2, '0') + '-01';
  const to   = isYear ? year + '-12-31' : monthEnd(year, month);
  const pol = P();

  const byGroup = revByGroup(from, to, hid);
  const revPeriod = sum(Object.values(byGroup));
  const revYear = revIn(year + '-01-01', year + '-12-31', hid);
  const expYear = expIn(year + '-01-01', year + '-12-31', hid);
  const branchNote = revYear > 3000000000
    ? 'Doanh thu năm trên 3 tỷ: năm nay vẫn giữ cách đang áp dụng, từ năm sau phải chuyển sang tính trên thu nhập (thu nhập × thuế suất). Phương pháp đã chọn giữ ổn định 02 năm liên tục.'
    : '';

  const overThreshold = pol.threshold > 0 && revYear > pol.threshold;
  const thresholdSet = pol.threshold > 0;

  /* GTGT */
  let vat = 0;
  if (overThreshold){
    GROUPS.forEach(g => { vat += byGroup[g.k] * (Number(pol.vat[g.k]) || 0) / 100; });
  }
  vat = n0(vat);

  /* TNCN cách A — theo bậc doanh thu năm, quy theo tỷ lệ doanh thu kỳ */
  const rateA = bracketRate(revYear);
  const baseA = pol.bracketBase === 'income' ? Math.max(0, revYear - expYear) : revYear;
  const annualA = baseA * rateA / 100;
  let tncnA = 0;
  if (overThreshold && revYear > 0) tncnA = n0(annualA * (revPeriod / revYear));

  /* TNCN cách B — tỷ lệ % ngành trên phần doanh thu vượt ngưỡng */
  const allowB = overThreshold && revYear <= 3000000000;
  const thresholdPart = (overThreshold && revYear > 0)
    ? Math.min(revPeriod, pol.threshold * (revPeriod / revYear)) : 0;
  const baseB = overThreshold ? Math.max(0, revPeriod - thresholdPart) : 0;
  const baseByGroup = {};
  let tncnB = 0;
  GROUPS.forEach(g => {
    const share = revPeriod > 0 ? (byGroup[g.k] / revPeriod) : 0;
    baseByGroup[g.k] = n0(baseB * share);
    tncnB += baseByGroup[g.k] * (Number(pol.tncn[g.k]) || 0) / 100;
  });
  tncnB = n0(tncnB);

  /* giảm 30% TNCN năm 2026–2027, hộ doanh thu đến 10 tỷ */
  const reduceOn = !!pol.reduce30
    && (pol.reduceYears || []).indexOf(Number(year)) >= 0
    && revYear <= (pol.reduceLimit || 0);
  if (reduceOn){ tncnA = n0(tncnA * 0.7); tncnB = n0(tncnB * 0.7); }

  const paid = sum(S.data.taxpay.filter(t =>
    t.hid === (hid || S.hid) && t.year == year && (isYear || t.month == month)
  ).map(t => t.amount));

  return {
    isYear, from, to, byGroup, revPeriod, revYear, expYear,
    threshold: pol.threshold, thresholdSet, overThreshold,
    vat, tncnA, tncnB, allowB, rateA, baseA, annualA, baseB, baseByGroup,
    thresholdPart, reduceOn, paid,
    totalA: vat + tncnA, totalB: vat + tncnB, branchNote
  };
}

/* ---------------------------- sổ theo dõi ---------------------------- */
const BOOKS = [
  { k:'s1a', code:'S1a', name:'Sổ nhật ký chung', sub:'Mọi phiếu phát sinh trong tháng' },
  { k:'s1b', code:'S1b', name:'Sổ doanh thu bán hàng', sub:'Chi tiết từng phiếu bán' },
  { k:'s1c', code:'S1c', name:'Sổ mua hàng và chi phí', sub:'Phiếu nhập hàng và chi phí' },
  { k:'s2a', code:'S2a', name:'Sổ quỹ tiền mặt', sub:'Thu chi tiền mặt' },
  { k:'s2b', code:'S2b', name:'Sổ công nợ', sub:'Khách hàng và nhà cung cấp' },
  { k:'s2c', code:'S2c', name:'Sổ tồn kho hàng hóa', sub:'Nhập, xuất, tồn từng mặt hàng' }
];

function bookRows(k, m){
  const from = m + '-01';
  const to = m + '-' + String(daysInMonth(Number(m.slice(0, 4)), Number(m.slice(5, 7)))).padStart(2, '0');
  const inM = d => !!d && d.slice(0, 7) === m;
  const invList = invs().filter(i => inM(i.date)).slice().sort((a, b) => a.date.localeCompare(b.date));
  const purList = purs().filter(p => inM(p.date)).slice().sort((a, b) => a.date.localeCompare(b.date));
  const expList = S.data.expenses.filter(e => e.hid === S.hid && inM(e.date));
  const payList = S.data.payments.filter(p => p.hid === S.hid && inM(p.date));
  const spList = purPays().filter(p => inM(p.date));
  const taxList = S.data.taxpay.filter(t => t.hid === S.hid && inM(t.date));
  if (k === 's1b') return { title:'SỔ DOANH THU BÁN HÀNG ' + m,
    head:['Ngày','Số phiếu','Khách hàng','Doanh thu','Giảm trừ','Thành tiền'],
    rows:invList.map(i => [i.date, i.code || '', i.customer || 'Khách lẻ', n0(i.subtotal), n0(i.discount), n0(i.total)]) };
  if (k === 's1c') return { title:'SỔ MUA HÀNG VÀ CHI PHÍ ' + m,
    head:['Ngày','Chứng từ','Nội dung','Số tiền'],
    rows:purList.map(p => [p.date, p.code || '', 'Mua hàng: ' + (p.supplier || ''), n0(p.total)])
      .concat(expList.map(e => [e.date, '', e.name, n0(e.amount)])) };
  if (k === 's2a') return { title:'SỔ QUỸ TIỀN MẶT ' + m,
    head:['Ngày','Chứng từ','Diễn giải','Thu','Chi'],
    rows:invList.filter(i => i.pay === 'cash').map(i => [i.date, i.code || '', 'Bán hàng', n0(i.total), 0])
      .concat(payList.map(p => [p.date, '', 'Thu nợ ' + (p.customer || ''), n0(p.amount), 0]))
      .concat(purList.filter(p => p.pay === 'cash' && !p.returned).map(p => [p.date, p.code || '', 'Mua hàng', 0, n0(p.total)]))
      .concat(spList.map(p => [p.date, '', 'Trả nợ nhà cung cấp', 0, n0(p.amount)]))
      .concat(expList.map(e => [e.date, '', e.name, 0, n0(e.amount)]))
      .concat(taxList.map(t => [t.date, '', 'Nộp thuế', 0, n0(t.amount)])) };
  if (k === 's2b') return { title:'SỔ CÔNG NỢ ' + m,
    head:['Ngày','Đối tượng','Loại','Phát sinh','Còn nợ'],
    rows:payList.map(p => [p.date, p.customer || '', 'Thu nợ', n0(p.amount), ''])
      .concat(spList.map(p => [p.date, p.supplier || '', 'Trả nợ nhà cung cấp', '', n0(p.amount)]))
      .concat(custs().filter(c => n0(c.debt) > 0).map(c => ['', c.name, 'Khách hàng', n0(c.debt), n0(c.debt)]))
      .concat(sups().filter(s => n0(s.debt) > 0).map(s => ['', s.name, 'Nhà cung cấp', n0(s.debt), n0(s.debt)])) };
  if (k === 's2c'){
    const rows = prods().map(p => {
      const inQty = sum(purList.filter(x => !x.returned).flatMap(x => x.lines)
        .filter(l => l.pid === p.id).map(l => n0(l.qty)));
      const outQty = sum(invList.flatMap(i => i.lines).filter(l => l.pid === p.id).map(l => n0(l.qty)));
      const adjQty = sum(S.data.stockAdj.filter(a => a.hid === S.hid && inM(a.date)
        && a.productId === p.id).map(a => n0(a.delta)));
      const stock = n0(p.stock), cost = n0(p.cost);
      return [p.name, p.unit || '', Math.max(0, stock - inQty + outQty - adjQty), inQty, outQty, stock, cost, stock * cost];
    });
    return { title:'SỔ TỒN KHO HÀNG HÓA ' + m,
      head:['Hàng hóa','Đơn vị','Đầu kỳ','Nhập','Xuất','Tồn cuối','Giá vốn','Giá trị'], rows };
  }
  const events = invList.map(i => [i.date, i.code || '', 'Bán hàng: ' + (i.customer || 'Khách lẻ'), n0(i.total), 0])
    .concat(purList.map(p => [p.date, p.code || '', 'Mua hàng: ' + (p.supplier || ''), 0, n0(p.total)]))
    .concat(payList.map(p => [p.date, '', 'Thu nợ ' + (p.customer || ''), n0(p.amount), 0]))
    .concat(spList.map(p => [p.date, '', 'Trả nợ ' + (p.supplier || ''), 0, n0(p.amount)]))
    .concat(expList.map(e => [e.date, '', e.name, 0, n0(e.amount)]))
    .concat(taxList.map(t => [t.date, '', 'Nộp thuế', 0, n0(t.amount)]))
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return { title:'SỔ NHẬT KÝ CHUNG ' + m, head:['Ngày','Chứng từ','Diễn giải','Thu','Chi'], rows:events };
}

function excelSheet(title, head, rows){
  const cell = v => '<Cell><Data ss:Type="' + (typeof v === 'number' ? 'Number' : 'String') + '">'
    + esc(v) + '</Data></Cell>';
  const row = a => '<Row>' + a.map(cell).join('') + '</Row>';
  return '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>'
    + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"'
    + ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="'
    + esc(String(title).slice(0, 28)) + '"><Table>' + row([title]) + row(head)
    + rows.map(row).join('') + '</Table></Worksheet></Workbook>';
}

/* ---------------------------- cổng dữ liệu hóa đơn ---------------------------- */
const Bridge = (function(){
  const pick = (o, names) => {
    for (const n of names){
      const v = o && o[n];
      if (v !== undefined && v !== null && v !== ''){
        return (typeof v === 'object' && v._text !== undefined) ? v._text : v;
      }
    }
    return '';
  };
  const arr = v => v === undefined || v === null ? [] : (Array.isArray(v) ? v : [v]);
  const decode = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

  function xmlObject(text){
    const src = String(text).replace(/<\?[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    const root = { _text:'' }, stack = [root];
    const re = /<(\/?)([\w:.\-]+)([^>]*?)(\/?)>|([^<]+)/g;
    let m;
    while ((m = re.exec(src))){
      if (m[5] !== undefined){
        const txt = decode(m[5]).trim();
        if (txt) stack[stack.length - 1]._text += txt;
        continue;
      }
      const name = m[2].replace(/^.*:/, '');
      if (m[1] === '/'){ if (stack.length > 1) stack.pop(); continue; }
      const node = { _text:'' }, ar = /([\w:.\-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let a;
      while ((a = ar.exec(m[3] || ''))) node[a[1].replace(/^.*:/, '')] = decode(a[2] !== undefined ? a[2] : a[3]);
      const parent = stack[stack.length - 1];
      if (Object.prototype.hasOwnProperty.call(parent, name)){
        if (!Array.isArray(parent[name])) parent[name] = [parent[name]];
        parent[name].push(node);
      } else parent[name] = node;
      if (!m[4]) stack.push(node);
    }
    const obj = {};
    Object.keys(root).forEach(k => { if (k !== '_text') obj[k] = root[k]; });
    return obj;
  }

  function norm(raw){
    const o = raw && raw.data && typeof raw.data === 'object' ? raw.data : raw;
    if (!o || typeof o !== 'object') throw new Error('Dữ liệu không hợp lệ');
    const kind = String(pick(o, ['kind','type','loai','invoiceType']) || '').toLowerCase();
    const isPur = /purchase|buy|mua|nhap/.test(kind);
    const date = String(pick(o, ['date','invoiceDate','issueDate','ngay','ngayLap']) || todayISO()).slice(0, 10);
    const code = String(pick(o, ['code','number','invoiceNo','so','ma'])
      || (isPur ? 'PN' : 'HD') + '-' + Date.now().toString(36)).slice(0, 40);
    const partner = String(pick(o, ['partner','customer','supplier','khach','nhaCungCap','tenKhach'])
      || (isPur ? 'Nhà cung cấp' : 'Khách lẻ'));
    const payRaw = String(pick(o, ['pay','paymentMethod','hinhThuc']) || 'cash').toLowerCase();
    const pay = /debt|credit|no/.test(payRaw) ? 'debt' : /bank|chuyen-khoan/.test(payRaw) ? 'bank' : 'cash';
    const lines = arr(pick(o, ['lines','items','lineItems','hang','hangHoa','details']))
      .map(l => ({
        pid:'',
        name:String(pick(l, ['name','product','itemName','tenHang','ten']) || 'Hàng hóa'),
        group:String(pick(l, ['group','nhomThue']) || 'goods'),
        qty:n0(pick(l, ['qty','quantity','soLuong','sl']) || 1),
        price:n0(pick(l, ['price','unitPrice','donGia','gia']) || 0)
      })).filter(l => l.price > 0);
    if (!lines.length) throw new Error('Thiếu dòng hàng hóa hoặc đơn giá');
    const subtotal = sum(lines.map(l => l.qty * l.price));
    const discount = Math.min(subtotal, n0(pick(o, ['discount','discountAmount','chietKhau','giamGia']) || 0));
    return { kind:isPur ? 'purchase' : 'sale', date, code, partner, pay, lines, subtotal, discount,
      total:subtotal - discount, note:String(pick(o, ['note','description','ghiChu']) || '') };
  }

  function parse(text){
    const s = String(text === undefined || text === null ? '' : text).trim();
    if (!s) throw new Error('Chưa có dữ liệu');
    let raw;
    if (s[0] === '{' || s[0] === '[') raw = JSON.parse(s);
    else if (s[0] === '<') raw = xmlObject(s);
    else throw new Error('Chỉ nhận dữ liệu JSON hoặc XML');
    if (raw && Array.isArray(raw.invoices)) return { batch:raw.invoices.map(norm) };
    if (raw && Array.isArray(raw.hoaDon)) return { batch:raw.hoaDon.map(norm) };
    return { one:norm(raw) };
  }

  function importNorm(inv){
    const box = inv.kind === 'purchase' ? purs() : invs();
    if (box.some(x => x.code === inv.code)) throw new Error('Mã chứng từ ' + inv.code + ' đã tồn tại');
    if (inv.kind === 'purchase'){
      let s = sups().find(x => (x.name || '').toLowerCase() === inv.partner.toLowerCase());
      if (!s){ s = { id:uid(), hid:S.hid, name:inv.partner, phone:'', address:'', debt:0 }; S.data.suppliers.push(s); }
      const p = { id:uid(), hid:S.hid, code:inv.code, date:inv.date, supplierId:s.id, supplier:s.name,
        lines:inv.lines, subtotal:inv.subtotal, discount:inv.discount, total:inv.total,
        pay:inv.pay, note:inv.note, source:'bridge' };
      S.data.purchases.push(p);
      applyPurchase(p);
    } else {
      let c = custs().find(x => (x.name || '').toLowerCase() === inv.partner.toLowerCase());
      if (inv.pay === 'debt' && !c){ c = { id:uid(), hid:S.hid, name:inv.partner, phone:'', debt:0 }; S.data.customers.push(c); }
      const i = { id:uid(), hid:S.hid, code:inv.code, date:inv.date, lines:inv.lines,
        subtotal:inv.subtotal, discount:inv.discount, total:inv.total, pay:inv.pay,
        customer:inv.partner, customerId:c ? c.id : '', note:inv.note, source:'bridge' };
      S.data.invoices.push(i);
      applySale(i);
    }
    return inv;
  }

  function importData(text){
    const p = parse(text), list = p.batch || [p.one];
    list.forEach(importNorm);
    saveAll();
    return { count:list.length, first:p.batch ? null : p.one };
  }

  function toXML(o){
    const e = esc;
    const lines = arr(o.lines || []).map(l => '<line><name>' + e(l.name || '') + '</name>'
      + '<group>' + e(l.group || 'goods') + '</group><qty>' + n0(l.qty)
      + '</qty><price>' + n0(l.price) + '</price></line>').join('');
    return '<invoice><kind>' + e(o.kind || 'sale') + '</kind><code>' + e(o.code || '') + '</code>'
      + '<date>' + e(o.date || '') + '</date><partner>' + e(o.partner || o.customer || o.supplier || '')
      + '</partner><pay>' + e(o.pay || 'cash') + '</pay><note>' + e(o.note || '')
      + '</note><discount>' + n0(o.discount) + '</discount><lines>' + lines + '</lines></invoice>';
  }

  function exportData(kind){
    const isPur = kind === 'purchase';
    const list = (isPur ? purs() : invs()).map(i => ({
      kind:isPur ? 'purchase' : 'sale', code:i.code, date:i.date,
      partner:isPur ? (i.supplier || '') : (i.customer || ''), pay:i.pay,
      discount:n0(i.discount), note:i.note || '',
      lines:(i.lines || []).map(l => ({ name:l.name, group:l.group || 'goods', qty:n0(l.qty), price:n0(l.price) }))
    }));
    return { app:'quan-ly-hkd', version:1, kind:isPur ? 'purchase' : 'sale',
      exportedAt:new Date().toISOString(), invoices:list };
  }

  return { parse, importData, exportData, norm, xmlObject,
    toXML, sample:function(kind){
      const isPur = kind === 'purchase';
      return { app:'quan-ly-hkd', version:1, kind:isPur ? 'purchase' : 'sale',
        invoices:[{ kind:isPur ? 'purchase' : 'sale', code:isPur ? 'PN-BR-001' : 'HD-BR-001',
          date:'2026-03-05', partner:isPur ? 'Nhà cung cấp mẫu' : 'Khách mẫu', pay:isPur ? 'debt' : 'cash',
          note:'Dữ liệu mẫu', discount:0,
          lines:[{ name:isPur ? 'Gạo' : 'Bút', group:'goods', qty:2, price:18000 }] }] };
    } };
})();
if (typeof window !== 'undefined') window.InvoiceBridge = Bridge;

/* ---------------------------- in ấn ---------------------------- */
function printHtml(html){
  $('#print').innerHTML = html;
  setTimeout(() => window.print(), 60);
}
function docHead(title, extra){
  const h = hh();
  return '<div class="pdoc">'
    + '<h2>' + esc(h ? h.name : '') + '</h2>'
    + '<div class="sub">' + (h && h.address ? esc(h.address) + ' · ' : '')
    + (h && h.taxCode ? 'MST: ' + esc(h.taxCode) : '') + '</div>'
    + '<h3 class="center">' + esc(title) + '</h3>'
    + (extra ? '<div class="center small">' + esc(extra) + '</div>' : '');
}
function docFoot(){
  const h = hh();
  return '<div class="sign"><div>Người mua / khách hàng<br><br><br>(Ký, ghi rõ họ tên)</div>'
    + '<div>Người bán hàng<br><br><br>' + esc(h ? (h.owner || '') : '') + '</div></div></div>';
}
