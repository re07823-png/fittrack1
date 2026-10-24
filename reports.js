import { load, today } from '../store.js';
import { dayGoal } from '../goal.js';

const $ = id => document.getElementById(id);
const r = Math.round;

const iso = d =>
  new Date(
    d - d.getTimezoneOffset() * 6e4
  )
    .toISOString()
    .slice(0, 10);

let days = 30;

export default {
  title: 'التقارير',
  render: () => '<div id="v"></div>',
  mount: draw
};

function draw() {
  const root = $('v');

  if (!root) return;

  const e = new Date();
  const f = iso(
    new Date(
      e - (days - 1) * 864e5
    )
  );

  const t = today();

  const inR = x =>
    x.date >= f &&
    x.date <= t;

  const W = load('weights', [])
    .filter(inR)
    .sort((a, b) =>
      a.date < b.date ? -1 : 1
    );

  const M = load('meals', [])
    .filter(inR);

  const C = load('cardio', [])
    .filter(inR);

  const S = load('sets', [])
    .filter(inR);

  const plan = load('plan', {});

  const byDay = {};

  M.forEach(m => {
    const o =
      byDay[m.date] ||= {
        k: 0,
        p: 0
      };

    o.k += m.kcal;
    o.p += m.p;
  });

  const D = Object.entries(byDay);

  const n = D.length;

  const avgK = n
    ? D.reduce(
        (s, [, o]) =>
          s + o.k,
        0
      ) / n
    : null;

  const avgP = n
    ? D.reduce(
        (s, [, o]) =>
          s + o.p,
        0
      ) / n
    : null;

  let planned = 0;
  let did = 0;

  const setDays = new Set(
    S.map(s => s.date)
  );

  for (let i = 0; i < days; i++) {
    const dt = new Date(
      e - i * 864e5
    );

    const k = iso(dt);

    if (
      (plan[dt.getDay()] || [])
        .length
    ) {
      planned++;

      if (setDays.has(k)) {
        did++;
      }
    }
  }

  const G = dayGoal(t);

  const cm = C.reduce(
    (s, c) => s + c.min,
    0
  );

  const ck = C.reduce(
    (s, c) => s + c.kcal,
    0
  );

  const weightChange =
    W.length > 1
      ? (
          W[W.length - 1].kg -
          W[0].kg
        ).toFixed(1)
      : null;

  const line =
    W.length > 1
      ? (() => {
          const mn = Math.min(
            ...W.map(
              x => x.kg
            )
          );

          const mx = Math.max(
            ...W.map(
              x => x.kg
            )
          );

          const R =
            mx - mn || 1;

          return `
            <svg
              viewBox="0 0 300 100"
              class="spark"
              role="img"
              aria-label="منحنى الوزن">

              <polyline
                fill="none"
                stroke="var(--accent)"
                stroke-width="2"
                points="${W.map(
                  (x, i) =>
                    `${
                      i /
                        (W.length - 1) *
                        290 +
                      5
                    },${
                      90 -
                      ((x.kg - mn) /
                        R) *
                        80
                    }`
                ).join(' ')}"
              />

            </svg>

            <p class="s">
              من ${mn} إلى ${mx} كغ
              <br>
              التغير خلال الفترة:
              ${
                weightChange > 0
                  ? '+'
                  : ''
              }${weightChange} كغ
            </p>
          `;
        })()
      : `
        <p class="s">
          تحتاج قياسين للوزن
          على الأقل في هذه الفترة.
        </p>
      `;

  const mxK = Math.max(
    1,
    ...D.map(
      ([, o]) => o.k
    ),
    G?.kcal || 0
  );

  const bars = n
    ? `
      <svg
        viewBox="0 0 300 100"
        class="spark"
        role="img"
        aria-label="السعرات اليومية">

        ${
          G
            ? `
              <line
                x1="0"
                x2="300"
                y1="${
                  95 -
                  (G.kcal /
                    mxK) *
                    90
                }"
                y2="${
                  95 -
                  (G.kcal /
                    mxK) *
                    90
                }"
                stroke="var(--muted)"
                stroke-dasharray="4"
              />
            `
            : ''
        }

        ${D.sort()
          .map(
            ([, o], i) => {
              const w =
                290 /
                Math.max(
                  D.length,
                  1
                );

              return `
                <rect
                  x="${
                    5 + i * w
                  }"
                  width="${Math.max(
                    2,
                    w - 2
                  )}"
                  y="${
                    95 -
                    (o.k /
                      mxK) *
                      90
                  }"
                  height="${
                    (o.k /
                      mxK) *
                    90
                  }"
                  fill="var(--accent)"
                  rx="2"
                />
              `;
            }
          )
          .join('')}
      </svg>
    `
    : `
      <p class="s">
        لا وجبات مسجلة
        في هذه الفترة.
      </p>
    `;

  root.innerHTML = `
    <div class="grid">

      <div class="tabs">
        ${[7, 30, 90]
          .map(
            d => `
              <button
                class="${
                  days === d
                    ? 'on'
                    : ''
                }"
                data-d="${d}">
                ${d} يومًا
              </button>
            `
          )
          .join('')}
      </div>

      <div class="card">
        <h2>الوزن</h2>
        ${line}
      </div>

      <div class="card">
        <h2>
          السعرات
          (الأيام المسجلة: ${n})
        </h2>

        ${bars}

        <p class="s">
          ${
            n
              ? `
                  المتوسط ${r(avgK)}
                  سعرة ·
                  بروتين ${r(avgP)} غ

                  ${
                    G
                      ? ` · الهدف ${r(
                          G.kcal
                        )} (${
                          avgK >
                          G.kcal
                            ? 'أعلى'
                            : 'أقل'
                        } بـ ${r(
                          Math.abs(
                            avgK -
                              G.kcal
                          )
                        )})`
                      : ' · أدخل هدفك في الإعدادات للمقارنة'
                  }
                `
              : 'سجّل وجباتك لتظهر المتوسطات.'
          }
        </p>
      </div>

      <div class="card">
        <h2>
          التدريب والكارديو
        </h2>

        <p class="s">
          جلسات تمرين:
          ${setDays.size}
          · الالتزام بالبرنامج:

          ${
            planned
              ? r(
                  (did /
                    planned) *
                    100
                ) +
                '% (' +
                did +
                ' من ' +
                planned +
                ')'
              : 'لا جدول أسبوعي بعد'
          }

          <br>

          كارديو:
          ${C.length}
          جلسات ·
          ${r(cm)}
          دقيقة ·
          ≈${r(ck)}
          سعرة
        </p>
      </div>

      <p class="s">
        كل الأرقام من
        بياناتك المسجلة فقط،
        والأيام الناقصة
        لا تُعدّ أيام صفر.
      </p>

    </div>
  `;

  root
    .querySelectorAll('[data-d]')
    .forEach(b => {
      b.onclick = () => {
        days =
          +b.dataset.d;

        draw();
      };
    });
}
