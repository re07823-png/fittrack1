import { db } from '../supabase.js';

export default {
  title: 'تسجيل الدخول',

  render: () => `
    <form class="auth" id="auth-form">

      <label>
        البريد الإلكتروني
        <input
          type="email"
          name="email"
          autocomplete="email"
          required
          dir="ltr">
      </label>

      <label>
        كلمة المرور
        <input
          type="password"
          name="password"
          autocomplete="current-password"
          minlength="8"
          required
          dir="ltr">
      </label>

      <label class="chk">
        <input type="checkbox" id="show-pass">
        إظهار كلمة المرور
      </label>

      <div
        class="err"
        id="auth-err"
        role="alert">
      </div>

      <button
        class="btn"
        type="submit">
        دخول
      </button>

      <button
        class="btn ghost"
        type="button"
        id="signup">
        إنشاء حساب
      </button>

    </form>
  `,

  mount(onDone) {
    const form = document.getElementById('auth-form');
    const err = document.getElementById('auth-err');

    const savedEmail =
      localStorage.getItem('lastEmail');

    if (savedEmail) {
      form.email.value = savedEmail;
    }

    const setLoading = loading => {
      form
        .querySelectorAll('button')
        .forEach(btn => {
          btn.disabled = loading;
        });
    };

    const getErrorMessage = message => {
      if (
        message?.includes(
          'Invalid login credentials'
        )
      ) {
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }

      if (
        message?.includes(
          'Email not confirmed'
        )
      ) {
        return 'يرجى تأكيد البريد الإلكتروني أولاً';
      }

      return message ||
        'حدث خطأ غير متوقع';
    };

    const run = async mode => {
      err.textContent = '';

      const email =
        form.email.value
          .trim()
          .toLowerCase();

      const password =
        form.password.value;

      localStorage.setItem(
        'lastEmail',
        email
      );

      setLoading(true);

      try {
        const c = await db();

        if (!c) {
          err.textContent =
            'لم يتم إعداد قاعدة البيانات بعد.';
          return;
        }

        const { error } =
          mode === 'up'
            ? await c.auth.signUp({
                email,
                password
              })
            : await c.auth.signInWithPassword({
                email,
                password
              });

        if (error) {
          err.textContent =
            getErrorMessage(
              error.message
            );
          return;
        }

        if (mode === 'up') {
          err.textContent =
            '✅ تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.';
          return;
        }

        onDone();
      } finally {
        setLoading(false);
      }
    };

    form.addEventListener(
      'submit',
      e => {
        e.preventDefault();
        run('in');
      }
    );

    document
      .getElementById('signup')
      .addEventListener(
        'click',
        () =>
          form.reportValidity() &&
          run('up')
      );

    document
      .getElementById('show-pass')
      .addEventListener(
        'change',
        e => {
          form.password.type =
            e.target.checked
              ? 'text'
              : 'password';
        }
      );
  }
};
