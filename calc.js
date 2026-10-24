// حسابات بحتة (قابلة للاختبار).
// كل الأرقام تقديرية وليست تشخيصًا طبيًا.

export const ACTIVITY = {
  sedentary: [1.2, 'خامل (عمل مكتبي، بلا تمرين)'],
  light: [1.375, 'خفيف (1–3 أيام تمرين)'],
  moderate: [1.55, 'متوسط (3–5 أيام)'],
  high: [1.725, 'عالٍ (6–7 أيام)'],
  athlete: [1.9, 'شديد جدًا (عمل بدني + تمرين)']
};

export const bmi = (kg, cm) =>
  cm > 0
    ? kg / ((cm / 100) ** 2)
    : 0;

// Mifflin–St Jeor
export const bmr = ({ sex, kg, cm, age }) =>
  10 * kg +
  6.25 * cm -
  5 * age +
  (sex === 'male' ? 5 : -161);

export const tdee = p => {
  const act = ACTIVITY[p.activity];

  if (!act) {
    return 0;
  }

  return bmr(p) * act[0];
};

export function targets(p) {
  const t = tdee(p);
  const b = bmr(p);

  const cut = Math.max(t * 0.85, b);
  const gain = t * 1.1;

  // ≈7700 سعرة لكل كغ
  const wk = k =>
    ((k - t) * 7) / 7700;

  return {
    maintain: t,
    cut,
    gain,
    cutWeekKg: wk(cut),
    gainWeekKg: wk(gain)
  };
}

export function weeklyAvg(entries, asOf) {
  const end = new Date(asOf).getTime();
  const from = end - 6 * 864e5;

  const w = entries.filter(e => {
    const t = new Date(e.date).getTime();

    return (
      t >= from &&
      t <= end
    );
  });

  return w.length
    ? w.reduce(
        (s, e) => s + e.kg,
        0
      ) / w.length
    : null;
}

// اقتراح وزن الجلسة القادمة.
// last: [{w,reps,clean}]

export function suggest(
  last,
  hi,
  step
) {
  if (!last.length) {
    return {
      w: null,
      why: 'تمرين جديد: ابدأ بوزن خفيف تتحكم به كاملًا، ثم نعايره من أدائك.'
    };
  }

  const valid = last.filter(
    s => Number.isFinite(s.w)
  );

  if (!valid.length) {
    return {
      w: null,
      why: 'لا توجد بيانات صالحة لاقتراح الوزن التالي.'
    };
  }

  const w = Math.max(
    ...valid.map(s => s.w)
  );

  const ok =
    valid.length >= 2 &&
    valid.every(
      s =>
        s.reps >= hi &&
        s.clean
    );

  return ok
    ? {
        w: w + step,
        why: `أكملت كل المجموعات (${hi} تكرارًا فأكثر) بتقنية سليمة بلا ألم، فزيادة صغيرة +${step} كغ.`
      }
    : {
        w,
        why: 'لم تكتمل كل المجموعات بالتكرارات المستهدفة وبتقنية سليمة، فثبّت الوزن حتى تكتمل.'
      };
}

// بروتين 1.8 غ/كغ
// دهون 25% من السعرات
// الباقي كربوهيدرات

export function macros(kcal, kg) {
  kcal = Math.max(
    0,
    kcal || 0
  );

  kg = Math.max(
    0,
    kg || 0
  );

  const p = 1.8 * kg;
  const f = (0.25 * kcal) / 9;

  return {
    p,
    f,
    c: Math.max(
      0,
      (kcal - 4 * p - 9 * f) / 4
    )
  };
}
