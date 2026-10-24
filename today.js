import { EX, thumb } from '../data/exercises.js';
import { load, today } from '../store.js';
import { openEx, openPlan } from './workouts.js';
import { dayGoal } from '../goal.js';

const DAYS = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

const r = Math.round;
const sum = (a, k) => a.reduce((s, x) => s + (x[k] || 0), 0);

const bar = (v, t) =>
  `<div class="bar"><i style="width:${Math.min(
    100,
    t ? (v / t) * 100 : 0
  )}%"></i></div>`;

export default {
  title: 'اليوم',

  render: () => '<div id="tw" class="grid"></div>',

  mount() {
    const t = today();
    const d = new Date().getDay();

    const plan = load('plan', {});

    const ids = (plan[d] || [])
      .filter(id => EX.some(e => e.id === id));

    const sets = load('sets', []);

    const done = new Set(
      sets
        .filter(s => s.date === t)
        .map(s => s.ex)
    );

    const n = ids.filter(i => done.has(i)).length;

    const progress =
      ids.length
        ? Math.round((n / ids.length) * 100)
        : 0;

    const W = load('weights', [])
      .sort((a, b) =>
        a.date < b.date ? 1 : -1
      );

    const meals = load('meals', [])
      .filter(m => m.date === t);

    const cardio = load('cardio', []);

    const G = dayGoal(t);

    const kc = sum(meals, 'kcal');
    const p = sum(meals, 'p');
    const c = sum(meals, 'c');
    const f = sum(meals, 'f');

    const wk = [...Array(7)].map(
      (_, i) => new Date(Date.now() - i * 864e5)
    );

    const wkIso = wk.map(x =>
      new Date(
        x - x.getTimezoneOffset() * 6e4
      )
        .toISOString()
        .slice(0, 10)
    );

    const cw = cardio.filter(x =>
      wkIso.includes(x.date)
    );

    const sess = new Set(
      sets
        .filter(s => wkIso.includes(s.date))
        .map(s => s.date)
    ).size;

    const planned = Object.values(plan)
      .filter(
        l => Array.isArray(l) && l.length
      )
      .length;

    const avg = (a, b) => {
      const x = W.filter(
        e => e.date >= a && e.date < b
      );

      return x.length
        ? sum(x, 'kg') / x.length
        : null;
    };

    const iso = k =>
      new Date(Date.now() - k * 864e5)
        .toISOString()
        .slice(0, 10);

    const a1 = avg(iso(6), iso(-1));
    const a0 = avg(iso(13), iso(6));

    const nudges = [];

    if (
      !W.length ||
      W[0].date < iso(3)
    ) {
      nudges.push(
        'لم تسجّل وزنك منذ أكثر من 3 أيام.'
      );
    }

    if (!meals.length) {
      nudges.push(
        'لا وجبات مسجلة اليوم.'
      );
    }

    if (!cw.length) {
      nudges.push(
        'لم يتم تسجيل أي نشاط كارديو مؤخراً.'
      );
    }

    const root =
      document.getElementById('tw');

    if (!root) return;

    const sec = (title, body) =>
      `<section class="card grid">
        <h2>${title}</h2>
        ${body}
      </section>`;

    const remain =
      G ? G.kcal - kc : 0;

    root.innerHTML = [
      nudges.length
        ? `<div class="notice">
            ${nudges.join('<br>')}
            <small>
              (تذكير بسيط، يمكنك تجاهله)
            </small>
          </div>`
        : '',

      sec(
        `برنامج اليوم — ${DAYS[d]}`,
        ids.length
          ? `
          ${bar(n, ids.length)}
          <p class="s">
            ${n} من ${ids.length} مكتمل (${progress}%)
          </p>

          ${ids
            .map(id => {
              const e = EX.find(
                x => x.id === id
              );

              return `
                <button class="row" data-id="${id}">
                  ${thumb(e.m, e.eq)}
                  <span>
                    <b>
                      ${e.ar}${
                        done.has(id) ? ' ✓' : ''
                      }
                    </b>
                    <small>
                      ${e.sets} ×
                      ${e.reps[0]}–${e.reps[1]}
                    </small>
                  </span>
                </button>
              `;
            })
            .join('')}

          <button class="btn" id="go">
            ${
              n < ids.length
                ? 'ابدأ التمرين'
                : 'راجع التمارين'
            }
          </button>

          <a
            class="lnk"
            href="#/workouts"
            id="pl">
            البرنامج الأسبوعي ←
          </a>
        `
          : `
          <p class="s">
            <b>يوم راحة</b>
            — لا تمارين مجدولة.
            استرح أو سجّل مشيًا خفيفًا.
          </p>

          <a
            class="lnk"
            href="#/workouts"
            id="pl">
            تعديل البرنامج الأسبوعي ←
          </a>
        `
      ),

      sec(
        'السعرات والمغذيات',
        `
        <div class="v">
          ${r(kc)}
          ${
            G
              ? ` / ${r(G.kcal)}`
              : ''
          }
          سعرة
        </div>

        ${
          G
            ? `
              ${bar(kc, G.kcal)}

              <p class="s">
                ${
                  remain >= 0
                    ? `المتبقي ${r(remain)} سعرة`
                    : `تجاوزت الهدف بـ ${r(
                        Math.abs(remain)
                      )} سعرة`
                }
              </p>

              <p class="s">
                بروتين ${r(p)} / ${r(G.p)} غ
              </p>
              ${bar(p, G.p)}

              <p class="s">
                كربوهيدرات ${r(c)} / ${r(G.c)} غ
              </p>
              ${bar(c, G.c)}

              <p class="s">
                دهون ${r(f)} / ${r(G.f)} غ
              </p>
              ${bar(f, G.f)}
            `
            : `
              <p class="s">
                بروتين ${r(p)}
                · كربوهيدرات ${r(c)}
                · دهون ${r(f)} غ.

                أدخل الجنس والنشاط والهدف
                في الإعدادات لعرض الأهداف.
              </p>
            `
        }
      `
      ),

      sec(
        'الوزن',
        W.length
          ? `
            <div class="v">
              ${W[0].kg} كغ
            </div>

            <p class="s">
              ${
                a1 != null &&
                a0 != null
                  ? `متوسط هذا الأسبوع ${
                      (a1 - a0 > 0
                        ? '+'
                        : '') +
                      (a1 - a0).toFixed(1)
                    } كغ عن الأسبوع السابق`
                  : 'سجّل أسبوعين لتظهر نسبة التغير'
              }
            </p>
          `
          : `
            <p class="s">
              سجّل أول وزن من تبويب «الوزن».
            </p>
          `
      ),

      sec(
        'الكارديو والأسبوع',
        `
        <p class="s">
          آخر 7 أيام:
          ${r(sum(cw, 'min'))}
          دقيقة كارديو ·
          ${sess}
          ${
            planned
              ? ` من ${planned}`
              : ''
          }
          أيام تدريب
        </p>

        ${
          planned
            ? bar(sess, planned)
            : ''
        }
      `
      ),

      `<div class="quick">
        <a href="#/nutrition">+ وجبة</a>
        <a href="#/body">+ وزن</a>
        <a href="#/cardio">+ كارديو</a>
        <a href="#/reports">التقارير</a>
      </div>`
    ].join('');

    root
      .querySelectorAll('.row')
      .forEach(b => {
        b.onclick = () => {
          openEx(b.dataset.id);
          location.hash = '#/workouts';
        };
      });

    const go =
      document.getElementById('go');

    if (go) {
      go.onclick = () => {
        openEx(
          ids.find(i => !done.has(i)) ||
          ids[0]
        );

        location.hash = '#/workouts';
      };
    }

    const pl =
      document.getElementById('pl');

    if (pl) {
      pl.onclick = () => openPlan();
    }
  }
};
