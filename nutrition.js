import { FOODS } from '../data/foods.js';
import { load, save, today } from '../store.js';
import { targets, macros } from '../calc.js';
import { esc } from '../ui.js';
const $ = id => document.getElementById(id), r = n => Math.round(n);
const TYPES = { breakfast: 'الإفطار', lunch: 'الغداء', dinner: 'العشاء', snack: 'وجبات خفيفة' };
const flt = () => foods().filter(f => (!st.cat || f.id[0] === st.cat) && (!st.q.trim() || f.ar.includes(st.q.trim())));
const st = { cat: '', tab: 'log', date: null, q: '', rname: '', srv: 4, rec: [], ri: 'f-rice', rg: 100 };
const foods = () => FOODS.concat(load('customFoods', []));
const sumK = (a, k) => a.reduce((s, x) => s + x[k], 0);
export default { title: 'التغذية', render: () => '<div id="v"></div>', mount() { st.date ||= today(); draw(); } };

function draw() {
  $('v').innerHTML = `<div class="tabs"><button class="${st.tab === 'log' ? 'on' : ''}" data-t="log">السجل</button><button class="${st.tab === 'rec' ? 'on' : ''}" data-t="rec">حاسبة وصفة</button></div><div id="w"></div>`;
  $('v').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { st.tab = b.dataset.t; draw(); });
  st.tab === 'log' ? log() : rec();
}
export function goalFor(date) {
  const p = load('profile', {}); if (!(p.sex && p.activity && p.goal)) return null;
  const w = load('weights', []).sort((a, b) => a.date < b.date ? 1 : -1)[0]?.kg ?? p.startWeight ?? 90;
  let kcal = targets({ sex: p.sex, kg: w, cm: +p.height, age: +p.age, activity: p.activity })[p.goal];
  const add = load('prefs', {}).addCardio ? sumK(load('cardio', []).filter(c => c.date === date), 'kcal') : 0;
  return { kcal: kcal + add, add, ...macros(kcal + add, w) };
}
function log() {
  const m = load('meals', []).filter(x => x.date === st.date), tot = { kcal: sumK(m, 'kcal'), p: sumK(m, 'p'), c: sumK(m, 'c'), f: sumK(m, 'f') }, T = goalFor(st.date);
  const list = flt(), freq = Object.entries(load('meals', []).reduce((o, x) => (o[x.name] = (o[x.name] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n]) => foods().find(f => f.ar === n)).filter(Boolean);
  $('w').innerHTML = `<div class="grid"><label>التاريخ<input type="date" id="dt" value="${st.date}"></label>
    <div class="card"><h2>الإجمالي</h2><div class="v">${r(tot.kcal)} سعرة</div><p class="s">بروتين ${r(tot.p)} غ · كربوهيدرات ${r(tot.c)} غ · دهون ${r(tot.f)} غ<br>${T ? `الهدف ${r(T.kcal)} — المتبقي <b>${r(T.kcal - tot.kcal)}</b> سعرة (بروتين ${r(T.p)} · كربوهيدرات ${r(T.c)} · دهون ${r(T.f)} غ)${T.add ? `<br>تشمل ${r(T.add)} سعرة كارديو` : ''}` : 'أكمل الجنس والنشاط والهدف في الإعدادات لعرض الهدف والمتبقي.'}</p></div>
    <form class="card grid" id="add"><h2>إضافة طعام</h2>
      <select name="type">${Object.entries(TYPES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select>
      <select id="cat"><option value="">كل الأصناف</option><option value="f" ${st.cat === 'f' ? 'selected' : ''}>مكونات أساسية</option><option value="d" ${st.cat === 'd' ? 'selected' : ''}>أطباق عربية</option><option value="c" ${st.cat === 'c' ? 'selected' : ''}>أطعمتي ووصفاتي</option></select>
      <input type="search" id="fq" placeholder="ابحث عن طعام" value="${esc(st.q)}">
      <select name="food" id="food">${list.map(f => `<option value="${f.id}">${f.ar}</option>`).join('')}</select><p class="s" id="hint"></p>
      <select name="unit"><option value="srv">عدد الحصص المنزلية</option><option value="g">غرام</option></select>
      <label>الكمية<input name="amt" type="number" inputmode="decimal" step="0.25" min="0.25" value="1" required></label><button class="btn" type="submit">إضافة</button></form>
    ${freq.length ? `<div class="card"><h2>الأكثر استخدامًا</h2>${freq.map(f => `<button class="chip" data-q="${f.id}">+ ${f.ar}</button>`).join('')}<p class="s">يضيف حصة واحدة إلى الوجبة المختارة أعلاه.</p></div>` : ''}
    <button class="btn ghost" id="cp" type="button">نسخ وجبات اليوم السابق</button>
    ${Object.entries(TYPES).map(([k, n]) => { const l = m.filter(x => x.type === k); return l.length ? `<div class="card"><h2>${n} — ${r(sumK(l, 'kcal'))} سعرة</h2>${l.map(x => `<div class="li"><span>${esc(x.name)} · ${x.g} غ · ${r(x.kcal)} سعرة · ب${r(x.p)}</span><button class="btn ghost sm" data-d="${x.id}">حذف</button></div>`).join('')}</div>` : ''; }).join('')}
    <p class="s">القيم تقديرية. الأطباق المنزلية تختلف كثيرًا بالمكونات والزيت، فاعتبرها نطاقًا لا رقمًا دقيقًا.</p></div>`;
  const hint = () => { const f = foods().find(x => x.id === $('food').value); $('hint').textContent = f ? `الحصة: ${f.sn} ≈ ${f.sg} غ · ${r(f.kcal * f.sg / 100)} سعرة${f.ref ? '' : ' (تقدير منزلي)'}` : ''; };
  hint(); $('food').onchange = hint; $('cat').onchange = e => { st.cat = e.target.value; log(); };
 const put = (f, g, type) => {
  if (!f || !Number.isFinite(g) || g <= 0) return;

  const k = g / 100;
  const a = load('meals', []);
; a.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), date: st.date, type, name: f.ar, g: r(g), kcal: f.kcal * k, p: f.p * k, c: f.c * k, f: f.f * k }); save('meals', a); };
  $('w').querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const f = foods().find(x => x.id === b.dataset.q); put(f, f.sg, document.querySelector('select[name=type]').value); log(); });
  $('cp').onclick = () => { const p = new Date(st.date + 'T12:00:00'); p.setDate(p.getDate() - 1); const iso = new Date(p - p.getTimezoneOffset() * 6e4).toISOString().slice(0, 10), src = load('meals', []).filter(x => x.date === iso);
    if (!src.length) return alert('لا توجد وجبات مسجلة في اليوم السابق (' + iso + ').'); const a = load('meals', []); src.forEach(x => a.push({ ...x, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), date: st.date })); save('meals', a); log(); };
  $('dt').onchange = e => { st.date = e.target.value || today(); log(); };
  $('fq').oninput = e => { st.q = e.target.value; const l = flt(); $('food').innerHTML = l.map(f => `<option value="${f.id}">${f.ar}</option>`).join(''); hint(); };
  $('add').onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)), f = foods().find(x => x.id === d.food); if (!f) return;
const g =
  d.unit === 'srv'
    ? +d.amt * f.sg
    : +d.amt;

if (!Number.isFinite(g) || g <= 0) {
  alert('الكمية غير صحيحة.');
  return;
}

const k = g / 100;
const a = load('meals', []);
;
    a.push({ id: Date.now().toString(36), date: st.date, type: d.type, name: f.ar, g: r(g), kcal: f.kcal * k, p: f.p * k, c: f.c * k, f: f.f * k });
    if (!save('meals', a)) alert('تعذّر الحفظ.'); log(); };
  $('w').querySelectorAll('[data-d]').forEach(b => b.onclick = () => { save('meals', load('meals', []).filter(x => x.id !== b.dataset.d)); log(); });
}
function rec() {
  const F = foods(), rows = st.rec.map(i => ({ ...i, f: F.find(x => x.id === i.id) })).filter(i => i.f);
  const T = k => rows.reduce((s, i) => s + i.f[k] * i.g / 100, 0), G = rows.reduce((s, i) => s + i.g, 0), n = Math.max(1, +st.srv || 1), ps = T('kcal') / n;
  const view = () => { const n = Math.max(1, +st.srv || 1), ps = T('kcal') / n; return `<div class="card"><h2>لكل حصة</h2><div class="v">${r(ps)} سعرة</div><p class="s">نطاق تقريبي ${r(ps * .8)}–${r(ps * 1.2)} · بروتين ${r(T('p') / n)} غ · كربوهيدرات ${r(T('c') / n)} غ · دهون ${r(T('f') / n)} غ · وزن الحصة ≈ ${r(G / n)} غ (وزن المكونات الخام)<br>الإجمالي ${r(T('kcal'))} سعرة. التقدير يعتمد على قيم المكونات التقريبية.</p>
      <button class="btn" id="rsv" ${rows.length && st.rname.trim() ? '' : 'disabled'}>حفظ كطعام مخصص</button></div>`; };
  $('w').innerHTML = `<div class="grid"><div class="card grid"><h2>حاسبة وصفة</h2><label>اسم الوصفة<input id="rn" value="${esc(st.rname)}"></label><label>عدد الحصص الناتجة<input id="rs" type="number" min="1" value="${st.srv}"></label>
    ${rows.map((i, j) => `<div class="li"><span>${i.f.ar} — ${i.g} غ</span><button class="btn ghost sm" data-x="${j}">حذف</button></div>`).join('')}
    <select id="ri">${F.map(f => `<option value="${f.id}" ${f.id === st.ri ? 'selected' : ''}>${f.ar}</option>`).join('')}</select><label>الكمية (غرام، وللزيت أيضًا)<input id="rg" type="number" inputmode="decimal" min="1" value="${st.rg}"></label><button class="btn ghost" id="ra" type="button">إضافة مكوّن</button></div>
    <div id="res">${view()}</div></div>`;
  $('rn').oninput = e => { st.rname = e.target.value; $('rsv').disabled = !(rows.length && st.rname.trim()); }; $('ri').onchange = e => { st.ri = e.target.value; }; $('rg').oninput = e => { st.rg = e.target.value; };
  $('rs').oninput = e => { st.srv = e.target.value; $('res').innerHTML = view(); bindSave(); };
  $('ra').onclick = () => { const g = +$('rg').value; if (g > 0) { st.rec.push({ id: $('ri').value, g }); rec(); } };
  $('w').querySelectorAll('[data-x]').forEach(b => b.onclick = () => { st.rec.splice(+b.dataset.x, 1); rec(); });
  const bindSave = () => { $('rsv').onclick = () =>
if (!G) {
  alert('أضف مكوّناً واحداً على الأقل.');
  return;
}
 { const a = load('customFoods', []); a.push({ id: 'c' + Date.now().toString(36), ar: st.rname.trim(), kcal: T('kcal') / G * 100, p: T('p') / G * 100, c: T('c') / G * 100, f: T('f') / G * 100, sn: 'حصة', sg: G / n, ref: 0 });
    save('customFoods', a); st.rec = []; st.rname = ''; st.tab = 'log'; draw(); }; };
  bindSave();
}
