import { isConfigured, db } from '../supabase.js';
import { load, save, exportAll, parseBackup, applyBackup, saveFile, csvReport, today } from '../store.js';
import { ACTIVITY, bmi, bmr, tdee, targets } from '../calc.js';
import { esc } from '../ui.js';
const $ = id => document.getElementById(id);
const DEF = { age: 26, height: 173, startWeight: 90, sex: '', activity: '', goal: '', goalWeight: '', days: '', allergies: '' };
export default { title: 'الإعدادات', render: () => '<div id="v"></div>', mount: draw };

function draw() {
  const p = { ...DEF, ...load('profile', {}) }, cur = (load('weights', []).sort((a, b) => a.date < b.date ? 1 : -1)[0]?.kg) ?? p.startWeight;
  const opt = (o, v) => Object.entries(o).map(([k, n]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${n}</option>`).join('');
  const ready = p.sex && p.activity, inp = { sex: p.sex, kg: cur, cm: +p.height, age: +p.age, activity: p.activity };
  const t = ready ? targets(inp) : null, r = Math.round, w = x => (x > 0 ? '+' : '') + x.toFixed(2);
  $('v').innerHTML = `<div class="grid"><form class="card grid" id="f"><h2>الملف الشخصي</h2>
    <label>العمر<input name="age" type="number" min="14" max="90" value="${p.age}" required></label>
    <label>الطول (سم)<input name="height" type="number" min="120" max="230" value="${p.height}" required></label>
    <label>الوزن الابتدائي (كغ)<input name="startWeight" type="number" step="0.1" value="${p.startWeight}" required></label>
    <label>الجنس<select name="sex" required><option value="">اختر…</option><option value="male" ${p.sex === 'male' ? 'selected' : ''}>ذكر</option><option value="female" ${p.sex === 'female' ? 'selected' : ''}>أنثى</option></select></label>
    <label>مستوى النشاط<select name="activity" required><option value="">اختر…</option>${Object.entries(ACTIVITY).map(([k, [, n]]) => `<option value="${k}" ${p.activity === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>الهدف<select name="goal"><option value="">اختر…</option>${opt({ cut: 'خسارة الدهون', maintain: 'المحافظة', gain: 'زيادة الكتلة' }, p.goal)}</select></label>
    <label>الوزن المستهدف (اختياري)<input name="goalWeight" type="number" step="0.1" value="${p.goalWeight}"></label>
    <label>أيام التدريب أسبوعيًا<input name="days" type="number" min="0" max="7" value="${p.days}"></label>
    <label>حساسية/تفضيلات طعام<input name="allergies" value="${esc(p.allergies || '')}"
></label>
    <button class="btn" type="submit">حفظ</button></form>
    <div class="card"><h2>الحسابات التقديرية</h2>${t ? `<p class="s">BMI: <b>${bmi(cur, +p.height).toFixed(1)}</b> (مؤشر إرشادي وليس تشخيصًا)<br>BMR: <b>${r(bmr(inp))}</b> سعرة (طاقة الراحة)<br>TDEE: <b>${r(t.maintain)}</b> سعرة (مع النشاط)<br>
      محافظة: ${r(t.maintain)} · خسارة دهون: ${r(t.cut)} (${w(t.cutWeekKg)} كغ/أسبوع تقريبًا) · زيادة كتلة: ${r(t.gain)} (${w(t.gainWeekKg)} كغ/أسبوع تقريبًا)<br>
      أرقام تقديرية وتختلف من شخص لآخر؛ عدّل الهدف تدريجيًا حسب اتجاه وزنك على عدة أسابيع. مستوى النشاط يشمل الكارديو المعتاد، فلا تضف سعراته مرة ثانية.<br><b>الافتراضات:</b> معادلة Mifflin–St Jeor، معامل النشاط ${ACTIVITY[p.activity][0]}، الوزن المستخدم ${cur} كغ، عجز 15% (لا ينزل عن BMR) وفائض 10%، بروتين 1.8 غ/كغ ودهون 25% من السعرات والباقي كربوهيدرات.</p>` : '<p class="s">اختر الجنس ومستوى النشاط واحفظ لعرض الحساب الشخصي.</p>'}</div>
    <div class="card"><h2>البيانات والنسخ الاحتياطي</h2><p class="s">${isConfigured() ? 'Supabase مفعّل لكن المزامنة لم تُنفَّذ بعد.' : 'بياناتك محفوظة على هذا الجهاز فقط، وقد تُمسح إذا نظّفت بيانات Safari.'}</p>
      <p class="s"><b>النسخة الاحتياطية الكاملة</b> ملف واحد فيه ملفك الشخصي والوزن والتمارين والبرنامج والوجبات والكارديو. احفظه في «الملفات» أو أرسله لنفسك؛ لا تحتاج لفتحه أو قراءته.</p>
      <button class="btn" id="x">تصدير نسخة احتياطية كاملة</button><p></p>
      <p class="s"><b>الاستيراد</b> يستبدل البيانات الموجودة في الملف، وتُحفظ لقطة من بياناتك الحالية تلقائيًا قبل ذلك.</p>
      <button class="btn ghost" id="imp">استيراد نسخة احتياطية</button><input type="file" id="impf" accept="application/json,.json" hidden><p></p>
      <p class="s"><b>تقرير CSV</b> لقراءة بياناتك في Excel أو Numbers. ليس نسخة احتياطية ولا يمكن استيراده.</p>
      <button class="btn ghost" id="csv">تصدير تقرير CSV</button><p class="s" id="bmsg" role="status"></p>
      ${isConfigured() ? '<button class="btn ghost" id="logout">تسجيل الخروج</button>' : ''}</div></div>`;
  $('f').onsubmit = ev => { ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target));
    save('profile', { ...d, age: +d.age, height: +d.height, startWeight: +d.startWeight, goalWeight: d.goalWeight ? +d.goalWeight : '' }); draw(); };
  const msg = (t, ok = true) => { $('bmsg').textContent = t; $('bmsg').style.color = ok ? 'inherit' : '#c43b3b'; };
  const out = async (name, text, type) => { try { const k = await saveFile(name, text, type); if (k !== 'cancel') msg(k === 'share' ? 'تم تجهيز الملف: اختر «حفظ في الملفات».' : 'تم تنزيل الملف: ' + name); } catch { msg('تعذّر إنشاء الملف.', false); } };
  $('x').onclick = () => out('FitTrack-backup-' + today() + '.json', exportAll(), 'application/json');
  $('csv').onclick = () => out('FitTrack-report-' + today() + '.csv', csvReport(), 'text/csv');
  $('imp').onclick = () => $('impf').click();
$('impf').onchange = async ev => {
  const file = ev.target.files?.[0];
  if (!file) {
    ev.target.value = '';
    return;
  }

  try {
    const o = parseBackup(await file.text()),
          ks = Object.keys(o).join('، ');
    if (confirm('سيستبدل الاستيراد هذه البيانات: ' + ks + '\nتُحفظ لقطة من بياناتك الحالية تلقائيًا قبل الاستبدال. متابعة؟')) { applyBackup(o); draw(); $('bmsg') && msg('تم الاستيراد بنجاح.'); } } catch (e) { msg('لم يُستورد شيء، وبياناتك لم تتغير: ' + e.message, false); } ev.target.value = ''; };
  $('logout')?.addEventListener('click', async () => {
  const c = await db();

  if (c) {
    await c.auth.signOut();
  }

  location.hash = '#/today';
  location.reload();
});