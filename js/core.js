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
    policy: null, settings: { backupAt: null, onboarded: false }
  },
  hid: null,
  route: 'home',
  cart: [],
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
