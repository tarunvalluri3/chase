-- Per-task reminder opt-in and recurring tasks.

alter table tasks
  add column if not exists reminder_enabled boolean not null default false;

alter table tasks
  add column if not exists repeat_rule text not null default 'NONE'
    check (repeat_rule in ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY'));

alter table tasks
  add column if not exists repeat_group_id uuid;

create index if not exists tasks_repeat_group_id_idx
  on tasks (repeat_group_id) where repeat_group_id is not null;
