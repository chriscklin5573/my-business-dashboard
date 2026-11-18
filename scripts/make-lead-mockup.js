// Builds mockups/lead-dashboard.html: a clickable PREVIEW of the planned lead-management dashboard,
// filled from the invented practice workbook data/leads/Lead_Practice.xlsx.
// It is a look-and-feel mockup only (one self-contained file, no network); the real pages come later.
// Run: node scripts/make-lead-mockup.js
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readXlsxFile from 'read-excel-file/node';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Optional: node scripts/make-lead-mockup.js <your workbook.xlsx> <output.html>
const SRC = path.resolve(process.argv[2] || path.join(root, 'data/leads/Lead_Practice.xlsx'));
const OUT = path.resolve(process.argv[3] || path.join(root, 'mockups/lead-dashboard.html'));
const PRACTICE = path.basename(SRC) === 'Lead_Practice.xlsx';
// Your own background picture (optional): mockups/my-background.jpg / .png / .webp.
// Only used for your own dashboard; it stays on this computer (see .gitignore).
const { existsSync: bgExists, readFileSync: bgRead } = await import('node:fs');
const BG_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml' };
const bgFile = PRACTICE ? null : Object.keys(BG_TYPES).map(ext => path.join(root, 'mockups/my-background.' + ext)).find(f => bgExists(f));
const avFile = PRACTICE ? null : Object.keys(BG_TYPES).map(ext => path.join(root, 'mockups/my-avatar.' + ext)).find(f => bgExists(f));
const AVATAR = avFile ? 'data:' + BG_TYPES[path.extname(avFile).slice(1).toLowerCase()] + ';base64,' + bgRead(avFile).toString('base64') : null;
const fontData = f => bgRead(path.join(root, 'mockups/fonts', f)).toString('base64');
// Font pairs (title font + number/system font). Pick one with FONT_PAIR=A|B|C (default A).
const FONT_FILES = {
  Cinzel: [['Cinzel-Variable.ttf', '400 900']], Rajdhani: [['Rajdhani-SemiBold.ttf', '600'], ['Rajdhani-Bold.ttf', '700']],
  Orbitron: [['Orbitron-Variable.ttf', '400 900']], Oxanium: [['Oxanium-Variable.ttf', '200 800']], 'Chakra Petch': [['ChakraPetch-SemiBold.ttf', '600'], ['ChakraPetch-Bold.ttf', '700']],
};
const FONT_PAIRS = { A: ['Orbitron', 'Oxanium'], B: ['Orbitron', 'Chakra Petch'], C: ['Cinzel', 'Rajdhani'] };
const PAIR = FONT_PAIRS[(process.env.FONT_PAIR || 'A').toUpperCase()] || FONT_PAIRS.A; // A chosen on 2026-11-17
const FONTS = [...new Set(PAIR)].flatMap(fam => FONT_FILES[fam].map(([f, w]) => '@font-face { font-family: "' + fam + '"; src: url(data:font/ttf;base64,' + fontData(f) + ') format("truetype"); font-weight: ' + w + '; font-display: swap; }')).join('\n');
const BG = bgFile ? 'data:' + BG_TYPES[path.extname(bgFile).slice(1).toLowerCase()] + ';base64,' + bgRead(bgFile).toString('base64') : null;

const iso = v => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? null : String(v).trim());
const sheets = await readXlsxFile(SRC);
const table = name => {
  const s = sheets.find(x => x.sheet === name);
  if (!s || !s.data.length) return [];
  const head = s.data[0].map(h => String(h ?? '').trim());
  // skip empty rows; trim text
  return s.data.slice(1).filter(r => r.some(v => v !== null && v !== ''))
    .map(r => Object.fromEntries(head.map((h, i) => [h, h.endsWith('_date') ? iso(r[i]) : typeof r[i] === 'string' ? r[i].trim() : r[i]])));
};
const data = { leads: table('Leads'), cases: table('Cases'), payments: table('Payments'), freebies: table('Freebies') };
const json = JSON.stringify(data).replace(/</g, '\\u003c');
// a fixed star field for the background (original art, no images downloaded)
let starSeed = 7;
const sr = () => ((starSeed = (starSeed * 16807) % 2147483647) / 2147483647);
const PEAKS = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M0 60 L0 40 L22 26 L38 36 L60 14 L74 30 L86 22 L104 40 L126 20 L140 32 L156 10 L160 4 L164 10 L176 28 L200 18 L200 60 Z" fill="#000" opacity="0.22"/><path d="M0 60 L0 50 L40 42 L80 52 L120 44 L160 52 L200 46 L200 60 Z" fill="#000" opacity="0.18"/></svg>');
let smokeSeed = 5;
const smr = () => ((smokeSeed = (smokeSeed * 16807) % 2147483647) / 2147483647);
const tendril = () => { let x = 300 + smr() * 600, y = 900; let d = 'M' + x.toFixed(0) + ' ' + y; for (let k = 0; k < 4; k++) { const nx = x + (smr() - 0.5) * 520, ny = y - 160 - smr() * 120; d += ' Q' + (x + (smr() - 0.5) * 420).toFixed(0) + ' ' + ((y + ny) / 2).toFixed(0) + ' ' + nx.toFixed(0) + ' ' + ny.toFixed(0); x = nx; y = ny; } return d; };
const SMOKE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice"><defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter><filter id="b2"><feGaussianBlur stdDeviation="5"/></filter>'
  + '<radialGradient id="neb" cx="58%" cy="38%" r="55%"><stop offset="0" stop-color="#6A3BC0" stop-opacity="0.18"/><stop offset="0.45" stop-color="#341A70" stop-opacity="0.12"/><stop offset="1" stop-color="#12062A" stop-opacity="0"/></radialGradient>'
  + '<radialGradient id="neb2" cx="15%" cy="85%" r="45%"><stop offset="0" stop-color="#5B2A9E" stop-opacity="0.16"/><stop offset="1" stop-color="#12062A" stop-opacity="0"/></radialGradient></defs>'
  + '<rect width="1200" height="900" fill="url(#neb)"/><rect width="1200" height="900" fill="url(#neb2)"/>'
  + Array.from({ length: 9 }, () => '<path d="' + tendril() + '" fill="none" stroke="#08030F" stroke-width="' + (40 + smr() * 70).toFixed(0) + '" stroke-linecap="round" opacity="' + (0.35 + smr() * 0.3).toFixed(2) + '" filter="url(#b)"/>').join('')
  + Array.from({ length: 7 }, () => '<path d="' + tendril() + '" fill="none" stroke="#0C0418" stroke-width="' + (8 + smr() * 14).toFixed(0) + '" stroke-linecap="round" opacity="0.6" filter="url(#b2)"/>').join('')
  + '</svg>');
const STARS = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">' +
  Array.from({ length: 90 }, () => '<circle cx="' + (sr() * 600).toFixed(1) + '" cy="' + (sr() * 600).toFixed(1) + '" r="' + (sr() * 1.1 + 0.2).toFixed(2) + '" fill="#fff" opacity="' + (sr() * 0.5 + 0.15).toFixed(2) + '"/>').join('') + '</svg>');

const html = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lead dashboard · mockup</title>
<style>
${FONTS}
:root {
  color-scheme: dark;
  --brand: #C9A8FF; --on-brand: #16082A; --brand-deep: #3A1626; --brand-soft: #2A1545; --brand-ink: #EBDDFF; --brand-ink-2: #D6BFFF;
  --gold: #F2C46B; --blue: #C9A8FF; --epic: #B794FF; --page: #07030E; --surface: #120A20; --surface-2: #1C1230; --border: #33224F;
  --ink: #F4EEFF; --ink-2: #D2C8E6; --muted: #A497C2; --btn: #6B3FC9; --btn-ink: #FFFFFF;
  --panel: linear-gradient(160deg, rgba(100, 50, 180, 0.07) 0%, rgba(18, 4, 38, 0.18) 50%, rgba(4, 0, 10, 0.32) 100%);
  --haze: blur(9px) saturate(130%) brightness(0.66);
  --display: "${PAIR[1]}", "DIN Alternate", "Bahnschrift", "Arial Narrow", sans-serif;
  --title: "${PAIR[0]}", "Trajan Pro", "Copperplate", Georgia, sans-serif;
  --active: linear-gradient(90deg, #6B3FC9 0%, #4A23A8 100%);
  --sys: 0 0 0 1px rgba(190, 150, 255, 0.55), 0 0 26px rgba(190, 150, 255, 0.22), inset 0 0 26px rgba(190, 150, 255, 0.07);
  --hot: #F07A5A; --hot-bg: #3A1D16; --cold: #6FA8E8; --cold-bg: #172A40;
  --good: #7CC473; --overdue: #F0645A; --critical-fill: #B8321F;
  --grid: #241838;
  --glow: 0 0 0 1px rgba(200, 160, 255, 0.24), 0 18px 44px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(235, 215, 255, 0.18), inset 0 0 44px rgba(150, 90, 240, 0.12);
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: url("${STARS}"), url("${SMOKE}") center / cover no-repeat, radial-gradient(1400px 900px at 50% 25%, #1C0B38 0%, #0A0318 45%, #030008 100%); background-attachment: fixed; min-height: 100%; color: var(--ink); font: 15px/1.55 var(--font); -webkit-font-smoothing: antialiased; }
h1, h2, h3 { margin: 0 0 8px; line-height: 1.25; font-family: var(--title); font-weight: 700; letter-spacing: ${PAIR[0] === 'Orbitron' ? '0.03em' : '0.06em'}; }${PAIR[0] === 'Orbitron' ? ' h2 { font-size: 15px; } .hunter-name { font-size: 16px !important; } .brandname { font-size: 15px !important; }' : ''}${PAIR[1] !== 'Rajdhani' ? ' nav a { letter-spacing: 0.05em !important; font-size: 13.5px !important; } .st small, .sys-tag { letter-spacing: 0.08em; }' : ''}
h2 { text-transform: uppercase; } .num, .value, .stat .value, .chev b, .stage b { font-family: var(--display); font-weight: 700; }
.sysmsg, .st small, .lic-k, .sys-tag, .q-h, .chip, .rd, .pill, .qtab, .rar, .chev-n, .stat .label { font-family: var(--display); font-weight: 600; }
h1 { font-size: 26px; } h2 { font-size: 17px; font-weight: 650; } h3 { font-size: 14px; font-weight: 650; }
.muted { color: var(--muted); } .small { font-size: 13px; } .num { font-variant-numeric: tabular-nums; }
.ribbon { background: rgba(8, 2, 16, 0.9); color: var(--ink-2); font-size: 13px; padding: 6px 16px; text-align: center; }
.topbar { display: grid; grid-template-columns: 220px minmax(0, 1fr); align-items: center; gap: 16px; padding: 14px 16px 16px; font-weight: 700; font-size: 17px; }
.hunter { display: flex; align-items: center; gap: 10px; padding: 10px 12px; min-width: 0; border-radius: 16px; background: var(--panel); backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); box-shadow: var(--glow); }
.hunter-txt { text-align: left; min-width: 0; flex: 1; }
.avatar { position: relative; width: 56px; height: 56px; flex: none; border-radius: 12px; box-shadow: 0 0 0 1.5px var(--rc), 0 0 16px color-mix(in srgb, var(--rc) 55%, transparent); }
.avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; display: block; }
.av-rank { position: absolute; right: -6px; bottom: -6px; min-width: 22px; height: 22px; padding: 0 5px; border-radius: 7px; display: grid; place-items: center; font-family: var(--display); font-size: 13px; font-weight: 800; color: #0B0614; background: var(--rc); box-shadow: 0 0 10px var(--rc); text-shadow: none; } .hunter .rank { width: 46px !important; height: 46px !important; flex: none; }
.brandname { display: flex; align-items: center; gap: 10px; font-size: 17px; font-family: var(--title); letter-spacing: 0.05em; }
.sysbar { align-self: stretch; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 10px 14px; border-radius: 16px; background: var(--panel); backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); box-shadow: var(--glow); min-width: 0; }
.sysbar-l { flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.sysmsg { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 500; color: var(--ink-2); } .sysmsg b { color: var(--blue); letter-spacing: 0.06em; }
.sysbar-r { display: flex; flex-wrap: wrap; gap: 8px; } .sysbar .st { padding: 4px 12px; min-width: 0; font-weight: 500; } .sysbar .st b { font-size: 16px; } .sysbar .rdst b { color: var(--blue); } .hunter-name { font-family: var(--title); font-weight: 700; font-size: 19px; line-height: 1.1; letter-spacing: 0.04em; } .hunter-rank { font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink-2); font-weight: 500; }
.hunter .xp { margin: 5px 0 2px; width: 100%; } .hunter .xp i { background: linear-gradient(90deg, #4A23A8, var(--blue)); box-shadow: 0 0 10px rgba(190, 150, 255, 0.8); } .hunter-next { font-size: 11px; color: var(--muted); font-weight: 500; }
.sysnote { flex-wrap: wrap; } .sysnote .statsrow { padding: 0; } .sysnote .st { padding: 3px 10px; min-width: 0; } .sysnote .st b { font-size: 15px; }
@media (max-width: 820px) { .topbar { grid-template-columns: 1fr; padding: 12px 12px 14px; } }
.mark { width: 24px; height: 24px; border-radius: 6px; transform: rotate(45deg) scale(0.8); background: linear-gradient(135deg, #C9A8FF, #4A23A8); box-shadow: 0 0 16px rgba(190, 150, 255, 0.7); }
.layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 16px; padding: 0 16px 24px; }
nav { position: sticky; top: 12px; align-self: start; background: var(--panel); backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); box-shadow: var(--glow); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
nav a { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; color: #F1E9FF; text-decoration: none; font-family: var(--display); font-weight: 600; font-size: 15px; letter-spacing: 0.12em; text-transform: uppercase; background: rgba(40, 14, 80, 0.22); border: 1px solid rgba(190, 150, 255, 0.20); box-shadow: inset 0 1px 0 rgba(240, 225, 255, 0.10); } nav a .navt { flex: 1; } nav a .gicon { width: 18px; height: 18px; flex: none; }
nav a:hover { background: rgba(52, 24, 96, 0.7); border-color: rgba(175, 135, 255, 0.35); }
nav a.active { background: linear-gradient(90deg, rgba(107, 63, 201, 0.7), rgba(30, 12, 64, 0.6)); color: #fff; border-color: rgba(190, 150, 255, 0.6); box-shadow: 0 0 16px rgba(150, 100, 255, 0.35), inset 0 0 12px rgba(175, 135, 255, 0.18); }
.count { background: var(--surface-2); border-radius: 999px; padding: 0 8px; font-size: 12px; font-weight: 600; }
nav a.active .count { background: var(--surface); }
.count.alert { background: var(--critical-fill); color: #fff; }
main { min-width: 0; }
.head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; margin: 4px 0 14px; }
.head h1 { margin: 0; }
.rd { background: var(--brand); color: var(--on-brand); border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 650; }
.card { backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); background: var(--panel); border-radius: 20px; padding: 18px 20px; min-width: 0; box-shadow: var(--glow); }
.card + .card, .tiles + .card, .grid + .card, .card + .grid { margin-top: 16px; }
.tiles { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 16px; }
.tile { backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); background: var(--panel); border-radius: 20px; padding: 16px 18px; box-shadow: var(--glow); }
.tile .label { font-size: 13px; color: var(--ink-2); }
.tile .value { font-size: 30px; font-weight: 700; margin: 4px 0 2px; font-variant-numeric: tabular-nums; }
.tile .foot { font-size: 12.5px; color: var(--muted); }
.tile.hero { background: radial-gradient(circle at 85% -10%, rgba(185, 150, 255, 0.35), transparent 58%), linear-gradient(160deg, #2A1A5E, #140A26); } .tile.hero .label, .tile.hero .foot { color: var(--brand-ink-2); } .tile.hero .value { color: #fff; font-size: 40px; text-shadow: 0 0 22px rgba(185, 150, 255, 0.55); }
.tile.alert { background: var(--brand-deep); } .tile.alert { background: radial-gradient(circle at 80% 0%, rgba(255, 100, 120, 0.25), transparent 60%), var(--brand-deep); } .tile.alert .label, .tile.alert .foot { color: #FFD3DC; } .tile.alert .value { color: #fff; }
@media (min-width: 1100px) { .tiles { grid-template-columns: repeat(6, minmax(0, 1fr)); } .tile.hero { grid-column: span 2; } }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); }
/* funnel */
.funnel { display: grid; grid-template-columns: minmax(90px, 190px) 1fr auto; gap: 7px 12px; align-items: center; font-size: 13.5px; }
.funnel .lbl { color: var(--ink-2); }
.bar { height: 18px; background: var(--grid); border-radius: 6px; overflow: hidden; }
.bar > i { display: block; height: 100%; background: linear-gradient(90deg, #4A23A8, var(--blue)); border-radius: 6px; box-shadow: 0 0 12px rgba(190, 150, 255, 0.45); }
.bar.cold > i { background: linear-gradient(90deg, #B9862E, var(--gold)); box-shadow: 0 0 12px rgba(242, 196, 107, 0.35); }
.funnel .v { text-align: right; white-space: nowrap; }
.funnel .v small { color: var(--muted); margin-left: 6px; }
/* tags */
.tag { display: inline-block; font-size: 11.5px; font-weight: 700; padding: 0 7px; border-radius: 999px; line-height: 18px; }
.tag.hot { background: var(--hot-bg); color: var(--hot); } .tag.cold { background: var(--cold-bg); color: var(--cold); }
.tag.won { background: #10301C; color: var(--good); } .tag.lost { background: var(--surface-2); color: var(--muted); }
.tag.proc { background: #3A2C12; color: #F0B060; } .tag.inst { background: #172A40; color: #8EC1F2; } .tag.bad { background: #3A1A16; color: var(--overdue); }
.prod { --pc: var(--brand); display: inline-block; font-size: 12.5px; font-weight: 650; padding: 1px 9px; border-radius: 999px; border: 1px solid var(--pc); color: var(--pc); background: color-mix(in srgb, var(--pc) 14%, transparent); white-space: nowrap; }
.tablewrap { overflow-x: auto; }
table.cases td { vertical-align: middle; } table.cases tr { cursor: pointer; } table.cases tr:hover td { background: var(--surface-2); }
table.cases tr.cont td { border-top: 0; padding-top: 2px; }
table.cases .nm { font-weight: 650; } table.cases .sub { font-size: 12px; color: var(--muted); }
tr.zero td { color: var(--muted); }
.count:empty { display: none; }
@media (max-width: 560px) { .list li { flex-wrap: wrap; } .list .grow { flex: 1 1 60%; } .list .when { margin-left: auto; } }
.card.warn { box-shadow: 0 0 0 1px var(--overdue); margin-bottom: 16px; } .card.warn h2 { color: var(--overdue); }
.tag.own { background: #2A1545; color: var(--brand); } .tag.agent { background: #172A40; color: #9FC3F5; }
.filters .sep { width: 1px; align-self: stretch; background: var(--border); margin: 0 4px; }
.paybar { display: flex; align-items: center; gap: 8px; margin: 4px 0 2px; } .paybar .bar { flex: 1; max-width: 160px; height: 8px; }
table.sched { margin: 6px 0 2px; font-size: 12.5px; } table.sched td { padding: 3px 6px; border-top: 1px solid var(--border); }
table.sched tr.late td { color: var(--overdue); } table.sched tr.due td { color: var(--muted); }
.od { color: var(--overdue); font-weight: 650; }
/* lists */
.list { list-style: none; margin: 0; padding: 0; }
.list li { display: flex; align-items: center; gap: 10px; padding: 10px 4px; border-top: 1px solid var(--border); cursor: pointer; }
.list li:first-child { border-top: 0; }
.list li:hover { background: var(--surface-2); border-radius: 10px; }
.list .grow { flex: 1; min-width: 0; }
.list .sub { font-size: 12.5px; color: var(--muted); }
.list .when { font-size: 13px; white-space: nowrap; text-align: right; }
.group-h { font-size: 13px; font-weight: 700; margin: 14px 0 4px; color: var(--ink-2); }
.group-h:first-child { margin-top: 0; }
/* kanban */
.board { display: grid; grid-auto-flow: column; grid-auto-columns: 210px; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.col { backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); background: var(--panel); box-shadow: var(--glow); border-radius: 18px; padding: 12px; min-height: 160px; }
.col h3 { display: flex; justify-content: space-between; gap: 6px; font-size: 13px; }
.col h3 .n { color: var(--muted); font-weight: 600; }
.kcard { background: var(--surface-2); border-radius: 12px; padding: 9px 10px; margin-top: 8px; cursor: pointer; font-size: 13px; }
.kcard:hover { outline: 1px solid var(--blue); box-shadow: 0 0 16px rgba(160, 120, 255, 0.35); }
.kcard .nm { font-weight: 650; }
.kcard .meta { color: var(--muted); font-size: 12px; }
.kcard.stuck { box-shadow: inset 3px 0 0 var(--overdue); }
.filters { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
.pill { font: inherit; font-size: 13px; border: 1px solid #4A3280; background: var(--surface); color: var(--ink-2); padding: 5px 12px; border-radius: 999px; cursor: pointer; }
.pill.active { background: var(--active); color: #fff; border-color: transparent; font-weight: 700; box-shadow: 0 0 0 1px rgba(190, 150, 255, 0.45), 0 4px 14px rgba(107, 63, 201, 0.4); }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
th, td { text-align: left; padding: 8px 6px; border-top: 1px solid var(--border); }
th { color: var(--muted); font-weight: 600; font-size: 12.5px; border-top: 0; }
td.r, th.r { text-align: right; }
/* drawer */
.back { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 40; }
.drawer { position: fixed; top: 8px; right: 8px; bottom: 8px; width: min(440px, calc(100% - 16px)); background: var(--surface); border-radius: 20px; z-index: 41; overflow: auto; padding: 22px; }
.drawer .x { float: right; font: inherit; font-size: 20px; background: var(--surface-2); color: var(--ink); border: 0; border-radius: 50%; width: 34px; height: 34px; cursor: pointer; }
.tl { list-style: none; padding: 0; margin: 10px 0 0; }
.tl li { display: flex; gap: 10px; padding: 5px 0; font-size: 13.5px; color: var(--muted); }
.tl li .dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--border); margin-top: 5px; flex: none; }
.tl li.done { color: var(--ink); } .tl li.done .dot { background: var(--brand); border-color: var(--brand); }
.tl li .d { margin-left: auto; font-variant-numeric: tabular-nums; }
dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 13.5px; margin: 12px 0; }
dt { color: var(--muted); }
/* hunter / system styles */
.sys-tag { font-size: 10.5px; letter-spacing: 0.18em; color: var(--blue); border: 1px solid rgba(190, 150, 255, 0.5); border-radius: 4px; padding: 1px 6px; margin-left: 4px; box-shadow: 0 0 10px rgba(190, 150, 255, 0.3); }
.license { position: relative; z-index: 1; display: flex; gap: 18px; align-items: center; padding: 22px 24px 8px; max-width: 620px; }
.lic-k { font-size: 11px; letter-spacing: 0.32em; color: var(--blue); font-weight: 700; }
.license h1 { font-size: 34px; margin: 2px 0; font-style: normal; letter-spacing: 0.02em; }
.lic-sub { color: var(--ink-2); font-size: 13.5px; margin-bottom: 6px; }
.lic-next { color: var(--muted); font-size: 12px; margin-top: 4px; }
.license .xp { max-width: 340px; } .license .xp i { background: linear-gradient(90deg, #4A23A8, #C9A8FF); box-shadow: 0 0 10px rgba(190, 150, 255, 0.8); }
.statsrow { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 8px; padding: 6px 24px 20px; }
.st { background: rgba(16, 8, 30, 0.35); border: 1px solid rgba(190, 150, 255, 0.35); border-radius: 10px; padding: 6px 12px; min-width: 104px; }
.st small { display: block; font-size: 10.5px; letter-spacing: 0.16em; color: var(--blue); } .st b { font-size: 18px; }
.sysnote { display: flex; align-items: center; gap: 8px; margin: -4px 0 16px; padding: 10px 14px; border-radius: 10px; background: rgba(8, 2, 18, 0.72); backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); box-shadow: var(--sys); font-size: 13.5px; color: var(--ink-2); } .sysnote b { color: var(--blue); letter-spacing: 0.06em; }
.sys-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 10px var(--blue); flex: none; }
.syswin { position: relative; backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); background: var(--panel); border-radius: 6px; padding: 14px 16px; box-shadow: var(--sys); }
.syswin::before, .syswin::after { content: ''; position: absolute; width: 14px; height: 14px; border: 2px solid var(--blue); }
.syswin::before { top: -2px; left: -2px; border-right: 0; border-bottom: 0; } .syswin::after { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }
.syswin-h { font-family: var(--title); display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; letter-spacing: 0.3em; font-weight: 800; color: #EBDDFF; padding-bottom: 8px; margin-bottom: 6px; border-bottom: 1px solid rgba(190, 150, 255, 0.35); }
.q-h { display: flex; justify-content: space-between; align-items: center; margin: 8px 0 2px; font-weight: 700; color: var(--blue); font-size: 13px; }
.syswin .chip { border-color: var(--blue); color: var(--blue); }
.syswin .missions li.ok .tick { background: var(--blue); border-color: var(--blue); color: var(--on-brand); box-shadow: 0 0 10px rgba(190, 150, 255, 0.7); }
.syswin .reward b { color: var(--gold); font-size: 13.5px; }
.ach { margin-bottom: 16px; }
.badges { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
@media (min-width: 1100px) { .badges { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.badge { --rc: #C9A8FF; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 3px; padding: 12px 10px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); opacity: 0.75; }
.badge.ok { opacity: 1; border-color: color-mix(in srgb, var(--rc) 60%, transparent); box-shadow: 0 0 18px color-mix(in srgb, var(--rc) 25%, transparent); background: linear-gradient(160deg, color-mix(in srgb, var(--rc) 14%, #120A20), #120A20); }
.hex { width: 46px; height: 46px; display: grid; place-items: center; clip-path: polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%); background: #241838; }
.badge.ok .hex { background: color-mix(in srgb, var(--rc) 22%, #120A20); } .hex .gicon { width: 24px; height: 24px; }
.badge b { font-size: 13.5px; } .badge small { font-size: 11.5px; color: var(--muted); min-height: 2.6em; }
.bprog { width: 100%; height: 4px; border-radius: 4px; background: #241838; overflow: hidden; } .bprog i { display: block; height: 100%; background: var(--rc); }
.rar { font-size: 10.5px; letter-spacing: 0.14em; color: var(--rc); font-weight: 800; } .badge:not(.ok) .rar { color: var(--muted); letter-spacing: 0.04em; }
.rank text { font-family: var(--font); }
/* game-style overview */
.gcard { backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); background: var(--panel); border-radius: 18px; padding: 16px 18px; box-shadow: var(--glow); min-width: 0; position: relative; overflow: hidden; }
.gcard h2 { display: flex; align-items: center; gap: 6px; }
.gi { display: inline-grid; place-items: center; } .gicon { width: 22px; height: 22px; }
.gi.gold .gicon { filter: drop-shadow(0 0 6px rgba(242, 196, 107, 0.6)); }
.banner { position: relative; border-radius: 22px; overflow: hidden; min-height: 230px; margin-bottom: 16px; box-shadow: var(--glow); }
body.has-bg .banner-art { opacity: 0.55; } body.has-bg .banner { backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); }
body, .gcard, .card, .tile, nav, .syswin, .hunter, .sysbar { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 8px rgba(0, 0, 0, 0.35); }
.banner-art { position: absolute; inset: 0; width: 100%; height: 100%; }
.banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8, 3, 16, 0.9) 0%, rgba(8, 3, 16, 0.45) 50%, transparent 75%); }
.banner-text { position: relative; z-index: 1; padding: 22px 24px; max-width: 560px; }
.banner h1 { font-size: 32px; font-style: italic; letter-spacing: -0.01em; margin: 0 0 4px; background: linear-gradient(90deg, #FFFFFF, #E6D6FF); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 24px rgba(185, 150, 255, 0.35); }
.banner p { color: var(--ink-2); font-style: italic; margin: 0 0 14px; }
.banner-rd { position: absolute; z-index: 1; top: 16px; right: 16px; }
.level { display: flex; align-items: center; gap: 10px; background: rgba(20, 10, 38, 0.75); border: 1px solid rgba(242, 196, 107, 0.45); border-radius: 14px; padding: 8px 12px; max-width: 420px; }
.level .gicon { width: 28px; height: 28px; }
.lv-top { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; } .lv-top b { color: var(--gold); } .lv-top span { color: var(--ink-2); }
.xp { height: 6px; border-radius: 6px; background: #2A1A48; margin-top: 5px; overflow: hidden; } .xp i { display: block; height: 100%; background: linear-gradient(90deg, #B9862E, #F2C46B); box-shadow: 0 0 10px rgba(242, 196, 107, 0.6); }
.stats { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 16px; }
.stat { padding-bottom: 8px; border-top: 2px solid var(--c); }
.stat-top { display: flex; gap: 12px; align-items: flex-start; }
.stat .gi { width: 40px; height: 40px; border-radius: 12px; background: color-mix(in srgb, var(--c) 16%, transparent); flex: none; }
.stat .label { font-size: 13px; color: var(--ink-2); } .stat .value { font-size: 30px; font-weight: 750; line-height: 1.15; } .stat .foot { font-size: 12.5px; color: var(--muted); }
.spark { display: block; width: 100%; height: 42px; margin-top: 6px; }
.grow3 { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); margin-bottom: 16px; }
@media (min-width: 1100px) { .grow3 { grid-template-columns: 1fr 1fr; } .grow3.b { grid-template-columns: 1.2fr 1fr 1fr; } }
.card-h { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; } .card-h h2 { margin: 0; }
.link { color: var(--blue); font-size: 13px; text-decoration: none; white-space: nowrap; }
.conv { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; } .ring { width: 130px; height: 130px; flex: none; } .conv-side { flex: 1; min-width: 150px; }
.ring-v { fill: #fff; font-size: 24px; font-weight: 750; } .ring-s { fill: var(--muted); font-size: 11px; }
.bars { width: 100%; height: auto; display: block; } .bar-v { fill: var(--ink-2); font-size: 11px; } .bar-l { fill: var(--muted); font-size: 11px; }
.legend { display: flex; gap: 14px; font-size: 12px; color: var(--muted); margin-bottom: 4px; } .legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; }
/* sales pipeline as a row of chevrons */
.pipe-card { margin-bottom: 16px; }
.pipe-meta { display: flex; align-items: center; gap: 12px; font-size: 13.5px; color: var(--ink-2); } .pipe-meta b { color: #fff; font-size: 16px; } .vsep { width: 1px; height: 16px; background: var(--border); }
.chevrons { display: flex; gap: 0; overflow-x: auto; padding: 4px 2px 6px; scroll-snap-type: x proximity; }
.chev { --sc: #2F6BFF; position: relative; flex: 1 0 128px; min-height: 132px; margin-left: -10px; padding: 12px 22px 12px 26px; display: flex; flex-direction: column; text-decoration: none; color: #fff; scroll-snap-align: start;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%);
  --rim: color-mix(in srgb, var(--sc) 70%, #E9DCFF); background: var(--rim); backdrop-filter: var(--haze); -webkit-backdrop-filter: var(--haze); isolation: isolate; }
.chev::before { content: ''; position: absolute; inset: 1.5px; z-index: -1; clip-path: inherit;
  background: url("${PEAKS}") bottom / 100% 46% no-repeat, linear-gradient(160deg, color-mix(in srgb, var(--sc) 62%, rgba(10, 3, 22, 0.55)), color-mix(in srgb, var(--sc) 26%, rgba(6, 1, 14, 0.75))); }
.chev.last { --rim: #F2C46B; filter: drop-shadow(0 0 6px rgba(242, 196, 107, 0.45)); }
.chev.last .chev-ic { background: rgba(242, 196, 107, 0.22); box-shadow: inset 0 0 0 1px rgba(242, 196, 107, 0.6); }
.chev.first { margin-left: 0; padding-left: 16px; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%); border-radius: 10px 0 0 10px; }
.chev::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 40%); }
.chev:hover { filter: brightness(1.18) saturate(1.1); }
.chev-n { font-size: 13px; font-weight: 750; line-height: 1.2; min-height: 2.4em; padding-right: 10px; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35); }
.chev-go { position: absolute; top: 10px; right: 22px; font-size: 18px; opacity: 0.75; }
.chev b { font-size: 30px; line-height: 1.1; margin-top: 4px; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35); } .chev small { font-size: 13px; opacity: 0.9; }
.chev-ic { position: absolute; right: 22px; bottom: 10px; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: rgba(0, 0, 0, 0.22); }
.chev-ic .gicon { width: 17px; height: 17px; }
.stages { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
.stage { --sc: #3B6BFF; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 12px; text-decoration: none; color: #fff; background: linear-gradient(150deg, color-mix(in srgb, var(--sc) 70%, #140A26), color-mix(in srgb, var(--sc) 25%, #140A26)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sc) 70%, transparent), 0 6px 18px color-mix(in srgb, var(--sc) 25%, transparent); }
.stage:hover { transform: translateY(-2px); }
.stage-n { font-size: 12px; font-weight: 650; min-height: 2.4em; } .stage b { font-size: 24px; line-height: 1.1; } .stage small { opacity: 0.85; }
.chip { border: 1px solid var(--gold); color: var(--gold); border-radius: 999px; padding: 0 10px; font-size: 12px; font-weight: 700; }
.missions { list-style: none; padding: 0; margin: 0; } .missions li { display: flex; gap: 10px; align-items: center; padding: 8px 0; border-top: 1px solid var(--border); font-size: 14px; } .missions li:first-child { border-top: 0; }
.missions .tick { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #4A3280; display: grid; place-items: center; font-size: 12px; font-weight: 800; flex: none; }
.missions li.ok .tick { background: var(--gold); border-color: var(--gold); color: var(--on-brand); box-shadow: 0 0 10px rgba(242, 196, 107, 0.6); }
.missions small { color: var(--muted); }
.reward { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: linear-gradient(90deg, rgba(160, 120, 255, 0.18), rgba(242, 196, 107, 0.12)); } .reward span { color: var(--ink-2); font-size: 13px; } .reward b { color: var(--gold); font-size: 18px; }
.month { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 6px; } .month > div { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; } .month b { font-size: 24px; } .month small { color: var(--muted); }
.feed { list-style: none; padding: 0; margin: 0; } .feed li { display: flex; gap: 10px; align-items: baseline; padding: 6px 0; font-size: 13px; cursor: pointer; } .feed small { color: var(--muted); width: 74px; flex: none; }
.dotg { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 8px rgba(242, 196, 107, 0.7); flex: none; align-self: center; }
.exp { margin-bottom: 16px; } .exp summary { cursor: pointer; color: var(--gold); font-weight: 650; }
.section-h { margin: 6px 0 12px; color: var(--ink-2); }
.tbar { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: flex-end; margin-bottom: 12px; }
.tbar input[type=search] { flex: 1 1 240px; font: inherit; font-size: 14px; color: var(--ink); background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; }
.tbar input:focus, .fsel select:focus { outline: 2px solid rgba(190, 150, 255, 0.6); outline-offset: 1px; }
.fsel { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--muted); letter-spacing: 0.04em; }
.fsel select { font: inherit; font-size: 13px; color: var(--ink); background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 7px 10px; }
table.saas th { position: sticky; top: 0; background: #150C24; white-space: nowrap; }
table.saas th.sortable { cursor: pointer; user-select: none; } table.saas th.on { color: var(--blue); } table.saas th .arrow { font-size: 10px; }
table.saas tbody tr { cursor: pointer; } table.saas tbody tr:hover td { background: rgba(190, 150, 255, 0.06); }
table.saas td { vertical-align: top; } table.saas .nm { font-weight: 650; } table.saas .sub { font-size: 12px; color: var(--muted); }
.tfoot { margin-top: 10px; font-size: 12.5px; color: var(--muted); }
@media (max-width: 560px) { .banner-art { height: 200px; } .banner::after { background: linear-gradient(180deg, rgba(8, 3, 16, 0.2) 0%, rgba(8, 3, 16, 0.85) 46%, rgba(8, 3, 16, 0.95) 100%); } .license { flex-direction: column; align-items: flex-start; padding-top: 176px; } .banner h1 { font-size: 24px; } .banner-rd { position: relative; top: auto; right: auto; z-index: 1; display: inline-block; margin: 0 0 0 24px; } .banner { padding-bottom: 14px; } }
[hidden] { display: none !important; }
${BG ? 'html, body { background: linear-gradient(180deg, rgba(18, 3, 36, 0.48), rgba(4, 0, 10, 0.68)), radial-gradient(ellipse at 50% 40%, transparent 28%, rgba(1, 0, 4, 0.78) 100%), url("' + BG + '") center 34% / cover no-repeat fixed, #08030F; }' : ''}
@media (max-width: 820px) {
  .layout { grid-template-columns: 1fr; padding: 0 12px 24px; }
  nav { position: static; flex-direction: row; overflow-x: auto; border-radius: 16px; padding: 6px; }
  nav a { white-space: nowrap; }
  h1 { font-size: 22px; }
}
</style>
</head>
<body${BG ? ' class="has-bg"' : ''}>
<div class="ribbon">${PRACTICE ? '<strong>Mockup</strong> · shows the planned lead dashboard with invented practice data (Lead_Practice.xlsx). Not the real version yet.' : '<strong>Mockup with your own data</strong> · from ' + path.basename(SRC).replace(/[<>&"]/g, '') + '. Stays on this computer; not uploaded.'}</div>
<div class="topbar"><div id="hunter" class="hunter"></div><div id="sysbar" class="sysbar"></div></div>
<div class="layout">
  <nav id="nav">
    <a href="#overview" data-page="overview">Overview</a>
    <a href="#leads" data-page="leads">Leads <span class="count" id="c-leads"></span></a>
    <a href="#board" data-page="board">Lead board <span class="count" id="c-board"></span></a>
    <a href="#cases" data-page="cases">Cases <span class="count" id="c-cases"></span></a>
    <a href="#aftersales" data-page="aftersales">After-sales <span class="count" id="c-after"></span></a>
    <a href="#followup" data-page="followup">Follow-ups <span class="count alert" id="c-follow"></span></a>
    <a href="#cold" data-page="cold">COLD &amp; Telegram <span class="count" id="c-cold"></span></a>
  </nav>
  <main>
    <section id="p-overview"></section>
    <section id="p-leads" hidden></section>
    <section id="p-board" hidden></section>
    <section id="p-cases" hidden></section>
    <section id="p-aftersales" hidden></section>
    <section id="p-followup" hidden></section>
    <section id="p-cold" hidden></section>
  </main>
</div>
<div id="drawer-root"></div>
<script>
const DATA = ${json};
const AVATAR = ${JSON.stringify(AVATAR)};
const HOT = [['h01_phone_date','Phone number received'],['h02_form_sent_date','Google Form sent'],['h03_call_date','First call stage'],['h04_docs_date','Docs collection stage'],['h05_checking_date','Bank Checking stage'],['h06_proposal_date','Proposal stage'],['h07_appointment_date','Appointment stage'],['h08_followup_date','Follow up & closing']];
const PRODUCTS = ['BCS', 'BCS settlement', 'CCS', 'Goal Loan', 'Home Fin', 'SME Loan', 'Fin Account', 'Card Master', 'Biz Assist', 'Financial Workshop'];
const INSTALLMENT_PRODUCTS = ['BCS', 'BCS settlement', 'CCS'];
// one colour per product (warm colours = the three that allow installment)
const PRODUCT_COLORS = { 'BCS': '#FF7A6B', 'BCS settlement': '#FFA94D', 'CCS': '#FFD84D', 'Goal Loan': '#A8E05F', 'Home Fin': '#3DD6C6',
  'SME Loan': '#5AA9FF', 'Fin Account': '#A98BFF', 'Card Master': '#FF6FB5', 'Biz Assist': '#D9D9D9', 'Financial Workshop': '#C9A27A' };
const prodTag = p => h('span', { class: 'prod', style: PRODUCT_COLORS[p] ? '--pc:' + PRODUCT_COLORS[p] : null }, p);
const OWNER = 'Chris'; // agent = Chris means your own case; any other agent passed the case to you
const isOwn = l => !l.agent || String(l.agent).trim().toLowerCase() === OWNER.toLowerCase();
const SOURCES = { 'All sources': () => true, ['Own (' + OWNER + ')']: isOwn, 'From agents': l => !isOwn(l) };
const COLD = [['c1_telegram_promoted_date','Telegram group promoted'],['c2_telegram_joined_date','Joined Telegram group'],['c3_upgraded_hot_date','Upgraded to HOT']];

// ---- helpers (text only, never innerHTML with data) ----
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = d => { if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || '—'; const [y, m, dd] = d.split('-'); return Number(dd) + ' ' + MONTHS[Number(m) - 1]; };

// ---- derived facts ----
// (payment due dates are plans, not events, so only paid dates count)
const allDates = DATA.leads.concat(DATA.cases).flatMap(l => Object.entries(l).filter(([k, v]) => k.endsWith('_date') && k !== 'next_action_date' && v).map(([, v]) => v))
  .concat(DATA.payments.map(p => p.paid_date).filter(Boolean));
const RD = allDates.sort().at(-1) || '2000-01-01'; // reporting date = latest recorded event in the file (placeholder when empty)
for (const l of DATA.leads) {
  // forgiving about how things were typed: hot/HOT, won/Won, blank status = Active
  l.category = String(l.category || '').trim().toUpperCase() === 'COLD' ? 'COLD' : String(l.category || '').trim() ? 'HOT' : (l.phone ? 'HOT' : 'COLD');
  l.status = ({ active: 'Active', won: 'Won', lost: 'Lost' })[String(l.status || '').trim().toLowerCase()] || 'Active';
  l.name = l.name || l.lead_id || '(no name)';
  l.platform = l.platform || '—';
  l.first_contact_date = l.first_contact_date || l.h01_phone_date || '';
  l.stage = 0; l.stageDate = null;
  HOT.forEach(([k], i) => { if (l[k]) { l.stage = i + 1; l.stageDate = l[k]; } });
  l.coldStep = 0; COLD.forEach(([k], i) => { if (l[k]) l.coldStep = i + 1; });
  l.lastDate = [l.first_contact_date, ...HOT.map(s => l[s[0]]), ...COLD.map(s => l[s[0]])].filter(Boolean).sort().at(-1);
  l.idle = days(l.lastDate, RD);
  l.active = l.status === 'Active';
  l.cases = [];
}
// cases: one row per product a customer closed
const byId = new Map(DATA.leads.map(l => [l.lead_id, l]));
for (const c of DATA.cases) {
  c.lead = byId.get(c.lead_id);
  c.isInstallment = String(c.installment || '').trim().toLowerCase() === 'yes';
  // installment cases close only when every payment is paid; the others when the fee is collected
  c.plan = DATA.payments.filter(p => p.case_id === c.case_id).sort((a, b) => a.due_date.localeCompare(b.due_date));
  c.total = c.plan.reduce((s, p) => s + Number(p.amount || 0), 0);
  c.paid = c.plan.filter(p => p.paid_date).reduce((s, p) => s + Number(p.amount || 0), 0);
  c.next = c.plan.find(p => !p.paid_date) || null;
  c.overduePays = c.plan.filter(p => !p.paid_date && p.due_date < RD);
  c.closedDate = c.isInstallment ? (c.plan.length && !c.next ? c.plan.map(p => p.paid_date).sort().at(-1) : null) : (c.fee_collected_date || null);
  c.state = c.closedDate ? 'Closed' : c.processing_date ? 'Processing' : 'Not started';
  c.badInstallment = c.isInstallment && !INSTALLMENT_PRODUCTS.includes(c.product);
  if (c.lead) c.lead.cases.push(c);
}
const cases = DATA.cases.filter(c => c.lead);
const leads = DATA.leads;
const hot = leads.filter(l => l.category === 'HOT');
const cold = leads.filter(l => l.category === 'COLD');
const activeHot = hot.filter(l => l.active);
const won = hot.filter(l => l.status === 'Won');
const lost = hot.filter(l => l.status === 'Lost');
const month = RD.slice(0, 7);
const newThisMonth = leads.filter(l => l.first_contact_date.startsWith(month));
const closedThisMonth = cases.filter(c => (c.closedDate || '').startsWith(month));
const processing = cases.filter(c => c.state !== 'Closed');
const needProduct = won.filter(l => !l.cases.length); // marked Won but nothing on the Cases sheet yet
// after-sales: customers whose products are all closed (fee fully collected)
const afterSales = won.filter(l => l.cases.length && l.cases.every(c => c.state === 'Closed'));
for (const l of afterSales) l.allClosedDate = l.cases.map(c => c.closedDate).sort().at(-1);
const afterSalesDue = afterSales.filter(l => !l.coi_date || !l.telegram_promoted_date);
const RM = n => 'RM ' + Number(n).toLocaleString('en-MY');
// customers who already closed (cases in processing / after-sales) are routine follow-ups: no red marks
// Closed customers (Won) have no next action: only when something was last done for them.
// Last action = the latest of last_action_date and every dated event on their cases, payments and after-sales.
for (const l of won) {
  l.lastActionDate = [l.last_action_date, l.h08_followup_date, l.coi_date, l.telegram_promoted_date,
    ...l.cases.flatMap(c => [c.closed_date, c.processing_date, c.closedDate, ...c.plan.map(p => p.paid_date)])].filter(Boolean).sort().at(-1) || null;
}
const ago = d => { if (!d) return 'no date yet'; const n = days(d, RD); return n <= 0 ? 'today' : n === 1 ? '1 day ago' : n + ' days ago'; };
const follow = leads.filter(l => l.status !== 'Won' && l.next_action_date).sort((a, b) => a.next_action_date.localeCompare(b.next_action_date));
const caseFollow = won.slice().sort((a, b) => (a.lastActionDate || '').localeCompare(b.lastActionDate || '')); // longest ago first
const overdue = follow.filter(l => l.next_action_date < RD);
const today = follow.filter(l => l.next_action_date === RD);
const STUCK = 7;
const stuck = activeHot.filter(l => l.idle >= STUCK).sort((a, b) => b.idle - a.idle);

function catTag(l) {
  if (l.status === 'Won') return h('span', { class: 'tag won' }, 'Won');
  if (l.status === 'Lost') return h('span', { class: 'tag lost' }, 'Lost');
  return h('span', { class: 'tag ' + (l.category === 'HOT' ? 'hot' : 'cold') }, l.category);
}
const stageName = l => l.status === 'Won' && !l.cases.length ? 'Won · no product added yet' : l.status === 'Won' ? 'Closed ' + l.cases.length + (l.cases.length === 1 ? ' product' : ' products')
  : l.category === 'HOT' ? (l.stage ? HOT[l.stage - 1][1] : '—') : (l.coldStep ? COLD[l.coldStep - 1][1] : 'PM only');
// who the case belongs to: your own, or passed on by an agent
function srcTag(l) {
  if (l.category !== 'HOT' && !l.agent) return null;
  return isOwn(l) ? h('span', { class: 'tag own' }, 'Own case') : h('span', { class: 'tag agent' }, 'Agent: ' + l.agent);
}
let sourceFilter = 'All sources';
function sourcePills(list) {
  return Object.keys(SOURCES).map(f => h('button', { class: 'pill src' + (f === sourceFilter ? ' active' : ''), onclick: () => { sourceFilter = f; render(); } }, f + ' (' + list.filter(SOURCES[f]).length + ')'));
}
function caseState(c) {
  return h('span', { class: 'tag ' + (c.state === 'Closed' ? 'won' : 'proc') }, c.state === 'Closed' ? 'Closed' : 'Processing');
}
function instTag(c) {
  if (c.badInstallment) return h('span', { class: 'tag bad', title: 'Installment is only for ' + INSTALLMENT_PRODUCTS.join(', ') }, '! Installment not allowed');
  return c.isInstallment ? h('span', { class: 'tag inst' }, 'Installment') : null;
}
function whenText(d, calm) {
  const n = days(RD, d);
  if (n < 0) return calm ? fmt(d) + ' (' + -n + (n === -1 ? ' day ago)' : ' days ago)') : h('span', { class: 'od' }, '! ' + -n + (n === -1 ? ' day' : ' days') + ' overdue');
  if (n === 0) return calm ? 'Today' : h('span', { class: 'od' }, 'Today');
  return fmt(d) + ' (in ' + n + (n === 1 ? ' day)' : ' days)');
}
function leadRow(l, right) {
  return h('li', { onclick: () => openLead(l) },
    catTag(l),
    h('div', { class: 'grow' }, h('div', null, l.name, ' ', srcTag(l)), h('div', { class: 'sub' }, stageName(l) + ' · ' + l.platform + (l.status === 'Won' ? (l.last_action ? ' · Last: ' + l.last_action : '') : l.next_action ? ' · Next: ' + l.next_action : ''))),
    h('div', { class: 'when' }, right));
}
function pageHead(title, extra) {
  return h('div', { class: 'head' }, h('h1', null, title), h('span', { class: 'rd' }, 'Reporting date ' + fmt(RD)), extra ? h('span', { class: 'muted small' }, extra) : null);
}
function tile(label, value, foot, cls) {
  return h('div', { class: 'tile ' + (cls || '') }, h('div', { class: 'label' }, label), h('div', { class: 'value' }, value), h('div', { class: 'foot' }, foot));
}
function funnel(rows, cls) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return h('div', { class: 'funnel' }, rows.flatMap(([label, n, note]) => [
    h('div', { class: 'lbl' }, label),
    h('div', { class: 'bar ' + (cls || '') }, h('i', { style: 'width:' + Math.max(2, n / max * 100) + '%' })),
    h('div', { class: 'v num' }, n, note ? h('small', null, note) : null),
  ]));
}

// ---- pages ----
// ---- game-style Overview helpers (all numbers come from the workbook) ----
const SVGNS = 'http://www.w3.org/2000/svg';
function sv(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}
let gradId = 0;
const addD = (iso, n) => new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);
// how many dated events fall in each of the last n weeks up to the reporting date (oldest first)
function weekly(dates, n = 8, weigh) {
  return Array.from({ length: n }, (_, k) => {
    const to = addD(RD, -7 * (n - 1 - k)), from = addD(to, -6);
    return dates.filter(d => d.date >= from && d.date <= to).reduce((s, d) => s + (weigh ? weigh(d) : 1), 0);
  });
}
function spark(values, color) {
  const w = 120, hgt = 40, max = Math.max(1, ...values);
  const pts = values.map((v, i) => [i * (w / Math.max(1, values.length - 1)), hgt - 4 - (v / max) * (hgt - 10)]);
  const id = 'g' + (++gradId);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return sv('svg', { viewBox: '0 0 ' + w + ' ' + hgt, class: 'spark', 'aria-hidden': 'true' },
    sv('defs', null, sv('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, sv('stop', { offset: 0, 'stop-color': color, 'stop-opacity': 0.45 }), sv('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }))),
    sv('path', { d: line + ' L' + w + ' ' + hgt + ' L0 ' + hgt + ' Z', fill: 'url(#' + id + ')' }),
    sv('path', { d: line, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
    sv('circle', { cx: pts.at(-1)[0], cy: pts.at(-1)[1], r: 3, fill: color }));
}
// small original line icons
const ICONS = {
  people: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 19c0-3 3-5 6-5s6 2 6 5M14 14.5c2.5-.4 6 1 6 4.5',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM15 9l5-5',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.8 2.8L16.5 9.5',
  coins: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v5c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 10v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  flow: 'M10 3h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4zM12 7v5M5 17v-3h14v3',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  form: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  chat: 'M4 5h16v11H9l-5 4zM8 10h.01M12 10h.01M16 10h.01',
  folder: 'M3 6h6l2 2h10v11H3zM3 10h18',
  bank: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  shake: 'M3 12l4-4 4 2 3-2 7 4-6 6-3-2-2 2-3-3zM11 10l3 3',
};
const icon = (name, color) => sv('svg', { viewBox: '0 0 24 24', class: 'gicon', 'aria-hidden': 'true' }, sv('path', { d: ICONS[name], fill: 'none', stroke: color || 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
// original banner art: a glowing gate (portal) on a dark ridge, energy rings, lightning and sparks
function bannerArt() {
  let seed = 23; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const sparks = Array.from({ length: 60 }, () => { const a = r() * Math.PI * 2, d = 40 + r() * 170; return sv('circle', { cx: (900 + Math.cos(a) * d * 1.3).toFixed(0), cy: (118 + Math.sin(a) * d * 0.55).toFixed(0), r: (r() * 1.6 + 0.4).toFixed(2), fill: r() < 0.7 ? '#E0CCFF' : '#F0B8FF', opacity: (r() * 0.7 + 0.3).toFixed(2) }); });
  const stars = Array.from({ length: 50 }, () => sv('circle', { cx: (r() * 1200).toFixed(0), cy: (r() * 110).toFixed(0), r: (r() * 1 + 0.3).toFixed(2), fill: '#fff', opacity: (r() * 0.5 + 0.15).toFixed(2) }));
  const bolt = (x, y, len, dir) => { let d = 'M' + x + ' ' + y; let cx = x, cy = y; for (let k = 0; k < 6; k++) { cx += dir * (len / 6) + (r() - 0.5) * 14; cy += (r() - 0.5) * 22; d += ' L' + cx.toFixed(0) + ' ' + cy.toFixed(0); } return sv('path', { d, stroke: '#EFE3FF', 'stroke-width': 1.6, fill: 'none', opacity: 0.85, filter: 'url(#soft)' }); };
  return sv('svg', { class: 'banner-art', viewBox: '0 0 1200 240', preserveAspectRatio: 'xMaxYMid slice', 'aria-hidden': 'true' },
    sv('defs', null,
      sv('linearGradient', { id: 'sky2', x1: 0, y1: 0, x2: 0, y2: 1 }, sv('stop', { offset: 0, 'stop-color': '#06020D' }), sv('stop', { offset: 0.65, 'stop-color': '#1A0B38' }), sv('stop', { offset: 1, 'stop-color': '#2A1458' })),
      sv('radialGradient', { id: 'gate', cx: 0.5, cy: 0.5, r: 0.5 }, sv('stop', { offset: 0, 'stop-color': '#FFFFFF' }), sv('stop', { offset: 0.18, 'stop-color': '#E0CCFF' }), sv('stop', { offset: 0.5, 'stop-color': '#7B4DFF', 'stop-opacity': 0.85 }), sv('stop', { offset: 0.8, 'stop-color': '#5B2BBF', 'stop-opacity': 0.5 }), sv('stop', { offset: 1, 'stop-color': '#5B2BBF', 'stop-opacity': 0 })),
      sv('radialGradient', { id: 'halo', cx: 0.5, cy: 0.5, r: 0.5 }, sv('stop', { offset: 0, 'stop-color': '#8A5BFF', 'stop-opacity': 0.55 }), sv('stop', { offset: 1, 'stop-color': '#8A5BFF', 'stop-opacity': 0 })),
      sv('filter', { id: 'soft' }, sv('feGaussianBlur', { stdDeviation: 1.2 }))),
    sv('rect', { width: 1200, height: 240, fill: 'url(#sky2)' }), stars,
    sv('ellipse', { cx: 900, cy: 120, rx: 260, ry: 150, fill: 'url(#halo)' }),
    sv('ellipse', { cx: 900, cy: 120, rx: 70, ry: 108, fill: 'url(#gate)' }),
    [118, 92, 134].map((ry, k) => sv('ellipse', { cx: 900, cy: 120, rx: ry * 0.62, ry, fill: 'none', stroke: k === 1 ? '#F0B8FF' : '#CDB2FF', 'stroke-width': 1.2, opacity: 0.55 - k * 0.12, transform: 'rotate(' + (k * 14 - 10) + ' 900 120)' })),
    bolt(840, 70, 120, -1), bolt(960, 160, 130, 1), bolt(955, 60, 90, 1),
    sparks,
    sv('path', { d: 'M0 240 L0 200 L120 186 L260 196 L380 176 L520 192 L640 170 L760 196 L840 214 L900 206 L960 214 L1060 188 L1200 198 L1200 240 Z', fill: '#0D0619' }),
    sv('path', { d: 'M0 240 L0 222 L180 214 L360 226 L560 210 L760 224 L980 216 L1200 226 L1200 240 Z', fill: '#06020D' }),
    sv('path', { d: 'M820 214 Q900 200 980 214', stroke: '#CDB2FF', 'stroke-width': 1.2, fill: 'none', opacity: 0.6 }),
    hunterFigure(872, 212, 1.3));
}
// an original hunter, seen from behind: long coat blown by the wind, a long sword held low,
// lit from behind by the gate (a dark silhouette with a blue rim light)
function hunterFigure(x, y, k) {
  const coat = 'M-9 -128 L-24 -121 L-31 -98 L-35 -72 L-29 -69 L-25 -92 L-23 -101 L-27 -78 L-31 -58 L-46 -38 L-62 -30 L-50 -26 L-70 -16 L-48 -15 L-56 -6 L-34 -10 L-24 -18 L-15 -33 L-13 0 L-3 0 L-2 -40 L2 -40 L4 0 L14 0 L15 -33 L25 -21 L33 -15 L31 -38 L27 -64 L31 -71 L27 -97 L24 -121 L9 -128 Z';
  const head = 'M-9 -129 C-11 -140 -9 -151 0 -152 C9 -151 11 -140 9 -129 Z';
  // messy hair blown to the left by the same wind as the coat
  const hair = 'M10 -136 C12 -146 9 -155 1 -157 C-6 -158 -12 -154 -13 -148 L-22 -150 L-14 -144 L-25 -141 L-13 -139 L-19 -133 L-10 -135 L-9 -131 Z';
  const sword = 'M27 -77 L31 -79 L60 8 L56 10 Z';
  const hilt = 'M23 -88 L27 -77 L31 -79 L27 -90 Z M21 -76 L37 -82 L38 -79 L22 -73 Z';
  const parts = [coat, head, hair, hilt];
  return sv('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + k + ')' },
    sv('ellipse', { cx: 0, cy: 1, rx: 46, ry: 5, fill: '#000', opacity: 0.55 }),
    // rim light (blurred blue outline), then the dark body on top
    parts.map(d => sv('path', { d, fill: 'none', stroke: '#B98CFF', 'stroke-width': 3, opacity: 0.55, filter: 'url(#soft)' })),
    sv('path', { d: sword, fill: '#E0CCFF', opacity: 0.9, filter: 'url(#soft)' }),
    sv('path', { d: sword, fill: '#F6EEFF' }),
    parts.map(d => sv('path', { d, fill: '#08030F' })),
    parts.map(d => sv('path', { d, fill: 'none', stroke: '#CDB2FF', 'stroke-width': 0.8, opacity: 0.65 })),
    sv('path', { d: 'M-24 -121 L-9 -128 L9 -128 L24 -121', fill: 'none', stroke: '#EFE3FF', 'stroke-width': 1.2, opacity: 0.8 }));
}
// EXP from what was actually done (shown on the page so it is not a mystery)
const EXP_RULES = [['HOT step reached', 10], ['COLD lead joined Telegram', 15], ['COLD lead upgraded to HOT', 40], ['Product closed', 100], ['Case closed (fee collected)', 150], ['Customer converted to COI', 60], ['Telegram promoted to customer', 30]];
function expTotal() {
  const n = name => EXP_RULES.find(x => x[0] === name)[1];
  return hot.reduce((s, l) => s + l.stage * n('HOT step reached'), 0)
    + leads.filter(l => l.c2_telegram_joined_date).length * n('COLD lead joined Telegram')
    + leads.filter(l => l.c3_upgraded_hot_date).length * n('COLD lead upgraded to HOT')
    + cases.length * n('Product closed') + cases.filter(c => c.state === 'Closed').length * n('Case closed (fee collected)')
    + leads.filter(l => l.coi_date).length * n('Customer converted to COI') + leads.filter(l => l.telegram_promoted_date).length * n('Telegram promoted to customer');
}
// Hunter ranks: EXP needed for each rank
const RANKS = [['E', 0, '#9AA7C7'], ['D', 1000, '#7FD18B'], ['C', 3000, '#C9A8FF'], ['B', 6000, '#A99BFF'], ['A', 10000, '#B794FF'], ['S', 15000, '#F2C46B']];
function rankOf(exp) { let i = 0; RANKS.forEach((r, k) => { if (exp >= r[1]) i = k; }); return { i, r: RANKS[i], next: RANKS[i + 1] || null }; }
// hexagon rank badge
function rankBadge(letter, color, size) {
  const pts = Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 3 * k - Math.PI / 2; return (50 + 44 * Math.cos(a)).toFixed(1) + ',' + (50 + 44 * Math.sin(a)).toFixed(1); }).join(' ');
  return sv('svg', { viewBox: '0 0 100 100', class: 'rank', style: 'width:' + size + 'px;height:' + size + 'px;filter:drop-shadow(0 0 10px ' + color + ')' },
    sv('polygon', { points: pts, fill: '#140A26', stroke: color, 'stroke-width': 3 }),
    sv('polygon', { points: pts, fill: 'none', stroke: color, 'stroke-width': 1, opacity: 0.4, transform: 'translate(50 50) scale(0.82) translate(-50 -50)' }),
    sv('text', { x: 50, y: 64, 'text-anchor': 'middle', fill: color, 'font-size': 44, 'font-weight': 800 }, letter));
}
// a framed "system window" panel
function sysWin(title, ...kids) { return h('div', { class: 'syswin' }, h('div', { class: 'syswin-h' }, h('span', { class: 'sys-dot' }), title), kids); }
// achievements, unlocked from what the workbook shows; rarity = colour
function achievements() {
  const closed = cases.length, coi = leads.filter(l => l.coi_date).length;
  const tg = leads.filter(l => l.telegram_promoted_date || l.c2_telegram_joined_date).length;
  const multi = Math.max(0, ...won.map(l => l.cases.length));
  const inst = cases.filter(c => c.isInstallment);
  const fast = won.map(l => days(l.first_contact_date, (l.cases.map(c => c.closed_date).sort()[0]) || l.first_contact_date)).filter(n => n >= 0);
  const best = fast.length ? Math.min(...fast) : null;
  return [
    ['First Close', 'Close your first product', Math.min(closed, 1), 1, 'common', 'check'],
    ['Ten Closes', 'Close 10 products', Math.min(closed, 10), 10, 'rare', 'target'],
    ['Multi-Class', 'One customer closes 3 products', Math.min(multi, 3), 3, 'epic', 'crown'],
    ['Swift Hunter', 'Close a customer within 14 days of first contact', best != null && best <= 14 ? 1 : 0, 1, 'rare', 'bolt'],
    ['Network Builder', 'Convert 5 customers to COI', Math.min(coi, 5), 5, 'epic', 'people'],
    ['Herald', 'Bring 10 people into the Telegram group', Math.min(tg, 10), 10, 'rare', 'star'],
    ['Clean Ledger', 'Installments with nothing overdue', inst.length && !inst.some(c => c.overduePays.length) ? 1 : 0, 1, 'common', 'coins'],
    ['Zero Backlog', 'No overdue follow-ups', overdue.length === 0 ? 1 : 0, 1, 'common', 'check'],
  ];
}
const RARITY = { common: '#C9A8FF', rare: '#B794FF', epic: '#F2C46B' };
function ring(pct, label, sub) {
  const R = 52, C = 2 * Math.PI * R, id = 'g' + (++gradId);
  return sv('svg', { viewBox: '0 0 140 140', class: 'ring' },
    sv('defs', null, sv('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, sv('stop', { offset: 0, 'stop-color': '#F2C46B' }), sv('stop', { offset: 1, 'stop-color': '#A99BFF' }))),
    sv('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: '#2A1A48', 'stroke-width': 12 }),
    sv('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: 'url(#' + id + ')', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-dasharray': (C * Math.min(1, pct / 100)).toFixed(1) + ' ' + C.toFixed(1), transform: 'rotate(-90 70 70)' }),
    sv('text', { x: 70, y: 72, 'text-anchor': 'middle', class: 'ring-v' }, label), sv('text', { x: 70, y: 94, 'text-anchor': 'middle', class: 'ring-s' }, sub));
}
// bars: [{label, values:[...]}], colours per series
function barChart(groups, colors, legend) {
  const w = 360, hgt = 170, max = Math.max(1, ...groups.flatMap(g => g.values)), gw = w / Math.max(1, groups.length), bw = Math.min(26, gw / (colors.length + 1.2));
  return h('div', null,
    legend ? h('div', { class: 'legend' }, legend.map((t, i) => h('span', null, h('i', { style: 'background:' + colors[i] }), t))) : null,
    sv('svg', { viewBox: '0 0 ' + w + ' ' + (hgt + 22), class: 'bars' },
      groups.flatMap((g, gi) => g.values.map((v, si) => {
        const bh = (v / max) * (hgt - 24), x = gi * gw + gw / 2 - (colors.length * bw) / 2 + si * bw + 2, y = hgt - bh;
        return [sv('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (bw - 4).toFixed(1), height: Math.max(1, bh).toFixed(1), rx: 3, fill: colors[si] }),
          sv('text', { x: (x + (bw - 4) / 2).toFixed(1), y: (y - 5).toFixed(1), 'text-anchor': 'middle', class: 'bar-v' }, v)];
      }).concat([sv('text', { x: (gi * gw + gw / 2).toFixed(1), y: hgt + 16, 'text-anchor': 'middle', class: 'bar-l' }, g.label)])),
      sv('line', { x1: 0, y1: hgt, x2: w, y2: hgt, stroke: '#3C2A66' })));
}
function activity(limit = 7) {
  const ev = [];
  for (const l of leads) {
    HOT.forEach(([k, label]) => { if (l[k]) ev.push([l[k], l, label]); });
    COLD.forEach(([k, label]) => { if (l[k]) ev.push([l[k], l, label]); });
    if (l.coi_date) ev.push([l.coi_date, l, 'Converted to COI']);
    if (l.telegram_promoted_date) ev.push([l.telegram_promoted_date, l, 'Telegram group promoted']);
  }
  for (const c of cases) {
    ev.push([c.closed_date, c.lead, 'Closed ' + c.product]);
    if (c.closedDate) ev.push([c.closedDate, c.lead, c.product + ' case closed']);
    for (const p of c.plan) if (p.paid_date) ev.push([p.paid_date, c.lead, 'Installment ' + RM(p.amount) + ' paid']);
  }
  return ev.filter(e => e[0]).sort((a, b) => b[0].localeCompare(a[0])).slice(0, limit);
}
// one violet family that brightens step by step towards closing
const STAGE_COLORS = ['#3A2F8C', '#43309A', '#4F31A8', '#5C33B4', '#6B36BF', '#7C3CC9', '#9150D3', '#AE74E0'];
const STAGE_ICONS = ['phone', 'form', 'chat', 'folder', 'bank', 'bulb', 'calendar', 'shake'];

// rank, the 4 hunter stats, today's quests and the [SYSTEM] message (shared by the header and the Overview)
function sysInfo() {
  const exp = expTotal(), rk = rankOf(exp);
  const xpPct = rk.next ? Math.round((exp - rk.r[1]) / (rk.next[1] - rk.r[1]) * 100) : 100;
  const last30 = addD(RD, -29);
  const STATS = [
    ['PROSPECTING', leads.filter(l => l.first_contact_date >= last30).length, 'New leads in the last 30 days'],
    ['CLOSING', cases.filter(c => (c.closed_date || '') >= last30).length, 'Products closed in the last 30 days'],
    ['FOLLOW-UP', follow.length ? Math.round((follow.length - overdue.length) / follow.length * 100) + '%' : '—', 'Lead follow-ups not overdue'],
    ['NETWORK', leads.filter(l => l.coi_date).length + leads.filter(l => l.telegram_promoted_date).length, 'COI conversions + Telegram promotions'],
  ];
  // missions for the reporting date
  const movedToday = leads.some(l => HOT.some(([k]) => l[k] === RD) || COLD.some(([k]) => l[k] === RD));
  const closedThisWeek = cases.some(c => c.closed_date && c.closed_date > addD(RD, -7));
  const missions = [
    ['Clear due follow-ups', overdue.length + today.length === 0, overdue.length + today.length ? (overdue.length + today.length) + ' left' : 'done'],
    ['Move a lead forward today', movedToday, movedToday ? 'done' : 'not yet'],
    ['Close a product this week', closedThisWeek, closedThisWeek ? 'done' : 'not yet'],
  ];
  const done = missions.filter(m => m[1]).length;
  const sysNote = rk.next ? 'Rank ' + rk.next[0] + ' unlocks in ' + (rk.next[1] - exp).toLocaleString('en-MY') + ' EXP. ' + (missions.length - done) + ' daily quest' + (missions.length - done === 1 ? '' : 's') + ' remaining.' : 'You have reached the highest rank.';
  return { exp, rk, xpPct, STATS, missions, done, sysNote };
}
function overview() {
  const reached = HOT.map(([k], i) => hot.filter(l => l.stage >= i + 1).length);
  const rows = HOT.map(([, label], i) => [label, reached[i], i ? Math.round(reached[i] / Math.max(1, reached[i - 1]) * 100) + '%' : '']);
  rows.push(['Closed (at least 1 product)', won.length, Math.round(won.length / Math.max(1, reached[7]) * 100) + '%']);
  const closeRate = Math.round(won.length / Math.max(1, hot.length) * 100);
  const byPlatform = [...new Set(leads.map(l => l.platform))].map(p => {
    const ls = leads.filter(l => l.platform === p);
    return [p, ls.length, 'HOT ' + ls.filter(l => l.category === 'HOT').length + ' · won ' + ls.filter(l => l.status === 'Won').length];
  }).sort((a, b) => b[1] - a[1]);
  const { exp, rk, xpPct, STATS, missions, done, sysNote } = sysInfo();
  const last30 = addD(RD, -29);
  const wk = addD(RD, -6);
  const weekly3 = [
    ['Add 5 new leads this week', leads.filter(l => l.first_contact_date >= wk).length, 5],
    ['Close 2 products this week', cases.filter(c => (c.closed_date || '') >= wk).length, 2],
    ['Convert 1 customer to COI this week', leads.filter(l => (l.coi_date || '') >= wk).length, 1],
  ];
  const ach = achievements();
  // stat cards with 8-week trends
  const ev = (list, key) => list.filter(x => x[key]).map(x => ({ date: x[key], x }));
  const newLeadsW = weekly(ev(leads, 'first_contact_date'));
  const movesW = weekly(hot.flatMap(l => HOT.map(([k]) => l[k]).filter(Boolean).map(date => ({ date }))));
  const closedW = weekly(cases.filter(c => c.closedDate).map(c => ({ date: c.closedDate })));
  const paid = cases.flatMap(c => c.plan.filter(p => p.paid_date).map(p => ({ date: p.paid_date, amount: Number(p.amount) })));
  const paidW = weekly(paid, 8, d => d.amount);
  const owed = cases.filter(c => c.isInstallment && c.state !== 'Closed').reduce((s, c) => s + c.total - c.paid, 0);
  const statCard = (ic, color, label, value, foot, spk) => h('div', { class: 'gcard stat', style: '--c:' + color }, h('div', { class: 'stat-top' }, h('span', { class: 'gi', style: 'color:' + color }, icon(ic, color)), h('div', null, h('div', { class: 'label' }, label), h('div', { class: 'value num' }, value), h('div', { class: 'foot' }, foot))), spk);
  // conversion by month: customers who closed in each of the last 5 months
  const months = Array.from({ length: 5 }, (_, i) => { const d = new Date(Date.parse(RD.slice(0, 7) + '-01')); d.setUTCMonth(d.getUTCMonth() - (4 - i)); return d.toISOString().slice(0, 7); });
  const wonMonth = l => (l.cases.map(c => c.closed_date).filter(Boolean).sort()[0] || '').slice(0, 7);
  const monthBars = months.map(m => ({ label: MONTHS[Number(m.slice(5)) - 1], values: [won.filter(l => wonMonth(l) === m).length] }));
  // lead sources: total vs closed (top 3 + others)
  const plats = [...new Set(leads.map(l => l.platform))].map(p => ({ p, n: leads.filter(l => l.platform === p).length })).sort((a, b) => b.n - a.n);
  const top = plats.slice(0, 3).map(x => x.p);
  const srcGroups = top.map(p => ({ label: p, values: [leads.filter(l => l.platform === p).length, leads.filter(l => l.platform === p && l.status === 'Won').length] }));
  if (plats.length > 3) srcGroups.push({ label: 'Others', values: [leads.filter(l => !top.includes(l.platform)).length, leads.filter(l => !top.includes(l.platform) && l.status === 'Won').length] });
  // this month
  const wonThisMonth = won.filter(l => wonMonth(l) === RD.slice(0, 7));
  const daysToClose = wonThisMonth.map(l => days(l.first_contact_date, l.cases.map(c => c.closed_date).sort()[0])).filter(n => n >= 0);
  const avgClose = daysToClose.length ? Math.round(daysToClose.reduce((a, b) => a + b, 0) / daysToClose.length) : null;
  const productsThisMonth = cases.filter(c => (c.closed_date || '').startsWith(RD.slice(0, 7))).length;

  return [
    h('div', { class: 'stats' },
      statCard('people', '#A99BFF', 'Total leads', leads.length, '+' + newThisMonth.length + ' this month', spark(newLeadsW, '#A99BFF')),
      statCard('target', '#F2C46B', 'Active pipeline', activeHot.length, Math.round(activeHot.length / Math.max(1, hot.length) * 100) + '% of HOT leads', spark(movesW, '#F2C46B')),
      statCard('check', '#3DD68C', 'Case Closed this month', closedThisMonth.length, processing.length + ' still processing', spark(closedW, '#3DD68C'))),
    h('div', { class: 'gcard pipe-card' }, h('div', { class: 'card-h' }, h('h2', null, h('span', { class: 'gi' }, icon('flow', '#F2C46B')), ' Sales pipeline'),
        h('div', { class: 'pipe-meta' }, h('span', null, h('b', { class: 'num' }, activeHot.length), ' active leads'), h('span', { class: 'vsep' }), h('a', { href: '#board', class: 'link' }, 'View board →'))),
      h('div', { class: 'chevrons' }, HOT.map(([, label], i) => {
        const n = activeHot.filter(l => l.stage === i + 1).length;
        return h('a', { href: '#board', class: 'chev' + (i === 0 ? ' first' : '') + (i === HOT.length - 1 ? ' last' : ''), style: '--sc:' + STAGE_COLORS[i], title: (i + 1) + '. ' + label },
          h('span', { class: 'chev-n' }, label), h('span', { class: 'chev-go' }, '›'),
          h('b', { class: 'num' }, n), h('small', { class: 'num' }, Math.round(n / Math.max(1, activeHot.length) * 100) + '%'),
          h('span', { class: 'chev-ic' }, icon(STAGE_ICONS[i], '#fff')));
      }))),
    h('div', { class: 'grow3' },
      h('div', { class: 'gcard' }, h('h2', null, 'Lead conversion rate'),
        h('div', { class: 'conv' }, ring(closeRate, closeRate + '%', won.length + ' / ' + hot.length + ' HOT'),
          h('div', { class: 'conv-side' }, h('div', { class: 'muted small' }, 'Customers closed per month'), barChart(monthBars, ['#F2C46B'])))),
      sysWin('QUEST INFO',
        h('div', { class: 'q-h' }, h('span', null, '[Daily Quest]'), h('span', { class: 'chip' }, done + ' / ' + missions.length)),
        h('ul', { class: 'missions' }, missions.map(([t, ok, note]) => h('li', { class: ok ? 'ok' : '' }, h('span', { class: 'tick' }, ok ? '✓' : ''), h('span', { class: 'grow' }, t), h('small', null, note)))),
        h('div', { class: 'q-h' }, h('span', null, '[Weekly Quest]'), h('span', { class: 'chip' }, weekly3.filter(q => q[1] >= q[2]).length + ' / ' + weekly3.length)),
        h('ul', { class: 'missions' }, weekly3.map(([t, n, goal]) => h('li', { class: n >= goal ? 'ok' : '' }, h('span', { class: 'tick' }, n >= goal ? '✓' : ''), h('span', { class: 'grow' }, t), h('small', { class: 'num' }, Math.min(n, goal) + ' / ' + goal)))),
        h('div', { class: 'reward' }, h('span', null, 'Rewards'), h('b', null, '+100 EXP daily · +300 EXP weekly')))),
    h('div', { class: 'gcard ach' }, h('div', { class: 'card-h' }, h('h2', null, 'Achievements'), h('span', { class: 'muted small' }, ach.filter(a => a[2] >= a[3]).length + ' / ' + ach.length + ' unlocked')),
      h('div', { class: 'badges' }, ach.map(([name, desc, n, goal, rar, ic]) => {
        const ok = n >= goal, col = RARITY[rar];
        return h('div', { class: 'badge' + (ok ? ' ok' : ''), style: '--rc:' + col, title: desc },
          h('div', { class: 'hex' }, icon(ic, ok ? col : '#6E5A88')),
          h('b', null, name), h('small', null, desc),
          h('div', { class: 'bprog' }, h('i', { style: 'width:' + Math.round(n / goal * 100) + '%' })),
          h('span', { class: 'rar' }, ok ? rar.toUpperCase() : n + ' / ' + goal));
      }))),
    h('div', { class: 'grow3 b' },
      h('div', { class: 'gcard' }, h('h2', null, 'Lead source performance'), barChart(srcGroups, ['#9C7BFF', '#F2C46B'], ['Total leads', 'Closed'])),
      h('div', { class: 'gcard' }, h('h2', null, 'This month'),
        h('div', { class: 'month' },
          [['people', newThisMonth.length, 'New leads'], ['check', wonThisMonth.length, 'Customers closed'], ['target', productsThisMonth, 'Products closed'], ['bolt', avgClose == null ? '—' : avgClose + 'd', 'Avg. days to close']]
            .map(([ic, v, t]) => h('div', null, h('span', { class: 'gi gold' }, icon(ic, '#F2C46B')), h('b', { class: 'num' }, v), h('small', null, t))))),
      h('div', { class: 'gcard' }, h('h2', null, h('span', { class: 'gi gold' }, icon('bolt', '#F2C46B')), ' Recent activity'),
        h('ul', { class: 'feed' }, activity().map(([d, l, what]) => h('li', { onclick: () => l && openLead(l) }, h('span', { class: 'dotg' }), h('small', null, ago(d)), h('span', { class: 'grow' }, what + (l ? ' · ' + l.name : ''))))))),
    h('details', { class: 'gcard exp' }, h('summary', null, 'How EXP works'),
      h('p', { class: 'muted small' }, 'EXP is counted from your workbook, so it always matches what was done. Ranks: E 0 · D 1,000 · C 3,000 · B 6,000 · A 10,000 · S 15,000 EXP.'),
      h('ul', { class: 'small' }, EXP_RULES.map(([t, n]) => h('li', null, t + ': +' + n + ' EXP')))),
    h('h2', { class: 'section-h' }, 'More details'),
    h('div', { class: 'grid' },
      h('div', { class: 'card' }, h('h2', null, 'HOT conversion funnel'), h('p', { class: 'muted small' }, 'How many leads reached each step; the % is how many moved on from the step before.'), funnel(rows)),
      h('div', { class: 'card' },
        h('h2', null, 'Stuck leads'),
        h('p', { class: 'muted small' }, 'Active HOT leads with no progress for ' + STUCK + '+ days.'),
        stuck.length ? h('ul', { class: 'list' }, stuck.slice(0, 8).map(l => leadRow(l, h('span', { class: 'od' }, l.idle + ' days idle')))) : h('p', { class: 'muted' }, 'None.'),
        h('h2', { style: 'margin-top:18px' }, 'Lead sources'),
        funnel(byPlatform, 'cold'))),
    h('div', { class: 'card' }, h('h2', null, 'Own cases and agents'), h('p', { class: 'muted small' }, 'Agent = who brought the customer. ' + OWNER + ' = your own case; anyone else passed the case to you.'),
      h('div', { class: 'tablewrap' }, h('table', null,
        h('thead', null, h('tr', null, h('th', null, 'Agent'), h('th', { class: 'r' }, 'HOT leads'), h('th', { class: 'r' }, 'Active'), h('th', { class: 'r' }, 'Won'), h('th', { class: 'r' }, 'Products closed'), h('th', { class: 'r' }, 'Close rate'))),
        h('tbody', null, [...new Set(hot.map(l => isOwn(l) ? OWNER : l.agent))].sort((a, b) => (b === OWNER) - (a === OWNER) || a.localeCompare(b)).map(a => {
          const ls = hot.filter(l => (isOwn(l) ? OWNER : l.agent) === a);
          const w = ls.filter(l => l.status === 'Won');
          return h('tr', null, h('td', null, a === OWNER ? h('span', { class: 'tag own' }, 'Own case · ' + OWNER) : h('span', { class: 'tag agent' }, a)),
            h('td', { class: 'r num' }, ls.length), h('td', { class: 'r num' }, ls.filter(l => l.active).length), h('td', { class: 'r num' }, w.length),
            h('td', { class: 'r num' }, w.reduce((s, l) => s + l.cases.length, 0)), h('td', { class: 'r num' }, Math.round(w.length / Math.max(1, ls.length) * 100) + '%'));
        }))))),
  ];
}
// ---- Leads: a clean, searchable, sortable table ----
const tbl = { q: '', status: 'All', category: 'All', source: 'All', agent: 'All', sort: 'first', dir: -1 }; // newest leads first
const agentOf = l => (isOwn(l) ? OWNER : l.agent);
// idle: days since anything happened (closed customers: since their last action)
const idleOf = l => (l.status === 'Won' && l.lastActionDate ? Math.max(0, days(l.lastActionDate, RD)) : l.idle);
const actionDate = l => (l.status === 'Won' ? l.lastActionDate : l.next_action_date) || '';
const SORTS = {
  name: l => String(l.name).toLowerCase(), status: l => l.status, stage: l => (l.status === 'Won' ? 20 : l.category === 'HOT' ? 10 + l.stage : l.coldStep),
  source: l => String(l.platform).toLowerCase(), agent: l => String(agentOf(l) || '').toLowerCase(), first: l => l.first_contact_date || '',
  action: l => actionDate(l) || '9999', idle: idleOf,
};
function leadsPage() {
  const opt = (key, values) => h('label', { class: 'fsel' }, h('span', null, key[0].toUpperCase() + key.slice(1)),
    h('select', { onchange: e => { tbl[key] = e.target.value; render(); } }, ['All', ...values].map(v => { const o = h('option', { value: v }, v); if (v === tbl[key]) o.selected = true; return o; })));
  const q = tbl.q.trim().toLowerCase();
  const rows = leads.filter(l => (tbl.status === 'All' || l.status === tbl.status) && (tbl.category === 'All' || l.category === tbl.category)
      && (tbl.source === 'All' || l.platform === tbl.source) && (tbl.agent === 'All' || agentOf(l) === tbl.agent)
      && (!q || [l.name, l.lead_id, l.problem, l.phone, l.platform, l.agent].some(v => String(v || '').toLowerCase().includes(q))))
    .sort((a, b) => { const x = SORTS[tbl.sort](a), y = SORTS[tbl.sort](b); return (x < y ? -1 : x > y ? 1 : 0) * tbl.dir; });
  const th = (key, label, cls) => h('th', { class: 'sortable' + (cls ? ' ' + cls : '') + (tbl.sort === key ? ' on' : ''), onclick: () => { if (tbl.sort === key) tbl.dir = -tbl.dir; else { tbl.sort = key; tbl.dir = 1; } render(); } },
    label, h('span', { class: 'arrow' }, tbl.sort === key ? (tbl.dir > 0 ? ' ▲' : ' ▼') : ''));
  const search = h('input', { type: 'search', id: 'lead-q', placeholder: 'Search name, ID, phone, problem…', value: tbl.q, oninput: e => { tbl.q = e.target.value; render(); const i = document.getElementById('lead-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
  const uniq = f => [...new Set(leads.map(f).filter(Boolean))].sort();
  return [pageHead('Leads', 'Every lead and customer in one table. Click a row for details.'),
    h('div', { class: 'gcard' },
      h('div', { class: 'tbar' }, search, opt('status', ['Active', 'Won', 'Lost']), opt('category', ['HOT', 'COLD']), opt('source', uniq(l => l.platform)), opt('agent', uniq(agentOf)),
        h('button', { class: 'pill', onclick: () => { Object.assign(tbl, { q: '', status: 'All', category: 'All', source: 'All', agent: 'All' }); render(); } }, 'Clear')),
      h('div', { class: 'tablewrap' }, h('table', { class: 'saas' },
        h('thead', null, h('tr', null, th('name', 'Lead'), th('status', 'Status'), th('stage', 'Stage'), th('source', 'Source'), th('agent', 'Agent'), th('first', 'First contact'), th('action', 'Next / last action'), th('idle', 'Idle', 'r'))),
        h('tbody', null, rows.map(l => h('tr', { onclick: () => openLead(l) },
          h('td', null, h('div', { class: 'nm' }, l.name), h('div', { class: 'sub' }, l.lead_id + (l.problem ? ' · ' + l.problem : ''))),
          h('td', null, catTag(l)),
          h('td', { class: 'small' }, stageName(l)),
          h('td', { class: 'small' }, l.platform),
          h('td', null, srcTag(l)),
          h('td', { class: 'small num' }, fmt(l.first_contact_date)),
          h('td', { class: 'small' }, l.status === 'Won' ? [h('div', null, l.last_action || 'Last action'), h('div', { class: 'sub' }, ago(l.lastActionDate))] : l.next_action ? [h('div', null, l.next_action), h('div', { class: 'sub' }, whenText(l.next_action_date))] : h('span', { class: 'muted' }, '—')),
          h('td', { class: 'r num small' + (l.active && l.idle >= STUCK ? ' od' : '') }, idleOf(l) + 'd')))))),
      h('div', { class: 'tfoot' }, 'Showing ' + rows.length + ' of ' + leads.length + (rows.length !== leads.length ? ' (filtered)' : '')))];
}
let boardFilter = 'Active';
function board() {
  const bySource = hot.filter(SOURCES[sourceFilter]);
  const shown = bySource.filter(l => boardFilter === 'All' || l.status === boardFilter);
  const filters = h('div', { class: 'filters' }, ['Active', 'Won', 'Lost', 'All'].map(f =>
    h('button', { class: 'pill' + (f === boardFilter ? ' active' : ''), onclick: () => { boardFilter = f; render(); } }, f + ' (' + (f === 'All' ? bySource.length : bySource.filter(l => l.status === f).length) + ')')),
    h('span', { class: 'sep' }), sourcePills(hot.filter(l => boardFilter === 'All' || l.status === boardFilter)));
  const cols = HOT.map(([, label], i) => {
    const ls = shown.filter(l => l.stage === i + 1).sort((a, b) => b.idle - a.idle);
    return h('div', { class: 'col' }, h('h3', null, h('span', null, (i + 1) + '. ' + label), h('span', { class: 'n' }, ls.length)),
      ls.map(l => h('div', { class: 'kcard' + (l.active && l.idle >= STUCK ? ' stuck' : ''), onclick: () => openLead(l) },
        h('div', { class: 'nm' }, l.name),
        h('div', null, srcTag(l)),
        h('div', { class: 'meta' }, l.platform + ' · ' + l.idle + ' days at this step'),
        l.next_action_date ? h('div', { class: 'meta' }, whenText(l.next_action_date)) : null)));
  });
  return [pageHead('Lead board', 'HOT leads by stage; red left edge = idle ' + STUCK + '+ days'), filters, h('div', { class: 'board' }, cols)];
}
let caseFilter = 'All';
function casesPage() {
  const installment = cases.filter(c => c.isInstallment);
  const owing = installment.filter(c => c.state !== 'Closed').sort((a, b) => (b.overduePays.length - a.overduePays.length) || ((a.next && a.next.due_date) || '').localeCompare((b.next && b.next.due_date) || ''));
  const overduePays = installment.flatMap(c => c.overduePays);
  const multi = won.filter(l => l.cases.length > 1);
  const FILTERS = { All: () => true, Processing: c => c.state !== 'Closed', Closed: c => c.state === 'Closed', Installment: c => c.isInstallment };
  const srcCases = cases.filter(c => SOURCES[sourceFilter](c.lead));
  const filters = h('div', { class: 'filters' }, Object.keys(FILTERS).map(f =>
    h('button', { class: 'pill' + (f === caseFilter ? ' active' : ''), onclick: () => { caseFilter = f; render(); } }, f + ' (' + srcCases.filter(FILTERS[f]).length + ')')),
    h('span', { class: 'sep' }), sourcePills(won.filter(l => l.cases.some(FILTERS[caseFilter]))));
  // one block per customer, one line per product they closed
  const customers = won.filter(SOURCES[sourceFilter]).filter(l => l.cases.some(FILTERS[caseFilter]))
    .sort((a, b) => (a.cases.every(c => c.state === 'Closed') - b.cases.every(c => c.state === 'Closed')) || a.cases[0].closed_date.localeCompare(b.cases[0].closed_date));
  const rows = customers.flatMap(l => l.cases.filter(FILTERS[caseFilter]).map((c, i) => h('tr', { class: i ? 'cont' : 'first', onclick: () => openLead(l) },
    h('td', null, i ? '' : h('div', null, h('div', { class: 'nm' }, l.name), h('div', null, srcTag(l)), h('div', { class: 'sub' }, l.lead_id + ' · ' + l.cases.length + (l.cases.length === 1 ? ' product' : ' products') + ' · consultant ' + (l.consultant || OWNER)))),
    h('td', null, prodTag(c.product)),
    h('td', null, caseState(c)),
    h('td', { class: 'num small' }, c.state === 'Closed' ? 'Fee collected ' + fmt(c.closedDate) : c.processing_date ? 'Since ' + fmt(c.processing_date) + ' (' + days(c.processing_date, RD) + ' days)' : 'Closed ' + fmt(c.closed_date)),
    h('td', null, instTag(c), c.isInstallment && c.plan.length ? payBar(c) : null))));
  const prodRows = PRODUCTS.map(p => {
    const cs = cases.filter(c => c.product === p);
    return h('tr', { class: cs.length ? '' : 'zero' }, h('td', null, prodTag(p), INSTALLMENT_PRODUCTS.includes(p) ? h('span', { class: 'muted small' }, ' · installment OK') : null),
      h('td', { class: 'r num' }, cs.filter(c => c.state !== 'Closed').length), h('td', { class: 'r num' }, cs.filter(c => c.state === 'Closed').length), h('td', { class: 'r num' }, cs.filter(c => c.isInstallment).length));
  });
  return [pageHead('Cases', 'From case processing onwards: one line per product a customer closed'),
    needProduct.length ? h('div', { class: 'card warn' }, h('h2', null, '! Won, but no product added yet (' + needProduct.length + ')'),
      h('p', { class: 'muted small' }, 'Add one row per product on the Cases sheet (same lead_id), with closed_date and processing_date.'),
      h('ul', { class: 'list' }, needProduct.map(l => leadRow(l, l.lead_id)))) : null,
    h('div', { class: 'tiles' },
      tile('Cases in processing', processing.length, 'of ' + cases.length + ' cases', 'hero'),
      tile('Case Closed this month', closedThisMonth.length, 'Fee collected'),
      tile('Customers', won.length, multi.length + ' closed more than 1 product'),
      tile('Installment still owed', RM(owing.reduce((s, c) => s + c.total - c.paid, 0)), owing.length + ' cases paying'),
      tile('Installments overdue', overduePays.length, overduePays.length ? RM(overduePays.reduce((s, p) => s + Number(p.amount), 0)) + ' not paid on time' : 'All on time', overduePays.length ? 'alert' : '')),
    h('div', { class: 'card' }, h('h2', null, 'Customers and products'), filters,
      h('div', { class: 'tablewrap' }, h('table', { class: 'cases' }, h('thead', null, h('tr', null, h('th', null, 'Customer'), h('th', null, 'Product'), h('th', null, 'Status'), h('th', null, 'When'), h('th', null, 'Fee'))), h('tbody', null, rows)))),
    h('div', { class: 'grid' },
      h('div', { class: 'card' }, h('h2', null, 'By product'),
        h('table', null, h('thead', null, h('tr', null, h('th', null, 'Product'), h('th', { class: 'r' }, 'Processing'), h('th', { class: 'r' }, 'Closed'), h('th', { class: 'r' }, 'Installment'))), h('tbody', null, prodRows))),
      h('div', { class: 'card' }, h('h2', null, 'Installments'), h('p', { class: 'muted small' }, 'The case closes only when the last installment is paid.'),
        h('ul', { class: 'list' }, owing.concat(installment.filter(c => c.state === 'Closed')).map(c => h('li', { onclick: () => openLead(c.lead) },
          h('div', { class: 'grow' }, h('div', null, c.lead.name, ' ', prodTag(c.product)), payBar(c),
            h('div', { class: 'sub' }, c.next ? 'Next: ' + RM(c.next.amount) + (c.plan.at(-1) === c.next ? ' (final)' : '') + ' due ' + fmt(c.next.due_date) : 'Fully paid ' + fmt(c.closedDate))),
          h('div', { class: 'when' }, c.overduePays.length ? h('span', { class: 'od' }, '! ' + c.overduePays.length + ' overdue') : c.next ? whenText(c.next.due_date) : caseState(c)))))))];
}
// paid / total with a small bar
function payBar(c) {
  const pct = c.total ? Math.round(c.paid / c.total * 100) : 0;
  return h('div', { class: 'paybar' }, h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.max(2, pct) + '%' })),
    h('span', { class: 'small num' }, RM(c.paid) + ' / ' + RM(c.total) + ' · ' + c.plan.filter(p => p.paid_date).length + ' of ' + c.plan.length + ' paid'));
}
let afterFilter = 'To do';
function afterSalesPage() {
  const FILTERS = { 'To do': l => !l.coi_date || !l.telegram_promoted_date, Done: l => l.coi_date && l.telegram_promoted_date, All: () => true };
  const coi = afterSales.filter(l => l.coi_date), tg = afterSales.filter(l => l.telegram_promoted_date);
  const waiting = won.filter(l => !afterSales.includes(l));
  const filters = h('div', { class: 'filters' }, Object.keys(FILTERS).map(f =>
    h('button', { class: 'pill' + (f === afterFilter ? ' active' : ''), onclick: () => { afterFilter = f; render(); } }, f + ' (' + afterSales.filter(FILTERS[f]).length + ')')));
  const mark = (d, label) => d ? h('span', { class: 'tag won' }, '✓ ' + label + ' · ' + fmt(d)) : h('span', { class: 'tag proc' }, 'Not yet');
  const rows = afterSales.filter(FILTERS[afterFilter]).sort((a, b) => a.allClosedDate.localeCompare(b.allClosedDate)).map(l => h('tr', { onclick: () => openLead(l) },
    h('td', null, h('div', { class: 'nm' }, l.name), h('div', { class: 'sub' }, l.cases.map(c => [prodTag(c.product), ' ']))),
    h('td', { class: 'num small' }, fmt(l.allClosedDate), h('div', { class: 'sub' }, days(l.allClosedDate, RD) + ' days ago')),
    h('td', null, mark(l.coi_date, 'COI')),
    h('td', null, mark(l.telegram_promoted_date, 'Promoted'))));
  return [pageHead('After-sales', 'After every product is closed: convert the customer to a COI and promote the Telegram group'),
    h('div', { class: 'tiles' },
      tile('After-sales to do', afterSalesDue.length, 'of ' + afterSales.length + ' customers with all cases closed', afterSalesDue.length ? 'alert' : 'hero'),
      tile('Converted to COI', coi.length + ' / ' + afterSales.length, Math.round(coi.length / Math.max(1, afterSales.length) * 100) + '%'),
      tile('Telegram promoted', tg.length + ' / ' + afterSales.length, Math.round(tg.length / Math.max(1, afterSales.length) * 100) + '%'),
      tile('Both done', afterSales.filter(FILTERS.Done).length, 'COI + Telegram'),
      tile('Not ready yet', waiting.length, 'Customers with a case still processing')),
    h('div', { class: 'card' }, h('h2', null, 'Customers'), filters,
      rows.length ? h('div', { class: 'tablewrap' }, h('table', { class: 'cases' }, h('thead', null, h('tr', null, h('th', null, 'Customer'), h('th', null, 'All cases closed'), h('th', null, 'COI'), h('th', null, 'Telegram group'))), h('tbody', null, rows)))
        : h('p', { class: 'muted' }, 'None.'))];
}
function followup() {
  const next7 = follow.filter(l => l.next_action_date > RD && days(RD, l.next_action_date) <= 7);
  const later = follow.filter(l => days(RD, l.next_action_date) > 7);
  const group = (title, ls, calm) => ls.length ? [h('div', { class: 'group-h' }, title + ' (' + ls.length + ')'), h('ul', { class: 'list' }, ls.map(l => leadRow(l, whenText(l.next_action_date, calm))))] : [];
  return [pageHead('Follow-ups', 'Sorted by next-action date'),
    h('div', { class: 'card' }, follow.length ? [group('Overdue', overdue), group('Today', today), group('Next 7 days', next7), group('Later', later)].flat() : h('p', { class: 'muted' }, 'No lead follow-ups.')),
    caseFollow.length ? h('div', { class: 'card' }, h('h2', null, 'Closed customers: last action'), h('p', { class: 'muted small' }, 'No next action for customers who already closed, only how long ago something was last done. Longest ago first.'),
      h('ul', { class: 'list' }, caseFollow.map(l => leadRow(l, h('span', { class: 'muted' }, 'Last action ' + ago(l.lastActionDate)))))) : null];
}
function coldPage() {
  const pool = leads.filter(l => l.c1_telegram_promoted_date || l.category === 'COLD');
  const rows = [['PM only (all COLD leads)', pool.length], ...COLD.map(([k, label]) => [label, pool.filter(l => l[k]).length])];
  const byFreebie = [...new Set(DATA.freebies.map(f => f.freebie))].map(name => {
    const fs = DATA.freebies.filter(f => f.freebie === name);
    const people = [...new Set(fs.map(f => f.lead_id))];
    const up = people.filter(id => leads.find(l => l.lead_id === id)?.c3_upgraded_hot_date);
    return { name, sent: fs.length, people: people.length, up: up.length };
  }).sort((a, b) => b.sent - a.sent);
  const waiting = cold.filter(l => l.next_action).sort((a, b) => a.next_action_date.localeCompare(b.next_action_date));
  return [pageHead('COLD & Telegram', 'Leads without contact details, nurtured into HOT through the Telegram group and freebies'),
    h('div', { class: 'grid' },
      h('div', { class: 'card' }, h('h2', null, 'COLD conversion'), funnel(rows, 'cold')),
      h('div', { class: 'card' }, h('h2', null, 'Freebie results'),
        h('table', null, h('thead', null, h('tr', null, h('th', null, 'Freebie'), h('th', { class: 'r' }, 'Sent'), h('th', { class: 'r' }, 'People'), h('th', { class: 'r' }, 'Later HOT'))),
          h('tbody', null, byFreebie.map(f => h('tr', null, h('td', null, f.name), h('td', { class: 'r num' }, f.sent), h('td', { class: 'r num' }, f.people), h('td', { class: 'r num' }, f.up))))))),
    h('div', { class: 'card' }, h('h2', null, 'To promote / remind to join'), waiting.length ? h('ul', { class: 'list' }, waiting.map(l => leadRow(l, whenText(l.next_action_date)))) : h('p', { class: 'muted' }, 'None.'))];
}

// ---- lead drawer ----
function openLead(l) {
  const root = document.getElementById('drawer-root');
  const close = () => { root.replaceChildren(); };
  const steps = (l.c1_telegram_promoted_date ? COLD : []).concat(l.category === 'HOT' ? HOT : (l.c1_telegram_promoted_date ? [] : COLD));
  root.replaceChildren(
    h('div', { class: 'back', onclick: close }),
    h('aside', { class: 'drawer' },
      h('button', { class: 'x', onclick: close, 'aria-label': 'Close' }, '×'),
      h('h2', null, l.name), catTag(l),
      h('dl', null,
        h('dt', null, 'Lead ID'), h('dd', null, l.lead_id),
        h('dt', null, 'Source'), h('dd', null, l.platform + ', first contact ' + fmt(l.first_contact_date)),
        l.category === 'HOT' || l.agent ? [h('dt', null, 'Agent'), h('dd', null, isOwn(l) ? [OWNER, ' ', srcTag(l)] : srcTag(l)), h('dt', null, 'Consultant'), h('dd', null, l.consultant || OWNER)] : null,
        l.phone ? [h('dt', null, 'Phone'), h('dd', null, l.phone)] : null,
        l.problem ? [h('dt', null, 'Problem'), h('dd', null, l.problem)] : null,
        h('dt', null, 'Now'), h('dd', null, stageName(l)),
        l.status === 'Won' ? [h('dt', null, 'Last action'), h('dd', null, (l.last_action ? l.last_action + ' · ' : '') + (l.lastActionDate ? fmt(l.lastActionDate) + ' (' + ago(l.lastActionDate) + ')' : 'no date yet'))]
          : l.next_action ? [h('dt', null, 'Next'), h('dd', null, l.next_action, ' · ', whenText(l.next_action_date))] : null,
        l.lost_reason ? [h('dt', null, 'Lost because'), h('dd', null, l.lost_reason)] : null),
      h('h3', null, 'Progress'),
      h('ul', { class: 'tl' }, steps.map(([k, label]) => h('li', { class: l[k] ? 'done' : '' }, h('span', { class: 'dot' }), label, h('span', { class: 'd' }, l[k] ? fmt(l[k]) : '')))),
      l.cases.length ? [
        h('h3', { style: 'margin-top:16px' }, 'Products closed'),
        h('ul', { class: 'list' }, l.cases.map(c => h('li', { style: 'cursor:default' },
          h('div', { class: 'grow' }, h('div', null, prodTag(c.product), ' ', instTag(c)),
            h('div', { class: 'sub' }, 'Closed ' + fmt(c.closed_date) + (c.processing_date ? ' · processing ' + fmt(c.processing_date) : '') + (c.closedDate ? ' · fee collected ' + fmt(c.closedDate) : '')),
            c.isInstallment && c.plan.length ? [payBar(c), h('table', { class: 'sched' }, h('tbody', null, c.plan.map(p => h('tr', { class: p.paid_date ? '' : p.due_date < RD ? 'late' : 'due' },
              h('td', null, fmt(p.due_date)), h('td', { class: 'r num' }, RM(p.amount)),
              h('td', { class: 'small' }, p.paid_date ? '✓ paid ' + fmt(p.paid_date) : p.due_date < RD ? '! overdue' : 'due'))))) ] : null),
          caseState(c)))),
        h('h3', { style: 'margin-top:16px' }, 'After-sales'),
        h('ul', { class: 'tl' },
          h('li', { class: l.coi_date ? 'done' : '' }, h('span', { class: 'dot' }), 'Converted to COI', h('span', { class: 'd' }, l.coi_date ? fmt(l.coi_date) : '')),
          h('li', { class: l.telegram_promoted_date ? 'done' : '' }, h('span', { class: 'dot' }), 'Telegram group promoted', h('span', { class: 'd' }, l.telegram_promoted_date ? fmt(l.telegram_promoted_date) : '')))] : null)
  );
}
addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('drawer-root').replaceChildren(); });

// ---- router ----
const PAGES = { overview, leads: leadsPage, board, cases: casesPage, aftersales: afterSalesPage, followup, cold: coldPage };
function render() {
  const page = PAGES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview';
  for (const id of Object.keys(PAGES)) {
    const sec = document.getElementById('p-' + id);
    sec.hidden = id !== page;
    if (id === page) sec.replaceChildren(...PAGES[id]().filter(x => x != null));
  }
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
}
document.getElementById('c-board').textContent = activeHot.length;
document.getElementById('c-leads').textContent = leads.length;
{ // header, right of the name card: title, the [SYSTEM] message, the 4 hunter stats and the reporting date
  const si = sysInfo();
  document.getElementById('sysbar').append(
    h('div', { class: 'sysbar-l' },
      h('div', { class: 'brandname' }, h('span', { class: 'mark' }), 'Lead Dashboard', h('span', { class: 'sys-tag' }, 'SYSTEM')),
      h('div', { class: 'sysmsg' }, h('span', { class: 'sys-dot' }), h('b', null, '[SYSTEM] '), si.sysNote)),
    h('div', { class: 'sysbar-r' },
      si.STATS.map(([k, v, hint]) => h('div', { class: 'st', title: hint }, h('small', null, k), h('b', { class: 'num' }, v))),
      h('div', { class: 'st rdst' }, h('small', null, 'REPORTING DATE'), h('b', { class: 'num' }, fmt(RD)))));
}
{ // top-left: your name, hunter rank and EXP
  const xp = expTotal(), rk1 = rankOf(xp), pct = rk1.next ? Math.round((xp - rk1.r[1]) / (rk1.next[1] - rk1.r[1]) * 100) : 100;
  document.getElementById('hunter').append(
    AVATAR ? h('div', { class: 'avatar', style: '--rc:' + rk1.r[2] }, h('img', { src: AVATAR, alt: '' }), h('span', { class: 'av-rank' }, rk1.r[0])) : rankBadge(rk1.r[0], rk1.r[2], 58),
    h('div', { class: 'hunter-txt' },
      h('div', { class: 'hunter-name' }, OWNER),
      h('div', { class: 'hunter-rank' }, 'Rank ' + rk1.r[0] + ' Hunter · ' + xp.toLocaleString('en-MY') + ' EXP'),
      h('div', { class: 'xp' }, h('i', { style: 'width:' + pct + '%' })),
      h('div', { class: 'hunter-next' }, rk1.next ? (rk1.next[1] - xp).toLocaleString('en-MY') + ' EXP to Rank ' + rk1.next[0] : 'Highest rank reached')));
}
{ // menu: an icon in front of every item
  const NAV_ICONS = { overview: 'crown', leads: 'people', board: 'flow', cases: 'folder', aftersales: 'star', followup: 'calendar', cold: 'chat' };
  document.querySelectorAll('nav a').forEach(a => { const t = h('span', { class: 'navt' }); while (a.firstChild && !(a.firstChild.nodeType === 1 && a.firstChild.classList.contains('count'))) t.append(a.firstChild); a.prepend(icon(NAV_ICONS[a.dataset.page] || 'star'), t); });
}
document.getElementById('c-follow').textContent = overdue.length + today.length || ''; // red dot only for leads that still need closing
document.getElementById('c-cases').textContent = processing.length + needProduct.length;
document.getElementById('c-after').textContent = afterSalesDue.length;
document.getElementById('c-cold').textContent = cold.length;
addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
render();
</script>
</body>
</html>
`;
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log('Wrote ' + path.relative(root, OUT) + (bgFile ? ' (background: ' + path.basename(bgFile) + ')' : '') + (avFile ? ' (avatar: ' + path.basename(avFile) + ')' : ''));
