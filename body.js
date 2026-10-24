import { load, save, today } from '../store.js';
import { weeklyAvg } from '../calc.js';
import { empty, esc } from '../ui.js';

const $ = id => document.getElementById(id);

export default {
  title: 'الوزن',
  render: () => '<div id="v"></div>',
  mount: draw
};

function draw() {
  const root = $('v');

  if (!root) return;

  const p = load('profile', {});
  const en = load('weights', [])
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const cur = en[0];
  const avg = en.length
    ? weeklyAvg(en, today())
    : null;

  const start = p.startWeight ?? 90;

  const f = n =>
    n == null
      ? '—'
      : (+n).toFixed(1);

  const spark =
    en.length > 1
      ? (() => {
          const d = [...en]
            .reverse()
            .slice(-30);

          const mn = Math.min(
            ...d.map(x => x.kg)
          );

          const mx = Math.max(
            ...d.map(x => x.kg)
          );

          const r = mx - mn || 1;

          return `
            <svg
              viewBox="0 0 300 80"
              class="spark"
              role="img"
              aria-label="منحنى الوزن">
              <polyline
                fill="none"
                stroke="var(--accent)"
                stroke-width="2"
                points="${d
                  .map(
                    (x, i) =>
                      `${(i / (d.length - 1)) * 296 + 2},${
                        76 -
                        ((x.kg - mn) / r) * 70
                      }`
                  )
                  .join(' ')}"
              />
            </svg>
          `;
        })()
      : '';

  root.innerHTML = `
    <div class="grid">

      <form class="card grid" id="f">
        <h2>سجّل وزنك</h2>

        <label>
          الوزن (كغ)
          <input
            name="kg"
            type="number"
            inputmode="decimal"
            step="0.1"
            min="20"
            max="400"
            required>
        </label>

        <label>
          التاريخ
          <input
            name="date"
            type="date"
            value="${today()}"
            required>
        </label>

        <label>
          محيط الخصر (سم، اختياري)
          <input
            name="waist"
            type="number"
            inputmode="decimal"
            step="0.1"
            min="30"
            max="250">
        </label>

        <label>
          ملاحظة (اختياري)
          <input name="note">
        </label>

        <button class="btn" type="submit">
          حفظ
        </button>
      </form>

      <div class="card">
        <h2>الحالي</h2>

        <div class="v">
          ${f(cur?.kg)} كغ
        </div>

        <p class="s">
          التغير منذ البداية (${f(start)}):
          ${cur ? f(cur.kg - start) : '—'} كغ

          <br>

          متوسط آخر 7 أيام:
          ${f(avg)} كغ

          ${
            p.goalWeight
              ? `<br>الهدف: ${p.goalWeight} كغ`
              : ''
          }
        </p>

        ${spark}

        <p class="s">
          الوزن يتذبذب يوميًا بسبب الماء والطعام؛
          انظر إلى اتجاه عدة أسابيع،
          لا إلى قياس واحد.
        </p>
      </div>

      ${
        en.length
          ? `
          <div class="card">
            <h2>السجل</h2>

            ${en
              .map(
                e => `
                <div class="li">
                  <span>
                    ${e.date}
                    —
                    <b>${e.kg}</b> كغ

                    ${
                      e.waist
                        ? ` · خصر ${e.waist} سم`
                        : ''
                    }

                    ${
                      e.note
                        ? ` · ${esc(e.note)}`
                        : ''
                    }
                  </span>

                  <button
                    class="btn ghost sm"
                    data-d="${e.date}">
                    حذف
                  </button>
                </div>
              `
              )
              .join('')}
          </div>
        `
          : empty(
              'body',
              'لا توجد قياسات وزن',
              'سجّل أول قياس من النموذج أعلاه.'
            )
      }

    </div>
  `;

  $('f').onsubmit = ev => {
    ev.preventDefault();

    const d = Object.fromEntries(
      new FormData(ev.target)
    );

    const kg = +d.kg;

    if (kg < 30 || kg > 300) {
      return;
    }

    if (
      en[0] &&
      Math.abs(kg - en[0].kg) > 3 &&
      !confirm(
        'الفرق عن آخر وزن أكثر من 3 كغ. هل القيمة صحيحة؟'
      )
    ) {
      return;
    }

    const a = load('weights', [])
      .filter(e => e.date !== d.date);

    a.push({
      date: d.date,
      kg,
      note: d.note,
      waist: d.waist
        ? +d.waist
        : undefined
    });

    if (!save('weights', a)) {
      alert('تعذّر الحفظ.');
      return;
    }

    draw();
  };

  root
    .querySelectorAll('[data-d]')
    .forEach(b => {
      b.onclick = () => {
        save(
          'weights',
          load('weights', [])
            .filter(
              e =>
                e.date !==
                b.dataset.d
            )
        );

        draw();
      };
    });
}
