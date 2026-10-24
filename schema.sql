-- FitTrack Personal — المخطط v0.1 (لا توجد بيانات تجريبية)
-- نفّذه من Supabase → SQL Editor. كل الجداول محمية بـ RLS: كل مستخدم يرى بياناته فقط.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  weight_unit text not null default 'kg' check (weight_unit in ('kg','lb')),
  kcal_goal int, protein_goal_g int, carbs_goal_g int, fat_goal_g int, weight_goal_kg numeric(5,2),
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null, muscle_group text, equipment text,
  unique (user_id, name)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text, started_at timestamptz not null default now(), ended_at timestamptz, notes text
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_order int not null, reps int check (reps >= 0), weight_kg numeric(6,2) check (weight_kg >= 0),
  rpe numeric(3,1) check (rpe between 1 and 10), is_warmup boolean not null default false
);

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null, serving_g numeric(7,2) not null default 100,
  kcal numeric(7,2) not null, protein_g numeric(6,2) default 0, carbs_g numeric(6,2) default 0, fat_g numeric(6,2) default 0
);

-- سجل الوجبات يحفظ لقطة من القيم وقت التسجيل، فتعديل الطعام لاحقًا لا يغيّر التاريخ.
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  logged_at timestamptz not null default now(),
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_id uuid references public.foods(id) on delete set null,
  name text not null, quantity_g numeric(7,2),
  kcal numeric(7,2) not null, protein_g numeric(6,2) default 0, carbs_g numeric(6,2) default 0, fat_g numeric(6,2) default 0
);

create table public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('walk','run')),
  started_at timestamptz not null default now(),
  duration_s int not null check (duration_s > 0), distance_m int check (distance_m >= 0),
  kcal int, notes text
);

create table public.body_weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  logged_on date not null default current_date, weight_kg numeric(5,2) not null check (weight_kg > 0),
  unique (user_id, logged_on)
);

create index on public.workouts (user_id, started_at desc);
create index on public.workout_sets (workout_id);
create index on public.meal_logs (user_id, logged_at desc);
create index on public.cardio_sessions (user_id, started_at desc);

do $$ declare t text; begin
  foreach t in array array['exercises','workouts','workout_sets','foods','meal_logs','cardio_sessions','body_weight_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id) values (new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
