# FitTrack Personal

تطبيق عربي RTL لمتابعة:

- تمارين الحديد
- التغذية والسعرات
- المشي والجري (Cardio)
- الوزن والقياسات
- التقارير والتقدم
- النسخ الاحتياطي والاستعادة

يعمل كتطبيق PWA ويمكن تثبيته على iPhone و Android.

---

## المميزات

✅ تتبع الوزن

✅ خطط تمارين أسبوعية

✅ سجل المجموعات والأوزان

✅ اقتراح وزن الجلسة القادمة

✅ تتبع التغذية والماكروز

✅ حاسبة وصفات

✅ تتبع الكارديو

✅ تقارير التقدم

✅ تصدير CSV

✅ نسخ احتياطي واستعادة

✅ دعم الوضع الليلي

✅ دعم العمل دون اتصال (Offline)

✅ دعم Supabase لتسجيل الدخول

---

## هيكل المشروع

```text
index.html

css/
└── styles.css

js/
├── app.js
├── store.js
├── calc.js
├── goal.js
├── ui.js
├── theme.js
├── supabase.js
├── config.js
│
├── data/
│   ├── exercises.js
│   └── foods.js
│
└── views/
    ├── auth.js
    ├── today.js
    ├── workouts.js
    ├── nutrition.js
    ├── cardio.js
    ├── body.js
    ├── reports.js
    └── settings.js

sw.js
manifest.webmanifest
