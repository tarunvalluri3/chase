-- Phase 19: time tracking (work sessions).

create table if not exists work_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('PAUSED', 'STOPPED', 'AUTO_STOPPED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_sessions_ended_reason_consistent
    check ((ended_at is null and end_reason is null) or (ended_at is not null and end_reason is not null))
);

create index if not exists work_sessions_task_id_idx on work_sessions (task_id);
create index if not exists work_sessions_user_id_idx on work_sessions (user_id);
create unique index if not exists work_sessions_one_open_per_task
  on work_sessions (task_id) where ended_at is null;
