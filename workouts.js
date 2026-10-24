import { EX, MUSCLES, EQUIP, thumb } from '../data/exercises.js';
import { load, save, today } from '../store.js';
import { suggest } from '../calc.js';
import { esc } from '../ui.js';

const st = { q: '', m: '', eq: '', tab: 'lib', sel: null };
const DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
export function openEx(id) { st.sel = id; }
export function openPlan() { st.sel = null; st.tab = 'plan'; }
const $ = id => document.getElementById(id);
const sets = () => load('sets', []);
let tm = null;

export default { title: 'تمارين الحديد', render: () => '<div id="v"></div>', mount() { stopTimer(); draw(); } };

function draw() {
  if (st.sel) return detail();
  $('v').innerHTML = `<div class="tabs"><button class="${st.tab === 'lib' ? 'on' : ''}" data-t="lib">المكتبة</button><button class="${st.tab === 'plan' ? 'on' : ''}" data-t="plan">البرنامج الأسبوعي</button></div><div id="w"></div>`;
  $('v').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { st.tab = b.dataset.t; draw(); });
  st.tab === 'plan' ? plan() : list();
}

function list() {
  const o = (m, v) => Object.entries(m).map(([k, n]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${n}</option>`).join('');
  $('w').innerHTML = `<div class="grid"><input id="q" type="search" placeholder="ابحث بالعربية أو الإنجليزية" value="${esc(st.q)}">
    <select id="m"><option value="">كل العضلات</option>${o(MUSCLES, st.m)}</select><select id="eq"><option value="">كل المعدات</option>${o(EQUIP, st.eq)}</select>
    <p class="s" id="cnt"></p><div class="grid" id="items"></div></div>`;
  const fill = () => {
    const q = st.q.trim().toLowerCase();
    const r = EX.filter(e => (!st.m || e.m === st.m) && (!st.eq || e.eq === st.eq) && (!q || e.ar.includes(q) || e.en.toLowerCase().includes(q)));
    $('cnt').textContent = r.length + ' تمرين';
    $('items').innerHTML = r.length ? r.map(e => `<button class="row" data-id="${e.id}">${thumb(e.m, e.eq)}<span><b>${e.ar}</b><small>${e.en} · ${MUSCLES[e.m]} · ${EQUIP[e.eq]}</small></span></button>`).join('') : '<p class="s">لا نتائج مطابقة.</p>';
    $('items').querySelectorAll('.row').forEach(b => b.onclick = () => { st.sel = b.dataset.id; draw(); scrollTo(0, 0); });
  };
  $('q').oninput = e => { st.q = e.target.value; fill(); };
  $('m').onchange = e => { st.m = e.target.value; fill(); };
  $('eq').onchange = e => { st.eq = e.target.value; fill(); };
  fill();
}

function plan() {
  const p = load('plan', {}), opts = Object.entries(MUSCLES).map(([k, n]) => { const l = EX.filter(e => e.m === k); return l.length ? `<optgroup label="${n}">${l.map(e => `<option value="${e.id}">${e.ar}</option>`).join('')}</optgroup>` : ''; }).join('');
  $('w').innerHTML = `<div class="grid"><p class="s">أضف تمارين لكل يوم تدريب واتركه فارغًا ليوم الراحة. ستظهر تمارين اليوم في الصفحة الرئيسية.</p>${DAYS.map((d, i) => { const l = p[i] || [];
    return `<div class="card"><h2>${d}${l.length ? '' : ' — راحة'}</h2>${l.map((id, j) => `<div class="li"><span>${EX.find(e => e.id === id)?.ar || id}</span><span><button class="btn ghost sm" data-a="up" data-d="${i}" data-j="${j}" aria-label="أعلى">↑</button> <button class="btn ghost sm" data-a="dn" data-d="${i}" data-j="${j}" aria-label="أسفل">↓</button> <button class="btn ghost sm" data-a="rm" data-d="${i}" data-j="${j}">حذف</button></span></div>`).join('')}
      <select data-add="${i}"><option value="">+ إضافة تمرين…</option>${opts}</select>${l.length ? `<select data-copy="${i}"><option value="">نسخ هذا اليوم إلى…</option>${DAYS.map((n, k) => k === i ? '' : `<option value="${k}">${n}</option>`).join('')}</select>` : ''}</div>`; }).join('')}</div>`;
  const put = () => { if (!save('plan', p)) alert('تعذّر الحفظ.'); plan(); };
  $('w').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const l = p[b.dataset.d], j = +b.dataset.j, a = b.dataset.a;
    if (a === 'rm') l.splice(j, 1); else { const k = a === 'up' ? j - 1 : j + 1; if (k >= 0 && k < l.length) [l[j], l[k]] = [l[k], l[j]]; } put(); });
  $('w').querySelectorAll('[data-add]').forEach(s => s.onchange = () => { if (s.value) { (p[s.dataset.add] ||= []).push(s.value); put(); } });
  $('w').querySelectorAll('[data-copy]').forEach(s => s.onchange = () => { if (s.value) { const t = (p[s.value] ||= []); p[s.dataset.copy].forEach(id => { if (!t.includes(id)) t.push(id); }); put(); } });
}

function detail() {
  const e = EX.find(x => x.id === st.sel);

  if (!e) {
    st.sel = null;
    draw();
    return;
  }

  const all = sets()
    .filter(s => s.ex === e.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const t = today();
  const past = all.filter(s => s.date < t), lastDate = past.length ? past.map(s => s.date).sort().pop() : null;
  const last = past.filter(s => s.date === lastDate), now = all.filter(s => s.date === t);
  const sg = suggest(last, e.reps[1], e.step || 1), best = all.length ? all.reduce((a, b) => b.w > a.w ? b : a) : null;
  $('v').innerHTML = `<div class="grid"><button class="btn ghost" id="back">رجوع للمكتبة</button>
    <div class="card hd">${thumb(e.m, e.eq)}<div><h2>${e.ar}</h2><p class="s">${e.en}</p><p class="s">${MUSCLES[e.m]} · ${EQUIP[e.eq]} · ${e.lv}</p></div></div>
    <div class="card"><h2>المقترح: ${e.sets} × ${e.reps[0]}–${e.reps[1]}</h2><p class="s">العضلات المساعدة: ${e.sec}</p><h3>الخطوات</h3><ol>${e.steps.map(x => `<li>${x}</li>`).join('')}</ol><h3>أخطاء شائعة</h3><ul>${e.mist.map(x => `<li>${x}</li>`).join('')}</ul><p class="s"><b>السلامة:</b> ${e.safe}</p><p class="s">الصورة المصغرة رسم توضيحي وليست صورة حقيقية للتمرين.</p></div>
    <div class="card"><h2>الوزن المقترح للجلسة القادمة</h2><div class="v">${sg.w == null ? '—' : sg.w + ' كغ'}</div><p class="s">${sg.why}</p></div>
    <div class="card"><h2>آخر جلسة${lastDate ? ' (' + lastDate + ')' : ''}</h2><p class="s">${last.length ? last.map(s => `${s.w}×${s.reps}`).join(' ، ') : 'لا يوجد سجل سابق'}${best ? `<br>أفضل وزن مسجل: ${best.w} كغ × ${best.reps}` : ''}</p></div>
    <form class="card grid" id="f"><h2>جلسة اليوم</h2>
      <div class="sets">${now.map((s, i) => `<span class="chip">${i + 1}) ${s.w} كغ × ${s.reps} ${s.reps >= e.reps[1] ? '✓' : ''}<button type="button" data-d="${s.id}" aria-label="حذف المجموعة">×</button></span>`).join('') || '<span class="s">لا مجموعات بعد</span>'}</div>
      <label>الوزن (كغ)<input name="w" type="number" inputmode="decimal" step="0.5" min="0" required value="${now.length ? now.at(-1).w : sg.w ?? ''}"></label>
      <label>التكرارات<input name="reps" type="number" inputmode="numeric" min="1" required></label>
      <label class="chk"><input name="clean" type="checkbox" checked> تقنية سليمة وبلا ألم</label>
      <button class="btn" type="submit">حفظ المجموعة وبدء الراحة</button></form>
    <div class="card" id="tm"></div></div>`;
  $('back').onclick = () => { stopTimer(); st.sel = null; draw(); };
$('f').onsubmit = ev => {
  ev.preventDefault();

  const d = new FormData(ev.target);

  const weight = +d.get('w');
  const reps = +d.get('reps');

  if (
    !Number.isFinite(weight) ||
    weight < 0 ||
    !Number.isFinite(reps) ||
    reps < 1
  ) {
    alert('الرجاء إدخال وزن وتكرارات صحيحة.');
    return;
  }

  const a = sets();

  a.push({
    id: Date.now().toString(36),
    ex: e.id,
    date: t,
    w: weight,
    reps,
    clean: d.get('clean') === 'on'
  });

  if (!save('sets', a)) {
    alert('تعذّر الحفظ: التخزين ممتلئ أو معطّل.');
    return;
  }

  draw();
  startTimer(load('rest', 45));
};
    draw(); startTimer(load('rest', 45));
  };
  $('v').querySelectorAll('[data-d]').forEach(b => b.onclick = () => { save('sets', sets().filter(s => s.id !== b.dataset.d)); draw(); });
  timerUI();
}

// مؤقت الراحة: يعمل والتطبيق مفتوح. على iPhone قد يتوقف في الخلفية، والاهتزاز غير مدعوم في Safari.
const T = { left: 0, run: false };
function stopTimer() { clearInterval(tm); T.run = false; T.left = 0; }
function startTimer(sec) { stopTimer(); T.left = sec; T.run = true; tick(); }
function tick() {
  clearInterval(tm);
  if (T.run) tm = setInterval(() => { T.left--; if (T.left <= 0) { T.run = false; clearInterval(tm); T.left = 0; beep(); } timerUI(); }, 1000);
  timerUI();
}
function beep() {
  navigator.vibrate?.([300, 100, 300]);
  try { const c = new AudioContext(), o = c.createOscillator(); o.connect(c.destination); o.frequency.value = 880; o.start(); o.stop(c.currentTime + 0.5); } catch {}
}
function timerUI() {
  const b = $('tm'); if (!b) return; const rest = load('rest', 45);
  b.innerHTML = `<h2>مؤقت الراحة</h2><div class="v" role="timer">${String(Math.floor(T.left / 60)).padStart(2, '0')}:${String(T.left % 60).padStart(2, '0')}</div>
    <div class="btns"><button class="btn" id="t1">${T.run ? 'إيقاف مؤقت' : T.left ? 'استكمال' : 'ابدأ'}</button><button class="btn ghost" id="t2">إعادة ضبط</button><button class="btn ghost" id="t3">تجاوز</button></div>
    <label>مدة الراحة (ثانية)<input id="t4" type="number" inputmode="numeric" min="10" max="600" value="${rest}"></label>`;
  $('t1').onclick = () => { if (T.run) { T.run = false; tick(); } else if (T.left) { T.run = true; tick(); } else startTimer(load('rest', 45)); };
  $('t2').onclick = () => startTimer(load('rest', 45));
  $('t3').onclick = () => { stopTimer(); timerUI(); };
  $('t4').onchange = ev => { save('rest', Math.min(600, Math.max(10, +ev.target.value || 45))); };
}
