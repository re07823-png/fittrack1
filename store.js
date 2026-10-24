// تخزين محلي مؤقت (localStorage). حدوده: خاص بهذا المتصفح/الجهاز، وقد يُمسح عند تنظيف بيانات Safari.
// سيُستبدل بمزامنة Supabase في مرحلة لاحقة؛ استخدم «تصدير البيانات» في الإعدادات كنسخة احتياطية.

const K = 'fittrack:v1:';

export const load = (k, d) => {
  try {
    const v = localStorage.getItem(K + k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};

export const save = (k, v) => {
  try {
    localStorage.setItem(K + k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};

export const exportAll = () => {
  const o = {};

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);

    if (
      k &&
      k.startsWith(K) &&
      !['_', 't'].includes(k[K.length])
    ) {
      try {
        o[k.slice(K.length)] = JSON.parse(
          localStorage.getItem(k)
        );
      } catch {
        // تجاهل البيانات المعطوبة بدل فشل التصدير بالكامل
      }
    }
  }

  return JSON.stringify(
    {
      app: 'FitTrack',
      version: 2,
      exportedAt: new Date().toISOString(),
      data: o
    },
    null,
    1
  );
};

export const today = () => {
  const d = new Date();

  return new Date(
    d - d.getTimezoneOffset() * 6e4
  )
    .toISOString()
    .slice(0, 10);
};

const SCHEMA = {
  favs: 'o',
  profile: 'o',
  weights: 'a',
  sets: 'a',
  rest: 'n',
  plan: 'o',
  meals: 'a',
  cardio: 'a',
  customFoods: 'a',
  prefs: 'o',
  meta: 'o'
};

export function parseBackup(txt) {
  let o;

  try {
    o = JSON.parse(txt);
  } catch {
    throw new Error('ليس ملف نسخة احتياطية صالحًا');
  }

  if (o && o.app === 'FitTrack') {
    if (!(o.version <= 2) || !o.data) {
      throw new Error(
        'إصدار النسخة غير متوافق (أحدث من التطبيق)'
      );
    }

    o = o.data;
  }

  if (
    !o ||
    typeof o !== 'object' ||
    Array.isArray(o) ||
    !Object.keys(o).length
  ) {
    throw new Error('بنية النسخة غير صحيحة');
  }

  for (const [k, v] of Object.entries(o)) {
    const t = SCHEMA[k];

    if (!t) {
      throw new Error('مفتاح غير معروف: ' + k);
    }

    const ok =
      t === 'a'
        ? Array.isArray(v) &&
          v.every(x => x && typeof x === 'object')
        : t === 'o'
        ? v &&
          typeof v === 'object' &&
          !Array.isArray(v)
        : typeof v === 'number' &&
          isFinite(v);

    if (!ok) {
      throw new Error(
        'بيانات غير صالحة في: ' + k
      );
    }
  }

  if (
    o.meta &&
    !(o.meta.app === 'FitTrack' &&
      o.meta.version <= 4)
  ) {
    throw new Error(
      'إصدار النسخة غير متوافق مع هذا التطبيق'
    );
  }

  return o;
}

// يحفظ لقطة من البيانات الحالية في المفتاح _prev قبل الاستبدال
// ثم يستبدل المفاتيح الموجودة في الملف فقط.

export function applyBackup(o) {
  save('_prev', exportAll());

  Object.entries(o).forEach(([k, v]) => {
    if (k !== 'meta') {
      save(k, v);
    }
  });

  return Object.keys(o)
    .filter(k => k !== 'meta')
    .length;
}

export async function saveFile(name, text, type) {
  const file = new File([text], name, { type });

  try {
    if (
      navigator.canShare?.({
        files: [file]
      })
    ) {
      await navigator.share({
        files: [file],
        title: name
      });

      return 'share';
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      return 'cancel';
    }
  }

  const a = document.createElement('a');

  a.href = URL.createObjectURL(file);
  a.download = name;

  document.body.append(a);
  a.click();
  a.remove();

  setTimeout(
    () => URL.revokeObjectURL(a.href),
    4000
  );

  return 'download';
}

export function csvReport() {
  const q = v =>
    '"' +
    String(v ?? '').replace(/"/g, '""') +
    '"';

  const row = a => a.map(q).join(',');

  const L = [];
  const R = Math.round;

  const sec = (t, h, rows) =>
    L.push(
      row([t]),
      row(h),
      ...rows.map(row),
      ''
    );

  sec(
    'الوزن',
    ['التاريخ', 'الوزن كغ', 'الخصر سم', 'ملاحظة'],
    load('weights', []).map(e => [
      e.date,
      e.kg,
      e.waist,
      e.note
    ])
  );

  sec(
    'الوجبات',
    [
      'التاريخ',
      'الوجبة',
      'الطعام',
      'غرام',
      'سعرات',
      'بروتين',
      'كربوهيدرات',
      'دهون'
    ],
    load('meals', []).map(m => [
      m.date,
      m.type,
      m.name,
      m.g,
      R(m.kcal),
      R(m.p),
      R(m.c),
      R(m.f)
    ])
  );

  sec(
    'الكارديو',
    [
      'التاريخ',
      'الجهاز',
      'دقائق',
      'كم',
      'سعرات',
      'المصدر'
    ],
    load('cardio', []).map(c => [
      c.date,
      c.m,
      c.min,
      c.km,
      R(c.kcal),
      c.src === 'dev'
        ? 'الجهاز'
        : 'تقديري'
    ])
  );

  sec(
    'التمارين',
    [
      'التاريخ',
      'التمرين',
      'الوزن',
      'التكرارات',
      'تقنية سليمة'
    ],
    load('sets', []).map(s => [
      s.date,
      s.ex,
      s.w,
      s.reps,
      s.clean ? 'نعم' : 'لا'
    ])
  );

  return '\ufeff' + L.join('\r\n');
}
