import { load } from './store.js';
import { targets, macros } from './calc.js';

// هدف يوم معيّن.
// يعيد null إذا لم تكتمل بيانات المستخدم أو تعذّر حساب الهدف.

export function dayGoal(date) {
  const p = load('profile', {});

  if (!(p.sex && p.activity && p.goal)) {
    return null;
  }

  const w =
    load('weights', [])
      .sort((a, b) =>
        a.date < b.date ? 1 : -1
      )[0]?.kg ??
    p.startWeight ??
    90;

  const goals = targets({
    sex: p.sex,
    kg: w,
    cm: +p.height,
    age: +p.age,
    activity: p.activity
  });

  const base = goals?.[p.goal];

  if (!Number.isFinite(base)) {
    return null;
  }

  const add = load('prefs', {}).addCardio
    ? load('cardio', [])
        .filter(c => c.date === date)
        .reduce(
          (s, c) => s + c.kcal,
          0
        )
    : 0;

  return {
    kcal: base + add,
    add,
    ...macros(base + add, w)
  };
}
