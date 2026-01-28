create table if not exists schedules (
  id uuid primary key,
  user_id uuid not null,
  post_id uuid not null,
  run_at timestamptz not null,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create index if not exists schedules_user_id_idx on schedules(user_id);
create index if not exists schedules_run_at_idx on schedules(run_at);
