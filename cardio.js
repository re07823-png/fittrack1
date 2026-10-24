import { load, save, today } from '../store.js';
import { esc } from '../ui.js';

const $ = id => document.getElementById(id);
const r = n => Math.round(n);

// MET تقريبية [خفيفة، متوسطة، عالية]
const M = {
  treadmill: ['جهاز المشي/الجري', [3.5, 6, 9.8]],
  bike: ['دراجة ثابتة عمودية', [4, 6.8, 9]],
  recumbent: ['دراجة بمسند', [3.5, 5.5, 7.5]],
  rowing: ['جهاز التجديف', [4.8, 7, 8.5]],
  elliptical: ['إليبتيكال', [4.6, 5.7, 7.5]],
  walk: ['مشي خارجي', [2.8, 3.8, 5]],
  run: ['جري خارجي', [8.3, 9.8, 11.5]]
};

const LV = ['خفيفة', 'متوسطة', 'عالية'];

export default {
  title: 'المشي والجري',
  render: () => '<div id="v"></div>',
  mount: draw
};

const weight = () =>
  load('weights', [])
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.kg ??
  load('profile', {}).startWeight ??
  90;

function draw() {
  const a = load('cardio', [])
    .sort((x, y) => (x.date < y.date ? 1 : -1));

  const pf = load('prefs', {});
  const kg = weight();

  const wk = a.filter(
    c =>
      (new Date(today()) - new Date(c.date)) / 864e5 < 7
  );

  $('v').innerHTML = `
    <div class="grid">

      <form class="card grid" id="f">
        <h2>تسجيل جلسة</h2>

        <select name="m">
          ${Object.entries(M)
            .map(([k, [n]]) =>
              `<option value="${k}">${n}</option>`
            )
            .join('')}
        </select>

        <label>
          المدة (دقيقة)
          <input
            name="min"
            type="number"
            inputmode="decimal"
            min="1"
            required>
        </label>

        <label>
          المسافة (كم، اختياري)
          <input
            name="km"
            type="number"
            inputmode="decimal"
            step="0.01"
            min="0">
        </label>

        <select name="lv">
          ${LV.map(
            (n, i) =>
              `<option value="${i}" ${
                i === 1 ? 'selected' : ''
              }>
                شدة ${n}
              </option>`
          ).join('')}
        </select>

        <label>
          سعرات من الجهاز/الساعة
          (اختياري، تُعتبر مقاسة)
          <input
            name="kcal"
            type="number"
            inputmode="numeric"
            min="0">
        </label>

        <label>
          التاريخ
          <input
            name="date"
            type="date"
            value="${today()}"
            required>
        </label>

        <button class="btn" type="submit">
          حفظ
        </button>

        <p class="s">
          السعرات تقديرية
          (MET × ${kg} كغ × المدة).
          قد تختلف عما يعرضه الجهاز.
        </p>
      </form>

      <div class="card">
        <h2>آخر 7 أيام</h2>

        <div class="v">
          ${r(
            wk.reduce(
              (s, c) => s + c.kcal,
              0
            )
          )} سعرة
        </div>

        <p class="s">
          ${r(
            wk.reduce(
              (s, c) => s + c.min,
              0
            )
          )} دقيقة
          ·
          ${wk.length} جلسات
        </p>

        <label class="chk">
          <input
            type="checkbox"
            id="ac"
            ${
              pf.addCardio
                ? 'checked'
                : ''
            }>
          أضف سعرات الكارديو
          إلى هدف السعرات اليومي
        </label>

        <p class="s">
          فعّلها فقط إذا كان
          مستوى النشاط لا يشمل الكارديو،
          وإلا ستُحسب مرتين.
        </p>
      </div>

      ${
        a.length
          ? `
          <div class="card">
            <h2>السجل</h2>

            ${a
              .map(
                c => `
                <div class="li">
                  <span>
                    ${c.date}
                    —
                    ${M[c.m]?.[0] || ''}
                    ·
                    ${c.min} د

                    ${
                      c.km
                        ? ` · ${c.km} كم (${(
                            c.km /
                            (c.min / 60)
                          ).toFixed(
                            1
                          )} كم/س)`
                        : ''
                    }

                    ·
                    ${LV[c.lv]}
                    ·
                    ${
                      c.meas
                        ? 'مقاسة ' +
                          r(c.kcal)
                        : '≈' +
                          r(c.kcal) +
                          ' (تقدير)'
                    }
                    سعرة
                  </span>

                  <button
                    class="btn ghost sm"
                    data-d="${c.id}">
                    حذف
                  </button>
                </div>
              `
              )
              .join('')}
          </div>
        `
          : '<p class="s">لا توجد جلسات بعد.</p>'
      }

    </div>
  `;

  $('f').onsubmit = e => {
    e.preventDefault();

    const d = Object.fromEntries(
      new FormData(e.target)
    );

    const min = +d.min;
    const km = d.km ? +d.km : 0;
    const lv = +d.lv;

    if (!M[d.m]) {
      alert('نوع الجهاز غير صالح.');
      return;
    }

    if (
      !Number.isFinite(min) ||
      min <= 0
    ) {
      alert('مدة التمرين غير صحيحة.');
      return;
    }

    if (
      !Number.isFinite(km) ||
      km < 0
    ) {
      alert('المسافة غير صحيحة.');
      return;
    }

    const arr = load('cardio', []);

    arr.push({
      id: Date.now().toString(36),
      date: d.date,
      m: d.m,
      min,
      km,
      lv,
      meas: !!d.kcal,
      kcal: d.kcal
        ? +d.kcal
        : M[d.m][1][lv] *
          kg *
          (min / 60)
    });

    if (!save('cardio', arr)) {
      alert('تعذّر الحفظ.');
      return;
    }

    draw();
  };

  $('ac').onchange = e => {
    save('prefs', {
      ...load('prefs', {}),
      addCardio:
        e.target.checked
    });
  };

  $('v')
    .querySelectorAll('[data-d]')
    .forEach(b => {
      b.onclick = () => {
        save(
          'cardio',
          load('cardio', [])
            .filter(
              c =>
                c.id !==
                b.dataset.d
            )
        );

        draw();
      };
    });
}
