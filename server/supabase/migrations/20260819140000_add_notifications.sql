-- Phase 17: notifications & email.

alter table users add column if not exists email text;

create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  task_id uuid not null references tasks (id) on delete cascade,
  type text not null check (type in (
    'TASK_CREATED', 'TASK_COMPLETED', 'TASK_INCOMPLETE',
    'TASK_DELETED', 'TASK_UPDATED', 'TASK_MISSED', 'DEADLINE_REMINDER'
  )),
  dedup_key text not null,
  status text not null check (status in ('PENDING', 'SENT', 'FAILED')),
  attempts int not null default 0,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, type, dedup_key)
);

create index if not exists notification_log_user_id_idx on notification_log (user_id);
create index if not exists notification_log_status_idx on notification_log (status);
