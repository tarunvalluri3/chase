-- Phase 6 prep (applied ahead of Phase 6, alongside Phase 2/3 corrections):
-- introduce the INCOMPLETE status and the columns needed to resolve a MISSED
-- task as either INCOMPLETE (with a user-supplied reason) or COMPLETED.

alter table tasks
  drop constraint if exists tasks_status_check;

alter table tasks
  add constraint tasks_status_check
  check (status in ('ACTIVE', 'COMPLETED', 'MISSED', 'INCOMPLETE', 'DELETED'));

alter table tasks
  add column if not exists incomplete_reason text,
  add column if not exists incomplete_at timestamptz;
