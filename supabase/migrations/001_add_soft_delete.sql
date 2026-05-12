alter table public.corrections add column if not exists deleted_at timestamptz;
alter table public.lesson_plans add column if not exists deleted_at timestamptz;
