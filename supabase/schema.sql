create extension if not exists pgcrypto;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  class_name text not null,
  student_name text not null,
  source_type text not null check (source_type in ('text', 'pdf', 'image')),
  grade_scale integer not null default 10 check (grade_scale in (10, 100)),
  file_path text,
  input_text text,
  extracted_text text,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'review_pending', 'approved', 'rejected', 'failed')),
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.corrections (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assignments(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  suggested_grade numeric(5,2),
  final_grade numeric(5,2),
  feedback text,
  final_feedback text,
  weaknesses text[] not null default '{}',
  summary text,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'failed')),
  raw_response jsonb,
  review_notes text,
  approved_at timestamptz,
  ai_provider text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  grade_level text not null,
  teaching_goal text not null,
  duration text not null,
  content jsonb not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at
before update on public.assignments
for each row
execute function public.set_updated_at();

drop trigger if exists corrections_set_updated_at on public.corrections;
create trigger corrections_set_updated_at
before update on public.corrections
for each row
execute function public.set_updated_at();

alter table public.assignments enable row level security;
alter table public.corrections enable row level security;
alter table public.lesson_plans enable row level security;

drop policy if exists "teachers_manage_own_assignments" on public.assignments;
create policy "teachers_manage_own_assignments"
on public.assignments
for all
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

drop policy if exists "teachers_manage_own_corrections" on public.corrections;
create policy "teachers_manage_own_corrections"
on public.corrections
for all
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

drop policy if exists "teachers_manage_own_lesson_plans" on public.lesson_plans;
create policy "teachers_manage_own_lesson_plans"
on public.lesson_plans
for all
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

-- colunas de soft-delete (seguras para rodar mesmo se já existirem)
alter table public.corrections add column if not exists deleted_at timestamptz;
alter table public.lesson_plans add column if not exists deleted_at timestamptz;

insert into storage.buckets (id, name, public)
values ('assignments', 'assignments', false)
on conflict (id) do nothing;

drop policy if exists "teachers_access_own_assignment_files" on storage.objects;
create policy "teachers_access_own_assignment_files"
on storage.objects
for all
using (bucket_id = 'assignments' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'assignments' and auth.uid()::text = (storage.foldername(name))[1]);
-- calendar_events

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  type text not null default 'aula'
    check (type in ('aula', 'prova', 'ferias', 'recuperacao', 'reuniao', 'outro')),
  turma text,
  description text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

drop policy if exists "teachers_manage_own_calendar_events" on public.calendar_events;
create policy "teachers_manage_own_calendar_events"
  on public.calendar_events
  for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
