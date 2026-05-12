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
