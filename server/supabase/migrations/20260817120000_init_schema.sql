-- Phase 2: initial schema for users and tasks.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  title text not null,
  description text,
  deadline timestamptz not null,
  priority text not null check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED', 'MISSED', 'DELETED')),
  missed_reason text,
  deletion_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  missed_at timestamptz,
  deleted_at timestamptz
);

create index if not exists tasks_user_id_idx on tasks (user_id);
create index if not exists tasks_user_id_status_idx on tasks (user_id, status);
create index if not exists tasks_user_id_deadline_idx on tasks (user_id, deadline);
