create table if not exists posts (
  id uuid primary key,
  user_id uuid not null,
  account_id uuid,
  content text not null,
  status text not null,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_user_id_idx on posts(user_id);
create index if not exists posts_status_idx on posts(status);
