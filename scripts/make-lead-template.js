// Writes data/leads/Lead_Practice.xlsx: an invented practice workbook for the lead-management
// dashboard (HOT / COLD leads). Every name, phone number and problem in it is made up.
// Run: node scripts/make-lead-template.js
// No libraries: the .xlsx (a zip of XML files) is written with Node's own zlib.
// The dates are fixed (reporting date 2026-11-14) so the file is the same every time.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateRawSync, crc32 } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// `--blank <file>` writes the same layout with no rows: a workbook for your own leads.
// `--upgrade <file>` rewrites your own workbook in the latest layout and keeps every row
// (a backup copy is saved next to it first).
const blankAt = process.argv.indexOf('--blank');
const upAt = process.argv.indexOf('--upgrade');
const UPGRADE = upAt !== -1;
const BLANK = blankAt !== -1 || UPGRADE;
const OUT = UPGRADE ? path.resolve(process.argv[upAt + 1] || path.join(root, 'data/leads/My_Leads.xlsx'))
  : BLANK ? path.resolve(process.argv[blankAt + 1] || path.join(root, 'data/leads/My_Leads.xlsx')) : path.join(root, 'data/leads/Lead_Practice.xlsx');
const REPORTING_DATE = '2026-11-14';

// ---------- the layout ----------
export const HOT_STAGES = [
  ['h01_phone_date', 'Phone number received'],
  ['h02_form_sent_date', 'Google Form sent'],
  ['h03_call_date', 'First call stage'],
  ['h04_docs_date', 'Docs collection stage'],
  ['h05_checking_date', 'Bank Checking stage'],
  ['h06_proposal_date', 'Proposal stage'],
  ['h07_appointment_date', 'Appointment stage'],
  ['h08_followup_date', 'Follow up & closing'],
];
// What a customer can close. One customer may close several at once: one row each on the Cases sheet.
export const PRODUCTS = ['BCS', 'BCS settlement', 'CCS', 'Goal Loan', 'Home Fin', 'SME Loan', 'Fin Account', 'Card Master', 'Biz Assist', 'Financial Workshop'];
// Only these products may have their fee paid by installment.
export const INSTALLMENT_PRODUCTS = ['BCS', 'BCS settlement', 'CCS'];
export const COLD_STEPS = [
  ['c1_telegram_promoted_date', 'Telegram group promoted'],
  ['c2_telegram_joined_date', 'Joined Telegram group'],
  ['c3_upgraded_hot_date', 'Upgraded to HOT'],
];
const LEAD_COLUMNS = [
  ['lead_id', 'Lead ID, must be unique', 'L-0001'],
  ['name', 'Name', 'Ali (Demo)'],
  ['platform', 'Where the lead came from', 'Facebook / Instagram / TikTok / Xiaohongshu'],
  ['first_contact_date', 'Date of first contact', '2026-11-01'],
  ['category', 'HOT = willing to share personal details and problems; COLD = just curious, no contact details left', 'HOT / COLD'],
  ['status', 'Active = still in steps 1-8; Won = closed at least one product (see the Cases sheet); Lost', 'Active / Won / Lost'],
  ['agent', 'Who brought this customer. Your own case: Chris. Passed to you by an agent: that agent\'s name', 'Chris / Wendy'],
  ['consultant', 'Who handles the case (usually Chris)', 'Chris'],
  ['phone', 'Phone (HOT leads only)', '012-000 0001'],
  ['problem', 'Short description of the problem', 'Credit card debt'],
  ['next_action', 'What to do next (active leads only)', 'First call'],
  ['next_action_date', 'Date of the next action', '2026-11-16'],
  ['lost_reason', 'Why the lead was lost (lost leads only)', 'No reply'],
  ['notes', 'Notes', ''],
  ...HOT_STAGES.map(([id, label], i) => [id, `HOT step ${i + 1} "${label}": the date it was reached (leave blank until then)`, '']),
  ['coi_date', 'After-sales: the date this customer was converted to a COI (centre of influence)', '2026-11-12'],
  ['telegram_promoted_date', 'After-sales: the date the Telegram group was promoted to this customer', '2026-11-12'],
  ...COLD_STEPS.map(([id, label]) => [id, `COLD "${label}": the date`, '']),
];
const CASE_COLUMNS = [
  ['case_id', 'Case ID, must be unique (one row per product a customer closed)', 'C-0001'],
  ['lead_id', 'The lead ID from the Leads sheet (pick from the list)', 'L-0002'],
  ['customer', 'Filled in automatically from the Leads sheet: do not type here', ''],
  ['product', 'Product closed (pick from the list)', PRODUCTS.join(' / ')],
  ['closed_date', 'Date this product was closed with the customer', '2026-10-26'],
  ['processing_date', 'Date case processing started', '2026-10-28'],
  ['fee_collected_date', 'Date the full fee was collected; the case is closed only then. Leave blank for installment cases: they close when the last payment on the Payments sheet is paid', '2026-11-10'],
  ['installment', `Yes = the fee is paid by installment (only for ${INSTALLMENT_PRODUCTS.join(', ')}); list every payment on the Payments sheet`, 'Yes / blank'],
  ['notes', 'Notes', ''],
];
const PAYMENT_COLUMNS = [
  ['case_id', 'The case ID from the Cases sheet, installment cases only (pick from the list)', 'C-0002'],
  ['customer', 'Filled in automatically from the Cases sheet: do not type here', ''],
  ['product', 'Filled in automatically from the Cases sheet: do not type here', ''],
  ['due_date', 'When this installment is due', '2026-03-05'],
  ['amount', 'Amount of this installment in RM (numbers only)', '6000'],
  ['paid_date', 'Date it was paid (blank = not paid yet)', '2026-03-04'],
];
const FREEBIE_COLUMNS = [
  ['lead_id', 'The lead ID from the Leads sheet (pick from the list)', 'L-0005'],
  ['name', 'Filled in automatically from the Leads sheet: do not type here', ''],
  ['freebie', 'What was given', 'MoneyBuddy DSR report'],
  ['sent_date', 'Date it was sent', '2026-11-10'],
];

// ---------- invented data (seeded, so it never changes) ----------
let seed = 20261114;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = a => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const before = (a, b) => a <= b;
// a next-action date near the reporting date (a few already overdue), never before the last step
const nextDate = last => { const d = addDays(REPORTING_DATE, int(-4, 10)); return d < last ? addDays(last, 1) : d; };

const NAMES = ['Ali', 'Mei Ling', 'Kumar', 'Siti', 'Jason', 'Farah', 'Wei Jie', 'Priya', 'Hafiz', 'Grace', 'Ahmad', 'Xin Yi', 'Ravi', 'Nurul', 'Daniel', 'Hui Min', 'Arif', 'Kavitha', 'Ken', 'Aisyah', 'Ming', 'Zul', 'Joanne', 'Suresh', 'Amirah', 'Kok Leong', 'Lina', 'Hakim', 'Shu Fen', 'Vincent', 'Yasmin', 'Raj', 'Eunice', 'Faiz', 'Pei Shan', 'Azlan', 'Rachel', 'Ganesh', 'Liyana', 'Chee Keong'];
const PLATFORMS = ['Facebook', 'Facebook', 'Instagram', 'Instagram', 'TikTok', 'Xiaohongshu'];
const PROBLEMS = ['Too much credit card debt', 'DSR too high, home loan rejected', 'Cannot repay personal loan', 'Wants to consolidate debts', 'Late payments on CCRIS', 'Car loan plus card debt', 'Loan rejected, wants to know why'];
const NEXT_ACTION = ['Send Google Form', 'First call', 'Remind to send documents', 'Bank checking', 'Prepare proposal', 'Set closing appointment', 'Follow up to close'];
const LOST = ['No reply', 'Fee too high', 'Went elsewhere', 'Incomplete documents, gave up', 'Not needed for now'];
const FREEBIES = ['MoneyBuddy DSR report', 'TFG tickets', 'ChatGPT prompt: settle credit card debt yourself', 'Monthly money tips'];

const OWNER = 'Chris';
const AGENTS = ['Wendy (Demo agent)', 'Kelvin (Demo agent)', 'Aina (Demo agent)'];
const UPGRADED = new Set([5, 17, 26]); // examples of COLD leads that later became HOT
// customers who closed, and how many products each closed (so every kind of example is in the file)
const CLOSERS = new Map([[1, 2], [3, 1], [7, 3], [9, 1], [12, 2], [15, 1], [20, 1], [24, 2], [29, 1], [33, 1], [36, 2]]);
const leads = [];
const freebies = [];
const cases = [];
const payments = [];
const firstOfNextMonth = iso => { const [y, m] = iso.split('-').map(Number); return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`; };
const monthDay = (iso, k, day) => { let d = iso; for (let j = 0; j < k; j++) d = firstOfNextMonth(d); return d.slice(0, 8) + String(day).padStart(2, '0'); };
// an installment plan: one row per payment; paid if due by the reporting date (sometimes late or missed)
function addSchedule(c, start, amounts, day, missChance) {
  let missed = false;
  amounts.forEach((amount, k) => {
    const due = monthDay(start, k, day);
    const p = { case_id: c.case_id, due_date: due, amount };
    if (!missed && before(due, REPORTING_DATE)) {
      if (rnd() < missChance) missed = true;
      else { const paid = addDays(due, int(-3, 4)); if (before(paid, REPORTING_DATE)) p.paid_date = paid; }
    }
    payments.push(p);
  });
  return payments.filter(p => p.case_id === c.case_id).every(p => p.paid_date);
}
function planAmounts(total, months) {
  const big = Math.round(total * 0.2 / 100) * 100;
  const rest = total - 2 * big;
  const each = Math.floor(rest / (months - 2) / 100) * 100;
  const list = [big, big, ...Array(months - 3).fill(each)];
  list.push(total - list.reduce((a, b) => a + b, 0));
  return list;
}
for (let i = 0; i < 40; i++) {
  const id = `L-${String(i + 1).padStart(4, '0')}`;
  const first = CLOSERS.has(i) ? addDays('2026-08-10', int(0, 55)) : addDays('2026-09-01', int(0, 72));
  const row = { lead_id: id, name: `${NAMES[i]} (Demo)`, platform: pick(PLATFORMS), first_contact_date: first, status: 'Active' };
  let hotStart = null;
  if (!CLOSERS.has(i) && (UPGRADED.has(i) || rnd() < 0.45)) {
    // COLD: PM only. Some are told about the Telegram group, some join, a few become HOT.
    row.category = 'COLD';
    let d = first;
    const depth = UPGRADED.has(i) ? 3 : int(0, 2);
    for (let s = 0; s < depth; s++) {
      const next = addDays(d, int(1, 7));
      if (!before(next, REPORTING_DATE)) break;
      row[COLD_STEPS[s][0]] = d = next;
    }
    if (row.c2_telegram_joined_date) {
      let fd = row.c2_telegram_joined_date;
      for (let k = int(1, 2); k > 0; k--) {
        fd = addDays(fd, int(2, 10));
        if (!before(fd, REPORTING_DATE)) break;
        freebies.push({ lead_id: id, freebie: pick(FREEBIES), sent_date: fd });
      }
    }
    if (row.c3_upgraded_hot_date) { row.category = 'HOT'; hotStart = row.c3_upgraded_hot_date; }
    else if (!row.c1_telegram_promoted_date) { row.next_action = 'Promote Telegram group'; row.next_action_date = nextDate(first); }
    else if (!row.c2_telegram_joined_date) { row.next_action = 'Remind to join Telegram group'; row.next_action_date = nextDate(row.c1_telegram_promoted_date); }
  } else {
    row.category = 'HOT';
    hotStart = first;
  }
  if (hotStart) {
    // most cases are Chris's own; some are passed on by an agent (invented names)
    row.agent = rnd() < 0.3 ? pick(AGENTS) : OWNER;
    row.consultant = OWNER;
    row.phone =`01${int(0, 9)}-000 ${String(1000 + i).slice(-4)}`;
    row.problem = pick(PROBLEMS);
    let d = hotStart;
    const target = CLOSERS.has(i) ? 8 : int(1, 8);
    let reached = 0;
    for (let s = 0; s < target; s++) {
      const next = s === 0 ? d : addDays(d, int(1, 6));
      if (!before(next, REPORTING_DATE)) break;
      row[HOT_STAGES[s][0]] = d = next;
      reached = s + 1;
    }
    // NEXT_ACTION[k] is the action that leads to stage k + 2 (after reaching stage k + 1)
    const closed = CLOSERS.has(i) && reached === 8;
    if (closed) {
      // Won: one to three products, each its own case with its own processing and fee dates
      row.status = 'Won';
      const n = CLOSERS.get(i);
      const chosen = [];
      while (chosen.length < n) { const p = !chosen.length && rnd() < 0.6 ? pick(INSTALLMENT_PRODUCTS) : pick(PRODUCTS); if (!chosen.includes(p)) chosen.push(p); }
      const closedOn = addDays(d, int(0, 3));
      let allDone = true; let lastFee = closedOn;
      for (const product of chosen) {
        const c = { case_id: `C-${String(cases.length + 1).padStart(4, '0')}`, lead_id: id, product, closed_date: closedOn };
        const proc = addDays(closedOn, int(1, 5));
        if (before(proc, REPORTING_DATE)) c.processing_date = proc;
        if (INSTALLMENT_PRODUCTS.includes(product) && rnd() < 0.6) {
          // installment: closed only when the last payment is paid
          c.installment = 'Yes';
          const paidUp = addSchedule(c, proc, planAmounts(pick([6000, 9000, 12000, 15000]), int(3, 6)), int(1, 28), 0.15);
          const last = payments.filter(p => p.case_id === c.case_id).at(-1);
          if (paidUp && last.paid_date > lastFee) lastFee = last.paid_date;
          if (!paidUp) allDone = false;
        } else {
          const fee = addDays(proc, int(7, 35));
          if (c.processing_date && before(fee, REPORTING_DATE)) { c.fee_collected_date = fee; if (fee > lastFee) lastFee = fee; } else allDone = false;
        }
        cases.push(c);
      }
      if (allDone) {
        // after-sales: COI and Telegram are tracked separately
        const coi = addDays(lastFee, int(1, 8)); const tg = addDays(lastFee, int(0, 5));
        if (before(coi, REPORTING_DATE) && rnd() < 0.55) row.coi_date = coi;
        if (before(tg, REPORTING_DATE) && rnd() < 0.7) row.telegram_promoted_date = tg;
        const todo = [!row.coi_date && 'convert to COI', !row.telegram_promoted_date && 'promote Telegram group'].filter(Boolean);
        if (todo.length) { row.next_action = 'After-sales: ' + todo.join(' + '); row.next_action_date = nextDate(lastFee); }
      } else { row.next_action = 'Follow up on case processing'; row.next_action_date = nextDate(closedOn); }
    } else if (reached >= 2 && rnd() < 0.2) { row.status = 'Lost'; row.lost_reason = pick(LOST); }
    else { row.next_action = reached === 8 ? 'Follow up to close' : NEXT_ACTION[reached - 1]; row.next_action_date = nextDate(d); }
  }
  if (i % 7 === 3) row.notes = 'Practice data: all invented';
  leads.push(row);
}
// A long installment plan, shaped like a real one: 6k, 6k, 3.6k x 4, 800 x 2, final 1.1k.
{
  const row = { lead_id: 'L-0041', name: 'Natalie (Demo)', platform: 'Facebook', first_contact_date: '2026-01-19', category: 'HOT', status: 'Won', agent: AGENTS[0], consultant: OWNER,
    phone: '012-000 1040', problem: 'Too much credit card debt', notes: 'Practice data: installment example' };
  ['2026-01-19', '2026-01-20', '2026-01-23', '2026-01-28', '2026-02-02', '2026-02-06', '2026-02-12', '2026-02-16'].forEach((d, k) => { row[HOT_STAGES[k][0]] = d; });
  const c = { case_id: `C-${String(cases.length + 1).padStart(4, '0')}`, lead_id: row.lead_id, product: 'BCS', closed_date: '2026-02-18', processing_date: '2026-02-20', installment: 'Yes', notes: 'Final payment in November' };
  cases.push(c);
  ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'].forEach((m, k) => {
    const amount = [6000, 6000, 3600, 3600, 3600, 3600, 800, 800, 1100][k];
    const due = `${m}-25`;
    payments.push({ case_id: c.case_id, due_date: due, amount, ...(before(due, REPORTING_DATE) ? { paid_date: addDays(due, k % 3 - 1) } : {}) });
  });
  row.next_action = 'Remind final installment (RM 1,100)'; row.next_action_date = '2026-11-23';
  leads.push(row);
}
if (BLANK) { leads.length = 0; cases.length = 0; payments.length = 0; freebies.length = 0; }

// Columns Excel fills in itself (looked up by ID); {r} is the row number.
const AUTO = {
  Cases: { customer: 'IFERROR(INDEX(Leads!$B:$B,MATCH($B{r},Leads!$A:$A,0)),"")' },
  Payments: { customer: 'IFERROR(INDEX(Cases!$C:$C,MATCH($A{r},Cases!$A:$A,0)),"")', product: 'IFERROR(INDEX(Cases!$D:$D,MATCH($A{r},Cases!$A:$A,0)),"")' },
  Freebies: { name: 'IFERROR(INDEX(Leads!$B:$B,MATCH($A{r},Leads!$A:$A,0)),"")' },
};
const AUTO_ROWS = 500; // formulas are ready on this many rows
const LAYOUT = { Leads: LEAD_COLUMNS, Cases: CASE_COLUMNS, Payments: PAYMENT_COLUMNS, Freebies: FREEBIE_COLUMNS };
// extra columns you added yourself are kept, at the end of their sheet
const EXTRA = { Leads: [], Cases: [], Payments: [], Freebies: [] };
if (UPGRADE) {
  const { existsSync, copyFileSync } = await import('node:fs');
  if (!existsSync(OUT)) { console.error(`Not found: ${OUT}`); process.exit(1); }
  if (existsSync(path.join(path.dirname(OUT), '~$' + path.basename(OUT)))) {
    console.error('The workbook is open in Excel. Close it first (so your later save does not undo the upgrade), then run this again.');
    process.exit(1);
  }
  let n = 1; let backup;
  do { backup = OUT.replace(/\.xlsx$/i, `.backup-${n}.xlsx`); n++; } while (existsSync(backup));
  copyFileSync(OUT, backup);
  const { default: readXlsx } = await import('read-excel-file/node');
  const old = await readXlsx(OUT);
  const toIso = v => (v instanceof Date ? v.toISOString().slice(0, 10) : v);
  const target = { Leads: leads, Cases: cases, Payments: payments, Freebies: freebies };
  for (const [sheet, list] of Object.entries(target)) {
    const s = old.find(x => x.sheet === sheet);
    if (!s || !s.data.length) continue;
    const head = s.data[0].map(h => String(h ?? '').trim());
    const known = new Set(LAYOUT[sheet].map(c => c[0]));
    EXTRA[sheet] = head.filter(h => h && !known.has(h));
    for (const r of s.data.slice(1)) {
      const row = {};
      head.forEach((h, i) => { if (h && !(AUTO[sheet] && h in AUTO[sheet]) && r[i] !== null && r[i] !== '') row[h] = toIso(r[i]); });
      if (Object.keys(row).length) list.push(row);
    }
  }
  console.log(`Backup saved: ${path.relative(root, backup)}`);
}

// ---------- a minimal .xlsx writer ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colName = n => { let s = ''; for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const excelSerial = iso => (Date.parse(`${iso}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86400000;
const isDateCol = id => id.endsWith('_date');
// style 0 = normal, 1 = date (yyyy-mm-dd), 2 = bold header, 3 = number, 4 = grey italic (filled in automatically)
function sheetXml(columns, rows, widths, lists = {}, auto = {}) {
  const cell = (r, c, v, id) => {
    const ref = `${colName(c)}${r}`;
    if (id && auto[id]) return `<c r="${ref}" t="str" s="4"><f>${esc(auto[id].replace(/\{r\}/g, r))}</f></c>`;
    if (v === undefined || v === null || v === '') return '';
    if (id && isDateCol(id) && /^\d{4}-\d{2}-\d{2}$/.test(v)) return `<c r="${ref}" s="1"><v>${excelSerial(v)}</v></c>`;
    if (typeof v === 'number') return `<c r="${ref}" s="3"><v>${v}</v></c>`;
    if (typeof v === 'boolean') return `<c r="${ref}" t="b"><v>${v ? 1 : 0}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${id ? '' : ' s="2"'}><is><t>${esc(v)}</t></is></c>`;
  };
  const head = `<row r="1">${columns.map((c, i) => cell(1, i, c, null)).join('')}</row>`;
  const n = Object.keys(auto).length ? Math.max(rows.length, AUTO_ROWS) : rows.length;
  const body = Array.from({ length: n }, (_, ri) => `<row r="${ri + 2}">${columns.map((c, i) => cell(ri + 2, i, (rows[ri] || {})[c], c)).join('')}</row>`).join('');
  const cols = `<cols>${columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${widths?.[i] ?? (auto[c] ? 22 : isDateCol(c) ? 13 : Math.max(12, c.length + 2))}" customWidth="1"${isDateCol(c) ? ' style="1"' : c === 'amount' ? ' style="3"' : ''}/>`).join('')}</cols>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols}<sheetData>${head}${body}</sheetData>${validations(columns, lists)}</worksheet>`;
}
// drop-down lists in Excel, rows 2-2000: a fixed list (e.g. product names) or a range on another sheet (e.g. the lead IDs)
function validations(columns, lists) {
  const v = Object.entries(lists).filter(([col]) => columns.includes(col)).map(([col, values]) => {
    const L = colName(columns.indexOf(col));
    const f = Array.isArray(values) ? `"${esc(values.join(','))}"` : esc(values);
    return `<dataValidation type="list" allowBlank="1" showErrorMessage="${Array.isArray(values) ? 1 : 0}" sqref="${L}2:${L}2000"><formula1>${f}</formula1></dataValidation>`;
  });
  return v.length ? `<dataValidations count="${v.length}">${v.join('')}</dataValidations>` : '';
}
// the "Guide" sheet is all text (no id), so give it plain rows
function guideXml() {
  const lines = [
    [BLANK ? `Lead workbook (${path.basename(OUT)})` : 'Lead practice workbook (Lead_Practice.xlsx)'],
    [BLANK ? 'Your own leads. Keep this file on your computer: it holds personal details and is never uploaded to GitHub.' : `Every name, phone number and problem here is invented practice data. Reporting date: ${REPORTING_DATE}.`],
    ['How to use: one row per lead on the Leads sheet. When a lead reaches a step, fill in that step\'s date; the dashboard takes the last filled date as the current stage.'],
    ['When a customer closes, add one row per product on the Cases sheet (a customer can close several products at once) and set the lead\'s status to Won. Pick the lead_id from the list; the customer\'s name then appears by itself (grey columns are filled in automatically).'],
    ['Installment cases: put every payment on the Payments sheet (due date, amount, paid date). The case closes only when every payment is paid. After-sales (COI, Telegram group) is per customer on the Leads sheet.'],
    [''],
    ['Sheet', 'Column', 'Meaning', 'Example'],
    ...LEAD_COLUMNS.map(([id, desc, ex]) => ['Leads', id, desc, ex]),
    ...CASE_COLUMNS.map(([id, desc, ex]) => ['Cases', id, desc, ex]),
    ...PAYMENT_COLUMNS.map(([id, desc, ex]) => ['Payments', id, desc, ex]),
    ...FREEBIE_COLUMNS.map(([id, desc, ex]) => ['Freebies', id, desc, ex]),
  ];
  const rows = lines.map((l, r) => `<row r="${r + 1}">${l.map((v, c) => v === '' ? '' : `<c r="${colName(c)}${r + 1}" t="inlineStr"${r === 0 || r === 6 ? ' s="2"' : ''}><is><t>${esc(v)}</t></is></c>`).join('')}</row>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="16" customWidth="1"/><col min="2" max="2" width="26" customWidth="1"/><col min="3" max="3" width="70" customWidth="1"/><col min="4" max="4" width="36" customWidth="1"/></cols><sheetData>${rows}</sheetData></worksheet>`;
}

const SHEETS = [
  ['Leads', sheetXml(LEAD_COLUMNS.map(c => c[0]).concat(EXTRA.Leads), leads, null, { category: ['HOT', 'COLD'], status: ['Active', 'Won', 'Lost'] })],
  ['Cases', sheetXml(CASE_COLUMNS.map(c => c[0]).concat(EXTRA.Cases), cases, [10, 10, 22, 20, 13, 15, 18, 12, 24], { lead_id: 'Leads!$A$2:$A$2000', product: PRODUCTS, installment: ['Yes'] }, AUTO.Cases)],
  ['Payments', sheetXml(PAYMENT_COLUMNS.map(c => c[0]).concat(EXTRA.Payments), payments, [10, 22, 18, 13, 12, 13], { case_id: 'Cases!$A$2:$A$2000' }, AUTO.Payments)],
  ['Freebies', sheetXml(FREEBIE_COLUMNS.map(c => c[0]).concat(EXTRA.Freebies), freebies, [12, 22, 34, 13], { lead_id: 'Leads!$A$2:$A$2000' }, AUTO.Freebies)],
  ['Guide', guideXml()],
];
const files = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${SHEETS.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${SHEETS.map(([name], i) => `<sheet name="${esc(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${SHEETS.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${SHEETS.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF7F7F7F"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="5"><xf/><xf numFmtId="164" applyNumberFormat="1"/><xf fontId="1" applyFont="1"/><xf numFmtId="3" applyNumberFormat="1"/><xf fontId="2" applyFont="1"/></cellXfs></styleSheet>`,
};
SHEETS.forEach(([, xml], i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = xml; });

function zip(entries) {
  const local = []; const central = []; let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name, 'utf8');
    const raw = Buffer.from(text, 'utf8');
    const data = deflateRawSync(raw);
    const crc = crc32(raw);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
    h.writeUInt32LE(0, 10); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(raw.length, 22);
    h.writeUInt16LE(nameBuf.length, 26); h.writeUInt16LE(0, 28);
    local.push(h, nameBuf, data);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt32LE(0, 12); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(raw.length, 24);
    c.writeUInt16LE(nameBuf.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(Object.keys(entries).length, 8); end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, cd, end]);
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, zip(files));
const count = s => leads.filter(r => r.category === s).length;
console.log(`Wrote ${path.relative(root, OUT)}: ${leads.length} leads (HOT ${count('HOT')}, COLD ${count('COLD')}), ${cases.length} cases, ${payments.length} installment payments, ${freebies.length} freebies.`);
