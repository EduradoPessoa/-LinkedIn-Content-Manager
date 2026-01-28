create table if not exists metrics (
  id uuid primary key,
  user_id uuid not null,
  post_id uuid not null,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  recorded_at timestamptz not null default now()
);

create index if not exists metrics_user_id_idx on metrics(user_id);
create index if not exists metrics_post_id_idx on metrics(post_id);
