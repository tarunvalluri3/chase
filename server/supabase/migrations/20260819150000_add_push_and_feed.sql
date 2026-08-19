-- Phase 18: push notifications & in-app feed.

alter table notification_log add column if not exists channel text not null default 'EMAIL' check (channel in ('EMAIL', 'PUSH'));

alter table notification_log drop constraint if exists notification_log_task_id_type_dedup_key_key;
alter table notification_log add constraint notification_log_task_id_type_dedup_key_channel_key
  unique (task_id, type, dedup_key, channel);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  task_id uuid not null references tasks (id) on delete cascade,
  type text not null check (type in (
    'TASK_CREATED', 'TASK_COMPLETED', 'TASK_INCOMPLETE',
    'TASK_DELETED', 'TASK_UPDATED', 'TASK_MISSED', 'DEADLINE_REMINDER'
  )),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx on notifications (user_id, created_at desc);
create index if not exists notifications_user_id_unread_idx on notifications (user_id) where read_at is null;
